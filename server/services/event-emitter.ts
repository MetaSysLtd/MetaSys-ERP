/**
 * Centralized event emitter service to standardize socket events across the application
 * This ensures consistent real-time updates for key data changes
 */

import socketService, { RoomType } from './socket';
import { logger } from '../logger';

/**
 * Event categories to organize different types of real-time updates
 */
export enum EventCategory {
  LEAD = 'lead',
  DISPATCH = 'dispatch',
  INVOICE = 'invoice',
  USER = 'user',
  CLIENT = 'client',
  SYSTEM = 'system',
}

/**
 * Standard event types for common operations
 */
export enum EventType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
  COMPLETED = 'completed',
  PAID = 'paid',
  ALERT = 'alert',
}

/**
 * Interface for standardized event payload
 */
interface EventPayload {
  id: number | string;
  category: EventCategory;
  type: EventType;
  data: any;
  metadata?: {
    userId?: number | string;
    orgId?: number | string;
    timestamp?: string;
    [key: string]: any;
  };
}

/**
 * Emits a standardized event to all relevant listeners
 * This is the primary method to use for emitting socket events
 */
export function emitEvent(payload: EventPayload): void {
  const { category, type, data, metadata = {} } = payload;
  const eventName = `${category}:${type}`;
  const timestamp = metadata.timestamp || new Date().toISOString();
  
  const eventPayload = {
    ...data,
    metadata: {
      ...metadata,
      timestamp,
      eventName,
    }
  };
  
  logger.debug(`Emitting event ${eventName}`, { 
    category, 
    type, 
    entityId: data.id, 
    userId: metadata.userId 
  });
  
  // Emit to different scopes based on available metadata
  
  // Organization-specific emission
  if (metadata.orgId) {
    socketService.emitToOrganization(metadata.orgId, eventName, eventPayload);
  }
  
  // User-specific emission if this event targets a specific user
  if (metadata.userId) {
    socketService.emitToUser(metadata.userId, eventName, eventPayload);
  }
  
  // Always emit to the module/category room for listeners of that module
  socketService.emitToModule(category, eventName, eventPayload);
  
  // Global listeners get high-level events
  const globalEventData = {
    id: data.id,
    category,
    type,
    timestamp,
    summary: getSummaryForEvent(category, type, data)
  };
  
  socketService.emitToAll('global:event', globalEventData);
}

/**
 * Helper to generate a human-readable summary of an event
 */
function getSummaryForEvent(category: EventCategory, type: EventType, data: any): string {
  switch (category) {
    case EventCategory.LEAD:
      return getLeadEventSummary(type, data);
    case EventCategory.DISPATCH:
      return getDispatchEventSummary(type, data);
    case EventCategory.INVOICE:
      return getInvoiceEventSummary(type, data);
    case EventCategory.USER:
      return getUserEventSummary(type, data);
    case EventCategory.CLIENT:
      return getClientEventSummary(type, data);
    default:
      return `${category} was ${type}`;
  }
}

/**
 * Generate lead event summary
 */
function getLeadEventSummary(type: EventType, data: any): string {
  const leadName = data.companyName || data.name || `Lead #${data.id}`;
  
  switch (type) {
    case EventType.CREATED:
      return `New lead created: ${leadName}`;
    case EventType.UPDATED:
      return `Lead updated: ${leadName}`;
    case EventType.STATUS_CHANGED:
      return `Lead status changed to ${data.status}: ${leadName}`;
    case EventType.ASSIGNED:
      return `Lead assigned: ${leadName}`;
    case EventType.DELETED:
      return `Lead deleted: ${leadName}`;
    default:
      return `Lead action: ${leadName}`;
  }
}

/**
 * Generate dispatch event summary
 */
