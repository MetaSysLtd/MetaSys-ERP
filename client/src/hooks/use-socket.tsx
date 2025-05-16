import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// Define the events we want to standardize across the application
export enum SocketEvents {
  // Lead events
  LEAD_CREATED = 'lead:created',
  LEAD_UPDATED = 'lead:updated',
  LEAD_DELETED = 'lead:deleted',
  LEAD_STATUS_CHANGED = 'lead:status_changed',
  LEAD_ASSIGNED = 'lead:assigned',
  
  // Dispatch events
  DISPATCH_CREATED = 'dispatch:created',
  DISPATCH_UPDATED = 'dispatch:updated',
  DISPATCH_COMPLETED = 'dispatch:completed',
  
  // Invoice events
  INVOICE_CREATED = 'invoice:created',
  INVOICE_UPDATED = 'invoice:updated',
  INVOICE_PAID = 'invoice:paid',
  
  // System events
  SYSTEM_ALERT = 'system:alert',
  SYSTEM_NOTIFICATION = 'system:notification',
  
  // Global event that can be used for high-level changes
  GLOBAL_EVENT = 'global:event'
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  emit: (event: string, ...args: any[]) => void;
  subscribe: (event: string, callback: (...args: any[]) => void) => () => void;
  // Add last received event for debugging/monitoring
  lastEvent: { event: string; data: any } | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<{ event: string; data: any } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      // Don't connect if not authenticated
      return;
    }
    
    // Determine WebSocket URL based on current environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to socket at:', wsUrl);
    
    // Create socket connection with proper config
    const socketInstance = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      auth: {
        userId: user.id,
        orgId: user.orgId,
      },
    });
    
    // Set up enhanced event listeners with better error handling
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setConnected(true);
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
      
      if (reason === 'io server disconnect') {
        // Need to manually reconnect
        setTimeout(() => socketInstance.connect(), 1000);
      }
    });
    
    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      setConnected(false);
      
      toast({
        title: "Connection Error",
        description: "Lost connection to server. Some real-time updates may not appear.",
        variant: "destructive"
      });
    });
    
    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnect attempt ${attemptNumber}`);
      
      if (attemptNumber >= 5) {
        toast({
          title: "Connection Issues",
          description: "Having trouble connecting for real-time updates.",
          variant: "destructive",
        });
      }
    });
    
    socketInstance.on('reconnect', () => {
      console.log('Socket reconnected');
      setConnected(true);
      
      toast({
        title: "Reconnected",
        description: "Real-time updates restored.",
        duration: 3000,
      });
    });
    
    // Global event listener
    socketInstance.on(SocketEvents.GLOBAL_EVENT, (data) => {
      console.log('Global event received:', data);
      setLastEvent({ event: SocketEvents.GLOBAL_EVENT, data });
    });
    
    // System alert listener
    socketInstance.on(SocketEvents.SYSTEM_ALERT, (data) => {
      console.log('System alert received:', data);
      setLastEvent({ event: SocketEvents.SYSTEM_ALERT, data });
      
      toast({
        title: data.title || "System Alert",
        description: data.message,
        variant: "destructive",
        duration: 10000,
      });
    });
    
    // Save socket instance in state
    setSocket(socketInstance);
    
    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [user, toast]);

  // Helper function to emit events safely
  const emit = useCallback((event: string, ...args: any[]) => {
    if (socket && connected) {
      socket.emit(event, ...args);
      console.log(`Emitted ${event}:`, args);
    } else {
      console.warn('Cannot emit event, socket is not connected:', event);
    }
  }, [socket, connected]);

  // Helper function to subscribe to socket events
  const subscribe = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      console.log(`Subscribing to ${event} events`);
      socket.on(event, (...args) => {
        // Track the last event for debugging
        setLastEvent({ event, data: args });
        // Call the original callback
        callback(...args);
      });
      
      return () => {
        console.log(`Unsubscribing from ${event} events`);
        socket.off(event, callback);
      };
    }
    
    return () => {};
  }, [socket]);
  
  return (
    <SocketContext.Provider value={{ socket, connected, emit, subscribe, lastEvent }}>
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

// Specialized hooks for specific event types

// Hook for lead-related events
export function useLeadEvents(
  onCreated?: (data: any) => void,
  onUpdated?: (data: any) => void,
  onStatusChanged?: (data: any) => void
) {
  const { subscribe } = useSocket();
  
  useEffect(() => {
    // Set up subscriptions
    const unsubscribeCreated = onCreated ? 
      subscribe(SocketEvents.LEAD_CREATED, onCreated) : 
      () => {};
      
    const unsubscribeUpdated = onUpdated ? 
      subscribe(SocketEvents.LEAD_UPDATED, onUpdated) : 
      () => {};
      
    const unsubscribeStatusChanged = onStatusChanged ? 
      subscribe(SocketEvents.LEAD_STATUS_CHANGED, onStatusChanged) : 
      () => {};
    
    // Clean up subscriptions
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeStatusChanged();
    };
  }, [subscribe, onCreated, onUpdated, onStatusChanged]);
}

// Hook for dispatch-related events
export function useDispatchEvents(
  onCreated?: (data: any) => void,
  onCompleted?: (data: any) => void
) {
  const { subscribe } = useSocket();
  
  useEffect(() => {
    // Set up subscriptions
    const unsubscribeCreated = onCreated ? 
      subscribe(SocketEvents.DISPATCH_CREATED, onCreated) : 
      () => {};
      
    const unsubscribeCompleted = onCompleted ? 
      subscribe(SocketEvents.DISPATCH_COMPLETED, onCompleted) : 
      () => {};
    
    // Clean up subscriptions
    return () => {
      unsubscribeCreated();
      unsubscribeCompleted();
    };
  }, [subscribe, onCreated, onCompleted]);
}

// Hook for invoice-related events
export function useInvoiceEvents(
  onCreated?: (data: any) => void,
  onPaid?: (data: any) => void
) {
  const { subscribe } = useSocket();
  
  useEffect(() => {
    // Set up subscriptions
    const unsubscribeCreated = onCreated ? 
      subscribe(SocketEvents.INVOICE_CREATED, onCreated) : 
      () => {};
      
    const unsubscribePaid = onPaid ? 
      subscribe(SocketEvents.INVOICE_PAID, onPaid) : 
      () => {};
    
    // Clean up subscriptions
    return () => {
      unsubscribeCreated();
      unsubscribePaid();
    };
  }, [subscribe, onCreated, onPaid]);
}