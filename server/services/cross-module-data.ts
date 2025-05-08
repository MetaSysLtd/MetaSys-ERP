import { db } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { logger } from '../logger';
import { checkPermission } from './permissions';
import { getIo } from '../socket';
import { RealTimeEvents } from '@shared/constants';
import { 
  users, 
  leads, 
  commissions, 
  activities, 
  tasks, 
  dispatchTasks, 
  dispatch_clients, 
  invoices, 
  invoiceItems 
} from '@shared/schema';

/**
 * Service to handle cross-module data flow with permission checks
 */

interface CrossModuleData {
  type: string;
  data: any;
  sourceModule: string;
  targetModule: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface DataAccessOptions {
  userId: number;
  orgId?: number;
  includeDetails?: boolean;
}

// Define the permission requirements for each data type
const dataTypePermissions: Record<string, string> = {
  'leads': 'crm.leads.view',
  'clients': 'crm.clients.view',
  'commissions': 'finance.commissions.view',
  'activities': 'crm.activities.view',
  'dispatches': 'dispatch.loads.view',
  'invoices': 'finance.invoices.view',
  'tasks': 'tasks.view',
  'performance': 'reports.performance.view',
  'financial': 'finance.reports.view'
};

/**
 * Get data from a module based on type and permissions
 */
export async function getModuleData(
  dataType: string,
  userId: number,
  options: DataAccessOptions = { userId: 0 }
): Promise<{ data: any; hasAccess: boolean; error?: string }> {
  try {
    // Check if user has permission to access this data type
    const requiredPermission = dataTypePermissions[dataType] || `${dataType}.view`;
    const hasAccess = await checkPermission(userId, requiredPermission);
    
    if (!hasAccess) {
      return { 
        data: null, 
        hasAccess: false,
        error: `Access denied: You don't have permission to view ${dataType}` 
      };
    }
    
    // Get the data based on the type
    let data = null;
    const orgId = options.orgId || 0;
    
    switch (dataType) {
      case 'leads':
        data = await getLeadData(userId, orgId, options.includeDetails);
        break;
      case 'clients':
        data = await getClientData(userId, orgId);
        break;
      case 'commissions':
        data = await getCommissionData(userId, orgId);
        break;
      case 'activities':
        data = await getActivityData(userId, orgId);
        break;
      case 'dispatches':
        data = await getDispatchData(userId, orgId);
        break;
      case 'invoices':
        data = await getInvoiceData(userId, orgId);
        break;
      case 'tasks':
        data = await getTaskData(userId, orgId);
        break;
      case 'performance':
        data = await getPerformanceData(userId, orgId);
        break;
      case 'dashboard':
        // Dashboard combines multiple data types
        data = await getDashboardData(userId, orgId);
        break;
      default:
        return {
          data: null,
          hasAccess: false,
          error: `Unknown data type: ${dataType}`
        };
    }
    
    return { 
      data, 
      hasAccess: true 
    };
  } catch (error) {
    logger.error(`Error getting module data (type: ${dataType}):`, error);
    
    // Generate a user-friendly error message
    let errorMessage = "An error occurred while retrieving data";
    
    if (error instanceof Error) {
      // Add more context to the error while keeping it user-friendly
      errorMessage = `${errorMessage}: ${error.message}`;
      
      // Log additional diagnostic information
      logger.debug(`Detailed error in getModuleData - context: cross-module-data, action: getModuleData, dataType: ${dataType}, userId: ${userId}, error: ${error.name} - ${error.message}`);
    }
    
    return {
      data: null,
      hasAccess: false,
      error: errorMessage
    };
  }
}

/**
 * Get lead data with permission checks
 */
async function getLeadData(userId: number, orgId: number, includeDetails = false): Promise<any> {
  // Get leads assigned to the user or within their organization
  const query = db.select().from(leads).where(
    orgId > 0 
      ? eq(leads.orgId, orgId) 
      : eq(leads.assignedTo, userId)
  ).orderBy(desc(leads.updatedAt));

  // Optionally include related data
  if (includeDetails) {
    // Note: This is a placeholder. In a real system, you'd use proper joins
    // with related tables like leadActivities, leadRemarks, etc.
    return await query;
  }

  // Basic lead data
  return await query;
}

/**
 * Get client data with permission checks
 */
async function getClientData(userId: number, orgId: number): Promise<any> {
  // Get clients associated with the user's organization
  return await db.select().from(dispatch_clients).where(
    orgId > 0 
      ? eq(dispatch_clients.orgId, orgId) 
      : sql`1=1` // All clients if no orgId specified (for global admins)
  ).orderBy(desc(dispatch_clients.updatedAt));
}

/**
 * Get commission data with permission checks
 */
async function getCommissionData(userId: number, orgId: number): Promise<any> {
  // Get commissions for the user or organization
  const query = db.select().from(commissions);

  if (orgId > 0) {
    query.where(eq(commissions.orgId, orgId));
  } else {
    query.where(eq(commissions.userId, userId));
  }

  return await query.orderBy(desc(commissions.month));
}

/**
 * Get activity data with permission checks
 */
async function getActivityData(userId: number, orgId: number): Promise<any> {
  // Get activities associated with the user or organization
  const query = db.select().from(activities);

  if (orgId > 0) {
    query.where(eq(activities.orgId, orgId));
  } else {
    query.where(eq(activities.userId, userId));
  }

  return await query.orderBy(desc(activities.timestamp));
}

/**
 * Get dispatch data with permission checks
 */
async function getDispatchData(userId: number, orgId: number): Promise<any> {
  // Get dispatch tasks associated with the user or organization
  return await db.select().from(dispatchTasks).where(
    orgId > 0 
      ? eq(dispatchTasks.orgId, orgId) 
      : eq(dispatchTasks.assignedTo, userId)
  ).orderBy(desc(dispatchTasks.updatedAt));
}

/**
 * Get invoice data with permission checks
 */
async function getInvoiceData(userId: number, orgId: number): Promise<any> {
  // Get invoices associated with the user or organization
  return await db.select().from(invoices).where(
    orgId > 0 
      ? eq(invoices.orgId, orgId) 
      : eq(invoices.createdBy, userId)
  ).orderBy(desc(invoices.issuedDate));
}

/**
 * Get task data with permission checks
 */
async function getTaskData(userId: number, orgId: number): Promise<any> {
  // Get tasks assigned to the user or within their organization
  return await db.select().from(tasks).where(
    orgId > 0
      ? eq(tasks.orgId, orgId)
      : eq(tasks.assignedTo, userId)
  ).orderBy(desc(tasks.dueDate));
}

/**
 * Get performance data with permission checks
 */
async function getPerformanceData(userId: number, orgId: number): Promise<any> {
  // Get performance metrics for the user or organization
  const userData = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      commissions: true
    }
  });

  if (!userData) {
    return null;
  }

  // Get lead conversion metrics
  const leadMetrics = await db.select({
    assigned: sql<number>`count(*) filter (where ${leads.assignedTo} = ${userId})`,
    converted: sql<number>`count(*) filter (where ${leads.assignedTo} = ${userId} and ${leads.status} = 'converted')`,
    conversion_rate: sql<number>`
      case
        when count(*) filter (where ${leads.assignedTo} = ${userId}) > 0
        then (count(*) filter (where ${leads.assignedTo} = ${userId} and ${leads.status} = 'converted') * 100.0 / 
             count(*) filter (where ${leads.assignedTo} = ${userId}))
        else 0
      end
    `
  }).from(leads);

  return {
    user: {
      id: userData.id,
      name: `${userData.firstName} ${userData.lastName}`,
      role: userData.roleId,
      department: userData.department
    },
    leads: leadMetrics[0],
    commissions: userData.commissions,
    // Additional performance metrics would go here
  };
}

