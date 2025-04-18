// User role-related constants
export const USER_ROLES = {
  SALES_REP: 'sales_rep',
  SALES_TEAM_LEAD: 'sales_team_lead', 
  SALES_MANAGER: 'sales_manager',
  HEAD_OF_SALES: 'head_of_sales',
  DISPATCH_REP: 'dispatch_rep',
  DISPATCH_TEAM_LEAD: 'dispatch_team_lead',
  DISPATCH_MANAGER: 'dispatch_manager',
  HEAD_OF_DISPATCH: 'head_of_dispatch',
  SUPER_ADMIN: 'super_admin'
};

// Department constants
export const DEPARTMENTS = {
  SALES: 'sales',
  DISPATCH: 'dispatch'
};

// Lead status constants
export const LEAD_STATUS = {
  UNQUALIFIED: 'unqualified',
  QUALIFIED: 'qualified',
  ACTIVE: 'active',
  LOST: 'lost',
  WON: 'won',
  FOLLOW_UP: 'follow_up',
  NURTURE: 'nurture'
};

// Equipment type constants
export const EQUIPMENT_TYPES = {
  FLATBED: 'flatbed',
  REEFER: 'reefer',
  DRY_VAN: 'dry_van',
  STEP_DECK: 'step_deck',
  LOWBOY: 'lowboy',
  OTHER: 'other'
};

// Factoring status constants
export const FACTORING_STATUS = {
  HAS_FACTORING: 'has_factoring',
  NEEDS_FACTORING: 'needs_factoring',
  NOT_INTERESTED: 'not_interested'
};

// Truck category constants
export const TRUCK_CATEGORIES = {
  OWNER_OPERATOR: 'owner_operator',
  SMALL_FLEET: 'small_fleet',
  MEDIUM_FLEET: 'medium_fleet',
  LARGE_FLEET: 'large_fleet'
};

// Invoice status constants
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

// Commission types
export const COMMISSION_TYPES = {
  SALES_DISPATCH: 'sales_dispatch',
  SALES_FACTORING: 'sales_factoring',
  SALES_DIRECT: 'sales_direct',
  SALES_MARKETING: 'sales_marketing',
  DISPATCH_STANDARD: 'dispatch_standard'
};

// Commission status
export const COMMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid'
};

// Sales commission rates
export const SALES_COMMISSION_RATES = {
  DISPATCH: 0.10, // 10% of first invoice after allocated target
  FACTORING: 7000, // PKR 7,000 per qualified factoring lead
  DIRECT: 8000,    // PKR 8,000 per closed lead
  MARKETING: 5000  // PKR 5,000 per closed lead
};

// Dispatch commission thresholds and rates
export const DISPATCH_COMMISSION_TIERS = [
  { min: 0, max: 650, rate: 0 },         // Min $650: Base salary only
  { min: 651, max: 850, rate: 0.025 },   // $651–$850: 2.5%
  { min: 851, max: 1500, rate: 0.05 },   // $851–$1500: 5.0%
  { min: 1501, max: 2500, rate: 0.10 },  // $1501–$2500: 10.0%
  { min: 2501, max: 3300, rate: 0.135 }, // $2501–$3300: 13.5%
  { min: 3301, max: Infinity, rate: 0.17 } // >$3301: 17.0%
];

