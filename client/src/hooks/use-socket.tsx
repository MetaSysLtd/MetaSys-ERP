import { useState, useEffect, createContext, useContext, ReactNode, useRef, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  emit: (event: string, ...args: any[]) => void;
  subscribe: (event: string, callback: (...args: any[]) => void) => () => void;
  connectionAttempted: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Queue for storing events that need to be sent once socket is connected
type QueuedEvent = {
  event: string;
  args: any[];
  timestamp: number;
};

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const connectionAttemptedRef = useRef(false);
  // Queue for events that were attempted to be sent while disconnected
  const eventQueueRef = useRef<QueuedEvent[]>([]);
  // Track event listeners to reattach during reconnection
  const eventListenersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());
  // Connection timestamp for debugging
  const connectTimeRef = useRef<number | null>(null);
  
  // Process queued events when connection is established
  const processEventQueue = useCallback(() => {
    if (!socketRef.current || !connected) return;
    
    const currentTime = Date.now();
    const maxAge = 30000; // 30 seconds TTL for queued events
    
    // Process queued events (respecting TTL)
    while (eventQueueRef.current.length > 0) {
      const queuedEvent = eventQueueRef.current[0];
      
      // Skip expired events
      if (currentTime - queuedEvent.timestamp > maxAge) {
        eventQueueRef.current.shift(); // Remove expired event
        continue;
      }
      
      // Send the event
      try {
        socketRef.current.emit(queuedEvent.event, ...queuedEvent.args);
        eventQueueRef.current.shift(); // Remove after successful send
      } catch (error) {
        console.error('Failed to send queued event:', error);
        break; // Stop processing on error
      }
    }
  }, [connected]);

  // Initialize socket with increased delay for auth to complete
  useEffect(() => {
    // Skip socket connection if one is already being established or exists
    if (connectionAttemptedRef.current) {
      return;
    }
    
    // Don't initialize socket immediately, wait a small delay
    // This gives authentication a chance to complete first
    const initTimeout = setTimeout(() => {
      // Determine WebSocket URL based on current environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
      console.log('Connecting to socket at:', wsUrl);
      connectionAttemptedRef.current = true;
      
      // Create socket connection with intelligent backoff settings
      const socketInstance = io({
        reconnectionDelayMax: 10000,  // Max reconnection delay
        reconnectionDelay: 1000,      // Initial reconnection delay
        timeout: 30000,               // Connection timeout
        reconnectionAttempts: 5,      // Limit reconnection attempts before giving up
        transports: ['websocket'],    // Force WebSocket transport for better performance
        forceNew: true,               // Create a new connection
        autoConnect: true             // Connect automatically
      });
      
      socketRef.current = socketInstance;
      
      // Set up event listeners
      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        setConnected(true);
        connectTimeRef.current = Date.now();
        
        // Process any queued events
        processEventQueue();
        
        // Reattach all event listeners from our registry
        eventListenersRef.current.forEach((callbacks, event) => {
          callbacks.forEach(callback => {
            socketInstance.on(event, callback);
          });
        });
      });
      
      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });
      
      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });
      
      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
        setConnected(false);
      });
      
      // Save socket instance in state
      setSocket(socketInstance);
    }, 1200); // Increased delay before initializing socket
    
    // Clean up on unmount
    return () => {
      clearTimeout(initTimeout);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // Clear all stored callbacks
      eventListenersRef.current.clear();
      // Clear event queue
      eventQueueRef.current = [];
    };
  }, [processEventQueue]);

  // Helper function to emit events safely with queueing for disconnection
  const emit = useCallback((event: string, ...args: any[]) => {
    if (socketRef.current && connected) {
      // Connected - send immediately
      socketRef.current.emit(event, ...args);
    } else {
      // Not connected - queue the event with timestamp
      console.warn('Socket not connected, queueing event:', event);
      eventQueueRef.current.push({
        event,
        args,
        timestamp: Date.now()
      });
      
      // Limit queue size to prevent memory issues
      if (eventQueueRef.current.length > 50) {
        // Remove oldest events if queue gets too large
        eventQueueRef.current = eventQueueRef.current.slice(-50);
      }
    }
  }, [connected]);

  // Helper function to subscribe to socket events with registry
  const subscribe = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      // Register event and callback
      if (!eventListenersRef.current.has(event)) {
        eventListenersRef.current.set(event, new Set());
      }
      eventListenersRef.current.get(event)?.add(callback);
      
      // Add listener to socket
      socketRef.current.on(event, callback);
      
      // Return cleanup function
      return () => {
        // Remove from both socket and our registry
        if (socketRef.current) {
          socketRef.current.off(event, callback);
        }
        
        const callbacks = eventListenersRef.current.get(event);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            eventListenersRef.current.delete(event);
          }
        }
      };
    }
    
    // If no socket yet, just register in our registry for later attachment
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set());
    }
    eventListenersRef.current.get(event)?.add(callback);
    
    return () => {
      const callbacks = eventListenersRef.current.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          eventListenersRef.current.delete(event);
        }
      }
    };
  }, []);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    socket,
    connected,
    emit,
    subscribe,
    connectionAttempted: connectionAttemptedRef.current
  }), [socket, connected, emit, subscribe]);
  
  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

// Hook to use socket connection
export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Hook to check socket connection status
export function useSocketConnectionStatus() {
  const { connected } = useSocket();
  return connected;
}