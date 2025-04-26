import { NextFunction, Request, Response } from 'express';
import { notifyDataChange } from '../socket';
import { storage } from '../storage';
import { logger } from '../logger';

/**
 * Helper function to emit real-time events when data changes
 * This can be used as middleware or called directly from routes
 * 
 * @param entityType The type of entity being modified (e.g., 'lead', 'load', 'invoice')
 * @param action The action being performed ('created', 'updated', 'deleted')
 * @param entityId The ID of the entity being modified
 * @param data The data related to the entity
 * @param options Additional options for notification control
 */
export function emitRealTimeUpdate(
  entityType: string,
  action: 'created' | 'updated' | 'deleted',
  entityId: number | string,
  data: any,
  options?: {
    userId?: number;
    orgId?: number;
    broadcastToOrg?: boolean;
    skipNotification?: boolean;
  }
): void {
  try {
    // Emit real-time update via socket
    notifyDataChange(
      entityType,
      entityId,
      action,
      data,
      {
        userId: options?.userId,
        orgId: options?.orgId,
        broadcastToOrg: options?.broadcastToOrg || false
      }
    );

    // If skipNotification is true, don't create a notification
    if (options?.skipNotification) {
      return;
    }

    // Create notification in database if appropriate
    if (action !== 'deleted' && options?.orgId) {
      createActivityNotification(entityType, action, entityId, data, options.orgId, options.userId);
    }
  } catch (error) {
    logger.error(`Error emitting real-time update for ${entityType}:${action}:`, error);
  }
}

/**
 * Creates a notification record in the database
 */
async function createActivityNotification(
  entityType: string,
  action: 'created' | 'updated' | 'deleted',
  entityId: number | string,
  data: any,
  orgId: number,
  userId?: number
): Promise<void> {
  try {
    // Different message templates based on entity type and action
    let message = '';
    let type = 'activity'; // Default notification type

    // Determine the appropriate message based on entity type and action
    if (entityType === 'lead') {
      if (action === 'created') {
        message = `New lead ${data.name || 'Unknown'} has been created`;
        type = 'lead';
      } else if (action === 'updated') {
        message = `Lead ${data.name || 'Unknown'} has been updated`;
        type = 'lead';
      }
    } else if (entityType === 'load') {
      if (action === 'created') {
        message = `New load #${data.loadNumber || entityId} has been created`;
        type = 'load';
      } else if (action === 'updated') {
        message = `Load #${data.loadNumber || entityId} has been updated`;
        type = 'load';
      }
    } else if (entityType === 'invoice') {
      if (action === 'created') {
        message = `New invoice #${data.invoiceNumber || entityId} has been created`;
        type = 'invoice';
      } else if (action === 'updated') {
        message = `Invoice #${data.invoiceNumber || entityId} has been updated`;
        type = 'invoice';
      }
    } else if (entityType === 'task') {
      if (action === 'created') {
        message = `New task "${data.title || 'Unknown'}" has been assigned`;
        type = 'task';
      } else if (action === 'updated') {
        message = `Task "${data.title || 'Unknown'}" has been updated`;
        type = 'task';
      }
    } else if (entityType === 'report') {
      if (action === 'created') {
        message = `New report for ${data.period || 'Unknown'} has been generated`;
        type = 'report';
      }
    }

    // Only create notification if we have a valid message
    if (message && message.length > 0) {
      await storage.createNotification({
        message,
        type,
        orgId,
        entityType,
        entityId: typeof entityId === 'string' ? entityId : entityId.toString(),
        createdBy: userId,
        createdAt: new Date(),
        read: false,
        important: type === 'invoice' || type === 'lead'
      });
    }
  } catch (error) {
    logger.error(`Error creating notification for ${entityType}:${action}:`, error);
  }
}

/**
 * Creates middleware that emits real-time events when API routes are accessed
 * This can be attached to express routers
 * 
 * @param entityType The type of entity being modified
 * @returns Express middleware function
 */
export function createRealTimeMiddleware(entityType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store the original JSON send method
    const originalSend = res.json;

    // Override the json method to intercept successful responses
    res.json = function(body: any): any {
      // Get the original response status code
      const statusCode = res.statusCode;

      // Only emit real-time events for successful operations
      if (statusCode >= 200 && statusCode < 300) {
        try {
          const userId = req.user?.id;
          const orgId = req.user?.orgId || null;
          
          // Determine the action based on the HTTP method
          let action: 'created' | 'updated' | 'deleted';
          
          switch (req.method.toUpperCase()) {
            case 'POST':
              action = 'created';
              break;
            case 'PUT':
            case 'PATCH':
              action = 'updated';
              break;
            case 'DELETE':
              action = 'deleted';
              break;
            default:
              // Don't emit events for GET requests
              return originalSend.apply(res, [body]);
          }
          
          // Extract entity ID from params or body
          let entityId: string | number;
          
          if (req.params.id) {
            entityId = req.params.id;
          } else if (body && body.id) {
            entityId = body.id;
          } else if (Array.isArray(body) && body.length > 0 && body[0].id) {
            // If we're returning an array, use the first item's ID and handle individually
            body.forEach((item: any) => {
              if (item.id) {
                emitRealTimeUpdate(entityType, action, item.id, item, { userId, orgId, broadcastToOrg: true });
              }
            });
            
            // We've already processed the array, so continue with the original send
            return originalSend.apply(res, [body]);
          } else {
            // Can't determine entity ID, skip emit
            return originalSend.apply(res, [body]);
          }
          
          // Emit the real-time update
          emitRealTimeUpdate(entityType, action, entityId, body, { userId, orgId, broadcastToOrg: true });
        } catch (error) {
          logger.error(`Error in real-time middleware for ${entityType}:`, error);
        }
      }
      
      // Call the original json method
      return originalSend.apply(res, [body]);
    };
    
    // Continue to the next middleware or route handler
    next();
  };
}

/**
 * Create specific middleware for common entity types
 */
export const leadRealTimeMiddleware = createRealTimeMiddleware('lead');
export const loadRealTimeMiddleware = createRealTimeMiddleware('load');
export const invoiceRealTimeMiddleware = createRealTimeMiddleware('invoice');
export const userRealTimeMiddleware = createRealTimeMiddleware('user');
export const taskRealTimeMiddleware = createRealTimeMiddleware('task');
export const reportRealTimeMiddleware = createRealTimeMiddleware('report');
export const notificationRealTimeMiddleware = createRealTimeMiddleware('notification');
export const dashboardRealTimeMiddleware = createRealTimeMiddleware('dashboard');