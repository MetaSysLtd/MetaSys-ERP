import { io, Socket } from 'socket.io-client';

// Event types for real-time updates
export enum RealTimeEvents {
  // Authentication events
  USER_LOGGED_IN = 'user:logged_in',
  USER_LOGGED_OUT = 'user:logged_out',
  
  // Lead events
  LEAD_CREATED = 'lead:created',
  LEAD_UPDATED = 'lead:updated',
  LEAD_STATUS_CHANGED = 'lead:status_changed',
  LEAD_DELETED = 'lead:deleted',
  LEAD_ASSIGNED = 'lead:assigned',
  LEAD_REMARK_ADDED = 'lead:remark_added',
  LEAD_FOLLOW_UP_CREATED = 'lead:follow_up_created',
  LEAD_FOLLOW_UP_COMPLETED = 'lead:follow_up_completed',
  
  // Load/Dispatch events
  LOAD_CREATED = 'load:created',
  LOAD_UPDATED = 'load:updated',
  LOAD_STATUS_CHANGED = 'load:status_changed',
  LOAD_DELETED = 'load:deleted',
  LOAD_ASSIGNED = 'load:assigned',
  
  // Invoice events
  INVOICE_CREATED = 'invoice:created',
  INVOICE_UPDATED = 'invoice:updated',
  INVOICE_STATUS_CHANGED = 'invoice:status_changed',
  INVOICE_DELETED = 'invoice:deleted',
  
  // Notification events
  NOTIFICATION_CREATED = 'notification:created',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_DELETED = 'notification:deleted',
  
  // HR events
  CANDIDATE_CREATED = 'hr:candidate_created',
  CANDIDATE_UPDATED = 'hr:candidate_updated',
  CANDIDATE_STATUS_CHANGED = 'hr:candidate_status_changed',
  PROBATION_UPDATED = 'hr:probation_updated',
  
  // Task events
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_COMPLETED = 'task:completed',
  TASK_ASSIGNED = 'task:assigned',
  
  // Report events
  REPORT_GENERATED = 'report:generated',
  REPORT_REMINDER = 'report:reminder',
  
  // General events
  ERROR = 'error',
  DATA_REFRESH = 'data:refresh',
  DATA_UPDATED = 'data:updated',
  SYSTEM_MESSAGE = 'system:message'
}

// SocketService class to handle all socket operations
class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private isAuthenticated = false;
  private userId: number | null = null;
  private orgId: number | null = null;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private MAX_RECONNECT_ATTEMPTS = 5;
  private RECONNECT_DELAY = 3000; // 3 seconds
  
  // Initialize the socket connection
  public initSocket(): void {
    try {
      if (this.socket) {
        console.log('Socket already initialized');
        return;
      }
      
      // Get the base URL dynamically
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const socketUrl = `${protocol}//${host}`;
      
      console.log('Connecting to socket at:', socketUrl);
      
      this.socket = io(socketUrl, {
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling']
      });
      
      this.setupListeners();
    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  }
  
  // Setup event listeners for the socket
  private setupListeners(): void {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // If we have user info, authenticate immediately after reconnecting
      if (this.userId) {
        this.authenticate(this.userId, this.orgId);
      }
      
      // Notify all data refresh handlers
      this.notifyHandlers(RealTimeEvents.DATA_REFRESH, { reconnected: true });
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.isAuthenticated = false;
      
      // Attempt to reconnect
      this.attemptReconnect();
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.notifyHandlers(RealTimeEvents.ERROR, { error });
    });
    
    this.socket.on('authenticated', (response) => {
      console.log('Socket authenticated:', response);
      this.isAuthenticated = response.success;
      
      if (!response.success) {
        console.error('Socket authentication failed:', response.error);
      }
    });
    
    // Setup handlers for general events
    this.socket.on(RealTimeEvents.DATA_UPDATED, (data) => {
      this.notifyHandlers(RealTimeEvents.DATA_UPDATED, data);
      
      // Also notify specific entity handlers
      if (data.entityType && data.action) {
        const specificEvent = `${data.entityType}:${data.action}`;
        this.notifyHandlers(specificEvent, data);
      }
    });
    
    this.socket.on(RealTimeEvents.SYSTEM_MESSAGE, (data) => {
      this.notifyHandlers(RealTimeEvents.SYSTEM_MESSAGE, data);
    });
  }
  
  // Attempt to reconnect to the socket server
  private attemptReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnect attempts reached. Please refresh the page.');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);
    
    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnected && this.socket) {
        this.socket.connect();
      }
    }, this.RECONNECT_DELAY);
  }
  
  // Authenticate the socket connection with user ID
  public authenticate(userId: number, orgId: number | null = null): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot authenticate: Socket not connected');
      return;
    }
    
    this.userId = userId;
    this.orgId = orgId;
    
    this.socket.emit('authenticate', { userId, orgId });
  }
  
  // Switch the organization context
  public switchOrganization(orgId: number): void {
    if (!this.socket || !this.isConnected || !this.isAuthenticated) {
      console.warn('Cannot switch organization: Socket not authenticated');
      return;
    }
    
    if (!this.userId) {
      console.warn('Cannot switch organization: No user ID');
      return;
    }
    
    this.orgId = orgId;
    this.socket.emit('switch_organization', { userId: this.userId, orgId });
  }
  
  // Subscribe to updates for a specific entity
  public subscribeToEntity(entity: string, id: number | string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot subscribe: Socket not connected');
      return;
    }
    
    this.socket.emit('subscribe', { entity, id });
  }
  
  // Unsubscribe from updates for a specific entity
  public unsubscribeFromEntity(entity: string, id: number | string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot unsubscribe: Socket not connected');
      return;
    }
    
    this.socket.emit('unsubscribe', { entity, id });
  }
  
  // Add an event handler
  public on(event: string, handler: Function): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
      
      // Add socket listener for this event if socket exists
      if (this.socket) {
        this.socket.on(event, (data) => {
          this.notifyHandlers(event, data);
        });
      }
    }
    
    this.eventHandlers.get(event)?.add(handler);
    
    // Return a function to remove this handler
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
          
          // Remove socket listener if no handlers left
          if (this.socket) {
            this.socket.off(event);
          }
        }
      }
    };
  }
  
  // Notify all handlers for an event
  private notifyHandlers(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in handler for event ${event}:`, error);
        }
      });
    }
  }
  
  // Check if socket is connected
  public isSocketConnected(): boolean {
    return this.isConnected;
  }
  
  // Check if socket is authenticated
  public isSocketAuthenticated(): boolean {
    return this.isAuthenticated;
  }
  
  // Disconnect the socket
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isAuthenticated = false;
      this.userId = null;
      this.orgId = null;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      this.eventHandlers.clear();
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;