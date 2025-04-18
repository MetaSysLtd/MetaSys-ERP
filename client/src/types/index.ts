// User and Authentication Types
export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  roleId: number;
  active: boolean;
  profileImageUrl: string | null;
}

export interface Role {
  id: number;
  name: string;
  department: string;
  level: number;
  permissions: string[];
}

export interface AuthData {
  authenticated: boolean;
  user: User | null;
  role: Role | null;
}

// Lead Management Types
export interface Lead {
  id: number;
  companyName: string;
  mcNumber: string;
  dotNumber?: string;
  equipmentType: string;
  truckCategory?: string;
  factoringStatus: string;
  serviceCharges: number;
  contactName: string;
  phoneNumber: string;
  email?: string;
  status: LeadStatus;
  assignedTo: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

export type LeadStatus = 
  | 'unqualified'
  | 'qualified'
  | 'active'
  | 'lost'
  | 'won'
  | 'follow-up'
  | 'nurture';

// Dispatch Management Types
export interface Load {
  id: number;
  leadId: number;
  origin: string;
  destination: string;
  pickupDate: string;
  deliveryDate: string;
  status: LoadStatus;
  freightAmount: number;
  serviceCharge: number;
  rateConfirmationUrl?: string;
  podUrl?: string;
  assignedTo: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LoadStatus = 
  | 'booked'
  | 'in_transit'
  | 'delivered'
  | 'invoiced'
  | 'paid';

// Invoice Management Types
export interface Invoice {
  id: number;
  invoiceNumber: string;
  leadId: number;
  totalAmount: number;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  createdBy: number;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  loadId: number;
  description: string;
  amount: number;
}

export type InvoiceStatus = 
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue';

// Commission Tracking Types
export interface Commission {
  id: number;
  userId: number;
  invoiceId: number;
  leadId?: number;
  loadId?: number;
  commissionType: CommissionType;
  amount: number;
  status: CommissionStatus;
  calculationDate: string;
  paidDate?: string;
  notes?: string;
}

export type CommissionType = 
  | 'sales_dispatch'
  | 'sales_factoring'
  | 'sales_direct'
  | 'sales_digital'
  | 'dispatch_tier';

export type CommissionStatus = 
  | 'pending'
  | 'approved'
  | 'paid';

// Activity Logging Types
export interface Activity {
  id: number;
  userId: number;
  entityType: EntityType;
  entityId: number;
  action: ActivityAction;
  details: string;
  timestamp: string;
}

export type EntityType = 
  | 'lead'
  | 'load'
  | 'invoice'
  | 'commission'
  | 'user';

export type ActivityAction = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'commented'
  | 'viewed';

// Dashboard Types
export interface DashboardData {
  metrics: {
    totalLeads?: number;
    qualifiedLeads?: number;
    activeClients?: number;
    monthlyCommission?: number;
    totalLoads?: number;
    inTransitLoads?: number;
    deliveredLoads?: number;
    invoicedLoads?: number;
  };
  activities: Activity[];
  leads?: Lead[];
  loads?: Load[];
  commissions?: Commission[];
}

// Form Types
export interface LeadFormValues {
  companyName: string;
  mcNumber: string;
  dotNumber?: string;
  equipmentType: string;
  truckCategory?: string;
  factoringStatus: string;
  serviceCharges: number;
  contactName: string;
  phoneNumber: string;
  email?: string;
  notes?: string;
  status: LeadStatus;
  assignedTo?: number;
}

export interface LoadFormValues {
  leadId: number;
  origin: string;
  destination: string;
  pickupDate: string;
  deliveryDate: string;
  freightAmount: number;
  serviceCharge: number;
  notes?: string;
  status: LoadStatus;
  assignedTo?: number;
}

export interface InvoiceFormValues {
  invoiceNumber: string;
  leadId: number;
  totalAmount: number;
  issuedDate: string;
  dueDate: string;
  notes?: string;
  items: {
    loadId: number;
    description: string;
    amount: number;
  }[];
}

// Notification Settings
export interface NotificationSettings {
  emailNotifications: boolean;
  slackNotifications: boolean;
  leadUpdates: boolean;
  loadUpdates: boolean;
  invoiceUpdates: boolean;
  dailySummary: boolean;
  weeklySummary: boolean;
}

// Filtering and Pagination
export interface FilterOptions {
  status?: string;
  assignedTo?: number;
  dateRange?: {
    from: string;
    to: string;
  };
  searchQuery?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export type ChartData = ChartDataPoint[];

export interface PerformanceData {
  performanceData: ChartData;
  avgCallsPerDay: number;
  callsChangePercentage: number;
  conversionRate: number;
  conversionChangePercentage: number;
  teamTarget: number;
}

export interface CommissionBreakdownData {
  currentMonth: string;
  earned: number;
  target: number;
  progress: number;
  status: string;
  breakdown: {
    category: string;
    amount: number;
  }[];
  monthlyData: {
    name: string;
    amount: number;
  }[];
  comparison: {
    lastMonth: number;
    lastMonthChange: number;
    ytd: number;
    ytdChange: number;
    forecast: number;
  };
}
