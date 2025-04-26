/**
 * Audit Logger Service
 * 
 * Provides functionality to log important user actions and system events
 * for audit trail and compliance purposes.
 */

import { db } from '../db';
import { logger } from '../logger';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Enum for different types of audit events
 */
export enum AuditEventType {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  ROLE_CREATED = 'ROLE_CREATED',
  ROLE_UPDATED = 'ROLE_UPDATED',
  ROLE_DELETED = 'ROLE_DELETED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  ORGANIZATION_CREATED = 'ORGANIZATION_CREATED',
  ORGANIZATION_UPDATED = 'ORGANIZATION_UPDATED',
  ORGANIZATION_DELETED = 'ORGANIZATION_DELETED',
  LEAD_CREATED = 'LEAD_CREATED',
  LEAD_UPDATED = 'LEAD_UPDATED',
  LEAD_DELETED = 'LEAD_DELETED',
  LOAD_CREATED = 'LOAD_CREATED',
  LOAD_UPDATED = 'LOAD_UPDATED',
  LOAD_DELETED = 'LOAD_DELETED',
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_UPDATED = 'INVOICE_UPDATED',
  INVOICE_DELETED = 'INVOICE_DELETED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  CANDIDATE_STATUS_CHANGED = 'CANDIDATE_STATUS_CHANGED',
  EMPLOYEE_CREATED = 'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED = 'EMPLOYEE_UPDATED',
  EMPLOYEE_TERMINATED = 'EMPLOYEE_TERMINATED',
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  REPORT_GENERATED = 'REPORT_GENERATED',
  EMAIL_SENT = 'EMAIL_SENT',
  SLACK_NOTIFICATION_SENT = 'SLACK_NOTIFICATION_SENT',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  SECURITY_ALERT = 'SECURITY_ALERT',
  DATA_EXPORT = 'DATA_EXPORT',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

/**
 * Interface for audit log entries
 */
export interface AuditLogEntry {
  timestamp: Date;
  userId: number | null;
  userEmail?: string;
  organizationId: number | null;
  eventType: AuditEventType;
  resourceType: string;
  resourceId: string | number | null;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an audit event
 * @param entry - Audit log entry details
 * @returns Promise resolving to success status
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<boolean> {
  try {
    const now = new Date();
    
    // Insert into audit_logs table
    await db.insert(schema.auditLogs).values({
      timestamp: entry.timestamp || now,
      userId: entry.userId,
      orgId: entry.organizationId,
      eventType: entry.eventType,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ? String(entry.resourceId) : null,
      description: entry.description,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to log audit event:', error);
    logger.error('Event details:', entry);
    return false;
  }
}

/**
 * Log a security-related audit event
 * Special handling for security events that need immediate attention
 * @param entry - Audit log entry details
 * @returns Promise resolving to success status
 */
export async function logSecurityEvent(entry: AuditLogEntry): Promise<boolean> {
  try {
    // Override the event type to ensure it's categorized as a security event
    entry.eventType = AuditEventType.SECURITY_ALERT;
    
    // Log to audit trail
    await logAuditEvent(entry);
    
    // Also log to system logs as a high-priority alert
    logger.warn(`SECURITY ALERT: ${entry.description}`, {
      userId: entry.userId,
      orgId: entry.organizationId,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress
    });
    
    // Additional security alert distribution could be added here
    
    return true;
  } catch (error) {
    logger.error('Failed to log security event:', error);
    return false;
  }
}

/**
 * Get audit logs for a specific organization
 * @param orgId - Organization ID
 * @param limit - Maximum number of records to return
 * @param offset - Offset for pagination
 * @returns Promise resolving to audit log entries
 */
export async function getOrganizationAuditLogs(
  orgId: number,
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  try {
    const logs = await db.select()
      .from(schema.auditLogs)
      .where(sql`${schema.auditLogs.orgId} = ${orgId}`)
      .orderBy(sql`${schema.auditLogs.timestamp} DESC`)
      .limit(limit)
      .offset(offset);
    
    return logs;
  } catch (error) {
    logger.error(`Failed to retrieve audit logs for organization ${orgId}:`, error);
    return [];
  }
}

/**
 * Get audit logs for a specific user
 * @param userId - User ID
 * @param limit - Maximum number of records to return
 * @param offset - Offset for pagination
 * @returns Promise resolving to audit log entries
 */
export async function getUserAuditLogs(
  userId: number,
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  try {
    const logs = await db.select()
      .from(schema.auditLogs)
      .where(sql`${schema.auditLogs.userId} = ${userId}`)
      .orderBy(sql`${schema.auditLogs.timestamp} DESC`)
      .limit(limit)
      .offset(offset);
    
    return logs;
  } catch (error) {
    logger.error(`Failed to retrieve audit logs for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get audit logs for a specific resource
 * @param resourceType - Type of resource (e.g., "user", "lead", "invoice")
 * @param resourceId - ID of the resource
 * @param limit - Maximum number of records to return
 * @param offset - Offset for pagination
 * @returns Promise resolving to audit log entries
 */
export async function getResourceAuditLogs(
  resourceType: string,
  resourceId: string | number,
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  try {
    const resourceIdStr = String(resourceId);
    
    const logs = await db.select()
      .from(schema.auditLogs)
      .where(sql`${schema.auditLogs.resourceType} = ${resourceType} AND ${schema.auditLogs.resourceId} = ${resourceIdStr}`)
      .orderBy(sql`${schema.auditLogs.timestamp} DESC`)
      .limit(limit)
      .offset(offset);
    
    return logs;
  } catch (error) {
    logger.error(`Failed to retrieve audit logs for ${resourceType} ${resourceId}:`, error);
    return [];
  }
}

/**
 * Get all audit logs with filtering options
 * @param filters - Filtering options
 * @param limit - Maximum number of records to return
 * @param offset - Offset for pagination
 * @returns Promise resolving to audit log entries
 */
export async function getAuditLogs(
  filters: {
    userId?: number;
    orgId?: number;
    eventType?: AuditEventType;
    resourceType?: string;
    resourceId?: string | number;
    startDate?: Date;
    endDate?: Date;
  },
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  try {
    let query = db.select().from(schema.auditLogs);
    
    // Apply filters
    const conditions: any[] = [];
    
    if (filters.userId !== undefined) {
      conditions.push(sql`${schema.auditLogs.userId} = ${filters.userId}`);
    }
    
    if (filters.orgId !== undefined) {
      conditions.push(sql`${schema.auditLogs.orgId} = ${filters.orgId}`);
    }
    
    if (filters.eventType !== undefined) {
      conditions.push(sql`${schema.auditLogs.eventType} = ${filters.eventType}`);
    }
    
    if (filters.resourceType !== undefined) {
      conditions.push(sql`${schema.auditLogs.resourceType} = ${filters.resourceType}`);
    }
    
    if (filters.resourceId !== undefined) {
      conditions.push(sql`${schema.auditLogs.resourceId} = ${String(filters.resourceId)}`);
    }
    
    if (filters.startDate !== undefined) {
      conditions.push(sql`${schema.auditLogs.timestamp} >= ${filters.startDate}`);
    }
    
    if (filters.endDate !== undefined) {
      conditions.push(sql`${schema.auditLogs.timestamp} <= ${filters.endDate}`);
    }
    
    // Apply all conditions if any exist
    if (conditions.length > 0) {
      let whereClause = conditions[0];
      for (let i = 1; i < conditions.length; i++) {
        whereClause = sql`${whereClause} AND ${conditions[i]}`;
      }
      query = query.where(whereClause);
    }
    
    // Apply sorting and pagination
    query = query.orderBy(sql`${schema.auditLogs.timestamp} DESC`)
      .limit(limit)
      .offset(offset);
    
    const logs = await query;
    return logs;
  } catch (error) {
    logger.error('Failed to retrieve audit logs with filters:', error);
    logger.error('Filters:', filters);
    return [];
  }
}

/**
 * Create an Express middleware for automatically logging API requests
 * @returns Express middleware function
 */
export function createAuditLogMiddleware() {
  return async (req: any, res: any, next: Function) => {
    // Save the original end function
    const originalEnd = res.end;
    
    // Override the end function to capture the response
    res.end = async function(...args: any[]) {
      // Call the original end function
      originalEnd.apply(res, args);
      
      try {
        // Don't log static assets or health checks
        if (req.path.startsWith('/assets/') || 
            req.path === '/favicon.ico' || 
            req.path === '/health' ||
            req.path === '/api/status/ping') {
          return;
        }
        
        // Extract the user ID from the session if available
        const userId = req.user?.id || req.session?.userId || null;
        const orgId = req.user?.orgId || null;
        
        // Determine resource type and ID from the path
        const pathParts = req.path.split('/').filter(Boolean);
        let resourceType = pathParts.length > 1 ? pathParts[1] : 'unknown';
        let resourceId = pathParts.length > 2 ? pathParts[2] : null;
        
        // Only numeric resource IDs are likely to be valid
        if (resourceId && !/^\d+$/.test(resourceId)) {
          resourceId = null;
        }
        
        // Determine event type based on HTTP method
        let eventType: AuditEventType;
        switch (req.method) {
          case 'GET':
            eventType = AuditEventType.USER_LOGIN; // Placeholder, as GETs aren't typically audited
            break;
          case 'POST':
            eventType = determineCreateEventType(resourceType);
            break;
          case 'PUT':
          case 'PATCH':
            eventType = determineUpdateEventType(resourceType);
            break;
          case 'DELETE':
            eventType = determineDeleteEventType(resourceType);
            break;
          default:
            eventType = AuditEventType.USER_LOGIN; // Default placeholder
        }
        
        // Don't log GET requests for regular operations
        // Only log important mutations and actions
        if (req.method === 'GET' && !req.path.includes('/login') && !req.path.includes('/logout')) {
          return;
        }
        
        // Log audit event
        await logAuditEvent({
          timestamp: new Date(),
          userId,
          userEmail: req.user?.email,
          organizationId: orgId,
          eventType,
          resourceType,
          resourceId,
          description: `${req.method} ${req.path}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: {
            statusCode: res.statusCode,
            responseTime: Date.now() - req.startTime,
            query: req.query
          }
        });
      } catch (error) {
        // Don't let audit logging failure affect the response
        logger.error('Error in audit log middleware:', error);
      }
    };
    
    // Store request start time for calculating response time
    req.startTime = Date.now();
    next();
  };
}

/**
 * Determine the appropriate create event type based on resource type
 * @param resourceType - Type of resource being created
 * @returns Appropriate audit event type
 */
function determineCreateEventType(resourceType: string): AuditEventType {
  switch (resourceType.toLowerCase()) {
    case 'users':
      return AuditEventType.USER_CREATED;
    case 'roles':
      return AuditEventType.ROLE_CREATED;
    case 'organizations':
      return AuditEventType.ORGANIZATION_CREATED;
    case 'leads':
      return AuditEventType.LEAD_CREATED;
    case 'loads':
      return AuditEventType.LOAD_CREATED;
    case 'invoices':
      return AuditEventType.INVOICE_CREATED;
    case 'employees':
      return AuditEventType.EMPLOYEE_CREATED;
    case 'api-keys':
      return AuditEventType.API_KEY_CREATED;
    default:
      return AuditEventType.USER_LOGIN; // Default placeholder
  }
}

/**
 * Determine the appropriate update event type based on resource type
 * @param resourceType - Type of resource being updated
 * @returns Appropriate audit event type
 */
function determineUpdateEventType(resourceType: string): AuditEventType {
  switch (resourceType.toLowerCase()) {
    case 'users':
      return AuditEventType.USER_UPDATED;
    case 'roles':
      return AuditEventType.ROLE_UPDATED;
    case 'organizations':
      return AuditEventType.ORGANIZATION_UPDATED;
    case 'leads':
      return AuditEventType.LEAD_UPDATED;
    case 'loads':
      return AuditEventType.LOAD_UPDATED;
    case 'invoices':
      return AuditEventType.INVOICE_UPDATED;
    case 'employees':
      return AuditEventType.EMPLOYEE_UPDATED;
    case 'permissions':
      return AuditEventType.PERMISSION_CHANGED;
    case 'candidates':
      return AuditEventType.CANDIDATE_STATUS_CHANGED;
    case 'config':
      return AuditEventType.CONFIG_CHANGED;
    default:
      return AuditEventType.USER_LOGIN; // Default placeholder
  }
}

/**
 * Determine the appropriate delete event type based on resource type
 * @param resourceType - Type of resource being deleted
 * @returns Appropriate audit event type
 */
function determineDeleteEventType(resourceType: string): AuditEventType {
  switch (resourceType.toLowerCase()) {
    case 'users':
      return AuditEventType.USER_DELETED;
    case 'roles':
      return AuditEventType.ROLE_DELETED;
    case 'organizations':
      return AuditEventType.ORGANIZATION_DELETED;
    case 'leads':
      return AuditEventType.LEAD_DELETED;
    case 'loads':
      return AuditEventType.LOAD_DELETED;
    case 'invoices':
      return AuditEventType.INVOICE_DELETED;
    case 'employees':
      return AuditEventType.EMPLOYEE_TERMINATED;
    case 'api-keys':
      return AuditEventType.API_KEY_REVOKED;
    default:
      return AuditEventType.USER_LOGIN; // Default placeholder
  }
}