/**
 * Get combined dashboard data
 */
async function getDashboardData(userId: number, orgId: number): Promise<any> {
  // Get combined data for the dashboard
  const userData = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!userData) {
    return null;
  }

  // Get counts of various entities
  const leadCount = await db.select({
    count: sql<number>`count(*)`
  }).from(leads).where(
    orgId > 0 
      ? eq(leads.orgId, orgId) 
      : sql`1=1`
  );

  const clientCount = await db.select({
    count: sql<number>`count(*)`
  }).from(dispatch_clients).where(
    orgId > 0 
      ? eq(dispatch_clients.orgId, orgId) 
      : sql`1=1`
  );

  const taskCount = await db.select({
    count: sql<number>`count(*)`
  }).from(tasks).where(
    orgId > 0
      ? eq(tasks.orgId, orgId)
      : eq(tasks.assignedTo, userId)
  );

  const dispatchCount = await db.select({
    count: sql<number>`count(*)`
  }).from(dispatchTasks).where(
    orgId > 0 
      ? eq(dispatchTasks.orgId, orgId) 
      : sql`1=1`
  );

  // Get user's latest 5 activities
  const userActivities = await db.select().from(activities)
    .where(eq(activities.userId, userId))
    .orderBy(desc(activities.timestamp))
    .limit(5);

  // Get user's latest 5 tasks
  const userTasks = await db.select().from(tasks)
    .where(eq(tasks.assignedTo, userId))
    .orderBy(desc(tasks.dueDate))
    .limit(5);

  return {
    counts: {
      leads: leadCount[0]?.count || 0,
      clients: clientCount[0]?.count || 0,
      tasks: taskCount[0]?.count || 0,
      dispatches: dispatchCount[0]?.count || 0
    },
    recentActivities: userActivities,
    upcomingTasks: userTasks,
    user: {
      id: userData.id,
      name: `${userData.firstName} ${userData.lastName}`,
      role: userData.roleId
    }
  };
}

