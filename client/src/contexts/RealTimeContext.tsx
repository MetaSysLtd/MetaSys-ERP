import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import socketService, { RealTimeEvents } from '@/services/socket-service';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface RealTimeContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  subscribe: (event: string, handler: (data: any) => void) => () => void;
  subscribeToEntity: (entity: string, id: number | string) => void;
  unsubscribeFromEntity: (entity: string, id: number | string) => void;
  invalidateQueries: (queryKey: string | string[]) => void;
}

const RealTimeContext = createContext<RealTimeContextType | null>(null);

interface RealTimeProviderProps {
  children: ReactNode;
}

export const RealTimeProvider: React.FC<RealTimeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Use deferred socket initialization for better performance
  useEffect(() => {
    // Setup deferred initialization instead of immediate connection
    socketService.setupDeferredInit();

    // Set up event listeners for connection state
    const connectListener = () => setIsConnected(true);
    const disconnectListener = () => {
      setIsConnected(false);
      setIsAuthenticated(false);
    };
    
    const authenticatedListener = (data: any) => {
      setIsAuthenticated(data.success);
      if (!data.success) {
        console.error('Socket authentication failed:', data.error);
      }
    };
    
    // Add event listeners to socket
    socketService.on('connect', connectListener);
    socketService.on('disconnect', disconnectListener);
    socketService.on('authenticated', authenticatedListener);
    
    // Setup system message handler
    socketService.on(RealTimeEvents.SYSTEM_MESSAGE, (data) => {
      toast({
        title: data.title || 'System Message',
        description: data.message || 'A system message was received.',
        variant: data.variant || 'default',
      });
    });
    
    // Setup error handler
    socketService.on(RealTimeEvents.ERROR, (error) => {
      console.error('Socket error:', error);
      toast({
        title: 'Connection Error',
        description: `There was an error with the real-time connection: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    });
    
    // Handle generic data updates for cache invalidation
    socketService.on(RealTimeEvents.DATA_UPDATED, (data) => {
      if (data.entityType) {
        // Invalidate queries related to the entity
        queryClient.invalidateQueries({ queryKey: [`/api/${data.entityType}s`] });
        
        // If an entity ID is provided, also invalidate specific entity query
        if (data.entityId) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/${data.entityType}s/${data.entityId}`] 
          });
        }
      }
    });
    
    // Clean up on unmount
    return () => {
      socketService.disconnect();
    };
  }, [toast]);

  // Authenticate when user changes
  useEffect(() => {
    if (user && user.id && isConnected && !isAuthenticated) {
      // Use orgId for compatibility with the original AuthContext
      const orgId = (user as any).orgId || null;
      socketService.authenticate(user.id, orgId);
    }
  }, [user, isConnected, isAuthenticated]);

  // Subscribe to a specific event
  const subscribe = (event: string, handler: (data: any) => void) => {
    return socketService.on(event, handler);
  };

  // Subscribe to updates for a specific entity
  const subscribeToEntity = (entity: string, id: number | string) => {
    socketService.subscribeToEntity(entity, id);
  };

  // Unsubscribe from updates for a specific entity
  const unsubscribeFromEntity = (entity: string, id: number | string) => {
    socketService.unsubscribeFromEntity(entity, id);
  };

  // Invalidate queries by key
  const invalidateQueries = (queryKey: string | string[]) => {
    queryClient.invalidateQueries({ 
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] 
    });
  };

  const value = {
    isConnected,
    isAuthenticated,
    subscribe,
    subscribeToEntity,
    unsubscribeFromEntity,
    invalidateQueries
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};