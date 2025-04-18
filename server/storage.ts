import {
  users, roles, leads, loads, invoices, invoiceItems, commissions, activities,
  type User, type InsertUser, type Role, type InsertRole,
  type Lead, type InsertLead, type Load, type InsertLoad,
  type Invoice, type InsertInvoice, type InvoiceItem, type InsertInvoiceItem,
  type Commission, type InsertCommission, type Activity, type InsertActivity
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User & Role operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersByRole(roleId: number): Promise<User[]>;
  
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
  
  // Activity logging
  getActivities(limit?: number): Promise<Activity[]>;
  getActivitiesByUser(userId: number, limit?: number): Promise<Activity[]>;
  getActivitiesByEntity(entityType: string, entityId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private roles: Map<number, Role>;
  private leads: Map<number, Lead>;
  private loads: Map<number, Load>;
  private invoices: Map<number, Invoice>;
  private invoiceItems: Map<number, InvoiceItem>;
  private commissions: Map<number, Commission>;
  private activities: Map<number, Activity>;
  
  private userIdCounter: number;
  private roleIdCounter: number;
  private leadIdCounter: number;
  private loadIdCounter: number;
  private invoiceIdCounter: number;
  private invoiceItemIdCounter: number;
  private commissionIdCounter: number;
  private activityIdCounter: number;

  constructor() {
    this.users = new Map();
    this.roles = new Map();
    this.leads = new Map();
    this.loads = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    this.commissions = new Map();
    this.activities = new Map();
    
    this.userIdCounter = 1;
    this.roleIdCounter = 1;
    this.leadIdCounter = 1;
    this.loadIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.invoiceItemIdCounter = 1;
    this.commissionIdCounter = 1;
    this.activityIdCounter = 1;
    
    // Initialize with default roles
    this.initializeRoles();
  }
  
  private initializeRoles() {
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
      profileImageUrl: null
    });
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
}

export const storage = new MemStorage();