/**
 * Emit real-time event for cross-module data updates
 */
export function emitCrossModuleUpdate(
  sourceModule: string,
  dataType: string,
  data: any,
  targetUsers: number[] = []
): void {
  const io = getIo();
  
  const eventData: CrossModuleData = {
    type: dataType,
    data,
    sourceModule,
    targetModule: '*', // Broadcast to all modules
    timestamp: new Date(),
    metadata: {
      action: 'update'
    }
  };
  
  // Emit to specific users if provided
  if (targetUsers.length > 0) {
    targetUsers.forEach(userId => {
      io.to(`user:${userId}`).emit(RealTimeEvents.DATA_UPDATED, eventData);
    });
  } else {
    // Broadcast to all authenticated users
    io.emit(RealTimeEvents.DATA_UPDATED, eventData);
  }
  
  // Also emit a specific event for the data type
  const specificEvent = `${sourceModule}.${dataType}.updated`;
  
  if (targetUsers.length > 0) {
    targetUsers.forEach(userId => {
      io.to(`user:${userId}`).emit(specificEvent, eventData);
    });
  } else {
    io.emit(specificEvent, eventData);
  }
}

/**
 * Get detailed data with cross-module integration
 * This function gets data from multiple modules and combines it based on permissions
 */
export async function getIntegratedData(
  userId: number,
  dataType: string,
  entityId: number,
  options: DataAccessOptions = { userId: 0 }
): Promise<{ 
  data: any | null; 
  related?: Record<string, any>; 
  message?: string;
  success: boolean;
}> {
  try {
    // Check permission for the main data type
    const mainPermission = dataTypePermissions[dataType] || `${dataType}.view`;
    const hasMainAccess = await checkPermission(userId, mainPermission);
    
    if (!hasMainAccess) {
      return {
        data: null,
        success: false,
        message: `Access denied: You don't have permission to view ${dataType}`
      };
    }
    
    // Get the primary data
    const mainData = await getPrimaryEntityData(dataType, entityId);
    if (!mainData) {
      return {
        data: null,
        success: false,
        message: `No data found for ${dataType} with ID ${entityId}`
      };
    }
    
    // Get related data based on permissions
    const relatedData: Record<string, any> = {};
    const relatedTypes = getRelatedDataTypes(dataType);
    
    // Check permissions and get data for each related type
    await Promise.all(
      relatedTypes.map(async (relType) => {
        const permission = dataTypePermissions[relType] || `${relType}.view`;
        const hasAccess = await checkPermission(userId, permission);
        
        try {
          if (hasAccess) {
            const data = await getRelatedEntityData(dataType, entityId, relType);
            relatedData[relType] = data;
          } else {
            relatedData[relType] = { 
              restricted: true, 
              message: `Access denied: You don't have permission to view ${relType}` 
            };
          }
        } catch (relError) {
          // Log the error but don't fail the whole request
          logger.error(`Error getting related data (main: ${dataType}, related: ${relType}, id: ${entityId}):`, relError);
          
          relatedData[relType] = { 
            error: true, 
            message: `Error retrieving related ${relType} data` 
          };
        }
      })
    );
    
    return {
      data: mainData,
      related: relatedData,
      success: true
    };
  } catch (error) {
    logger.error(`Error getting integrated data (type: ${dataType}, id: ${entityId}):`, error);
    
    // Generate a user-friendly error message
    let errorMessage = "An error occurred while retrieving integrated data";
    
    if (error instanceof Error) {
      // Add more context to the error while keeping it user-friendly
      errorMessage = `${errorMessage}: ${error.message}`;
      
      // Log additional diagnostic information
      logger.debug(`Detailed error in getIntegratedData - context: cross-module-data, action: getIntegratedData, dataType: ${dataType}, entityId: ${entityId}, userId: ${userId}, error: ${error.name} - ${error.message}`);
    }
    
    return {
      data: null,
      success: false,
      message: errorMessage
    };
  }
}

/**
 * Get primary entity data
 */
