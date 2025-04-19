import {
  users, roles, leads, loads, invoices, invoiceItems, commissions, activities, tasks,
  dispatch_clients, organizations, userOrganizations, commissionRules, commissionsMonthly,
  clockEvents, clockEventTypeEnum,
  type User, type InsertUser, type Role, type InsertRole,
  type Lead, type InsertLead, type Load, type InsertLoad,
  type Invoice, type InsertInvoice, type InvoiceItem, type InsertInvoiceItem,
  type Commission, type InsertCommission, type Activity, type InsertActivity,
  type DispatchClient, type InsertDispatchClient, 
  type Organization, type InsertOrganization,
  type UserOrganization, type InsertUserOrganization,
  type CommissionRule, type InsertCommissionRule,
  type CommissionMonthly, type InsertCommissionMonthly,
  type Task, type InsertTask,
  type ClockEvent, type InsertClockEvent
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, and, desc, inArray } from "drizzle-orm";
import createMemoryStore from "memorystore";
import { db, pgPool, pool } from './db';

// Interface for storage operations
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;

  // Organization operations
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationByCode(code: string): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;
  getActiveOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, org: Partial<Organization>): Promise<Organization | undefined>;
  
  // User & Role operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersByOrganization(orgId: number): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(roleId: number): Promise<User[]>;
  
  // User-Organization relationships
  getUserOrganizations(userId: number): Promise<Organization[]>;
  getUserOrganizationIds(userId: number): Promise<number[]>;
  setUserOrganizations(userId: number, organizationIds: number[]): Promise<void>;
  
  getRole(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  getRoles(): Promise<Role[]>;
  
  // Lead operations
  getLead(id: number): Promise<Lead | undefined>;
  getLeads(): Promise<Lead[]>;
  getLeadsByStatus(status: string): Promise<Lead[]>;
  getLeadsByAssignee(userId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<Lead>): Promise<Lead | undefined>;
  
  // Load operations
  getLoad(id: number): Promise<Load | undefined>;
  getLoads(): Promise<Load[]>;
  getLoadsByStatus(status: string): Promise<Load[]>;
  getLoadsByAssignee(userId: number): Promise<Load[]>;
  getLoadsByLead(leadId: number): Promise<Load[]>;
  createLoad(load: InsertLoad): Promise<Load>;
  updateLoad(id: number, load: Partial<Load>): Promise<Load | undefined>;
  
  // Invoice operations
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByStatus(status: string): Promise<Invoice[]>;
  getInvoicesByLead(leadId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined>;
  
  // Invoice items operations
  getInvoiceItem(id: number): Promise<InvoiceItem | undefined>;
  getInvoiceItemsByInvoice(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  
  // Commission operations
  getCommission(id: number): Promise<Commission | undefined>;
  getCommissions(): Promise<Commission[]>;
  getCommissionsByUser(userId: number): Promise<Commission[]>;
  getCommissionsByInvoice(invoiceId: number): Promise<Commission[]>;
  createCommission(commission: InsertCommission): Promise<Commission>;
  updateCommission(id: number, commission: Partial<Commission>): Promise<Commission | undefined>;
  
  // Commission Rule operations
  getCommissionRule(id: number): Promise<CommissionRule | undefined>;
  getCommissionRulesByType(type: string): Promise<CommissionRule[]>;
  getCommissionRulesByOrg(orgId: number): Promise<CommissionRule[]>;
  createCommissionRule(rule: InsertCommissionRule): Promise<CommissionRule>;
  updateCommissionRule(id: number, rule: Partial<CommissionRule>): Promise<CommissionRule | undefined>;
  
  // Commission Monthly operations
  getCommissionMonthly(id: number): Promise<CommissionMonthly | undefined>;
  
  // Commission analysis operations
  getTopCommissionEarners(options: {
    orgId: number;
    month: string;
    limit: number;
    type?: 'sales' | 'dispatch';
  }): Promise<Array<CommissionMonthly & { username: string; firstName: string; lastName: string; profileImageUrl: string | null; }>>;
  
  getCommissionsMonthlyByUser(userId: number): Promise<CommissionMonthly[]>;
  getCommissionsMonthlyByMonth(month: string): Promise<CommissionMonthly[]>;
  getCommissionsMonthlyByOrg(orgId: number): Promise<CommissionMonthly[]>;
  getCommissionMonthlyByUserAndMonth(userId: number, month: string): Promise<CommissionMonthly | undefined>;
  createCommissionMonthly(commission: InsertCommissionMonthly): Promise<CommissionMonthly>;
  updateCommissionMonthly(id: number, commission: Partial<CommissionMonthly>): Promise<CommissionMonthly | undefined>;
  
  // Dispatch Client operations
  getDispatchClient(id: number): Promise<DispatchClient | undefined>;
  getDispatchClientByLeadId(leadId: number): Promise<DispatchClient | undefined>;
  getDispatchClients(): Promise<DispatchClient[]>;
  getDispatchClientsByStatus(status: string): Promise<DispatchClient[]>;
  createDispatchClient(client: InsertDispatchClient): Promise<DispatchClient>;
  updateDispatchClient(id: number, client: Partial<DispatchClient>): Promise<DispatchClient | undefined>;
  
  // Activity logging
  getActivities(limit?: number): Promise<Activity[]>;
  getActivitiesByUser(userId: number, limit?: number): Promise<Activity[]>;
  getActivitiesByEntity(entityType: string, entityId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasks(options?: { status?: string; priority?: string; limit?: number }): Promise<Task[]>;
  getTasksByAssignee(userId: number): Promise<Task[]>;
  getTasksByEntity(entityType: string, entityId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  
  // Clock Event operations
  getClockEvent(id: number): Promise<ClockEvent | undefined>;
  getClockEvents(): Promise<ClockEvent[]>;
  getClockEventsByUser(userId: number): Promise<ClockEvent[]>;
  getClockEventsByUserAndDay(userId: number, date: Date): Promise<ClockEvent[]>;
  getCurrentClockStatus(userId: number): Promise<'IN' | 'OUT' | null>;
  createClockEvent(event: InsertClockEvent): Promise<ClockEvent>;
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  
  private users: Map<number, User>;
  private roles: Map<number, Role>;
  private leads: Map<number, Lead>;
  private dispatchClients: Map<number, DispatchClient>;
  private loads: Map<number, Load>;
  private invoices: Map<number, Invoice>;
  private invoiceItems: Map<number, InvoiceItem>;
  private commissions: Map<number, Commission>;
  private activities: Map<number, Activity>;
  private organizations: Map<number, Organization>;
  private userOrganizations: Map<number, UserOrganization>;
  private commissionRules: Map<number, CommissionRule>;
  private commissionsMonthly: Map<number, CommissionMonthly>;
  private tasks: Map<number, Task>;
  private clockEvents: Map<number, ClockEvent>;
  
  private userIdCounter: number;
  private roleIdCounter: number;
  private leadIdCounter: number;
  private dispatchClientIdCounter: number;
  private loadIdCounter: number;
  private invoiceIdCounter: number;
  private invoiceItemIdCounter: number;
  private commissionIdCounter: number;
  private activityIdCounter: number;
  private organizationIdCounter: number;
  private userOrganizationIdCounter: number;
  private commissionRuleIdCounter: number;
  private commissionMonthlyIdCounter: number;
  private taskIdCounter: number;
  private clockEventIdCounter: number;

  constructor() {
    // Initialize the memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.users = new Map();
    this.roles = new Map();
    this.leads = new Map();
    this.dispatchClients = new Map();
    this.loads = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    this.commissions = new Map();
    this.activities = new Map();
    this.organizations = new Map();
    this.userOrganizations = new Map();
    this.commissionRules = new Map();
    this.commissionsMonthly = new Map();
    this.tasks = new Map();
    this.clockEvents = new Map();
    
    this.userIdCounter = 1;
    this.roleIdCounter = 1;
    this.leadIdCounter = 1;
    this.dispatchClientIdCounter = 1;
    this.loadIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.invoiceItemIdCounter = 1;
    this.commissionIdCounter = 1;
    this.activityIdCounter = 1;
    this.organizationIdCounter = 1;
    this.userOrganizationIdCounter = 1;
    this.commissionRuleIdCounter = 1;
    this.commissionMonthlyIdCounter = 1;
    this.taskIdCounter = 1;
    this.clockEventIdCounter = 1;
    
    // Initialize with default roles
    this.initializeRoles();
  }
  
  private initializeCommissionRules(orgId: number) {
    // Check if we already have commission rules
    const existingSalesRules = Array.from(this.commissionRules.values())
      .filter(rule => rule.type === 'sales' && rule.orgId === orgId);
    
    const existingDispatchRules = Array.from(this.commissionRules.values())
      .filter(rule => rule.type === 'dispatch' && rule.orgId === orgId);
    
    // If we don't have sales commission rules, create them
    if (existingSalesRules.length === 0) {
      const salesCommRules = {
        type: 'sales',
        orgId,
        tiers: [
          {active: 0, pct: -25, fixed: 0},
          {active: 2, fixed: 5000},
          {active: 3, fixed: 10000},
          {active: 4, fixed: 15000},
          {active: 5, fixed: 21500},
          {active: 6, fixed: 28000},
          {active: 7, fixed: 36000},
          {active: 8, fixed: 45000},
          {active: 9, fixed: 55000},
          {active: 10, fixed: 70000}
        ],
        updatedBy: 1 // Default admin user
      };
      
      this.createCommissionRule(salesCommRules);
    }
    
    // If we don't have dispatch commission rules, create them
    if (existingDispatchRules.length === 0) {
      const dispatchCommRules = {
        type: 'dispatch',
        orgId,
        tiers: [
          {min: 651, max: 850, pct: 2.5},
          {min: 851, max: 1500, pct: 5},
          {min: 1501, max: 2700, pct: 10},
          {min: 2701, max: 3700, pct: 12.5},
          {min: 3701, max: Infinity, pct: 15}
        ],
        updatedBy: 1 // Default admin user
      };
      
      this.createCommissionRule(dispatchCommRules);
    }
  }
  
  private initializeRoles() {
    // Create a default organization
    const defaultOrg = this.createOrganization({
      name: "Default Organization",
      code: "DEFAULT",
      active: true
    });
    
    // Initialize commission rules
    this.initializeCommissionRules(defaultOrg.id);
    
    const roles: InsertRole[] = [
      {
        name: "Sales Rep",
        department: "sales",
        level: 1,
        permissions: ["leads.view.own", "leads.create", "leads.update.own"]
      },
      {
        name: "Sales Team Lead",
        department: "sales",
        level: 2,
        permissions: ["leads.view.team", "leads.create", "leads.update.team", "team.view"]
      },
      {
        name: "Sales Manager",
        department: "sales",
        level: 3,
        permissions: ["leads.view.department", "leads.create", "leads.update.department", "team.view", "team.manage"]
      },
      {
        name: "Head of Sales",
        department: "sales",
        level: 4,
        permissions: ["leads.view.all", "leads.create", "leads.update.all", "team.view", "team.manage", "reports.view.sales"]
      },
      {
        name: "Dispatch Rep",
        department: "dispatch",
        level: 1,
        permissions: ["loads.view.own", "loads.create", "loads.update.own"]
      },
      {
        name: "Dispatch Team Lead",
        department: "dispatch",
        level: 2,
        permissions: ["loads.view.team", "loads.create", "loads.update.team", "team.view"]
      },
      {
        name: "Dispatch Manager",
        department: "dispatch",
        level: 3,
        permissions: ["loads.view.department", "loads.create", "loads.update.department", "team.view", "team.manage"]
      },
      {
        name: "Head of Dispatch",
        department: "dispatch",
        level: 4,
        permissions: ["loads.view.all", "loads.create", "loads.update.all", "team.view", "team.manage", "reports.view.dispatch"]
      },
      {
        name: "Super Admin",
        department: "admin",
        level: 5,
        permissions: ["*"]
      }
    ];
    
    roles.forEach(role => this.createRole(role));
    
    // Add a default Super Admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      firstName: "System",
      lastName: "Admin",
      email: "admin@metasys.com",
      roleId: 9, // Super Admin role
      active: true,
      phoneNumber: null,
      profileImageUrl: null,
      orgId: defaultOrg.id
    });
  }
  
  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizationByCode(code: string): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(org => org.code === code);
  }

  async getOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async getActiveOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values()).filter(org => org.active);
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const id = this.organizationIdCounter++;
    const now = new Date();
    const org: Organization = {
      ...insertOrg,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.organizations.set(id, org);
    return org;
  }

  async updateOrganization(id: number, updates: Partial<Organization>): Promise<Organization | undefined> {
    const org = await this.getOrganization(id);
    if (!org) return undefined;
    
    const updatedOrg = {
      ...org,
      ...updates,
      updatedAt: new Date()
    };
    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }
  
  async getUsersByOrganization(orgId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.orgId === orgId);
  }

  // User-Organization relationships
  async getUserOrganizations(userId: number): Promise<Organization[]> {
    // Get all user-organization relationships for this user
    const userOrgRelations = Array.from(this.userOrganizations.values())
      .filter(relation => relation.userId === userId);
    
    // Get the actual organization objects
    const orgIds = userOrgRelations.map(relation => relation.organizationId);
    const organizations = orgIds.map(orgId => this.organizations.get(orgId))
      .filter((org): org is Organization => org !== undefined);
    
    return organizations;
  }

  async getUserOrganizationIds(userId: number): Promise<number[]> {
    // Get all user-organization relationships for this user and return just the organization IDs
    const userOrgRelations = Array.from(this.userOrganizations.values())
      .filter(relation => relation.userId === userId);
    
    return userOrgRelations.map(relation => relation.organizationId);
  }

  async setUserOrganizations(userId: number, organizationIds: number[]): Promise<void> {
    // Remove existing relationships for this user
    Array.from(this.userOrganizations.values())
      .filter(relation => relation.userId === userId)
      .forEach(relation => this.userOrganizations.delete(relation.id));
    
    // Create new relationships
    for (const orgId of organizationIds) {
      const id = this.userOrganizationIdCounter++;
      const now = new Date();
      const userOrg: UserOrganization = {
        id,
        userId,
        organizationId: orgId,
        createdAt: now
      };
      this.userOrganizations.set(id, userOrg);
    }
  }

  // User & Role operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(roleId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.roleId === roleId);
  }

  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    return Array.from(this.roles.values()).find(role => role.name === name);
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = this.roleIdCounter++;
    const role: Role = { ...insertRole, id };
    this.roles.set(id, role);
    return role;
  }

  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  // Lead operations
  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(lead => lead.status === status);
  }

  async getLeadsByAssignee(userId: number): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(lead => lead.assignedTo === userId);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.leadIdCounter++;
    const now = new Date();
    const lead: Lead = { 
      ...insertLead, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const lead = await this.getLead(id);
    if (!lead) return undefined;
    
    const updatedLead = { 
      ...lead, 
      ...updates,
      updatedAt: new Date()
    };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  // Load operations
  async getLoad(id: number): Promise<Load | undefined> {
    return this.loads.get(id);
  }

  async getLoads(): Promise<Load[]> {
    return Array.from(this.loads.values());
  }

  async getLoadsByStatus(status: string): Promise<Load[]> {
    return Array.from(this.loads.values()).filter(load => load.status === status);
  }

  async getLoadsByAssignee(userId: number): Promise<Load[]> {
    return Array.from(this.loads.values()).filter(load => load.assignedTo === userId);
  }

  async getLoadsByLead(leadId: number): Promise<Load[]> {
    return Array.from(this.loads.values()).filter(load => load.leadId === leadId);
  }

  async createLoad(insertLoad: InsertLoad): Promise<Load> {
    const id = this.loadIdCounter++;
    const now = new Date();
    const load: Load = {
      ...insertLoad,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.loads.set(id, load);
    return load;
  }

  async updateLoad(id: number, updates: Partial<Load>): Promise<Load | undefined> {
    const load = await this.getLoad(id);
    if (!load) return undefined;
    
    const updatedLoad = {
      ...load,
      ...updates,
      updatedAt: new Date()
    };
    this.loads.set(id, updatedLoad);
    return updatedLoad;
  }

  // Invoice operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    return Array.from(this.invoices.values()).find(invoice => invoice.invoiceNumber === invoiceNumber);
  }

  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoicesByStatus(status: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.status === status);
  }

  async getInvoicesByLead(leadId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.leadId === leadId);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const now = new Date();
    const invoice: Invoice = {
      ...insertInvoice,
      id,
      createdAt: now
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = {
      ...invoice,
      ...updates
    };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  // Invoice items operations
  async getInvoiceItem(id: number): Promise<InvoiceItem | undefined> {
    return this.invoiceItems.get(id);
  }

  async getInvoiceItemsByInvoice(invoiceId: number): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter(item => item.invoiceId === invoiceId);
  }

  async createInvoiceItem(insertItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const id = this.invoiceItemIdCounter++;
    const item: InvoiceItem = {
      ...insertItem,
      id
    };
    this.invoiceItems.set(id, item);
    return item;
  }

  // Commission operations
  async getCommission(id: number): Promise<Commission | undefined> {
    return this.commissions.get(id);
  }

  async getCommissions(): Promise<Commission[]> {
    return Array.from(this.commissions.values());
  }

  async getCommissionsByUser(userId: number): Promise<Commission[]> {
    return Array.from(this.commissions.values()).filter(commission => commission.userId === userId);
  }

  async getCommissionsByInvoice(invoiceId: number): Promise<Commission[]> {
    return Array.from(this.commissions.values()).filter(commission => commission.invoiceId === invoiceId);
  }

  async createCommission(insertCommission: InsertCommission): Promise<Commission> {
    const id = this.commissionIdCounter++;
    const commission: Commission = {
      ...insertCommission,
      id
    };
    this.commissions.set(id, commission);
    return commission;
  }

  async updateCommission(id: number, updates: Partial<Commission>): Promise<Commission | undefined> {
    const commission = await this.getCommission(id);
    if (!commission) return undefined;
    
    const updatedCommission = {
      ...commission,
      ...updates
    };
    this.commissions.set(id, updatedCommission);
    return updatedCommission;
  }

  // Dispatch Client operations
  async getDispatchClient(id: number): Promise<DispatchClient | undefined> {
    return this.dispatchClients.get(id);
  }
  
  async getDispatchClientByLeadId(leadId: number): Promise<DispatchClient | undefined> {
    return Array.from(this.dispatchClients.values()).find(client => client.leadId === leadId);
  }
  
  async getDispatchClients(): Promise<DispatchClient[]> {
    return Array.from(this.dispatchClients.values());
  }
  
  async getDispatchClientsByStatus(status: string): Promise<DispatchClient[]> {
    return Array.from(this.dispatchClients.values()).filter(client => client.status === status);
  }
  
  async createDispatchClient(insertClient: InsertDispatchClient): Promise<DispatchClient> {
    const id = this.dispatchClientIdCounter++;
    const now = new Date();
    const client: DispatchClient = {
      ...insertClient,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.dispatchClients.set(id, client);
    return client;
  }
  
  async updateDispatchClient(id: number, updates: Partial<DispatchClient>): Promise<DispatchClient | undefined> {
    const client = await this.getDispatchClient(id);
    if (!client) return undefined;
    
    const updatedClient = {
      ...client,
      ...updates,
      updatedAt: new Date()
    };
    this.dispatchClients.set(id, updatedClient);
    return updatedClient;
  }
  
  // Activity logging
  async getActivities(limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }

  async getActivitiesByUser(userId: number, limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }

  async getActivitiesByEntity(entityType: string, entityId: number, limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.entityType === entityType && activity.entityId === entityId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const activity: Activity = {
      ...insertActivity,
      id,
      timestamp: now
    };
    this.activities.set(id, activity);
    return activity;
  }
  
  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasks(options?: { status?: string; priority?: string; limit?: number }): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());
    
    if (options?.status) {
      tasks = tasks.filter(task => task.status === options.status);
    }
    
    if (options?.priority) {
      tasks = tasks.filter(task => task.priority === options.priority);
    }
    
    // Sort by dueDate (most urgent first)
    tasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    
    if (options?.limit) {
      tasks = tasks.slice(0, options.limit);
    }
    
    return tasks;
  }
  
  async getTasksByAssignee(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.assignedTo === userId)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }
  
  async getTasksByEntity(entityType: string, entityId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.relatedEntityType === entityType && task.relatedEntityId === entityId)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const task: Task = {
      ...insertTask,
      id,
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;
    
    // If we're completing a task now, set the completedAt timestamp
    if (updates.status === 'completed' && task.status !== 'completed') {
      updates.completedAt = new Date();
    }
    
    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  // Clock Event operations
  async getClockEvent(id: number): Promise<ClockEvent | undefined> {
    return this.clockEvents.get(id);
  }

  async getClockEvents(): Promise<ClockEvent[]> {
    return Array.from(this.clockEvents.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getClockEventsByUser(userId: number): Promise<ClockEvent[]> {
    return Array.from(this.clockEvents.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getClockEventsByUserAndDay(userId: number, date: Date): Promise<ClockEvent[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.clockEvents.values())
      .filter(event => {
        const eventDate = new Date(event.timestamp);
        return event.userId === userId && 
               eventDate >= startOfDay && 
               eventDate <= endOfDay;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getCurrentClockStatus(userId: number): Promise<'IN' | 'OUT' | null> {
    const userEvents = await this.getClockEventsByUser(userId);
    
    if (userEvents.length === 0) {
      return 'OUT'; // Default state if no events exist
    }
    
    // Sort by timestamp descending to get the most recent event
    userEvents.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Return the type of the most recent event
    return userEvents[0].type;
  }

  async createClockEvent(event: InsertClockEvent): Promise<ClockEvent> {
    const id = this.clockEventIdCounter++;
    const now = new Date();
    
    const clockEvent: ClockEvent = {
      ...event,
      id,
      timestamp: now
    };
    
    this.clockEvents.set(id, clockEvent);
    return clockEvent;
  }

  // Commission Rules operations
  async getCommissionRule(id: number): Promise<CommissionRule | undefined> {
    return this.commissionRules.get(id);
  }

  async getCommissionRulesByType(type: string): Promise<CommissionRule[]> {
    return Array.from(this.commissionRules.values()).filter(rule => rule.type === type);
  }

  async getCommissionRulesByOrg(orgId: number): Promise<CommissionRule[]> {
    return Array.from(this.commissionRules.values()).filter(rule => rule.orgId === orgId);
  }

  async createCommissionRule(rule: InsertCommissionRule): Promise<CommissionRule> {
    const id = this.commissionRuleIdCounter++;
    const now = new Date();
    const commissionRule: CommissionRule = {
      ...rule,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.commissionRules.set(id, commissionRule);
    return commissionRule;
  }

  async updateCommissionRule(id: number, updates: Partial<CommissionRule>): Promise<CommissionRule | undefined> {
    const rule = await this.getCommissionRule(id);
    if (!rule) return undefined;
    
    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: new Date()
    };
    this.commissionRules.set(id, updatedRule);
    return updatedRule;
  }
  
  // Monthly Commission operations
  async getCommissionMonthly(id: number): Promise<CommissionMonthly | undefined> {
    return this.commissionsMonthly.get(id);
  }

  async getCommissionMonthlyByUserAndMonth(userId: number, month: string): Promise<CommissionMonthly | undefined> {
    return Array.from(this.commissionsMonthly.values()).find(
      commission => commission.userId === userId && commission.month === month
    );
  }

  async getCommissionsMonthlyByUser(userId: number): Promise<CommissionMonthly[]> {
    return Array.from(this.commissionsMonthly.values()).filter(commission => commission.userId === userId);
  }

  async getCommissionsMonthlyByMonth(month: string): Promise<CommissionMonthly[]> {
    return Array.from(this.commissionsMonthly.values()).filter(commission => commission.month === month);
  }

  async getCommissionsMonthlyByOrg(orgId: number): Promise<CommissionMonthly[]> {
    return Array.from(this.commissionsMonthly.values()).filter(commission => commission.orgId === orgId);
  }
  
  async getTopCommissionEarners(options: {
    orgId: number;
    month: string;
    limit: number;
    type?: 'sales' | 'dispatch';
  }): Promise<Array<CommissionMonthly & { username: string; firstName: string; lastName: string; profileImageUrl: string | null; }>> {
    // Filter commissions by criteria
    let filteredCommissions = Array.from(this.commissionsMonthly.values())
      .filter(comm => comm.orgId === options.orgId && comm.month === options.month);
    
    // Filter by department if specified
    if (options.type) {
      filteredCommissions = filteredCommissions.filter(comm => comm.dept === options.type);
    }
    
    // Sort by totalCommission in descending order
    filteredCommissions.sort((a, b) => b.totalCommission - a.totalCommission);
    
    // Get top N commissions
    const topCommissions = filteredCommissions.slice(0, options.limit);
    
    // Join with user data
    return topCommissions.map(comm => {
      const user = this.users.get(comm.userId);
      return {
        ...comm,
        amount: comm.totalCommission, // Map totalCommission to amount for consistency
        username: user?.username || 'unknown',
        firstName: user?.firstName || 'Unknown',
        lastName: user?.lastName || 'User',
        profileImageUrl: user?.profileImageUrl
      };
    });
  }

  async createCommissionMonthly(commission: InsertCommissionMonthly): Promise<CommissionMonthly> {
    const id = this.commissionMonthlyIdCounter++;
    const now = new Date();
    const commissionMonthly: CommissionMonthly = {
      ...commission,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.commissionsMonthly.set(id, commissionMonthly);
    return commissionMonthly;
  }

  async updateCommissionMonthly(id: number, updates: Partial<CommissionMonthly>): Promise<CommissionMonthly | undefined> {
    const commission = await this.getCommissionMonthly(id);
    if (!commission) return undefined;
    
    const updatedCommission = {
      ...commission,
      ...updates,
      updatedAt: new Date()
    };
    this.commissionsMonthly.set(id, updatedCommission);
    return updatedCommission;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Create PostgreSQL session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool: pgPool,
      createTableIfMissing: true
    });
    
    // Initialize with default data if needed
    this.initializeRoles();
  }

  private async initializeRoles() {
    // Check if we have any roles already
    const existingRoles = await this.getRoles();
    if (existingRoles.length > 0) {
      return; // Database is already initialized
    }
    
    // Create default organization or use existing one
    let defaultOrg = await this.getOrganizationByCode("DEFAULT");
    if (!defaultOrg) {
      defaultOrg = await this.createOrganization({
        name: "Default Organization",
        code: "DEFAULT",
        active: true
      });
    }
    
    // Add default roles with different permissions and departments
    const roles: InsertRole[] = [
      {
        name: "Administrator",
        department: "admin",
        level: 5,
        permissions: ["all"]
      },
      {
        name: "Sales Manager",
        department: "sales",
        level: 4,
        permissions: ["manage_leads", "manage_users", "view_reports", "manage_sales"]
      },
      {
        name: "Sales Team Lead",
        department: "sales",
        level: 3,
        permissions: ["manage_leads", "view_users", "view_reports"]
      },
      {
        name: "Sales Representative",
        department: "sales",
        level: 1,
        permissions: ["view_leads", "create_leads"]
      },
      {
        name: "Dispatch Manager",
        department: "dispatch",
        level: 4,
        permissions: ["manage_loads", "manage_users", "view_reports", "manage_dispatch"]
      },
      {
        name: "Dispatch Team Lead",
        department: "dispatch",
        level: 3,
        permissions: ["manage_loads", "view_users", "view_reports"]
      },
      {
        name: "Dispatcher",
        department: "dispatch",
        level: 1,
        permissions: ["view_loads", "create_loads"]
      },
      {
        name: "Accounting Manager",
        department: "accounting",
        level: 4,
        permissions: ["manage_invoices", "manage_users", "view_reports", "manage_accounting"]
      }
    ];
    
    // Add roles
    for (const role of roles) {
      await this.createRole(role);
    }
    
    // Check if admin user exists
    const adminUser = await this.getUserByUsername("admin");
    if (!adminUser) {
      // Add admin user
      await this.createUser({
        username: "admin",
        password: "admin123",  // In a real app would be hashed
        firstName: "System",
        lastName: "Administrator",
        email: "admin@metasys.com",
        phoneNumber: null,
        roleId: 1,  // Administrator role
        active: true,
        profileImageUrl: null,
        orgId: defaultOrg.id
      });
    }
  }
  
  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationByCode(code: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.code, code));
    return org;
  }

  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations);
  }

  async getActiveOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).where(eq(organizations.active, true));
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const now = new Date().toISOString();
    const [org] = await db.insert(organizations).values({
      ...insertOrg,
      createdAt: now,
      updatedAt: now
    }).returning();
    return org;
  }

  async updateOrganization(id: number, updates: Partial<Organization>): Promise<Organization | undefined> {
    const [org] = await db.update(organizations)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(organizations.id, id))
      .returning();
    return org;
  }
  
  async getUsersByOrganization(orgId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.orgId, orgId));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUsersByRole(roleId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.roleId, roleId));
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(insertRole).returning();
    return role;
  }

  async getRoles(): Promise<Role[]> {
    return db.select().from(roles);
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeads(): Promise<Lead[]> {
    return db.select().from(leads);
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.status, status));
  }

  async getLeadsByAssignee(userId: number): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.assignedTo, userId));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const now = new Date().toISOString();
    const [lead] = await db.insert(leads).values({
      ...insertLead,
      createdAt: now,
      updatedAt: now
    }).returning();
    return lead;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(leads.id, id))
      .returning();
    return updatedLead;
  }

  async getLoad(id: number): Promise<Load | undefined> {
    const [load] = await db.select().from(loads).where(eq(loads.id, id));
    return load;
  }

  async getLoads(): Promise<Load[]> {
    return db.select().from(loads);
  }

  async getLoadsByStatus(status: string): Promise<Load[]> {
    return db.select().from(loads).where(eq(loads.status, status));
  }

  async getLoadsByAssignee(userId: number): Promise<Load[]> {
    return db.select().from(loads).where(eq(loads.assignedTo, userId));
  }

  async getLoadsByLead(leadId: number): Promise<Load[]> {
    return db.select().from(loads).where(eq(loads.leadId, leadId));
  }

  async createLoad(insertLoad: InsertLoad): Promise<Load> {
    const now = new Date().toISOString();
    const [load] = await db.insert(loads).values({
      ...insertLoad,
      createdAt: now,
      updatedAt: now
    }).returning();
    return load;
  }

  async updateLoad(id: number, updates: Partial<Load>): Promise<Load | undefined> {
    const [updatedLoad] = await db
      .update(loads)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(loads.id, id))
      .returning();
    return updatedLoad;
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber));
    return invoice;
  }

  async getInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices);
  }

  async getInvoicesByStatus(status: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.status, status));
  }

  async getInvoicesByLead(leadId: number): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.leadId, leadId));
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values({
      ...insertInvoice,
      createdAt: new Date().toISOString()
    }).returning();
    return invoice;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async getInvoiceItem(id: number): Promise<InvoiceItem | undefined> {
    const [item] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, id));
    return item;
  }

  async getInvoiceItemsByInvoice(invoiceId: number): Promise<InvoiceItem[]> {
    return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(insertItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const [item] = await db.insert(invoiceItems).values(insertItem).returning();
    return item;
  }

  async getCommission(id: number): Promise<Commission | undefined> {
    const [commission] = await db.select().from(commissions).where(eq(commissions.id, id));
    return commission;
  }

  async getCommissions(): Promise<Commission[]> {
    return db.select().from(commissions);
  }

  async getCommissionsByUser(userId: number): Promise<Commission[]> {
    return db.select().from(commissions).where(eq(commissions.userId, userId));
  }

  async getCommissionsByInvoice(invoiceId: number): Promise<Commission[]> {
    return db.select().from(commissions).where(eq(commissions.invoiceId, invoiceId));
  }

  async createCommission(insertCommission: InsertCommission): Promise<Commission> {
    const [commission] = await db.insert(commissions).values(insertCommission).returning();
    return commission;
  }

  async updateCommission(id: number, updates: Partial<Commission>): Promise<Commission | undefined> {
    const [updatedCommission] = await db
      .update(commissions)
      .set(updates)
      .where(eq(commissions.id, id))
      .returning();
    return updatedCommission;
  }
  
  // Dispatch Client operations
  async getDispatchClient(id: number): Promise<DispatchClient | undefined> {
    const [client] = await db.select().from(dispatch_clients).where(eq(dispatch_clients.id, id));
    return client;
  }
  
  async getDispatchClientByLeadId(leadId: number): Promise<DispatchClient | undefined> {
    const [client] = await db.select().from(dispatch_clients).where(eq(dispatch_clients.leadId, leadId));
    return client;
  }
  
  async getDispatchClients(): Promise<DispatchClient[]> {
    return db.select().from(dispatch_clients);
  }
  
  async getDispatchClientsByStatus(status: string): Promise<DispatchClient[]> {
    return db.select().from(dispatch_clients).where(eq(dispatch_clients.status, status));
  }
  
  async createDispatchClient(insertClient: InsertDispatchClient): Promise<DispatchClient> {
    const now = new Date().toISOString();
    const [client] = await db.insert(dispatch_clients).values({
      ...insertClient,
      createdAt: now,
      updatedAt: now
    }).returning();
    return client;
  }
  
  async updateDispatchClient(id: number, updates: Partial<DispatchClient>): Promise<DispatchClient | undefined> {
    const [updatedClient] = await db
      .update(dispatch_clients)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(dispatch_clients.id, id))
      .returning();
    return updatedClient;
  }

  async getActivities(limit?: number): Promise<Activity[]> {
    const query = db.select()
      .from(activities)
      .orderBy(desc(activities.timestamp));
    
    if (limit) {
      query.limit(limit);
    }
    
    return query;
  }

  async getActivitiesByUser(userId: number, limit?: number): Promise<Activity[]> {
    const query = db.select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.timestamp));
    
    if (limit) {
      query.limit(limit);
    }
    
    return query;
  }

  async getActivitiesByEntity(entityType: string, entityId: number, limit?: number): Promise<Activity[]> {
    const query = db.select()
      .from(activities)
      .where(
        and(
          eq(activities.entityType, entityType),
          eq(activities.entityId, entityId)
        )
      )
      .orderBy(desc(activities.timestamp));
    
    if (limit) {
      query.limit(limit);
    }
    
    return query;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values({
      ...insertActivity,
      timestamp: new Date().toISOString()
    }).returning();
    return activity;
  }

  // User-Organization relationships
  async getUserOrganizations(userId: number): Promise<Organization[]> {
    const userOrgs = await db
      .select({
        organizationId: userOrganizations.organizationId
      })
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, userId));
    
    if (userOrgs.length === 0) {
      return [];
    }
    
    // Get the organizations
    const orgIds = userOrgs.map(uo => uo.organizationId);
    return db
      .select()
      .from(organizations)
      .where(
        orgIds.length === 1 
          ? eq(organizations.id, orgIds[0]) 
          : inArray(organizations.id, orgIds)
      );
  }

  async getUserOrganizationIds(userId: number): Promise<number[]> {
    const userOrgs = await db
      .select({
        organizationId: userOrganizations.organizationId
      })
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, userId));
    
    return userOrgs.map(uo => uo.organizationId);
  }

  async setUserOrganizations(userId: number, organizationIds: number[]): Promise<void> {
    // Transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Delete existing relationships
      await tx
        .delete(userOrganizations)
        .where(eq(userOrganizations.userId, userId));
      
      // Insert new relationships
      if (organizationIds.length > 0) {
        await tx
          .insert(userOrganizations)
          .values(
            organizationIds.map(orgId => ({
              userId,
              organizationId: orgId,
              createdAt: new Date().toISOString()
            }))
          );
      }
    });
  }

  // Commission Rules operations
  async getCommissionRule(id: number): Promise<CommissionRule | undefined> {
    const [rule] = await db.select().from(commissionRules).where(eq(commissionRules.id, id));
    return rule;
  }

  async getCommissionRulesByType(type: string): Promise<CommissionRule[]> {
    return db.select().from(commissionRules).where(eq(commissionRules.type, type));
  }

  async getCommissionRulesByOrg(orgId: number): Promise<CommissionRule[]> {
    return db.select().from(commissionRules).where(eq(commissionRules.orgId, orgId));
  }

  async createCommissionRule(rule: InsertCommissionRule): Promise<CommissionRule> {
    const now = new Date().toISOString();
    const [commissionRule] = await db.insert(commissionRules).values({
      ...rule,
      createdAt: now,
      updatedAt: now
    }).returning();
    return commissionRule;
  }

  async updateCommissionRule(id: number, updates: Partial<CommissionRule>): Promise<CommissionRule | undefined> {
    const [updatedRule] = await db
      .update(commissionRules)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(commissionRules.id, id))
      .returning();
    return updatedRule;
  }
  
  // Monthly Commission operations
  async getCommissionMonthly(id: number): Promise<CommissionMonthly | undefined> {
    const [commission] = await db.select().from(commissionsMonthly).where(eq(commissionsMonthly.id, id));
    return commission;
  }

  async getCommissionMonthlyByUserAndMonth(userId: number, month: string): Promise<CommissionMonthly | undefined> {
    const [commission] = await db.select().from(commissionsMonthly).where(
      and(
        eq(commissionsMonthly.userId, userId),
        eq(commissionsMonthly.month, month)
      )
    );
    return commission;
  }

  async getCommissionsMonthlyByUser(userId: number): Promise<CommissionMonthly[]> {
    return db.select().from(commissionsMonthly).where(eq(commissionsMonthly.userId, userId));
  }

  async getCommissionsMonthlyByMonth(month: string): Promise<CommissionMonthly[]> {
    return db.select().from(commissionsMonthly).where(eq(commissionsMonthly.month, month));
  }

  async getCommissionsMonthlyByOrg(orgId: number): Promise<CommissionMonthly[]> {
    return db.select().from(commissionsMonthly).where(eq(commissionsMonthly.orgId, orgId));
  }
  
  async getTopCommissionEarners(options: {
    orgId: number;
    month: string;
    limit: number;
    type?: 'sales' | 'dispatch';
  }): Promise<Array<CommissionMonthly & { username: string; firstName: string; lastName: string; profileImageUrl: string | null; }>> {
    // Build the query conditions
    const conditions = [
      eq(commissionsMonthly.orgId, options.orgId),
      eq(commissionsMonthly.month, options.month)
    ];
    
    // Filter by department if specified
    if (options.type) {
      conditions.push(eq(commissionsMonthly.dept, options.type));
    }
    
    // Get top commission earners with user details
    const results = await db.select({
      id: commissionsMonthly.id,
      userId: commissionsMonthly.userId,
      amount: commissionsMonthly.totalCommission,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      dept: commissionsMonthly.dept,
      month: commissionsMonthly.month
    })
    .from(commissionsMonthly)
    .innerJoin(users, eq(commissionsMonthly.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(commissionsMonthly.totalCommission))
    .limit(options.limit);
    
    return results;
  }

  async createCommissionMonthly(commission: InsertCommissionMonthly): Promise<CommissionMonthly> {
    const now = new Date().toISOString();
    const [commissionMonthly] = await db.insert(commissionsMonthly).values({
      ...commission,
      createdAt: now,
      updatedAt: now
    }).returning();
    return commissionMonthly;
  }

  async updateCommissionMonthly(id: number, updates: Partial<CommissionMonthly>): Promise<CommissionMonthly | undefined> {
    const [updatedCommission] = await db
      .update(commissionsMonthly)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(commissionsMonthly.id, id))
      .returning();
    return updatedCommission;
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
  
  async getTasks(options?: { status?: string; priority?: string; limit?: number }): Promise<Task[]> {
    let query = db.select().from(tasks);
    
    // Apply filters
    const conditions = [];
    
    if (options?.status) {
      conditions.push(eq(tasks.status, options.status));
    }
    
    if (options?.priority) {
      conditions.push(eq(tasks.priority, options.priority));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Sort by dueDate (most urgent first)
    query = query.orderBy(tasks.dueDate);
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return query;
  }
  
  async getTasksByAssignee(userId: number): Promise<Task[]> {
    return db.select()
      .from(tasks)
      .where(eq(tasks.assignedTo, userId))
      .orderBy(tasks.dueDate);
  }
  
  async getTasksByEntity(entityType: string, entityId: number): Promise<Task[]> {
    return db.select()
      .from(tasks)
      .where(
        and(
          eq(tasks.relatedEntityType, entityType),
          eq(tasks.relatedEntityId, entityId)
        )
      )
      .orderBy(tasks.dueDate);
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const now = new Date().toISOString();
    const [task] = await db.insert(tasks).values({
      ...insertTask,
      createdAt: now,
      updatedAt: now
    }).returning();
    return task;
  }
  
  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    // If we're completing a task now, set the completedAt timestamp
    if (updates.status === 'completed') {
      updates.completedAt = new Date().toISOString();
    }
    
    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }
  
  // Clock Event operations
  async getClockEvent(id: number): Promise<ClockEvent | undefined> {
    const [event] = await db.select().from(clockEvents).where(eq(clockEvents.id, id));
    return event;
  }
  
  async getClockEvents(): Promise<ClockEvent[]> {
    return db.select().from(clockEvents).orderBy(desc(clockEvents.timestamp));
  }
  
  async getClockEventsByUser(userId: number): Promise<ClockEvent[]> {
    return db.select()
      .from(clockEvents)
      .where(eq(clockEvents.userId, userId))
      .orderBy(desc(clockEvents.timestamp));
  }
  
  async getClockEventsByUserAndDay(userId: number, date: Date): Promise<ClockEvent[]> {
    // Convert date to ISO string with only the date part (YYYY-MM-DD)
    const dateString = date.toISOString().split('T')[0];
    
    return db.select()
      .from(clockEvents)
      .where(
        and(
          eq(clockEvents.userId, userId),
          sql`DATE(${clockEvents.timestamp}) = ${dateString}`
        )
      )
      .orderBy(clockEvents.timestamp);
  }
  
  async getCurrentClockStatus(userId: number): Promise<'IN' | 'OUT' | null> {
    const [latestEvent] = await db.select()
      .from(clockEvents)
      .where(eq(clockEvents.userId, userId))
      .orderBy(desc(clockEvents.timestamp))
      .limit(1);
    
    return latestEvent ? latestEvent.type : null;
  }
  
  async createClockEvent(event: InsertClockEvent): Promise<ClockEvent> {
    const now = new Date().toISOString();
    const [clockEvent] = await db.insert(clockEvents).values({
      ...event,
      timestamp: now,
      createdAt: now
    }).returning();
    return clockEvent;
  }
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();
