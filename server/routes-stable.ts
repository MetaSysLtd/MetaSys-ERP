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
  app.post("/api/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          status: "error", 
          message: "Username and password are required" 
        });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ 
          status: "error", 
          message: "Invalid username or password" 
        });
      }

      // Secure password verification using bcrypt
      const { comparePassword, isPasswordHashed, migratePasswordIfNeeded } = await import('./utils/password');
      
      // Migrate legacy plain text passwords
      if (!isPasswordHashed(user.password)) {
        console.log(`Migrating plain text password for user: ${username}`);
        const hashedPassword = await migratePasswordIfNeeded(user.password);
        await storage.updateUser(user.id, { password: hashedPassword });
        user.password = hashedPassword;
      }
      
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          status: "error", 
          message: "Invalid username or password" 
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

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const role = req.userRole!;
      
      res.json({ 
        status: "success",
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          orgId: user.orgId,
          roleId: user.roleId,
          role: {
            id: role.id,
            name: role.name,
            level: role.level
          }
        }
      });
    } catch (error) {
      console.error("Error in /api/auth/me:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Internal server error" 
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

  // CRM Leads routes
  app.get("/api/leads", requireAuth, async (req, res, next) => {
    try {
      const leads = await storage.getLeads();
      
      // Transform the leads data to match the expected CRM structure
      const transformedLeads = leads.map(lead => ({
        id: lead.id,
        companyName: lead.company || `${lead.firstName} ${lead.lastName}`,
        contactName: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        phoneNumber: lead.phone,
        source: lead.source,
        sourceDetails: lead.notes || "",
        mcNumber: `MC${1000 + lead.id}`,
        mcAge: Math.floor(Math.random() * 60) + 6,
        dotNumber: `DOT${2000 + lead.id}`,
        equipmentType: "flatbed",
        truckCategory: "Class 8",
        factoringStatus: "has-factoring",
        serviceCharges: 4.5,
        priority: lead.priority,
        category: "Carrier",
        currentAvailability: "Available",
        notes: lead.notes,
        status: lead.status,
        assignedTo: lead.assignedUserId,
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

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res, next) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.json({ status: "success", notifications });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res, next) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId, req.user!.id);
      res.json({ status: "success", message: "Notification marked as read" });
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