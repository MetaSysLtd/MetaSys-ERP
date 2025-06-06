import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  emit: (event: string, data: any) => void;
  lastEvent: { event: string; data: any } | null;
}

export const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ event: string; data: any } | null>(null);
  const { user } = useAuth();
  
  // Create stable toast reference to prevent useEffect cycling
  const { toast } = useToast();
  const stableToast = useCallback((options: any) => {
    toast(options);
  }, [toast]);

  // Initialize socket connection with proper cleanup
  useEffect(() => {
    if (!user) {
      // Clean up existing socket if user logs out
      if (socket) {
        console.log('Cleaning up socket due to user logout');
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Prevent multiple socket connections
    if (socket && socket.connected) {
      console.log('Socket already connected, reusing existing connection');
      return;
    }

    // Connect to Socket.IO server with correct path
    const socketInstance = io({
      path: '/ws', // Match server configuration
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000,
      forceNew: false,
      auth: {
        userId: user.id,
        orgId: (user as any).orgId || 1,
      },
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected successfully');
      setConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      setConnected(false);
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Reconnect manually if the server disconnected us (possibly for auth reasons)
        socketInstance.connect();
      }
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      
      if (error.message?.includes('auth')) {
        stableToast({
          title: 'Connection Error',
          description: 'Authentication issue with real-time updates. Please refresh.',
          variant: 'destructive',
        });
      }
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnect attempt ${attemptNumber}`);
      
      if (attemptNumber >= 5) {
        stableToast({
          title: 'Connection Issues',
          description: 'Having trouble connecting for real-time updates.',
          variant: 'destructive',
        });
      }
    });

    socketInstance.on('reconnect', () => {
      console.log('Socket reconnected');
      setConnected(true);
      
      stableToast({
        title: 'Reconnected',
        description: 'Real-time updates restored.',
        duration: 3000,
      });
    });

    // Handle global events
    socketInstance.on('global:event', (data) => {
      console.log('Global event received:', data);
      setLastEvent({ event: 'global:event', data });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [user]); // Removed toast dependency to prevent infinite socket cycling

  // Subscribe to events (with typed callback)
  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!socket) return () => {};

    console.log(`Subscribing to ${event} events`);
    socket.on(event, callback);

    // Return unsubscribe function
    return () => {
      console.log(`Unsubscribing from ${event} events`);
      socket.off(event, callback);
    };
  }, [socket]);

  // Emit events
  const emit = useCallback((event: string, data: any) => {
    if (!socket || !connected) {
      console.warn(`Cannot emit ${event}, socket not connected`);
      return;
    }

    socket.emit(event, data);
    console.log(`Emitted ${event}:`, data);
  }, [socket, connected]);

  return (
    <SocketContext.Provider 
      value={{ 
        socket, 
        connected, 
        subscribe, 
        emit,
        lastEvent
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook for components to use
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
};

// Create specialized hooks for specific events
export const useLeadEvents = (onLeadCreated?: (lead: any) => void, onLeadUpdated?: (lead: any) => void) => {
  const { subscribe } = useSocket();
  
  useEffect(() => {
    // Subscribe to lead creation events
    const unsubscribeCreated = onLeadCreated ? 
      subscribe('lead:created', onLeadCreated) : 
      () => {};
      
    // Subscribe to lead update events
    const unsubscribeUpdated = onLeadUpdated ? 
      subscribe('lead:updated', onLeadUpdated) : 
      () => {};
      
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [subscribe, onLeadCreated, onLeadUpdated]);
};

export const useDispatchEvents = (onDispatchCreated?: (dispatch: any) => void) => {
  const { subscribe } = useSocket();
  
  useEffect(() => {
    // Subscribe to dispatch creation events
    const unsubscribe = onDispatchCreated ? 
      subscribe('dispatch:created', onDispatchCreated) : 
      () => {};
      
    return () => {
      unsubscribe();
    };
  }, [subscribe, onDispatchCreated]);
};

export const useInvoiceEvents = (onInvoicePaid?: (invoice: any) => void) => {
  const { subscribe } = useSocket();
  
  useEffect(() => {
    // Subscribe to invoice paid events
    const unsubscribe = onInvoicePaid ? 
      subscribe('invoice:paid', onInvoicePaid) : 
      () => {};
      
    return () => {
      unsubscribe();
    };
  }, [subscribe, onInvoicePaid]);
};