import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import { db } from './db';
import { users, notifications, roles } from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';

export let io: SocketIOServer;

// Map to track which users are connected to which socket IDs
const userSocketMap = new Map<number, Set<string>>();
// Map to track which sockets belong to which user
const socketUserMap = new Map<string, number>();
// Map to track which organizations each socket belongs to
const socketOrgMap = new Map<string, number>();

// Define all real-time event types
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

export function initializeSocketServer(server: Server) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle client authentication and joining rooms
    socket.on('authenticate', async (data: { userId: number; orgId?: number }) => {
      try {
        const userId = data.userId;
        const orgId = data.orgId;
        
        if (!userId) {
          console.warn('Authentication failed: No user ID provided');
          socket.emit('authenticated', { success: false, error: 'No user ID provided' });
          return;
        }

        const user = await db.select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user.length === 0) {
          console.warn(`Authentication failed: User with ID ${userId} not found`);
          socket.emit('authenticated', { success: false, error: 'User not found' });
          return;
        }

        // Add socket to user mapping
        if (!userSocketMap.has(userId)) {
          userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId)?.add(socket.id);
        socketUserMap.set(socket.id, userId);
        
        // Track organization if provided, otherwise use user's default org
        const userOrgId = orgId || user[0].orgId;
        if (userOrgId) {
          socketOrgMap.set(socket.id, userOrgId);
          // Join organization room
          socket.join(`org:${userOrgId}`);
        }
        
        // Join user-specific room
        socket.join(`user:${userId}`);
        
        // Join department room if applicable
        if (user[0].dept) {
          socket.join(`dept:${user[0].dept}`);
        }
        
        // Join role room if applicable
        if (user[0].roleId) {
          socket.join(`role:${user[0].roleId}`);
          
          // Find user's role
          const userRole = await db.select()
            .from(roles)
            .where(eq(roles.id, user[0].roleId))
            .limit(1);
          
          if (userRole.length > 0) {
            socket.join(`role-name:${userRole[0].name.toLowerCase().replace(/\s+/g, '-')}`);
          }
        }
        
        console.log(`User ${userId} authenticated on socket ${socket.id}`);
        // Notify the user that they're authenticated
        socket.emit('authenticated', { 
          success: true, 
          userId, 
          orgId: userOrgId 
        });
        
        // Notify about user login
        emitToUser(userId, RealTimeEvents.USER_LOGGED_IN, {
          userId,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('authenticated', { success: false, error: 'Authentication failed' });
      }
    });
    
    // Handle organization switching
    socket.on('switch_organization', ({ userId, orgId }) => {
      if (userId && orgId) {
        const currentOrgId = socketOrgMap.get(socket.id);
        if (currentOrgId) {
          // Leave current org room
          socket.leave(`org:${currentOrgId}`);
        }
        
        // Join new org room
        socket.join(`org:${orgId}`);
        socketOrgMap.set(socket.id, orgId);
        
        console.log(`User ${userId} switched to organization ${orgId} on socket ${socket.id}`);
        socket.emit('organization_switched', { success: true, orgId });
      }
    });
    
    // Handle subscriptions to specific entity updates
    socket.on('subscribe', ({ entity, id }) => {
      if (entity && id) {
        socket.join(`${entity}:${id}`);
        console.log(`Socket ${socket.id} subscribed to ${entity}:${id}`);
      }
    });
    
    // Handle unsubscriptions
    socket.on('unsubscribe', ({ entity, id }) => {
      if (entity && id) {
        socket.leave(`${entity}:${id}`);
        console.log(`Socket ${socket.id} unsubscribed from ${entity}:${id}`);
      }
    });
    
    // Handle task status updates with enhanced real-time support
    socket.on('taskUpdate', (data) => {
      // Get user ID from socket
      const userId = socketUserMap.get(socket.id);
      
      // Add task updated metadata
      const taskUpdateData = {
        ...data,
        updatedBy: userId,
        updatedAt: new Date().toISOString()
      };
      
      // Send to specific users and broadcast to relevant rooms
      if (data.assignedTo) {
        emitToUser(data.assignedTo, RealTimeEvents.TASK_UPDATED, taskUpdateData);
      }
      
      // If task is completed, emit the completed event
      if (data.status === 'completed') {
        emitEvent(RealTimeEvents.TASK_COMPLETED, taskUpdateData);
      }
      
      // Notify organization members about task changes
      if (data.orgId) {
        emitToOrg(data.orgId, RealTimeEvents.TASK_UPDATED, taskUpdateData);
      }
      
      // Tell subscribers to this specific task
      emitToEntity('task', data.id, RealTimeEvents.TASK_UPDATED, taskUpdateData);
      
      // Broadcast general data update
      notifyDataChange('task', data.id, 'updated', taskUpdateData, {
        userId: data.assignedTo,
        orgId: data.orgId
      });
    });
    
    // Handle report submissions with enhanced real-time support
    socket.on('reportSubmit', (data) => {
      // Get user ID from socket
      const userId = socketUserMap.get(socket.id);
      
      // Add report submission metadata
      const reportData = {
        ...data,
        submittedBy: userId,
        submittedAt: new Date().toISOString()
      };
      
      // Broadcast to specific users
      if (data.dispatcherId) {
        emitToUser(data.dispatcherId, RealTimeEvents.REPORT_GENERATED, reportData);
      }
      
      // Broadcast to team leads and admins
      io.to('role-name:admin').emit(RealTimeEvents.REPORT_GENERATED, reportData);
      io.to('role-name:dispatch-team-lead').emit(RealTimeEvents.REPORT_GENERATED, reportData);
      
      // Notify organization members about report submission
      if (data.orgId) {
        emitToOrg(data.orgId, RealTimeEvents.REPORT_GENERATED, reportData);
      }
      
      // Tell subscribers to this specific report
      emitToEntity('report', data.id, RealTimeEvents.REPORT_GENERATED, reportData);
      
      // Broadcast general data update
      notifyDataChange('report', data.id, 'created', reportData, {
        userId: data.dispatcherId,
        orgId: data.orgId,
        broadcastToOrg: true
      });
    });
    
    // Handle UI preferences updates with enhanced real-time support
    socket.on('uiPrefsUpdated', (prefs) => {
      // Broadcast to all tabs of the same user
      if (prefs.userId) {
        socket.to(`user:${prefs.userId}`).emit('uiPrefsUpdated', prefs);
      }
    });

    // Handle client disconnection with enhanced cleanup
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Clean up user mapping
      const userId = socketUserMap.get(socket.id);
      if (userId) {
        const userSockets = userSocketMap.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          
          // If this was the last socket for this user, remove from map and notify about logout
          if (userSockets.size === 0) {
            userSocketMap.delete(userId);
            
            // Emit logout event
            emitEvent(RealTimeEvents.USER_LOGGED_OUT, {
              userId,
              timestamp: new Date().toISOString()
            });
          }
        }
        socketUserMap.delete(socket.id);
      }
      
      // Clean up org mapping
      socketOrgMap.delete(socket.id);
    });
  });

  console.log('Socket.IO server initialized');
  return io;
}

