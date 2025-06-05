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

      // TODO: Add password verification logic here
      // For now, allowing login for demo purposes

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
      const user = await storage.createUser(userData);
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
      const stats = await storage.getDashboardStats(req.user!.orgId!);
      res.json({ status: "success", stats });
    } catch (error) {
      next(error);
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res, next) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id, req.user!.orgId!);
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