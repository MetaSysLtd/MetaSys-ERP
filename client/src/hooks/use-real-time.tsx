import { useEffect, useState, useRef, useCallback } from 'react';
import socketService, { RealTimeEvents } from '../services/socket-service';
import { useAuth } from './use-auth';
import { queryClient } from '@/lib/queryClient';
import { useToast } from './use-toast';
import { useSocket, SocketEvents } from './use-socket';

export type RealtimeConfig = {
  onReconnect?: (data: any) => void;
  onError?: (error: any) => void;
  handleSystemMessage?: (message: any) => void;
  subscribeToEntities?: Array<{ type: string; id: number | string }>;
};

/**
 * Hook to connect to real-time updates and subscriptions
 * @param config Configuration for real-time updates
 * @returns Object with connection status and methods
 */
export function useRealTime(config?: RealtimeConfig) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const cleanupFns = useRef<Array<() => void>>([]);
  const { toast } = useToast();

  // Setup socket connection
  useEffect(() => {
    // Initialize socket connection
    socketService.initSocket();

    return () => {
      // Clear all event handlers
      cleanupFns.current.forEach(fn => fn());
      cleanupFns.current = [];
    };
  }, []);

  // Authenticate when user changes
  useEffect(() => {
    if (user && user.id) {
      socketService.authenticate(user.id, user.orgId || null);
    }
  }, [user]);

  // Setup event handlers and subscriptions
  useEffect(() => {
    if (!config) return;

    // Setup connection status handler
    const connectHandler = socketService.on('connect', () => {
      setIsConnected(true);
    });
    cleanupFns.current.push(connectHandler);

    // Setup disconnect handler
    const disconnectHandler = socketService.on('disconnect', () => {
      setIsConnected(false);
      setIsAuthenticated(false);
    });
    cleanupFns.current.push(disconnectHandler);

    // Setup authenticated handler
    const authenticatedHandler = socketService.on('authenticated', (response) => {
      setIsAuthenticated(response.success);
    });
    cleanupFns.current.push(authenticatedHandler);

    // Setup data refresh handler
    const dataRefreshHandler = socketService.on(RealTimeEvents.DATA_REFRESH, (data) => {
      if (data.reconnected && config.onReconnect) {
        config.onReconnect(data);
      }
    });
    cleanupFns.current.push(dataRefreshHandler);

    // Setup error handler
    const errorHandler = socketService.on(RealTimeEvents.ERROR, (data) => {
      if (config.onError) {
        config.onError(data);
      }
    });
    cleanupFns.current.push(errorHandler);

    // Setup system message handler
    const systemMessageHandler = socketService.on(RealTimeEvents.SYSTEM_MESSAGE, (data) => {
      if (config.handleSystemMessage) {
        config.handleSystemMessage(data);
      } else {
        // Default handler shows toast
        toast({
          title: data.title || 'System Message',
          description: data.message || 'A system message was received.',
          variant: data.variant || 'default',
        });
      }
    });
    cleanupFns.current.push(systemMessageHandler);

    // Subscribe to entities
    if (config.subscribeToEntities && config.subscribeToEntities.length > 0) {
      config.subscribeToEntities.forEach(entity => {
        socketService.subscribeToEntity(entity.type, entity.id);
      });
    }

    return () => {
      // Clean up entity subscriptions
      if (config.subscribeToEntities && config.subscribeToEntities.length > 0) {
        config.subscribeToEntities.forEach(entity => {
          socketService.unsubscribeFromEntity(entity.type, entity.id);
        });
      }

      // Clear all event handlers
      cleanupFns.current.forEach(fn => fn());
      cleanupFns.current = [];
    };
  }, [config, toast]);

  /**
   * Subscribe to a specific event
   * @param event Event name to subscribe to
   * @param handler Function to call when event occurs
   * @returns Function to unsubscribe
   */
  const subscribe = useCallback((event: string, handler: Function) => {
    const unsubscribe = socketService.on(event, handler);
    cleanupFns.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  /**
   * Subscribe to updates for a specific entity
   * @param entityType Type of entity (e.g., 'lead', 'load', 'invoice')
   * @param entityId Unique identifier for the entity
   */
  const subscribeToEntity = useCallback((entityType: string, entityId: number | string) => {
    socketService.subscribeToEntity(entityType, entityId);
  }, []);

  /**
   * Invalidate React Query cache when real-time updates are received
   * @param queryKey Query key to invalidate
   */
  const setupCacheInvalidation = useCallback((event: string, queryKey: string | string[]) => {
    const unsubscribe = socketService.on(event, () => {
      queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
    });
    cleanupFns.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // Automatically invalidate queries for common entities when they change
  useEffect(() => {
    // Lead-related events
    setupCacheInvalidation(RealTimeEvents.LEAD_CREATED, ['/api/leads']);
    setupCacheInvalidation(RealTimeEvents.LEAD_UPDATED, ['/api/leads']);
    setupCacheInvalidation(RealTimeEvents.LEAD_DELETED, ['/api/leads']);
    setupCacheInvalidation(RealTimeEvents.LEAD_STATUS_CHANGED, ['/api/leads']);

    // Load-related events
    setupCacheInvalidation(RealTimeEvents.LOAD_CREATED, ['/api/loads']);
    setupCacheInvalidation(RealTimeEvents.LOAD_UPDATED, ['/api/loads']);
    setupCacheInvalidation(RealTimeEvents.LOAD_DELETED, ['/api/loads']);
    setupCacheInvalidation(RealTimeEvents.LOAD_STATUS_CHANGED, ['/api/loads']);

    // Invoice-related events
    setupCacheInvalidation(RealTimeEvents.INVOICE_CREATED, ['/api/invoices']);
    setupCacheInvalidation(RealTimeEvents.INVOICE_UPDATED, ['/api/invoices']);
    setupCacheInvalidation(RealTimeEvents.INVOICE_DELETED, ['/api/invoices']);
    setupCacheInvalidation(RealTimeEvents.INVOICE_STATUS_CHANGED, ['/api/invoices']);

    // Notification-related events
    setupCacheInvalidation(RealTimeEvents.NOTIFICATION_CREATED, ['/api/notifications']);
    setupCacheInvalidation(RealTimeEvents.NOTIFICATION_READ, ['/api/notifications']);
    setupCacheInvalidation(RealTimeEvents.NOTIFICATION_DELETED, ['/api/notifications']);

    // Dashboard data
    setupCacheInvalidation(RealTimeEvents.DATA_UPDATED, ['/api/dashboard', '/api/dashboard/metrics']);

    return () => {
      // Clean up will be handled by the main cleanup function
    };
  }, [setupCacheInvalidation]);

  return {
    isConnected,
    isAuthenticated,
    subscribe,
    subscribeToEntity,
    setupCacheInvalidation,
  };
}