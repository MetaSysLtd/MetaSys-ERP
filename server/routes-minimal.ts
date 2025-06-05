import type { Express } from "express";
import { createServer, type Server } from "http";
import { minimalStorage } from "./storage-minimal";
import { setupAuth } from "./middleware/auth";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      res.json({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        storage: "minimal" 
      });
    } catch (error) {
      res.status(500).json({ 
        status: "unhealthy", 
        error: "Health check failed" 
      });
    }
  });

  // User preferences endpoint
  app.get("/api/user/preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const prefs = await minimalStorage.getUiPreferences(req.user.id);
      res.json(prefs || {
        sidebarCollapsed: false,
        sidebarPinned: true,
        theme: "light",
        language: "en"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get preferences" });
    }
  });

  app.put("/api/user/preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const updatedPrefs = await minimalStorage.updateUiPreferences(req.user.id, req.body);
      res.json(updatedPrefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // Basic role endpoint
  app.get("/api/roles/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const role = await minimalStorage.getRole(parseInt(req.params.id));
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      res.status(500).json({ error: "Failed to get role" });
    }
  });

  // Basic organization endpoint
  app.get("/api/organizations/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const org = await minimalStorage.getOrganization(parseInt(req.params.id));
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(org);
    } catch (error) {
      res.status(500).json({ error: "Failed to get organization" });
    }
  });

  // Dashboard stats endpoint - return basic stats
  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      res.json({
        totalLeads: 0,
        totalRevenue: 0,
        totalInvoices: 0,
        pendingTasks: 0,
        activeLoads: 0,
        monthlyRevenue: 0,
        conversionRate: 0,
        avgResponseTime: 0
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  // Basic CRM endpoints - connect to storage
  app.get("/api/leads", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const leads = await minimalStorage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/tasks", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.json({ data: [], pagination: { total: 0, page: 1, limit: 10 } });
  });

  app.get("/api/notifications", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.json([]);
  });

  const httpServer = createServer(app);

  return httpServer;
}