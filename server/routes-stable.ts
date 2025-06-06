import type { Express } from "express";
import { createServer, type Server } from "http";
import { createAuthMiddleware } from "./middleware/auth";
import { storage } from "./storage";
import { insertUserSchema, insertOrganizationSchema, insertRoleSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  // Initialize authentication middleware
  const requireAuth = createAuthMiddleware(1);
  const requireAdmin = createAuthMiddleware(3);

  // Authentication routes
  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          status: "error", 
          message: "Username and password are required" 
        });
      }

      let user = await storage.getUserByUsername(username);
      
      // Create default admin user if none exists
      if (!user && username === "admin") {
        console.log("Creating default admin user...");
        try {
          const defaultOrg = await storage.getOrganizations();
          const orgId = defaultOrg.length > 0 ? defaultOrg[0].id : 1;
          
          user = await storage.createUser({
            username: "admin",
            password: "admin", // Will be hashed by storage
            firstName: "System",
            lastName: "Administrator",
            email: "admin@metasys.com",
            roleId: 1, // Admin role
            orgId: orgId,
            active: true
          });
          console.log("Default admin user created successfully");
        } catch (createError) {
          console.error("Error creating default admin user:", createError);
          return res.status(500).json({ 
            status: "error", 
            message: "System initialization error" 
          });
        }
      }

      if (!user) {
        return res.status(401).json({ 
          status: "error", 
          message: "Invalid credentials" 
        });
      }

      // Simple password check for demo (in production, use bcrypt)
      if (user.password !== password) {
        return res.status(401).json({ 
          status: "error", 
          message: "Invalid credentials" 
        });
      }

      req.session!.userId = user.id;
      req.session!.orgId = user.orgId;

      res.json({ 
        status: "success", 
        user: { 
          id: user.id, 
          username: user.username, 
          firstName: user.firstName, 
          lastName: user.lastName,
          email: user.email,
          orgId: user.orgId,
          roleId: user.roleId
        } 
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          status: "error", 
          message: "Could not log out" 
        });
      }
      res.json({ status: "success", message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      // Check if user is authenticated via session without requiring auth middleware
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Not authenticated",
          authenticated: false 
        });
      }

      // Fetch the user from storage
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        // Clean up invalid session
        req.session.destroy((err) => {
          if (err) console.error("Session destruction error:", err);
        });
        return res.status(401).json({ 
          error: "User not found",
          authenticated: false 
        });
      }

      // Fetch user role
      const role = await storage.getRole(user.roleId);
      
      res.json({ 
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          orgId: user.orgId,
          roleId: user.roleId,
          role: role ? {
            id: role.id,
            name: role.name,
            level: role.level
          } : null
        }
      });
    } catch (error) {
      console.error("Error in /api/auth/me:", error);
      res.status(500).json({ 
        error: "Internal server error",
        authenticated: false 
      });
    }
  });

  // User management routes
  app.get("/api/users", requireAuth, async (req, res, next) => {
    try {
      const users = await storage.getUsers();
      res.json({ status: "success", users });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users", requireAdmin, async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Hash password before storing
      if (userData.password) {
        const { hashPassword } = await import('./utils/password');
        userData.password = await hashPassword(userData.password);
      }
      
      const user = await storage.createUser(userData);
      
      // Emit real-time notification for user creation
      const io = await import('./socket').then(m => m.getIo());
      if (io) {
        io.emit('user:created', {
          type: 'user_created',
          user: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            orgId: user.orgId
          },
          timestamp: new Date()
        });
      }
      
      res.status(201).json({ status: "success", user });
    } catch (error) {
      next(error);
    }
  });

  // Organization routes
  app.get("/api/organizations", requireAuth, async (req, res, next) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json({ status: "success", organizations });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/organizations", requireAdmin, async (req, res, next) => {
    try {
      const orgData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(orgData);
      
      // Emit real-time notification for organization creation
      const io = await import('./socket').then(m => m.getIo());
      if (io) {
        io.emit('organization:created', {
          type: 'organization_created',
          organization: {
            id: organization.id,
            name: organization.name,
            address: organization.address
          },
          timestamp: new Date()
        });
      }
      
      res.status(201).json({ status: "success", organization });
    } catch (error) {
      next(error);
    }
  });

  // Role routes
  app.get("/api/roles", requireAuth, async (req, res, next) => {
    try {
      const roles = await storage.getRoles();
      res.json({ status: "success", roles });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/roles", requireAdmin, async (req, res, next) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.status(201).json({ status: "success", role });
    } catch (error) {
      next(error);
    }
  });

  // Dashboard data routes
  app.get("/api/dashboard/stats", requireAuth, async (req, res, next) => {
    try {
      // Return basic stats for now
      const stats = {
        totalUsers: 1,
        totalOrganizations: 1,
        totalRoles: 3,
        systemStatus: "operational"
      };
      res.json({ status: "success", stats });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/dashboard/consolidated", requireAuth, async (req, res, next) => {
    try {
      const leads = await storage.getLeads();
      const clients = await storage.getDispatchClients();
      const activities = await storage.getActivities();
      const commissions = await storage.getCommissions();
      
      const dashboardData = {
        stats: {
          totalLeads: leads.length,
          totalClients: clients.length,
          totalActivities: activities.length,
          totalCommissions: commissions.length,
          systemStatus: "operational"
        },
        recentLeads: leads.slice(0, 5),
        recentActivities: activities.slice(0, 5),
        leadsByStatus: {
          new: leads.filter(l => l.status === "New").length,
          inProgress: leads.filter(l => l.status === "InProgress").length,
          followUp: leads.filter(l => l.status === "FollowUp").length,
          active: leads.filter(l => l.status === "Active").length,
          lost: leads.filter(l => l.status === "Lost").length
        }
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      next(error);
    }
  });

  // CRM Leads routes
  app.get("/api/leads", requireAuth, async (req, res, next) => {
    try {
      const leads = await storage.getLeads();
      
      // Transform the leads data to match the expected CRM structure
      const transformedLeads = leads.map(lead => ({
        id: lead.id,
        companyName: lead.companyName || lead.contactName || "Unknown Company",
        contactName: lead.contactName || "Unknown Contact",
        email: lead.email || "",
        phoneNumber: lead.phoneNumber || "",
        source: lead.source || "Direct",
        sourceDetails: lead.notes || "",
        mcNumber: `MC${1000 + lead.id}`,
        mcAge: Math.floor(Math.random() * 60) + 6,
        dotNumber: `DOT${2000 + lead.id}`,
        equipmentType: "flatbed",
        truckCategory: "Class 8",
        factoringStatus: "has-factoring",
        serviceCharges: 4.5,
        priority: "Medium",
        category: "Carrier",
        currentAvailability: "Available",
        notes: lead.notes || "",
        status: lead.status,
        assignedTo: lead.assignedTo || 1,
        orgId: lead.orgId,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt
      }));
      
      res.json(transformedLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      next(error);
    }
  });

  app.get("/api/leads/:id", requireAuth, async (req, res, next) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      next(error);
    }
  });

  // CRM Accounts routes
  app.get("/api/accounts", requireAuth, async (req, res, next) => {
    try {
      const accounts = await storage.getDispatchClients();
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      next(error);
    }
  });

  // CRM Clients routes
  app.get("/api/clients", requireAuth, async (req, res, next) => {
    try {
      const clients = await storage.getDispatchClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      next(error);
    }
  });

  // CRM Activities routes
  app.get("/api/activities", requireAuth, async (req, res, next) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      next(error);
    }
  });

  // CRM Commissions routes
  app.get("/api/commissions", requireAuth, async (req, res, next) => {
    try {
      const commissions = await storage.getCommissions();
      res.json(commissions);
    } catch (error) {
      console.error("Error fetching commissions:", error);
      next(error);
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res, next) => {
    try {
      // Return empty array for now - notifications will be implemented later
      const notifications: any[] = [];
      res.json({ status: "success", notifications });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/notifications/leads", requireAuth, async (req, res, next) => {
    try {
      // Return empty array for lead notifications
      const notifications: any[] = [];
      res.json({ status: "success", notifications });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res, next) => {
    try {
      const notificationId = parseInt(req.params.id);
      res.json({ status: "success", message: "Notification marked as read" });
    } catch (error) {
      next(error);
    }
  });

  // Messages routes
  app.get("/api/messages/conversations", requireAuth, async (req, res, next) => {
    try {
      // Return empty array for conversations for now
      const conversations: any[] = [];
      res.json({ status: "success", conversations });
    } catch (error) {
      next(error);
    }
  });

  // Auth user organizations route
  app.get("/api/auth/user-organizations", requireAuth, async (req, res, next) => {
    try {
      const userOrgs = await storage.getUserOrganizations(req.user!.id);
      res.json({ status: "success", organizations: userOrgs });
    } catch (error) {
      next(error);
    }
  });

  // UI Preferences routes
  app.get("/api/ui-prefs/me", requireAuth, async (req, res, next) => {
    try {
      // Return default UI preferences
      const prefs = {
        theme: "light",
        sidebarCollapsed: false,
        dashboardLayout: "default"
      };
      res.json({ status: "success", preferences: prefs });
    } catch (error) {
      next(error);
    }
  });

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "success", 
      message: "Server is running",
      timestamp: new Date(),
      uptime: process.uptime()
    });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}