// Form labels and options
export const FORM_OPTIONS = {
  LEAD_SOURCES: [
    { label: 'Cold Call', value: 'cold_call' },
    { label: 'Referral', value: 'referral' },
    { label: 'Website', value: 'website' },
    { label: 'Social Media', value: 'social_media' },
    { label: 'Trade Show', value: 'trade_show' },
    { label: 'Other', value: 'other' }
  ],
  PAYMENT_METHODS: [
    { label: 'ACH', value: 'ach' },
    { label: 'Zelle', value: 'zelle' },
    { label: 'QuickPay', value: 'quickpay' },
    { label: 'Check', value: 'check' },
    { label: 'Wire Transfer', value: 'wire' },
    { label: 'Other', value: 'other' }
  ],
  EQUIPMENT_TYPE_OPTIONS: [
    { label: 'Flatbed', value: 'flatbed' },
    { label: 'Reefer', value: 'reefer' },
    { label: 'Dry Van', value: 'dry_van' },
    { label: 'Step Deck', value: 'step_deck' },
    { label: 'Lowboy', value: 'lowboy' },
    { label: 'Other', value: 'other' }
  ],
  FACTORING_STATUS_OPTIONS: [
    { label: 'Has Factoring', value: 'has_factoring' },
    { label: 'Needs Factoring', value: 'needs_factoring' },
    { label: 'Not Interested', value: 'not_interested' }
  ],
  TRUCK_CATEGORY_OPTIONS: [
    { label: 'Owner Operator', value: 'owner_operator' },
    { label: 'Small Fleet (2-5)', value: 'small_fleet' },
    { label: 'Medium Fleet (6-20)', value: 'medium_fleet' },
    { label: 'Large Fleet (20+)', value: 'large_fleet' }
  ],
  LEAD_STATUS_OPTIONS: [
    { label: 'Unqualified', value: 'unqualified' },
    { label: 'Qualified', value: 'qualified' },
    { label: 'Active', value: 'active' },
    { label: 'Lost', value: 'lost' },
    { label: 'Won', value: 'won' },
    { label: 'Follow-Up', value: 'follow_up' },
    { label: 'Nurture', value: 'nurture' }
  ]
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me'
  },
  USERS: {
    LIST: '/api/users',
    DETAILS: (id: number) => `/api/users/${id}`,
    COMMISSIONS: (id: number) => `/api/users/${id}/commissions`
  },
  LEADS: {
    LIST: '/api/leads',
    DETAILS: (id: number) => `/api/leads/${id}`,
    LOADS: (id: number) => `/api/leads/${id}/loads`,
    INVOICES: (id: number) => `/api/leads/${id}/invoices`
  },
  LOADS: {
    LIST: '/api/loads',
    DETAILS: (id: number) => `/api/loads/${id}`
  },
  INVOICES: {
    LIST: '/api/invoices',
    DETAILS: (id: number) => `/api/invoices/${id}`,
    ITEMS: (id: number) => `/api/invoices/${id}/items`
  },
  COMMISSIONS: {
    LIST: '/api/commissions',
    DETAILS: (id: number) => `/api/commissions/${id}`
  },
  ACTIVITIES: {
    LIST: '/api/activities'
  },
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    SALES_STATS: '/api/dashboard/sales-stats',
    DISPATCH_STATS: '/api/dashboard/dispatch-stats',
    REVENUE_STATS: '/api/dashboard/revenue-stats',
    COMMISSION_STATS: '/api/dashboard/commission-stats'
  }
};

// Status badge colors
export const STATUS_COLORS = {
  unqualified: { bg: 'bg-red-100', text: 'text-red-800' },
  qualified: { bg: 'bg-green-100', text: 'text-green-800' },
  active: { bg: 'bg-blue-100', text: 'text-blue-800' },
  lost: { bg: 'bg-gray-100', text: 'text-gray-800' },
  won: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  follow_up: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  nurture: { bg: 'bg-purple-100', text: 'text-purple-800' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-800' },
  paid: { bg: 'bg-green-100', text: 'text-green-800' },
  overdue: { bg: 'bg-red-100', text: 'text-red-800' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' }
};

// Navigation items by role
export const getNavigationItems = (role: string, department: string) => {
  const baseItems = [
    { name: 'Dashboard', href: '/', icon: 'Home' }
  ];

  // Sales department navigation
  if (department === DEPARTMENTS.SALES) {
    baseItems.push(
      { name: 'Leads', href: '/leads', icon: 'Users' },
      { name: 'Tasks', href: '/tasks', icon: 'Calendar' }
    );
  }

  // Dispatch department navigation
  if (department === DEPARTMENTS.DISPATCH) {
    baseItems.push(
      { name: 'Loads', href: '/dispatch', icon: 'Truck' }
    );
  }

  // Common items for all roles
  baseItems.push(
    { name: 'Invoices', href: '/invoices', icon: 'FileText' },
    { name: 'Reports', href: '/reports', icon: 'BarChart2' }
  );

  // Admin items for managers and above
  const isManager = role.includes('manager') || 
                    role.includes('head') || 
                    role === USER_ROLES.SUPER_ADMIN;
  
  if (isManager) {
    baseItems.push(
      { name: 'Settings', href: '/settings', icon: 'Settings' }
    );
  }

  return baseItems;
};

// Team options for sidebar
export const getTeamOptions = (role: string) => {
  if (role === USER_ROLES.SUPER_ADMIN) {
    return [
      { name: 'Sales', href: '/switch-department/sales' },
      { name: 'Dispatch', href: '/switch-department/dispatch' }
    ];
  }
  
  // For other roles, no team switching
  return [];
};
