/**
 * API Routes constants
 * Used for consistency between client and server
 */
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    CURRENT_USER: '/api/auth/me',
    CHANGE_PASSWORD: '/api/auth/change-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    REQUEST_RESET: '/api/auth/request-reset',
    SWITCH_ORGANIZATION: '/api/auth/switch-organization'
  },
  USERS: {
    BASE: '/api/users',
    SINGLE: (id: number) => `/api/users/${id}`,
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile/update',
    PREFERENCES: '/api/users/preferences',
    NOTIFICATIONS: '/api/users/notifications',
    BY_ORGANIZATION: (orgId: number) => `/api/users/organization/${orgId}`
  },
  ORGANIZATIONS: {
    BASE: '/api/organizations',
    SINGLE: (id: number) => `/api/organizations/${id}`,
    MEMBERS: (id: number) => `/api/organizations/${id}/members`,
    ADD_MEMBER: (id: number) => `/api/organizations/${id}/members/add`,
    REMOVE_MEMBER: (id: number, userId: number) => `/api/organizations/${id}/members/${userId}/remove`,
    UPDATE_MEMBER: (id: number, userId: number) => `/api/organizations/${id}/members/${userId}/update`
  },
  ROLES: {
    BASE: '/api/roles',
    SINGLE: (id: number) => `/api/roles/${id}`,
    PERMISSIONS: '/api/roles/permissions'
  },
  CRM: {
    LEADS: {
      BASE: '/api/crm/leads',
      SINGLE: (id: number) => `/api/crm/leads/${id}`,
      ASSIGN: (id: number) => `/api/crm/leads/${id}/assign`,
      STATUS: (id: number) => `/api/crm/leads/${id}/status`,
      REMARKS: (id: number) => `/api/crm/leads/${id}/remarks`,
      CALLS: (id: number) => `/api/crm/leads/${id}/calls`,
      FOLLOWUPS: (id: number) => `/api/crm/leads/${id}/followups`,
      STATS: '/api/crm/leads/stats'
    },
    CUSTOMERS: {
      BASE: '/api/crm/customers',
      SINGLE: (id: number) => `/api/crm/customers/${id}`,
      FEEDBACK: (id: number) => `/api/crm/customers/${id}/feedback`
    }
  },
  DISPATCH: {
    LOADS: {
      BASE: '/api/dispatch/loads',
      SINGLE: (id: number) => `/api/dispatch/loads/${id}`,
      ASSIGN: (id: number) => `/api/dispatch/loads/${id}/assign`,
      STATUS: (id: number) => `/api/dispatch/loads/${id}/status`,
      TRACKING: (id: number) => `/api/dispatch/loads/${id}/tracking`
    },
    CARRIERS: {
      BASE: '/api/dispatch/carriers',
      SINGLE: (id: number) => `/api/dispatch/carriers/${id}`,
      AVAILABLE: '/api/dispatch/carriers/available'
    },
    REPORTS: {
      DAILY: '/api/dispatch/reports/daily',
      MONTHLY: '/api/dispatch/reports/monthly',
      SUBMIT: '/api/dispatch/reports/submit'
    }
  },
  FINANCE: {
    INVOICES: {
      BASE: '/api/finance/invoices',
      SINGLE: (id: number) => `/api/finance/invoices/${id}`,
      STATUS: (id: number) => `/api/finance/invoices/${id}/status`,
      SEND: (id: number) => `/api/finance/invoices/${id}/send`
    },
    EXPENSES: {
      BASE: '/api/finance/expenses',
      SINGLE: (id: number) => `/api/finance/expenses/${id}`,
      APPROVE: (id: number) => `/api/finance/expenses/${id}/approve`,
      REJECT: (id: number) => `/api/finance/expenses/${id}/reject`
    },
    COMMISSIONS: {
      BASE: '/api/finance/commissions',
      CALCULATE: '/api/finance/commissions/calculate',
      REPORT: '/api/finance/commissions/report'
    }
  },
  HR: {
    EMPLOYEES: {
      BASE: '/api/hr/employees',
      SINGLE: (id: number) => `/api/hr/employees/${id}`,
      STATUS: (id: number) => `/api/hr/employees/${id}/status`
    },
    APPLICANTS: {
      BASE: '/api/hr/applicants',
      SINGLE: (id: number) => `/api/hr/applicants/${id}`,
      STATUS: (id: number) => `/api/hr/applicants/${id}/status`
    },
    LEAVES: {
      BASE: '/api/hr/leaves',
      SINGLE: (id: number) => `/api/hr/leaves/${id}`,
      APPROVE: (id: number) => `/api/hr/leaves/${id}/approve`,
      REJECT: (id: number) => `/api/hr/leaves/${id}/reject`
    },
    PROBATION: {
      BASE: '/api/hr/probation',
      SINGLE: (id: number) => `/api/hr/probation/${id}`,
      EVALUATIONS: (id: number) => `/api/hr/probation/${id}/evaluations`
    }
  },
  TASKS: {
    BASE: '/api/tasks',
    SINGLE: (id: number) => `/api/tasks/${id}`,
    COMPLETE: (id: number) => `/api/tasks/${id}/complete`,
    ASSIGN: (id: number) => `/api/tasks/${id}/assign`,
    USER: '/api/tasks/user'
  },
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    MARK_READ: (id: number) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
    USER: '/api/notifications/user',
    PREFERENCES: '/api/notifications/preferences'
  },
  SYSTEM: {
    HEALTH: '/api/system/health',
    LOGS: '/api/system/logs',
    ERRORS: '/api/system/errors',
    STATS: '/api/system/stats',
    CACHE: '/api/system/cache',
    VERSION: '/api/system/version'
  }
};

