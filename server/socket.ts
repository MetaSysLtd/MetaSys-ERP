import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import { db } from './db';
import { users, notifications, roles } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export let io: SocketIOServer;

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

    // Authenticate socket connection
    socket.on('authenticate', async (userId: number) => {
      try {
        if (!userId) {
          console.warn('Authentication failed: No user ID provided');
          return;
        }

        const user = await db.select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user.length === 0) {
          console.warn(`Authentication failed: User with ID ${userId} not found`);
          return;
        }

        // Join room for user-specific messages
        socket.join(`user_${userId}`);
        
        // Join room for department-wide messages
        if (user[0].dept) {
          socket.join(`dept_${user[0].dept}`);
        }
        
        // Join room for org-wide messages
        if (user[0].orgId) {
          socket.join(`org_${user[0].orgId}`);
        }

        console.log(`User ${userId} authenticated and joined rooms`);
        socket.emit('authenticated', { success: true });
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('authenticated', { success: false, error: 'Authentication failed' });
      }
    });

    // Handle task status updates
    socket.on('taskUpdate', (data) => {
      // Broadcast to relevant users
      if (data.dispatcherId) {
        io.to(`user_${data.dispatcherId}`).emit('taskUpdated', data);
      }
      
      // Also broadcast to team leads and admins in the department
      io.to(`dept_dispatch`).emit('taskStatusChanged', data);
    });
    
    // Handle report submissions
    socket.on('reportSubmit', (data) => {
      // Broadcast to relevant users
      if (data.dispatcherId) {
        io.to(`user_${data.dispatcherId}`).emit('reportSubmitted', data);
      }
      
      // Also broadcast to team leads and admins
      io.to(`dept_dispatch`).emit('reportSubmitted', data);
      io.to(`role_admin`).emit('dailyReportSubmitted', data);
    });

    // Store socket preference update events
    socket.on('uiPrefsUpdated', (prefs) => {
      // Broadcast to all tabs of the same user
      if (prefs.userId) {
        socket.to(`user_${prefs.userId}`).emit('uiPrefsUpdated', prefs);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('Socket.IO server initialized');
  return io;
}

// Helper function to send notifications via socket
export async function sendSocketNotification(type: string, userId: number, data: any) {
  try {
    // Store notification in database
    await db.insert(notifications).values({
      title: data.title || type,
      type,
      userId,
      message: data.message || JSON.stringify(data),
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Send via socket if user is connected
    io.to(`user_${userId}`).emit(type, data);
    
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
      assignedAt: new Date(),
      status: leadData.status
    };
    
    // Send to the specific dispatcher
    await sendSocketNotification('leadAssigned', dispatcherId, notificationData);
    
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
      status: leadData.status
    };
    
    // Send to the specific dispatcher
    await sendSocketNotification('leadFollowUpReminder', dispatcherId, notificationData);
    
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
      count: leadData.count
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
      changedAt: new Date()
    };
    
    // Send to team leads and admins
    await notifyTeamLeadsAndAdmins('leadStatusChange', notificationData);
    
    // Send specific notification to sales team if status is Active or Unqualified
    if (leadData.status === 'Active' || leadData.status === 'Unqualified') {
      await db.select()
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(eq(roles.department, 'sales'))
        .then(salesUsers => {
          salesUsers.forEach(user => {
            sendSocketNotification('leadStatusChange', user.users.id, notificationData);
          });
        });
    }
    
    return true;
  } catch (error) {
    console.error('Error sending lead status change notification:', error);
    return false;
  }
}