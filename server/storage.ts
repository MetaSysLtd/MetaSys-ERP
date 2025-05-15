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
  getDefaultRole(): Promise<Role | undefined>;
  getUserRole(userId: number): Promise<Role | undefined>;
  
  // Organization operations
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationByCode(code: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, org: Partial<Organization>): Promise<Organization | undefined>;
  
  // User-Organization operations
  getUserOrganizations(userId: number): Promise<Organization[]>;
  getUserOrganizationIds(userId: number): Promise<number[]>;
  
  // Auth operations
  checkPassword(username: string, password: string): Promise<User | undefined>;
  getUserIdFromSession(sessionId: string): Promise<number | undefined>;
  
  // Preferences operations
  getUserPreferences(userId: number): Promise<UiPreferences | undefined>;
  
  // Notifications operations
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUserNotificationsByType(userId: number, type: string): Promise<Notification[]>;
  sendNotification(notification: InsertNotification): Promise<Notification>;
  
  // Lead operations
  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<Lead>): Promise<Lead | undefined>;
  getLeadsByStatus(status: string): Promise<Lead[]>;
  getLeadsByAssignee(userId: number): Promise<Lead[]>;
  
  // Dashboard operations
  getDashboardWidgets(userId: number, orgId: number): Promise<DashboardWidget[]>;
  
  // Dispatch client operations
  createDispatchClient(client: InsertDispatchClient): Promise<DispatchClient>;
  
  // Session management
  createErrorLog?(errorData: any): Promise<any>;
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
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error in getUser:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      return undefined;
    }
  }
  
  async getDefaultRole(): Promise<Role | undefined> {
    try {
      // Get the role with level 1 (standard user)
      const [role] = await db.select().from(roles).where(eq(roles.level, 1));
      return role;
    } catch (error) {
      console.error("Error in getDefaultRole:", error);
      return undefined;
    }
  }
  
  async getOrganizations(): Promise<Organization[]> {
    try {
      const orgs = await db.select().from(organizations);
      return orgs;
    } catch (error) {
      console.error("Error in getOrganizations:", error);
      return [];
    }
  }
  
  async getOrganization(id: number): Promise<Organization | undefined> {
    try {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
      return org;
    } catch (error) {
      console.error("Error in getOrganization:", error);
      return undefined;
    }
  }
  
  async getOrganizationByCode(code: string): Promise<Organization | undefined> {
    try {
      const [org] = await db.select().from(organizations).where(eq(organizations.code, code));
      return org;
    } catch (error) {
      console.error("Error in getOrganizationByCode:", error);
      return undefined;
    }
  }
  
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    try {
      const [newOrg] = await db.insert(organizations).values(org).returning();
      return newOrg;
    } catch (error) {
      console.error("Error in createOrganization:", error);
      throw error;
    }
  }
  
  async updateOrganization(id: number, org: Partial<Organization>): Promise<Organization | undefined> {
    try {
      const [updatedOrg] = await db
        .update(organizations)
        .set(org)
        .where(eq(organizations.id, id))
        .returning();
      return updatedOrg;
    } catch (error) {
      console.error("Error in updateOrganization:", error);
      return undefined;
    }
  }
  
  async getUserOrganizations(userId: number): Promise<Organization[]> {
    try {
      const userOrgs = await db
        .select()
        .from(userOrganizations)
        .where(eq(userOrganizations.userId, userId));
      
      if (!userOrgs.length) {
        return [];
      }
      
      const orgIds = userOrgs.map(uo => uo.orgId);
      const orgs = await db
        .select()
        .from(organizations)
        .where(inArray(organizations.id, orgIds));
      
      return orgs;
    } catch (error) {
      console.error("Error in getUserOrganizations:", error);
      return [];
    }
  }
  
  async getUserOrganizationIds(userId: number): Promise<number[]> {
    try {
      const userOrgs = await db
        .select()
        .from(userOrganizations)
        .where(eq(userOrganizations.userId, userId));
      
      return userOrgs.map(uo => uo.orgId);
    } catch (error) {
      console.error("Error in getUserOrganizationIds:", error);
      return [];
    }
  }
  
  async getUserRole(userId: number): Promise<Role | undefined> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return undefined;
      }
      
      return this.getRole(user.roleId);
    } catch (error) {
      console.error("Error in getUserRole:", error);
      return undefined;
    }
  }
  
  async getUserPreferences(userId: number): Promise<UiPreferences | undefined> {
    try {
      const [prefs] = await db
        .select()
        .from(uiPreferences)
        .where(eq(uiPreferences.userId, userId));
      
      return prefs;
    } catch (error) {
      console.error("Error in getUserPreferences:", error);
      return undefined;
    }
  }
  
  async getUserNotifications(userId: number): Promise<Notification[]> {
    try {
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
      
      return userNotifications;
    } catch (error) {
      console.error("Error in getUserNotifications:", error);
      return [];
    }
  }
  
  async getUserNotificationsByType(userId: number, type: string): Promise<Notification[]> {
    try {
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.type, type)
        ))
        .orderBy(desc(notifications.createdAt))
        .limit(20);
      
      return userNotifications;
    } catch (error) {
      console.error("Error in getUserNotificationsByType:", error);
      return [];
    }
  }
  
  async sendNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const [newNotification] = await db
        .insert(notifications)
        .values(notification)
        .returning();
      
      return newNotification;
    } catch (error) {
      console.error("Error in sendNotification:", error);
      throw error;
    }
  }
  
  async getDashboardWidgets(userId: number, orgId: number): Promise<DashboardWidget[]> {
    try {
      const widgets = await db
        .select()
        .from(dashboardWidgets)
        .where(and(
          eq(dashboardWidgets.userId, userId),
          eq(dashboardWidgets.orgId, orgId)
        ));
      
      return widgets;
    } catch (error) {
      console.error("Error in getDashboardWidgets:", error);
      return [];
    }
  }
  
  async createDispatchClient(client: InsertDispatchClient): Promise<DispatchClient> {
    try {
      const [newClient] = await db
        .insert(dispatch_clients)
        .values(client)
        .returning();
      
      return newClient;
    } catch (error) {
      console.error("Error in createDispatchClient:", error);
      throw error;
    }
  }
  
  async getUserIdFromSession(sessionId: string): Promise<number | undefined> {
    try {
      // This requires a direct query to the session table
      const result = await pool.query(
        'SELECT sess FROM session WHERE sid = $1',
        [sessionId]
      );
      
      if (result.rows.length === 0) return undefined;
      
      const sessionData = result.rows[0].sess;
      return sessionData?.userId;
    } catch (error) {
      console.error("Error in getUserIdFromSession:", error);
      return undefined;
    }
  }
  
  async getLeads(): Promise<Lead[]> {
    try {
      return await getAllLeads();
    } catch (error) {
      console.error("Error in getLeads:", error);
      return [];
    }
  }
  
  async getLead(id: number): Promise<Lead | undefined> {
    try {
      return await getLeadById(id);
    } catch (error) {
      console.error("Error in getLead:", error);
      return undefined;
    }
  }
  
  async createLead(lead: InsertLead): Promise<Lead> {
    try {
      const [newLead] = await db.insert(leads).values(lead).returning();
      return newLead;
    } catch (error) {
      console.error("Error in createLead:", error);
      throw error;
    }
  }
  
  async updateLead(id: number, lead: Partial<Lead>): Promise<Lead | undefined> {
    try {
      const [updatedLead] = await db
        .update(leads)
        .set(lead)
        .where(eq(leads.id, id))
        .returning();
      return updatedLead;
    } catch (error) {
      console.error("Error in updateLead:", error);
      return undefined;
    }
  }
  
  async getLeadsByStatus(status: string): Promise<Lead[]> {
    try {
      return await getLeadsByStatusApi(status);
    } catch (error) {
      console.error("Error in getLeadsByStatus:", error);
      return [];
    }
  }
  
  async getLeadsByAssignee(userId: number): Promise<Lead[]> {
    try {
      return await getLeadsByAssigneeApi(userId);
    } catch (error) {
      console.error("Error in getLeadsByAssignee:", error);
      return [];
    }
  }
  
  async createErrorLog(errorData: any): Promise<any> {
    try {
      // Log error to console for now
      console.error("Error log:", errorData);
      // In a real implementation, this would be saved to a database table
      return { logged: true, timestamp: new Date() };
    } catch (error) {
      console.error("Error in createErrorLog:", error);
      return { logged: false };
    }
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
  private organizations: Map<number, Organization>;
  private leads: Map<number, Lead>;
  private nextUserId: number = 1;
  private nextRoleId: number = 1;
  private nextLeadId: number = 1;
  private nextOrgId: number = 1;
  
  constructor() {
    // Initialize the memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
      ttl: 7 * 24 * 60 * 60 * 1000 // 7 days session lifetime
    });
    
    this.users = new Map();
    this.roles = new Map();
    this.organizations = new Map();
    this.leads = new Map();
    
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