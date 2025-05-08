/**
 * Real-time event names for socket.io communication
 */
export enum RealTimeEvents {
  // Authentication events
  USER_LOGGED_IN = 'user:logged_in',
  USER_LOGGED_OUT = 'user:logged_out',
  
  // Data update events
  DATA_UPDATED = 'data:updated',
  DATA_CREATED = 'data:created',
  DATA_DELETED = 'data:deleted',
  
  // CRM module events
  LEAD_UPDATED = 'crm:lead:updated',
  LEAD_CREATED = 'crm:lead:created',
  LEAD_DELETED = 'crm:lead:deleted',
  CLIENT_UPDATED = 'crm:client:updated',
  CLIENT_CREATED = 'crm:client:created',
  
  // Dispatch module events
  DISPATCH_UPDATED = 'dispatch:updated',
  DISPATCH_CREATED = 'dispatch:created',
  DISPATCH_STATUS_CHANGED = 'dispatch:status:changed',
  
  // Finance module events
  INVOICE_UPDATED = 'finance:invoice:updated',
  INVOICE_CREATED = 'finance:invoice:created',
  COMMISSION_UPDATED = 'finance:commission:updated',
  
  // Task events
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_COMPLETED = 'task:completed',
  TASK_ASSIGNED = 'task:assigned',
  
  // Notification events
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_READ = 'notification:read',
  
  // Dashboard events
  DASHBOARD_UPDATED = 'dashboard:updated',
  
  // System events
  SYSTEM_ALERT = 'system:alert',
  SYSTEM_MAINTENANCE = 'system:maintenance'
}

/**
 * Permission level requirements for various system functions
 */
export enum PermissionLevel {
  VIEW_ONLY = 1,
  BASIC = 2,
  STANDARD = 3,
  ADMIN = 4,
  SUPER_ADMIN = 5
}

/**
 * Entity types for activities, tasks, and permissions
 */
export enum EntityTypes {
  LEAD = 'lead',
  CLIENT = 'client',
  DISPATCH = 'dispatch',
  INVOICE = 'invoice',
  TASK = 'task',
  USER = 'user',
  ORGANIZATION = 'organization'
}

/**
 * Status options for various entities
 */
export const STATUS_OPTIONS = {
  LEAD: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Lost'],
  DISPATCH: ['Pending', 'Assigned', 'In Transit', 'Delivered', 'Completed', 'Cancelled'],
  TASK: ['Pending', 'In Progress', 'Completed', 'Overdue', 'Cancelled'],
  INVOICE: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled']
};

/**
 * Module names for cross-module data sharing
 */
export enum Modules {
  CRM = 'crm',
  DISPATCH = 'dispatch',
  FINANCE = 'finance',
  HR = 'hr',
  MARKETING = 'marketing',
  DASHBOARD = 'dashboard',
  ADMIN = 'admin',
  SETTINGS = 'settings'
}

/**
 * API endpoints for modules
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me'
  },
  CRM: {
    LEADS: '/api/crm/leads',
    CLIENTS: '/api/crm/clients',
    ACTIVITIES: '/api/crm/activities',
    DASHBOARD: '/api/crm/dashboard'
  },
  FINANCE: {
    INVOICES: '/api/finance/invoices',
    COMMISSIONS: '/api/finance/commissions',
    EXPENSES: '/api/finance/expenses'
  },
  DISPATCH: {
    LOADS: '/api/dispatch/loads',
    DRIVERS: '/api/dispatch/drivers',
    REPORTS: '/api/dispatch/reports'
  },
  HR: {
    EMPLOYEES: '/api/hr/employees',
    LEAVE: '/api/hr/leave',
    HIRING: '/api/hr/hiring'
  },
  DASHBOARD: '/api/dashboard',
  TASKS: '/api/tasks',
  NOTIFICATIONS: '/api/notifications',
  USERS: '/api/users',
  ROLES: '/api/roles',
  ORGANIZATIONS: '/api/organizations',
  CROSS_MODULE: '/api/cross-module'
};

/**
 * API routes for system functionality
 */
export const API_ROUTES = {
  SYSTEM: {
    HEALTH: '/api/system/health',
    STATUS: '/api/system/status'
  },
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me'
  },
  USER: {
    PROFILE: '/api/user/profile',
    PREFERENCES: '/api/user/preferences'
  }
};