// Emit to all connected clients
export function emitEvent(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
    console.log(`Emitted global event: ${event}`, data);
  } else {
    console.error('Socket server not initialized, cannot emit event:', event);
  }
}

// Emit to a specific user (all their connected devices)
export function emitToUser(userId: number, event: string, data: any): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    console.log(`Emitted event to user ${userId}: ${event}`);
  } else {
    console.error(`Socket server not initialized, cannot emit event to user ${userId}:`, event);
  }
}

// Emit to all users in an organization
export function emitToOrg(orgId: number, event: string, data: any): void {
  if (io) {
    io.to(`org:${orgId}`).emit(event, data);
    console.log(`Emitted event to org ${orgId}: ${event}`);
  } else {
    console.error(`Socket server not initialized, cannot emit event to org ${orgId}:`, event);
  }
}

// Emit to clients subscribed to a specific entity
export function emitToEntity(entity: string, id: number | string, event: string, data: any): void {
  if (io) {
    io.to(`${entity}:${id}`).emit(event, data);
    console.log(`Emitted event to ${entity} ${id}: ${event}`);
  } else {
    console.error(`Socket server not initialized, cannot emit event to ${entity} ${id}:`, event);
  }
}

// Notify all relevant parties about data changes
export function notifyDataChange(
  entityType: string, 
  entityId: number | string, 
  action: 'created' | 'updated' | 'deleted', 
  data: any, 
  options?: { 
    orgId?: number, 
    userId?: number,
    broadcastToOrg?: boolean
  }
): void {
  if (!io) {
    console.error('Socket server not initialized, cannot notify data change');
    return;
  }

  const event = `${entityType}:${action}`;
  
  // Emit to the specific entity subscribers
  emitToEntity(entityType, entityId, event, data);
  
  // If userId is specified, also emit directly to that user
  if (options?.userId) {
    emitToUser(options.userId, event, data);
  }
  
  // If orgId is specified and broadcastToOrg is true, emit to the entire org
  if (options?.orgId && options?.broadcastToOrg) {
    emitToOrg(options.orgId, event, data);
  }
  
  // Always emit the general data update event
  emitEvent(RealTimeEvents.DATA_UPDATED, {
    entityType,
    entityId,
    action,
    timestamp: new Date().toISOString()
  });
}

