import { User, Lead, Load, Invoice, Commission, ActivityLog } from './schema';

// Role-specific permissions
export type Permission = 
  | 'create:lead'
  | 'read:lead'
  | 'update:lead'
  | 'delete:lead'
  | 'create:load'
  | 'read:load'
  | 'update:load'
  | 'delete:load'
  | 'create:invoice'
  | 'read:invoice'
  | 'update:invoice'
  | 'delete:invoice'
  | 'read:commission'
  | 'update:commission'
  | 'read:reports'
  | 'create:user'
  | 'read:user'
  | 'update:user'
  | 'delete:user'
  | 'admin:all';

// User session data
export interface UserSession {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  permissions: Permission[];
}

// Dashboard statistics
export interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  activeClients: number;
  monthlyCommission: number;
  teamPerformance: {
    averageCallsPerDay: number;
    conversionRate: number;
    teamTarget: number;
  };
  recentActivities: RecentActivity[];
}

// Sales dashboard statistics
export interface SalesDashboardStats extends DashboardStats {
  leadsByStatus: Record<string, number>;
  monthlyLeadsGenerated: Record<string, number>;
}

// Dispatch dashboard statistics
export interface DispatchDashboardStats extends DashboardStats {
  totalLoads: number;
  completedLoads: number;
  pendingLoads: number;
  monthlyRevenue: number;
}

// Recent activity entry
export interface RecentActivity {
  id: number;
  type: 'lead' | 'load' | 'invoice' | 'user';
  action: string;
  user: {
    id: number;
    name: string;
  };
  resource: {
    id: number;
    name: string;
  };
  timestamp: Date;
}

// Commission calculation
export interface CommissionCalculation {
  userId: number;
  userName: string;
  role: string;
  department: string;
  baseAmount: number;
  commissionRate: number;
  totalCommission: number;
  breakdown: {
    type: string;
    amount: number;
  }[];
  period: {
    month: number;
    year: number;
  };
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
}

// Filtering options
export interface FilterOptions {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  assignedTo?: number;
  searchTerm?: string;
}

// Sorting options
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Generic query options
export interface QueryOptions {
  pagination?: PaginationParams;
  filters?: FilterOptions;
  sort?: SortOptions;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Role-specific dashboard types
export type RoleDashboard = 
  | 'sales_rep_dashboard'
  | 'sales_team_lead_dashboard'
  | 'sales_manager_dashboard'
  | 'head_of_sales_dashboard'
  | 'dispatch_rep_dashboard'
  | 'dispatch_team_lead_dashboard'
  | 'dispatch_manager_dashboard'
  | 'head_of_dispatch_dashboard'
  | 'super_admin_dashboard';

// Department type
export type Department = 'sales' | 'dispatch';
