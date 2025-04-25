import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import { db } from './db';
import { users, notifications } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
      userId,
      type,
      content: JSON.stringify(data),
      read: false,
      createdAt: new Date(),
    });

    // Send via socket if user is connected
    io.to(`user_${userId}`).emit(type, data);
    
    return true;
  } catch (error) {
    console.error(`Error sending ${type} notification:`, error);
    return false;
  }
}