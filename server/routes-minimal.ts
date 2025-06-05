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

export async function registerRoutes(router: any): Promise<void> {
  // Basic health check
  router.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Authentication routes
  router.post("/auth/login", async (req, res) => {
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

  router.post("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  router.get("/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ 
        status: "error", 
        message: "Unauthorized: Please log in to access this resource",
        authenticated: false 
      });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ 
        status: "error", 
        message: "User not found",
        authenticated: false 
      });
    }
    
    res.json({
      status: "success",
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  });

  router.get("/auth/user-organizations", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ organizations: [] });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.orgId) {
      return res.json({ organizations: [] });
    }
    
    const org = await storage.getOrganization(user.orgId);
    res.json({ 
      organizations: org ? [{ 
        id: org.id, 
        name: org.name,
        current: true 
      }] : [] 
    });
  });

  router.get("/organization/current", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.orgId) {
      return res.status(404).json({ message: "No organization found" });
    }
    
    const org = await storage.getOrganization(user.orgId);
    res.json(org || { message: "Organization not found" });
  });

  router.get("/organizations/current", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.orgId) {
      return res.status(404).json({ message: "No organization found" });
    }
    
    const org = await storage.getOrganization(user.orgId);
    res.json(org || { message: "Organization not found" });
  });

  router.get("/user", requireAuth(1), async (req, res) => {
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
  router.get("/users", requireAuth(3), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin profile management routes
  router.get("/admin/users", requireAuth(5), async (req, res) => {
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

  router.patch("/admin/users/:id", requireAuth(5), async (req, res) => {
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

  router.delete("/admin/users/:id", requireAuth(5), async (req, res) => {
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
}