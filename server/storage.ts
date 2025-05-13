import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import {
  users, roles, leads, leadRemarks, loads, invoices, invoiceItems, commissions, activities, tasks,
  dispatch_clients, organizations, userOrganizations, commissionPolicy, commissionsMonthly,
  commissionRun, leadSalesUsers, clockEvents, clockEventTypeEnum, uiPreferences, dispatchTasks, 
  dispatchReports, performanceTargets, hiringCandidates, candidateDocuments, hiringTemplates, 
  probationSchedules, probationEvaluations, exitRequests, companyDocuments, notifications, 
  dashboardWidgets, bugs, bugUrgencyEnum, userSettings, organizationSettings, permissionTemplates, 
  featureFlags, userLocations, formTemplates, formSubmissions, leadHandoffs, accounts, surveys,
  type User, type InsertUser, type Role, type InsertRole,
  type Lead, type InsertLead, type Load, type InsertLoad,
  type Invoice, type InsertInvoice, type InvoiceItem, type InsertInvoiceItem,
  type Commission, type InsertCommission, type Activity, type InsertActivity,
  type DispatchClient, type InsertDispatchClient, 
  type Organization, type InsertOrganization,
  type UserOrganization, type InsertUserOrganization,
  type CommissionPolicy, type InsertCommissionPolicy, 
  type CommissionRun, type InsertCommissionRun,
  type LeadSalesUser, type InsertLeadSalesUser,
  type CommissionMonthly, type InsertCommissionMonthly,
  type Task, type InsertTask,
  type ClockEvent, type InsertClockEvent,
  type UiPreferences, type InsertUiPreferences,
  type DispatchTask, type InsertDispatchTask,
  type DispatchReport, type InsertDispatchReport,
  type PerformanceTarget, type InsertPerformanceTarget,
  type DashboardWidget, type InsertDashboardWidget,
  type LeadRemark, type CallLog, type InsertCallLog, type LeadFollowUp, type InsertLeadFollowUp,
  type CustomerFeedback, type InsertCustomerFeedback,
  type HiringCandidate, type InsertHiringCandidate,
  type CandidateDocument, type InsertCandidateDocument,
  type HiringTemplate, type InsertHiringTemplate,
  type ProbationSchedule, type InsertProbationSchedule,
  type ProbationEvaluation, type InsertProbationEvaluation,
  type ExitRequest, type InsertExitRequest,
  type CompanyDocument, type InsertCompanyDocument,
  type Notification, type InsertNotification,
  type Bug, type InsertBug,
  type UserSettings, type InsertUserSettings,
  type OrganizationSettings, type InsertOrganizationSettings,
  type PermissionTemplate, type InsertPermissionTemplate,
  type FeatureFlag, type InsertFeatureFlag,
  type UserLocation, type InsertUserLocation,
  type FormTemplate, type InsertFormTemplate,
  type FormSubmission, type InsertFormSubmission,
  type LeadHandoff, type InsertLeadHandoff,
  type Account, type InsertAccount,
  type Survey, type InsertSurvey
} from "@shared/schema";
import { eq, and, desc, inArray, gte, lte, lt, sql, count } from "drizzle-orm";
import { db, pgPool, pool } from './db';
import { getAllLeads, getLeadById, getLeadsByStatus as getLeadsByStatusApi, getLeadsByAssignee as getLeadsByAssigneeApi } from './leadsApi';
import { 
  getAllFormTemplates, getFormTemplateById, getFormTemplatesByLeadType,
  getAllFormSubmissions, getFormSubmissionsByLeadId, getFormSubmissionById
} from './formApi';

// Interface for storage operations
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersByOrgId(orgId: number): Promise<User[]>;
  
  // Role operations
  getRole(id: number): Promise<Role | undefined>;
  getRoles(): Promise<Role[]>;
  
  // Auth operations
  checkPassword(username: string, password: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Create PostgreSQL session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool: pgPool,
      createTableIfMissing: true,
      tableName: 'session'
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getUsersByOrgId(orgId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.orgId, orgId));
  }
  
  // Role operations
  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }
  
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }
  
  // Auth operations
  async checkPassword(username: string, password: string): Promise<User | undefined> {
    // In a real application, you would verify the password hash here
    // This is a simplified version for demo purposes
    const user = await this.getUserByUsername(username);
    if (user && user.password === password) {
      return user;
    }
    return undefined;
  }
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: Map<number, User>;
  private roles: Map<number, Role>;
  
  constructor() {
    // Initialize the memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
      ttl: 7 * 24 * 60 * 60 * 1000 // 7 days session lifetime
    });
    
    this.users = new Map();
    this.roles = new Map();
    
    // Initialize with default data
    this.initializeDefaultData();
  }
  
  private initializeDefaultData() {
    // Add some default roles
    const adminRole: Role = {
      id: 1,
      name: 'Admin',
      level: 5,
      description: 'Administrator with full access to all features',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const userRole: Role = {
      id: 2,
      name: 'User',
      level: 1,
      description: 'Standard user with limited access',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.roles.set(adminRole.id, adminRole);
    this.roles.set(userRole.id, userRole);
    
    // Add a default admin user
    const adminUser: User = {
      id: 1,
      username: 'admin',
      password: 'admin123', // In a real app, this would be hashed
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      phoneNumber: null,
      roleId: 1,
      active: true,
      orgId: 1,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      hasAcceptedTerms: true,
      isSystemAdmin: true,
      department: 'Administration',
      position: 'Administrator',
      canEditLeads: true,
      canViewReports: true,
      canModifySettings: true,
      canManageUsers: true
    };
    
    this.users.set(adminUser.id, adminUser);
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: this.users.size + 1,
      active: true,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      hasAcceptedTerms: false,
      isSystemAdmin: false,
      department: '',
      position: '',
      canEditLeads: false,
      canViewReports: false,
      canModifySettings: false,
      canManageUsers: false
    };
    
    this.users.set(newUser.id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByOrgId(orgId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.orgId === orgId);
  }
  
  // Role operations
  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }
  
  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }
  
  // Auth operations
  async checkPassword(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (user && user.password === password) {
      return user;
    }
    return undefined;
  }
}

// Export the storage instance - use DatabaseStorage which connects to PostgreSQL
export const storage = new DatabaseStorage();