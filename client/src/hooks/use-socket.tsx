import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  emit: (event: string, ...args: any[]) => void;
  subscribe: (event: string, callback: (...args: any[]) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const connectionAttemptedRef = useRef(false);

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
      
      // Create socket connection with auto reconnect but initial delay
      const socketInstance = io({
        reconnectionDelayMax: 10000,
        reconnectionDelay: 1000,
        timeout: 20000
      });
      
      socketRef.current = socketInstance;
      
      // Set up event listeners
      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        setConnected(true);
      });
      
      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });
      
      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
        setConnected(false);
      });
      
      // Save socket instance in state
      setSocket(socketInstance);
    }, 800); // Small delay before initializing socket
    
    // Clean up on unmount
    return () => {
      clearTimeout(initTimeout);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Helper function to emit events safely
  const emit = (event: string, ...args: any[]) => {
    if (socket && connected) {
      socket.emit(event, ...args);
    } else {
      console.warn('Cannot emit event, socket is not connected:', event);
    }
  };

  // Helper function to subscribe to socket events
  const subscribe = (event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback);
      return () => {
        socket.off(event, callback);
      };
    }
    
    return () => {};
  };
  
  return (
    <SocketContext.Provider value={{ socket, connected, emit, subscribe }}>
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