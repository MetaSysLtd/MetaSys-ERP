import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { SOCKET_EVENTS } from '@shared/constants';
import { logger } from '../logger';

let io: SocketIOServer;

/**
 * Room types for categorizing socket connections
 */
export enum RoomType {
  USER = 'user', // Room for individual user events
  ORG = 'org',   // Room for organization-wide events
  ROLE = 'role', // Room for role-specific events
  MODULE = 'module', // Room for module-specific events
  GLOBAL = 'global'  // Room for all users (system announcements)
}

/**
 * Initialize Socket.IO server
 * @param httpServer - HTTP server instance
 * @returns Socket.IO server instance
 */
export function initializeSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // In production, this should be restricted to trusted domains
      methods: ['GET', 'POST']
    },
    path: '/ws',
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
    cookie: false
  });

  setupEventHandlers();

  logger.info('Socket.IO server initialized');
  return io;
}

/**
 * Setup Socket.IO connection and event handlers
 */
function setupEventHandlers(): void {
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    const orgId = socket.handshake.auth.orgId;

    // Skip auth-less connections
    if (!userId) {
      logger.warn('Socket connection without user ID');
      return;
    }

    logger.info(`User ${userId} connected to socket`);

    // Add socket to user's room
    joinRoom(socket, RoomType.USER, userId);
    
    // If org ID is provided, join org room
    if (orgId) {
      joinRoom(socket, RoomType.ORG, orgId);
    }
    
    // Join global room for system-wide announcements
    joinRoom(socket, RoomType.GLOBAL, 'all');

    // Handle room join requests
    socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ type, id }) => {
      joinRoom(socket, type, id);
    });

    // Handle room leave requests
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, ({ type, id }) => {
      leaveRoom(socket, type, id);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User ${userId} disconnected from socket`);
    });
  });
}

/**
 * Join a room with proper format and logging
 * @param socket - Socket instance
 * @param type - Room type
 * @param id - Room identifier
 */
export function joinRoom(socket: any, type: RoomType, id: string | number): void {
  const roomName = formatRoomName(type, id);
  socket.join(roomName);
  logger.debug(`Socket ${socket.id} joined room: ${roomName}`);
}

/**
 * Leave a room with proper format and logging
 * @param socket - Socket instance
 * @param type - Room type
 * @param id - Room identifier
 */
export function leaveRoom(socket: any, type: RoomType, id: string | number): void {
  const roomName = formatRoomName(type, id);
  socket.leave(roomName);
  logger.debug(`Socket ${socket.id} left room: ${roomName}`);
}

/**
 * Format room name with consistent pattern
 * @param type - Room type
 * @param id - Room identifier
 * @returns Formatted room name
 */
export function formatRoomName(type: RoomType, id: string | number): string {
  return `${type}:${id}`;
}

/**
 * Emit an event to a specific user
 * @param userId - User ID
 * @param event - Event name
 * @param data - Event data
 */
export function emitToUser(userId: number | string, event: string, data: any): void {
  if (!io) {
    logger.error('Socket.IO server not initialized');
    return;
  }
  
  const roomName = formatRoomName(RoomType.USER, userId);
  io.to(roomName).emit(event, data);
  logger.debug(`Emitted ${event} to user ${userId}`);
}

/**
 * Emit an event to all users in an organization
 * @param orgId - Organization ID
 * @param event - Event name
 * @param data - Event data
 */
export function emitToOrganization(orgId: number | string, event: string, data: any): void {
  if (!io) {
    logger.error('Socket.IO server not initialized');
    return;
  }
  
  const roomName = formatRoomName(RoomType.ORG, orgId);
  io.to(roomName).emit(event, data);
  logger.debug(`Emitted ${event} to organization ${orgId}`);
}

/**
 * Emit an event to users with a specific role
 * @param roleId - Role ID
 * @param event - Event name
 * @param data - Event data
 */
export function emitToRole(roleId: number | string, event: string, data: any): void {
  if (!io) {
    logger.error('Socket.IO server not initialized');
    return;
  }
  
  const roomName = formatRoomName(RoomType.ROLE, roleId);
  io.to(roomName).emit(event, data);
  logger.debug(`Emitted ${event} to role ${roleId}`);
}

/**
 * Emit an event to users of a specific module
 * @param moduleId - Module ID
 * @param event - Event name
 * @param data - Event data
 */
export function emitToModule(moduleId: string, event: string, data: any): void {
  if (!io) {
    logger.error('Socket.IO server not initialized');
    return;
  }
  
  const roomName = formatRoomName(RoomType.MODULE, moduleId);
  io.to(roomName).emit(event, data);
  logger.debug(`Emitted ${event} to module ${moduleId}`);
}

/**
 * Emit an event to all connected users
 * @param event - Event name
 * @param data - Event data
 */
export function emitToAll(event: string, data: any): void {
  if (!io) {
    logger.error('Socket.IO server not initialized');
    return;
  }
  
  const roomName = formatRoomName(RoomType.GLOBAL, 'all');
  io.to(roomName).emit(event, data);
  logger.debug(`Emitted ${event} to all users`);
}

/**
 * Emit an event to multiple users
 * @param userIds - Array of user IDs
 * @param event - Event name
 * @param data - Event data
 */
export function emitToUsers(userIds: (number | string)[], event: string, data: any): void {
  if (!io) {
    logger.error('Socket.IO server not initialized');
    return;
  }
  
  for (const userId of userIds) {
    emitToUser(userId, event, data);
  }
}

/**
 * Emit a server status event to all users
 * @param status - Server status message
 * @param isError - Whether this is an error status
 */
export function emitServerStatus(status: string, isError: boolean = false): void {
  const event = isError ? SOCKET_EVENTS.SYSTEM_ALERT : 'server_status';
  const data = {
    message: status,
    timestamp: new Date().toISOString(),
    type: isError ? 'error' : 'info'
  };
  
  emitToAll(event, data);
}

/**
 * Get the Socket.IO server instance
 * @returns Socket.IO server instance
 */
export function getSocketServer(): SocketIOServer {
  return io;
}

export default {
  initializeSocketServer,
  emitToUser,
  emitToOrganization,
  emitToRole,
  emitToModule,
  emitToAll,
  emitToUsers,
  emitServerStatus,
  getSocketServer,
  RoomType
};