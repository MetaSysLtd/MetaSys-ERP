/**
 * Centralized socket service for the MetaSys ERP application
 * This service standardizes socket interactions throughout the application.
 */

import { io, Socket } from 'socket.io-client';
import { toast } from '@/hooks/use-toast';

let socket: Socket | null = null;
let isInitialized = false;
let userId: number | string | null = null;
let orgId: number | string = 0;

// Type guard function to check if userId is not null
function isValidUserId(id: number | string | null): id is number | string {
    return id !== null;
}
let pendingSubscriptions: Array<{ type: string; id: number | string }> = [];

// Standardized event names for better consistency across the application
export enum RealTimeEvents {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',
  AUTHENTICATED = 'authenticated',
  
  // Status events
  DATA_REFRESH = 'data:refresh',
  ERROR = 'error',
  SYSTEM_MESSAGE = 'system:message',
  SYSTEM_ALERT = 'system:alert',
  
  // Lead events
  LEAD_CREATED = 'lead:created',
  LEAD_UPDATED = 'lead:updated',
  LEAD_DELETED = 'lead:deleted',
  LEAD_STATUS_CHANGED = 'lead:status_changed',
  LEAD_ASSIGNED = 'lead:assigned',
  
  // Load/Dispatch events
  LOAD_CREATED = 'dispatch:created',
  LOAD_UPDATED = 'dispatch:updated',
  LOAD_DELETED = 'dispatch:deleted',
  LOAD_STATUS_CHANGED = 'dispatch:status_changed',
  LOAD_ASSIGNED = 'dispatch:assigned',
  LOAD_COMPLETED = 'dispatch:completed',
  
  // Invoice events
  INVOICE_CREATED = 'invoice:created',
  INVOICE_UPDATED = 'invoice:updated',
  INVOICE_DELETED = 'invoice:deleted',
  INVOICE_STATUS_CHANGED = 'invoice:status_changed',
  INVOICE_PAID = 'invoice:paid',
  
  // Notification events
  NOTIFICATION_CREATED = 'notification:created',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_DELETED = 'notification:deleted',
  
  // Dashboard data
  DATA_UPDATED = 'data:updated',
}

/**
 * Initialize the socket connection to the server
 * @returns {boolean} True if successfully initialized
 */