async function getPrimaryEntityData(dataType: string, entityId: number): Promise<any> {
  switch (dataType) {
    case 'leads':
      return await db.query.leads.findFirst({
        where: eq(leads.id, entityId)
      });
    case 'clients':
      return await db.query.dispatch_clients.findFirst({
        where: eq(dispatch_clients.id, entityId)
      });
    case 'dispatches':
      return await db.query.dispatchTasks.findFirst({
        where: eq(dispatchTasks.id, entityId)
      });
    case 'tasks':
      return await db.query.tasks.findFirst({
        where: eq(tasks.id, entityId)
      });
    case 'invoices':
      return await db.query.invoices.findFirst({
        where: eq(invoices.id, entityId)
      });
    default:
      return null;
  }
}

/**
 * Get related entity data
 */
async function getRelatedEntityData(
  primaryType: string,
  primaryId: number,
  relatedType: string
): Promise<any> {
  switch (`${primaryType}:${relatedType}`) {
    case 'leads:activities':
      return await db.select().from(activities)
        .where(
          and(
            eq(activities.entityType, 'lead'),
            eq(activities.entityId, primaryId)
          )
        )
        .orderBy(desc(activities.timestamp));
    
    case 'leads:tasks':
      return await db.select().from(tasks)
        .where(
          and(
            eq(tasks.relatedEntityType, 'lead'),
            eq(tasks.relatedEntityId, primaryId)
          )
        )
        .orderBy(desc(tasks.dueDate));
    
    case 'leads:commissions':
      // Get commission data related to this lead
      return await db.select().from(commissions)
        .where(eq(commissions.leadId, primaryId))
        .orderBy(desc(commissions.createdAt));
    
    case 'clients:invoices':
      return await db.select().from(invoices)
        .where(eq(invoices.leadId, primaryId))
        .orderBy(desc(invoices.issuedDate));
    
    case 'clients:activities':
      return await db.select().from(activities)
        .where(
          and(
            eq(activities.entityType, 'client'),
            eq(activities.entityId, primaryId)
          )
        )
        .orderBy(desc(activities.timestamp));
        
    case 'clients:tasks':
      return await db.select().from(tasks)
        .where(
          and(
            eq(tasks.relatedEntityType, 'client'),
            eq(tasks.relatedEntityId, primaryId)
          )
        )
        .orderBy(desc(tasks.dueDate));
    
    case 'dispatches:activities':
      return await db.select().from(activities)
        .where(
          and(
            eq(activities.entityType, 'dispatch'),
            eq(activities.entityId, primaryId)
          )
        )
        .orderBy(desc(activities.timestamp));

    case 'dispatches:invoices':
      // Get invoices related to this dispatch
      return await db.select().from(invoices)
        .where(eq(invoices.dispatchId, primaryId))
        .orderBy(desc(invoices.issuedDate));
        
    case 'dispatches:tasks':
      // Get tasks related to this dispatch
      return await db.select().from(tasks)
        .where(
          and(
            eq(tasks.relatedEntityType, 'dispatch'),
            eq(tasks.relatedEntityId, primaryId)
          )
        )
        .orderBy(desc(tasks.dueDate));
    
    case 'invoices:dispatches':
      // Get dispatch related to this invoice
      return await db.query.dispatchTasks.findFirst({
        where: eq(dispatchTasks.id, await db.select({ 
          dispatchId: invoices.dispatchId 
        })
        .from(invoices)
        .where(eq(invoices.id, primaryId))
        .then(results => results[0]?.dispatchId || 0))
      });
      
    case 'invoices:clients':
      // Get client related to this invoice
      return await db.query.dispatch_clients.findFirst({
        where: eq(dispatch_clients.id, await db.select({ 
          leadId: invoices.leadId 
        })
        .from(invoices)
        .where(eq(invoices.id, primaryId))
        .then(results => results[0]?.leadId || 0))
      });
      
    case 'invoices:activities':
      // Get activities related to this invoice
      return await db.select().from(activities)
        .where(
          and(
            eq(activities.entityType, 'invoice'),
            eq(activities.entityId, primaryId)
          )
        )
        .orderBy(desc(activities.timestamp));
      
    case 'tasks:activities':
      // Get activities related to this task
      return await db.select().from(activities)
        .where(
          and(
            eq(activities.entityType, 'task'),
            eq(activities.entityId, primaryId)
          )
        )
        .orderBy(desc(activities.timestamp));
    
    default:
      return [];
  }
}

/**
 * Get related data types for a given entity type
 */
function getRelatedDataTypes(dataType: string): string[] {
  switch (dataType) {
    case 'leads':
      return ['activities', 'tasks', 'commissions'];
    case 'clients':
      return ['invoices', 'activities', 'tasks'];
    case 'dispatches':
      return ['activities', 'tasks', 'invoices'];
    case 'invoices':
      return ['activities', 'clients', 'dispatches'];
    case 'tasks':
      return ['activities'];
    default:
      return [];
  }
}