/**
 * Socket event constants
 * Used for consistency between client and server
 */
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Room management
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  
  // User presence
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_ACTIVITY: 'user_activity',
  
  // Notifications
  NOTIFICATION: 'notification',
  NOTIFICATION_READ: 'notification_read',
  
  // CRM events
  LEAD_CREATED: 'lead_created',
  LEAD_UPDATED: 'lead_updated',
  LEAD_STATUS_CHANGED: 'lead_status_changed',
  LEAD_ASSIGNED: 'lead_assigned',
  LEAD_REMARK_ADDED: 'lead_remark_added',
  LEAD_CALL_LOGGED: 'lead_call_logged',
  LEAD_FOLLOWUP_CREATED: 'lead_followup_created',
  LEAD_FOLLOWUP_COMPLETED: 'lead_followup_completed',
  
  // Dispatch events
  LOAD_CREATED: 'load_created',
  LOAD_UPDATED: 'load_updated',
  LOAD_STATUS_CHANGED: 'load_status_changed',
  LOAD_ASSIGNED: 'load_assigned',
  LOAD_TRACKING_UPDATED: 'load_tracking_updated',
  
  // HR events
  LEAVE_REQUESTED: 'leave_requested',
  LEAVE_STATUS_CHANGED: 'leave_status_changed',
  APPLICANT_STATUS_CHANGED: 'applicant_status_changed',
  PROBATION_EVALUATION_ADDED: 'probation_evaluation_added',
  
  // Task events
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_COMPLETED: 'task_completed',
  TASK_ASSIGNED: 'task_assigned',
  
  // Finance events
  INVOICE_CREATED: 'invoice_created',
  INVOICE_UPDATED: 'invoice_updated',
  INVOICE_STATUS_CHANGED: 'invoice_status_changed',
  
  // System events
  SYSTEM_ALERT: 'system_alert',
  DAILY_REPORT_REMINDER: 'daily_report_reminder',
  TASK_REMINDER: 'task_reminder',
  LEAD_FOLLOWUP_REMINDER: 'lead_followup_reminder',
  PERFORMANCE_ALERT: 'performance_alert'
};

/**
 * Room name patterns for Socket.IO
 */
export const SOCKET_ROOMS = {
  USER: (userId: number) => `user:${userId}`,
  ORGANIZATION: (orgId: number) => `organization:${orgId}`,
  ROLE: (roleId: number) => `role:${roleId}`,
  LEAD: (leadId: number) => `lead:${leadId}`,
  LOAD: (loadId: number) => `load:${loadId}`,
  DEPARTMENT: (dept: string) => `department:${dept}`,
  ADMIN: 'admin',
  SYSTEM: 'system',
  DISPATCH: 'dispatch',
  SALES: 'sales',
  FINANCE: 'finance',
  HR: 'hr'
};

