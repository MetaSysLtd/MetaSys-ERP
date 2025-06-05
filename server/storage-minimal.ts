import type { 
  User, Role, Organization, Lead, Task, Notification, Message, 
  InsertUser, InsertRole, InsertOrganization, InsertLead, InsertTask, InsertNotification, InsertMessage,
  UiPreferences, InsertUiPreferences
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

export interface IMinimalStorage {
  // Session store
  sessionStore: session.Store;
  
  // Essential user operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Essential role operations
  getRole(id: number): Promise<Role | undefined>;
  
  // Essential organization operations
  getOrganization(id: number): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  
  // Essential UI preferences
  getUiPreferences(userId: number): Promise<UiPreferences | undefined>;
  createUiPreferences(prefs: InsertUiPreferences): Promise<UiPreferences>;
  updateUiPreferences(userId: number, updates: Partial<UiPreferences>): Promise<UiPreferences>;
}

export class MinimalStorage implements IMinimalStorage {
  sessionStore: session.Store;
  
  private users: Map<number, User>;
  private roles: Map<number, Role>;
  private organizations: Map<number, Organization>;
  private uiPreferences: Map<number, UiPreferences>;
  
  private userIdCounter: number;
  private roleIdCounter: number;
  private orgIdCounter: number;
  private uiPrefIdCounter: number;

  constructor() {
    // Initialize in-memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize maps
    this.users = new Map();
    this.roles = new Map();
    this.organizations = new Map();
    this.uiPreferences = new Map();
    
    // Initialize counters
    this.userIdCounter = 1;
    this.roleIdCounter = 1;
    this.orgIdCounter = 1;
    this.uiPrefIdCounter = 1;
    
    // Initialize with essential data
    this.initializeEssentialData();
  }

  private async initializeEssentialData() {
    // Create default organization
    const defaultOrg = await this.createOrganization({
      name: "Default Organization",
      code: "DEFAULT",
      active: true
    });

    // Create essential roles
    const adminRole = {
      id: this.roleIdCounter++,
      name: "System Administrator",
      department: "admin",
      level: 5,
      permissions: ["*"],
      description: "Full system access",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const userRole = {
      id: this.roleIdCounter++,
      name: "User",
      department: "general",
      level: 1,
      permissions: ["read"],
      description: "Basic user access",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.roles.set(adminRole.id, adminRole);
    this.roles.set(userRole.id, userRole);

    // Create default admin user
    const adminUser = await this.createUser({
      username: "admin",
      password: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukBJpFO22", // password: admin
      email: "admin@metasys.com",
      firstName: "System",
      lastName: "Administrator",
      roleId: adminRole.id,
      active: true
    });

    // Create default UI preferences for admin
    await this.createUiPreferences({
      userId: adminUser.id,
      sidebarCollapsed: false,
      sidebarPinned: true,
      theme: "light",
      language: "en"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.userIdCounter++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(user.id, user);
    return user;
  }

  // Role operations
  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }

  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const organization: Organization = {
      id: this.orgIdCounter++,
      ...orgData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.organizations.set(organization.id, organization);
    return organization;
  }

  // UI Preferences operations
  async getUiPreferences(userId: number): Promise<UiPreferences | undefined> {
    for (const prefs of this.uiPreferences.values()) {
      if (prefs.userId === userId) {
        return prefs;
      }
    }
    return undefined;
  }

  async createUiPreferences(prefsData: InsertUiPreferences): Promise<UiPreferences> {
    const prefs: UiPreferences = {
      id: this.uiPrefIdCounter++,
      ...prefsData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.uiPreferences.set(prefs.id, prefs);
    return prefs;
  }

  async updateUiPreferences(userId: number, updates: Partial<UiPreferences>): Promise<UiPreferences> {
    let existingPrefs = await this.getUiPreferences(userId);
    
    if (!existingPrefs) {
      // Create default preferences if none exist
      existingPrefs = await this.createUiPreferences({
        userId,
        sidebarCollapsed: false,
        sidebarPinned: true,
        theme: "light",
        language: "en"
      });
    }
    
    const updatedPrefs: UiPreferences = {
      ...existingPrefs,
      ...updates,
      updatedAt: new Date()
    };
    
    this.uiPreferences.set(updatedPrefs.id, updatedPrefs);
    return updatedPrefs;
  }
}

export const minimalStorage = new MinimalStorage();