function initSocket(): boolean {
  // If already initialized but socket is null, clean up state first
  if (isInitialized && !socket) {
    isInitialized = false;
  }
  
  if (isInitialized && socket) {
    console.log('Socket already initialized, reusing existing connection');
    return true;
  }
  
  try {
    // Determine WebSocket URL based on current environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Since we're using socket.io, we need to use the http/https protocol
    const wsUrl = `${window.location.protocol}//${window.location.host}`;
    
    console.log('Connecting to socket at:', wsUrl);
    
    // Create socket connection with proper config and more reliable settings
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 30000,
      autoConnect: true,
      forceNew: true,
      path: '/socket.io', // Ensure the path is explicit and correct
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5
    });
    
    // Set up standard event handlers
    socket.on('connect', () => {
      console.log('Socket connected successfully:', socket?.id);
      
      // If we have user ID, authenticate immediately with delay to ensure connection is stable
      if (isValidUserId(userId)) {
        setTimeout(() => {
          if (socket && socket.connected) {
            // Make sure we have a valid user ID and org ID for authentication
            authenticate(userId, orgId);
          }
        }, 500);
      }
      
      // Process any pending subscriptions with a slight delay
      setTimeout(() => {
        processPendingSubscriptions();
      }, 1000);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Need to manually reconnect
        setTimeout(() => socket?.connect(), 1000);
      }
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnect attempt ${attemptNumber}`);
    });
    
    socket.on('reconnect', () => {
      console.log('Socket reconnected');
      
      // Re-authenticate and re-subscribe
      if (isValidUserId(userId)) {
        authenticate(userId, orgId || 0);
      }
      
      // Process any pending subscriptions
      processPendingSubscriptions();
    });
    
    isInitialized = true;
    return true;
  } catch (err) {
    console.error('Failed to initialize socket:', err);
    return false;
  }
}

/**
 * Process any subscriptions that were attempted before socket was ready
 */
function processPendingSubscriptions(): void {
  if (!socket || !socket.connected) return;
  
  // Process and clear pending subscriptions
  while (pendingSubscriptions.length > 0) {
    const sub = pendingSubscriptions.shift();
    if (sub) {
      subscribeToEntity(sub.type, sub.id);
    }
  }
}

/**
 * Authenticate the socket connection with user credentials
 * @param {number|string} id User ID
 * @param {number|string|undefined} organization Organization ID (optional)
 * @returns {Promise<boolean>} Success status
 */
function authenticate(id: number | string, organization?: number | string): Promise<boolean> {
  // Store these values regardless of connection status
  userId = id;
  orgId = organization || 0; // Use 0 as default value for undefined organization
  
  return new Promise((resolve) => {
    if (!socket) {
      // If no socket, initialize and wait for connection before authenticating
      const initialized = initSocket();
      if (!initialized) {
        console.warn('Failed to initialize socket for authentication');
        resolve(false);
        return;
      }
    }
    
    // If socket exists but not connected, wait a moment and try again
    if (socket && !socket.connected) {
      console.log('Socket not connected, waiting before authentication attempt');
      setTimeout(() => {
        if (socket && socket.connected) {
          console.log('Authenticating socket with user ID after connection delay:', id);
          socket.emit('authenticate', { userId: id, orgId: organization || 0 });
          resolve(true);
        } else {
          console.warn('Cannot emit event, socket is not connected: authenticate');
          resolve(false);
        }
      }, 1500);
      return;
    }
    
    // Normal case: socket is connected, authenticate immediately
    if (socket && socket.connected) {
      console.log('Authenticating socket with user ID:', id);
      socket.emit('authenticate', { userId: id, orgId: organization || 0 });
      resolve(true);
    } else {
      console.warn('Cannot emit authenticate event, socket unavailable');
      resolve(false);
    }
  });
}

/**
 * Subscribe to events for a specific entity
 * @param {string} entityType Type of entity (e.g., 'lead', 'load', 'invoice')
 * @param {number|string} entityId ID of the entity
 */
function subscribeToEntity(entityType: string, entityId: number | string): void {
  if (!socket) {
    initSocket();
  }
  
  if (!socket || !socket.connected) {
    // Queue subscription for later
    pendingSubscriptions.push({ type: entityType, id: entityId });
    return;
  }
  
  console.log(`Subscribing to ${entityType}:${entityId}`);
  socket.emit('subscribe', { entityType, entityId });
}

/**
 * Unsubscribe from events for a specific entity
 * @param {string} entityType Type of entity
 * @param {number|string} entityId ID of the entity
 */
function unsubscribeFromEntity(entityType: string, entityId: number | string): void {
  if (!socket || !socket.connected) return;
  
  console.log(`Unsubscribing from ${entityType}:${entityId}`);
  socket.emit('unsubscribe', { entityType, entityId });
}

/**
 * Subscribe to a specific event
 * @param {string} event Event name
 * @param {Function} handler Event handler function
 * @returns {Function} Function to unsubscribe from the event
 */
function on(event: string, handler: Function): () => void {
  if (!socket) {
    initSocket();
  }
  
  if (!socket) return () => {};
  
  console.log(`Setting up handler for ${event}`);
  socket.on(event, handler as (...args: any[]) => void);
  
  return () => {
    if (socket) {
      console.log(`Removing handler for ${event}`);
      socket.off(event, handler as (...args: any[]) => void);
    }
  };
}

/**
 * Emit an event to the server
 * @param {string} event Event name
 * @param {any} data Event data
 */
function emit(event: string, data: any): void {
  if (!socket) {
    initSocket();
  }
  
  if (!socket || !socket.connected) {
    console.warn(`Cannot emit ${event}, socket not connected`);
    return;
  }
  
  console.log(`Emitting ${event}:`, data);
  socket.emit(event, data);
}

/**
 * Disconnect the socket
 */
function disconnect(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    isInitialized = false;
  }
}

/**
 * Check if socket is connected
 * @returns {boolean} Connection status
 */
function isConnected(): boolean {
  return !!(socket && socket.connected);
}

// Export the service functions
export default {
  initSocket,
  authenticate,
  subscribeToEntity,
  unsubscribeFromEntity,
  on,
  emit,
  disconnect,
  isConnected,
  RealTimeEvents,
};