/**
 * Error codes for standard API errors
 */
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Permission errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Data errors
  DATA_INTEGRITY_ERROR: 'DATA_INTEGRITY_ERROR',
  STALE_DATA: 'STALE_DATA'
};

/**
 * Standard HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Date formats used throughout the application
 */
export const DATE_FORMATS = {
  SHORT_DATE: 'yyyy-MM-dd',
  LONG_DATE: 'MMMM d, yyyy',
  SHORT_DATETIME: 'yyyy-MM-dd HH:mm',
  LONG_DATETIME: 'MMMM d, yyyy h:mm a',
  TIME: 'h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss'Z'",
  MONTH_YEAR: 'MMMM yyyy'
};

/**
 * Application-wide configuration constants
 */
export const APP_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PASSWORD_MIN_LENGTH: 8,
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_TIMEZONE: 'America/New_York',
  // Timeouts in milliseconds
  API_TIMEOUT: 30000, // 30 seconds
  SOCKET_TIMEOUT: 10000, // 10 seconds
  SESSION_TIMEOUT: 86400000, // 24 hours
  // Rate limiting
  RATE_LIMIT_WINDOW: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100
};

/**
 * Feature flags
 */
export const FEATURES = {
  TWO_FACTOR_AUTH: false,
  DOCUMENT_UPLOAD: true,
  ADVANCED_REPORTING: true,
  EMAIL_NOTIFICATIONS: true,
  SLACK_NOTIFICATIONS: true,
  SMS_NOTIFICATIONS: false,
  CUSTOMER_PORTAL: false,
  CARRIER_PORTAL: true,
  PAYMENT_PROCESSING: false
};

/**
 * Permission constants
 */
export const PERMISSIONS = {
  // User management
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_EDIT: 'user.edit',
  USER_DELETE: 'user.delete',
  
  // Organization management
  ORG_VIEW: 'org.view',
  ORG_CREATE: 'org.create',
  ORG_EDIT: 'org.edit',
  ORG_DELETE: 'org.delete',
  
  // Role management
  ROLE_VIEW: 'role.view',
  ROLE_CREATE: 'role.create',
  ROLE_EDIT: 'role.edit',
  ROLE_DELETE: 'role.delete',
  
  // Lead management
  LEAD_VIEW: 'lead.view',
  LEAD_CREATE: 'lead.create',
  LEAD_EDIT: 'lead.edit',
  LEAD_DELETE: 'lead.delete',
  LEAD_ASSIGN: 'lead.assign',
  
  // Load management
  LOAD_VIEW: 'load.view',
  LOAD_CREATE: 'load.create',
  LOAD_EDIT: 'load.edit',
  LOAD_DELETE: 'load.delete',
  LOAD_ASSIGN: 'load.assign',
  
  // Invoice management
  INVOICE_VIEW: 'invoice.view',
  INVOICE_CREATE: 'invoice.create',
  INVOICE_EDIT: 'invoice.edit',
  INVOICE_DELETE: 'invoice.delete',
  INVOICE_SEND: 'invoice.send',
  
  // Task management
  TASK_VIEW: 'task.view',
  TASK_CREATE: 'task.create',
  TASK_EDIT: 'task.edit',
  TASK_DELETE: 'task.delete',
  TASK_ASSIGN: 'task.assign',
  
  // HR management
  HR_VIEW: 'hr.view',
  HR_MANAGE: 'hr.manage',
  HR_ADMIN: 'hr.admin',
  
  // System management
  SYSTEM_VIEW: 'system.view',
  SYSTEM_MANAGE: 'system.manage',
  SYSTEM_ADMIN: 'system.admin',
  
  // Reports
  REPORT_VIEW: 'report.view',
  REPORT_CREATE: 'report.create',
  REPORT_EXPORT: 'report.export',
  
  // Special permissions
  ALL_ACCESS: '*.*', // Super admin permission
  VIEW_ALL_ORGS: 'org.view_all'
};