function getDispatchEventSummary(type: EventType, data: any): string {
  const loadId = data.id;
  const client = data.clientName || data.client?.name || 'Client';
  
  switch (type) {
    case EventType.CREATED:
      return `New load created for ${client}`;
    case EventType.UPDATED:
      return `Load #${loadId} updated for ${client}`;
    case EventType.STATUS_CHANGED:
      return `Load #${loadId} status changed to ${data.status}`;
    case EventType.ASSIGNED:
      return `Load #${loadId} assigned to driver`;
    case EventType.COMPLETED:
      return `Load #${loadId} completed`;
    default:
      return `Dispatch action: Load #${loadId}`;
  }
}

/**
 * Generate invoice event summary
 */
function getInvoiceEventSummary(type: EventType, data: any): string {
  const invoiceId = data.id;
  const amount = data.amount ? `$${data.amount}` : '';
  const client = data.clientName || data.client?.name || 'Client';
  
  switch (type) {
    case EventType.CREATED:
      return `New invoice created for ${client} ${amount}`;
    case EventType.UPDATED:
      return `Invoice #${invoiceId} updated ${amount}`;
    case EventType.PAID:
      return `Invoice #${invoiceId} paid ${amount}`;
    default:
      return `Invoice action: Invoice #${invoiceId}`;
  }
}

/**
 * Generate user event summary
 */
function getUserEventSummary(type: EventType, data: any): string {
  const userName = data.username || data.name || `User #${data.id}`;
  
  switch (type) {
    case EventType.CREATED:
      return `New user created: ${userName}`;
    case EventType.UPDATED:
      return `User updated: ${userName}`;
    default:
      return `User action: ${userName}`;
  }
}

/**
 * Generate client event summary
 */
function getClientEventSummary(type: EventType, data: any): string {
  const clientName = data.name || data.companyName || `Client #${data.id}`;
  
  switch (type) {
    case EventType.CREATED:
      return `New client created: ${clientName}`;
    case EventType.UPDATED:
      return `Client updated: ${clientName}`;
    default:
      return `Client action: ${clientName}`;
  }
}

/**
 * Helper functions for common event emissions
 */

/**
 * Emit lead created event
 */
export function emitLeadCreated(lead: any, userId: number | string, orgId: number | string): void {
  emitEvent({
    id: lead.id,
    category: EventCategory.LEAD,
    type: EventType.CREATED,
    data: lead,
    metadata: {
      userId,
      orgId
    }
  });
}

/**
 * Emit lead updated event
 */
export function emitLeadUpdated(lead: any, userId: number | string, orgId: number | string): void {
  emitEvent({
    id: lead.id,
    category: EventCategory.LEAD,
    type: EventType.UPDATED,
    data: lead,
    metadata: {
      userId,
      orgId
    }
  });
}

/**
 * Emit lead status changed event
 */
export function emitLeadStatusChanged(lead: any, previousStatus: string, userId: number | string, orgId: number | string): void {
  emitEvent({
    id: lead.id,
    category: EventCategory.LEAD,
    type: EventType.STATUS_CHANGED,
    data: {
      ...lead,
      previousStatus
    },
    metadata: {
      userId,
      orgId
    }
  });
}

/**
 * Emit dispatch created event
 */
export function emitDispatchCreated(dispatch: any, userId: number | string, orgId: number | string): void {
  emitEvent({
    id: dispatch.id,
    category: EventCategory.DISPATCH,
    type: EventType.CREATED,
    data: dispatch,
    metadata: {
      userId,
      orgId
    }
  });
}

/**
 * Emit invoice paid event
 */
export function emitInvoicePaid(invoice: any, userId: number | string, orgId: number | string): void {
  emitEvent({
    id: invoice.id,
    category: EventCategory.INVOICE,
    type: EventType.PAID,
    data: invoice,
    metadata: {
      userId,
      orgId
    }
  });
}

export default {
  emitEvent,
  emitLeadCreated,
  emitLeadUpdated,
  emitLeadStatusChanged,
  emitDispatchCreated,
  emitInvoicePaid,
  EventCategory,
  EventType
};