// Helper function to send notifications via socket
export async function sendSocketNotification(type: string, userId: number, data: any) {
  try {
    // Store notification in database
    const insertedNotification = await db.insert(notifications).values({
      title: data.title || type,
      type,
      userId,
      message: data.message || JSON.stringify(data),
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // Format notification with ID for client
    const notificationData = {
      ...data,
      id: insertedNotification[0]?.id,
      type,
      createdAt: new Date().toISOString()
    };

    // Send via socket if user is connected
    emitToUser(userId, RealTimeEvents.NOTIFICATION_CREATED, notificationData);
    
    // Also send the specific event type if it's different from the generic notification event
    if (type !== RealTimeEvents.NOTIFICATION_CREATED) {
      emitToUser(userId, type, notificationData);
    }
    
    return true;
  } catch (error) {
    console.error(`Error sending ${type} notification:`, error);
    return false;
  }
}

/**
 * Send a notification to all team leads and admins in both sales and dispatch departments
 */
export async function notifyTeamLeadsAndAdmins(type: string, data: any) {
  try {
    // Find all team leads and admin users
    const teamLeadsAndAdmins = await db.select()
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(
        or(
          eq(roles.name, 'Admin'),
          eq(roles.name, 'Sales Team Lead'),
          eq(roles.name, 'Dispatch Team Lead')
        )
      );
    
    // Send notification to each team lead and admin
    for (const user of teamLeadsAndAdmins) {
      await sendSocketNotification(type, user.users.id, data);
    }
    
    return true;
  } catch (error) {
    console.error(`Error notifying team leads and admins (${type}):`, error);
    return false;
  }
}

/**
 * Send lead assigned notification to a dispatcher
 */
export async function sendLeadAssignedNotification(dispatcherId: number, leadData: any) {
  try {
    const notificationData = {
      title: 'New Lead Assigned',
      message: `A new lead (${leadData.name}) has been assigned to you. Please review and follow up.`,
      leadId: leadData.id,
      leadName: leadData.name,
      clientName: leadData.clientName,
      assignedBy: leadData.assignedBy,
      assignedAt: new Date().toISOString(),
      status: leadData.status
    };
    
    // Send to the specific dispatcher
    await sendSocketNotification(RealTimeEvents.LEAD_ASSIGNED, dispatcherId, notificationData);
    
    // Also notify the entity subscribers
    notifyDataChange('lead', leadData.id, 'updated', {
      ...leadData,
      assignedTo: dispatcherId,
      assignedAt: new Date().toISOString()
    }, {
      userId: dispatcherId,
      orgId: leadData.orgId,
      broadcastToOrg: true
    });
    
    return true;
  } catch (error) {
    console.error('Error sending lead assigned notification:', error);
    return false;
  }
}

/**
 * Send follow-up reminder for leads that are still in HandToDispatch status after 24 hours
 */
export async function sendLeadFollowUpReminder(dispatcherId: number, leadData: any) {
  try {
    const notificationData = {
      title: 'Lead Follow-Up Required',
      message: `Lead ${leadData.name} is still in HandToDispatch status. Immediate follow-up required.`,
      leadId: leadData.id,
      leadName: leadData.name,
      clientName: leadData.clientName,
      assignedAt: leadData.assignedAt,
      status: leadData.status,
      priority: 'high'
    };
    
    // Send to the specific dispatcher
    await sendSocketNotification(RealTimeEvents.LEAD_FOLLOW_UP_CREATED, dispatcherId, notificationData);
    
    return true;
  } catch (error) {
    console.error('Error sending lead follow-up reminder:', error);
    return false;
  }
}

/**
 * Send weekly inactive leads reminder
 */
export async function sendWeeklyInactiveLeadsReminder(dispatcherId: number, leadData: any) {
  try {
    const notificationData = {
      title: 'Weekly Inactive Leads Reminder',
      message: `You have ${leadData.count} inactive lead(s) in HandToDispatch status for more than a week. Please take action.`,
      leadIds: leadData.leadIds,
      leadNames: leadData.leadNames,
      count: leadData.count,
      priority: 'medium'
    };
    
    // Send to the specific dispatcher
    await sendSocketNotification('weeklyInactiveLeadsReminder', dispatcherId, notificationData);
    
    return true;
  } catch (error) {
    console.error('Error sending weekly inactive leads reminder:', error);
    return false;
  }
}

/**
 * Send lead status change notification
 */
export async function sendLeadStatusChangeNotification(leadData: any) {
  try {
    const notificationData = {
      title: 'Lead Status Changed',
      message: `Lead ${leadData.name} status changed to ${leadData.status}`,
      leadId: leadData.id,
      leadName: leadData.name,
      clientName: leadData.clientName,
      previousStatus: leadData.previousStatus,
      status: leadData.status,
      changedBy: leadData.changedBy,
      changedAt: new Date().toISOString()
    };
    
    // Send to team leads and admins
    await notifyTeamLeadsAndAdmins(RealTimeEvents.LEAD_STATUS_CHANGED, notificationData);
    
    // Send specific notification to sales team if status is Active or Unqualified
    if (leadData.status === 'Active' || leadData.status === 'Unqualified') {
      await db.select()
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(eq(roles.department, 'sales'))
        .then(salesUsers => {
          salesUsers.forEach(user => {
            sendSocketNotification(RealTimeEvents.LEAD_STATUS_CHANGED, user.users.id, notificationData);
          });
        });
    }
    
    // Notify about the lead status change
    notifyDataChange('lead', leadData.id, 'updated', {
      ...leadData,
      changedAt: new Date().toISOString()
    }, {
      orgId: leadData.orgId,
      broadcastToOrg: true
    });
    
    return true;
  } catch (error) {
    console.error('Error sending lead status change notification:', error);
    return false;
  }
}