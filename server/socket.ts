import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { storage } from './storage';
import { logger } from './logger';

let io: SocketIOServer;

// Define real-time event types
export enum RealTimeEvents {
  DATA_UPDATED = 'data:updated',
  LEAD_CREATED = 'lead:created',
  LEAD_UPDATED = 'lead:updated',
  LEAD_DELETED = 'lead:deleted',
  LOAD_CREATED = 'load:created',
  LOAD_UPDATED = 'load:updated',
  LOAD_DELETED = 'load:deleted',
  INVOICE_CREATED = 'invoice:created',
  INVOICE_UPDATED = 'invoice:updated',
  INVOICE_DELETED = 'invoice:deleted',
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_DELETED = 'task:deleted',
  NOTIFICATION_CREATED = 'notification:created',
  USER_LOGGED_IN = 'user:logged_in',
  UI_PREFS_UPDATED = 'uiPrefsUpdated',
  REPORT_GENERATED = 'report:generated',
  USER_ASSIGNMENT_CHANGED = 'user:assignment_changed',
  DASHBOARD_UPDATED = 'dashboard:updated'
}

// Initialize Socket.IO
export function initSocketIO(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    }
  });

  // Set up middleware for authentication
  io.use(async (socket, next) => {
    try {
      const sessionId = socket.handshake.auth.sessionId;
      
      // If no session ID is provided, allow connection but don't authenticate
      if (!sessionId) {
        return next();
      }
      
      // Get user from storage based on session ID
      const userId = await storage.getUserIdFromSession(sessionId);
      if (!userId) {
        return next();
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Set user data on socket for later use
      socket.data.user = user;
      socket.data.userId = user.id;
      socket.data.orgId = user.orgId;
      
      logger.info(`User ${user.id} authenticated on socket ${socket.id}`);
      
      // Continue to the next middleware
      return next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      return next(new Error('Authentication error'));
    }
  });

  // Handle connections
  io.on('connection', async (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    
    // When a user identifies themselves
    socket.on('identify', async (payload) => {
      try {
        const { userId, sessionId } = payload;
        
        if (!userId) {
          return socket.emit('identify:error', { error: 'User ID is required' });
        }
        
        // Get user from storage
        const user = await storage.getUser(userId);
        if (!user) {
          return socket.emit('identify:error', { error: 'User not found' });
        }
        
        // Store user info in socket data
        socket.data.user = user;
        socket.data.userId = user.id;
        socket.data.orgId = user.orgId;
        
        // Join organization room to receive organization-wide updates
        if (user.orgId) {
          socket.join(`org:${user.orgId}`);
        }
        
        // Join user room to receive user-specific updates
        socket.join(`user:${user.id}`);
        
        // Send confirmation to client
        socket.emit('identify:success', {
          success: true,
          userId: user.id,
          orgId: user.orgId
        });
        
        // Emit event that user has logged in
        emitToUser(user.id, RealTimeEvents.USER_LOGGED_IN, {
          userId: user.id,
          timestamp: new Date()
        });
        
        logger.info(`User ${user.id} authenticated on socket ${socket.id}`);
      } catch (error) {
        logger.error('Socket identify error:', error);
        socket.emit('identify:error', { error: 'Authentication failed' });
      }
    });

    // When a client subscribes to an entity
    socket.on('subscribe:entity', (data) => {
      const { entityType, entityId } = data;
      
      if (!entityType || !entityId) {
        return socket.emit('subscribe:error', { error: 'Entity type and ID are required' });
      }
      
      // Join room for this entity
      const room = `${entityType}:${entityId}`;
      socket.join(room);
      
      socket.emit('subscribe:success', { entityType, entityId });
      logger.info(`Socket ${socket.id} subscribed to ${entityType}:${entityId}`);
    });

    // When a client unsubscribes from an entity
    socket.on('unsubscribe:entity', (data) => {
      const { entityType, entityId } = data;
      
      if (!entityType || !entityId) {
        return socket.emit('unsubscribe:error', { error: 'Entity type and ID are required' });
      }
      
      // Leave room for this entity
      const room = `${entityType}:${entityId}`;
      socket.leave(room);
      
      socket.emit('unsubscribe:success', { entityType, entityId });
      logger.info(`Socket ${socket.id} unsubscribed from ${entityType}:${entityId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
}

// Function to emit events to all connected clients
export function emitToAll(event: string, data: any): void {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit event:', event);
    return;
  }
  
  io.emit(event, data);
}

// Function to emit events to a specific user
export function emitToUser(userId: number, event: string, data: any): void {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit event to user:', event);
    return;
  }
  
  io.to(`user:${userId}`).emit(event, data);
}

// Function to emit events to an organization
export function emitToOrg(orgId: number, event: string, data: any): void {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit event to org:', event);
    return;
  }
  
  io.to(`org:${orgId}`).emit(event, data);
}

// Function to emit events to a specific entity's subscribers
export function emitToEntity(entityType: string, entityId: number | string, event: string, data: any): void {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit event to entity:', event);
    return;
  }
  
  io.to(`${entityType}:${entityId}`).emit(event, data);
}

/**
 * Notifies clients about data changes
 */
export function notifyDataChange(
  entityType: string,
  entityId: number | string,
  action: 'created' | 'updated' | 'deleted',
  data: any,
  options?: {
    userId?: number;
    orgId?: number;
    broadcastToOrg?: boolean;
  }
): void {
  try {
    if (!io) {
      logger.warn('Socket.IO not initialized, cannot notify about data change');
      return;
    }
    
    const specificEvent = `${entityType}:${action}`;
    const genericEvent = RealTimeEvents.DATA_UPDATED;
    
    // Create payload for the event
    const payload = {
      entityType,
      entityId,
      action,
      data,
      timestamp: new Date(),
    };
    
    // Emit to entity subscribers
    emitToEntity(entityType, entityId, specificEvent, payload);
    emitToEntity(entityType, entityId, genericEvent, payload);
    
    // If user-specific, emit to the user
    if (options?.userId) {
      emitToUser(options.userId, specificEvent, payload);
      emitToUser(options.userId, genericEvent, payload);
    }
    
    // If organization-specific, emit to the organization
    if (options?.orgId && options?.broadcastToOrg) {
      emitToOrg(options.orgId, specificEvent, payload);
      emitToOrg(options.orgId, genericEvent, payload);
    }
    
    logger.debug(`Emitted ${specificEvent} for ${entityType}:${entityId}`);
  } catch (error) {
    logger.error('Error in notifyDataChange:', error);
  }
}

export function getIo(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized, call initSocketIO first');
  }
  return io;
}