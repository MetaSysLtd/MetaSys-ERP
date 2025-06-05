import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
// Simple session-based auth middleware
const requireAuth = (minLevel: number = 1) => {
  return async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    const role = await storage.getUserRole(user.id);
    if (!role || role.level < minLevel) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    req.user = user;
    req.userRole = role;
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Basic health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;
      
      res.json({ 
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", requireAuth(1), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.json({
      id: req.user.id,
      username: req.user.username,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email
    });
  });

  // User management routes
  app.get("/api/users", requireAuth(3), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin profile management routes
  app.get("/api/admin/users", requireAuth(5), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          const role = await storage.getUserRole(user.id);
          return { ...user, role };
        })
      );
      res.json(usersWithRoles);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", requireAuth(5), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth(5), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      
      // Prevent deleting yourself
      if (userId === req.user?.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      // For now, just mark as inactive instead of deleting
      const updatedUser = await storage.updateUser(userId, { active: false });
      res.json({ message: "User deactivated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}