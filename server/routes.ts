import express, { type Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  insertUserSchema, insertRoleSchema, insertLeadSchema, 
  insertLoadSchema, insertInvoiceSchema, insertInvoiceItemSchema,
  insertCommissionSchema, insertActivitySchema,
  users, roles
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import path from "path";
import * as slackNotifications from "./slack";
import * as notificationService from "./notifications";
import { NotificationPreferences, defaultNotificationPreferences } from "./notifications";

// Add type extensions for Express
declare global {
  namespace Express {
    interface Request {
      user?: typeof users.$inferSelect;
      userRole?: typeof roles.$inferSelect;
    }
  }
  
  // Extend express-session
  namespace Express {
    interface SessionData {
      userId?: number;
    }
  }
}

const MemoryStore = createMemoryStore(session);

const createAuthMiddleware = (requiredRoleLevel: number = 1) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated via session
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized: Please log in to access this resource" });
    }

    try {
      // Fetch the user from storage
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Unauthorized: User not found" });
      }

      // Fetch the user's role
      const role = await storage.getRole(user.roleId);
      if (!role) {
        return res.status(403).json({ message: "Forbidden: User role not found" });
      }

      // Check if the user's role level is sufficient
      if (role.level < requiredRoleLevel) {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }

      // Add user and role to the request object for use in route handlers
      req.user = user;
      req.userRole = role;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: storage.sessionStore, // Use the storage session store (PostgreSQL)
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "metasys-erp-secret"
    })
  );

  // Setup for handling file uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Authentication routes
  const authRouter = express.Router();
  app.use("/api/auth", authRouter);

  // Login route
  authRouter.post("/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) { // In a real app, use bcrypt to compare passwords
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Store user in session
      req.session.userId = user.id;
      
      const role = await storage.getRole(user.roleId);
      
      // Return user info (except password)
      const { password: _, ...userInfo } = user;
      return res.status(200).json({ 
        user: userInfo,
        role
      });
    } catch (error) {
      next(error);
    }
  });

  // Logout route
  authRouter.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Check current user session
  authRouter.get("/me", async (req, res, next) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ authenticated: false });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ authenticated: false });
      }

      const role = await storage.getRole(user.roleId);
      
      // Return user info (except password)
      const { password: _, ...userInfo } = user;
      return res.status(200).json({ 
        authenticated: true,
        user: userInfo,
        role
      });
    } catch (error) {
      next(error);
    }
  });

  // User routes
  const userRouter = express.Router();
  app.use("/api/users", userRouter);

  userRouter.get("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  });

  userRouter.get("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is trying to access other user's data
      if (req.user.id !== user.id && req.userRole.level < 3) {
        return res.status(403).json({ message: "Forbidden: You can only view your own profile" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  userRouter.post("/", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  userRouter.patch("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow updating own profile unless admin or manager
      if (req.user.id !== userId && req.userRole.level < 3) {
        return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
      }

      // Don't allow role changes unless admin
      if (req.body.roleId && req.userRole.level < 4) {
        return res.status(403).json({ message: "Forbidden: You cannot change user roles" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Role routes
  const roleRouter = express.Router();
  app.use("/api/roles", roleRouter);

  roleRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      next(error);
    }
  });

  roleRouter.post("/", createAuthMiddleware(5), async (req, res, next) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  // Lead routes
  const leadRouter = express.Router();
  app.use("/api/leads", leadRouter);

  leadRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      let leads;
      const { status, assigned } = req.query;
      
      // Determine which leads the user can access based on role
      if (req.userRole.department === 'sales' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1) {
          // Sales Reps can only see their own leads
          leads = await storage.getLeadsByAssignee(req.user.id);
        } else if (req.userRole.level === 2) {
          // Team Leads can see all leads (we would filter by team in a real app)
          leads = await storage.getLeads();
        } else {
          // Managers and above can see all leads
          leads = await storage.getLeads();
        }
      } else {
        // Dispatch can only see active leads
        leads = await storage.getLeadsByStatus('active');
      }
      
      // Filter by status if provided
      if (status && typeof status === 'string') {
        leads = leads.filter(lead => lead.status === status);
      }
      
      // Filter by assigned user if provided
      if (assigned && typeof assigned === 'string') {
        const assignedId = parseInt(assigned, 10);
        if (!isNaN(assignedId)) {
          leads = leads.filter(lead => lead.assignedTo === assignedId);
        }
      }
      
      res.json(leads);
    } catch (error) {
      next(error);
    }
  });

  leadRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const lead = await storage.getLead(Number(req.params.id));
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to view this lead
      if (req.userRole.department === 'sales' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && lead.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only view your own leads" });
        }
      } else if (req.userRole.department === 'dispatch' && lead.status !== 'active') {
        return res.status(403).json({ message: "Forbidden: Dispatch can only view active leads" });
      }
      
      res.json(lead);
    } catch (error) {
      next(error);
    }
  });

  leadRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadData = insertLeadSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      // Validate MC number age if provided
      if (leadData.mcNumber) {
        // In a real app, this would check against a database or API to validate the MC number's age
        // For now, we'll assume all MC numbers are valid
      }
      
      const lead = await storage.createLead(leadData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'lead',
        entityId: lead.id,
        action: 'created',
        details: `Created lead for ${lead.companyName}`
      });
      
      // Send notification through multiple channels
      notificationService.sendLeadNotification(
        lead.id,
        'created',
        true
      ).catch(err => console.error('Error sending lead notification:', err));
      
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  leadRouter.patch("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadId = Number(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to update this lead
      if (req.userRole.department === 'sales' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && lead.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only update your own leads" });
        }
      } else {
        return res.status(403).json({ message: "Forbidden: Only sales department can update leads" });
      }
      
      const updatedLead = await storage.updateLead(leadId, req.body);
      
      // Log the activity
      if (req.body.status && req.body.status !== lead.status) {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'lead',
          entityId: leadId,
          action: 'status_changed',
          details: `Changed lead status from ${lead.status} to ${req.body.status}`
        });
      } else {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'lead',
          entityId: leadId,
          action: 'updated',
          details: `Updated lead information`
        });
      }
      
      res.json(updatedLead);
    } catch (error) {
      next(error);
    }
  });

  // Load routes
  const loadRouter = express.Router();
  app.use("/api/loads", loadRouter);

  loadRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      let loads;
      const { status, assigned, leadId } = req.query;
      
      // Determine which loads the user can access based on role
      if (req.userRole.department === 'dispatch' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1) {
          // Dispatch Reps can only see their own loads
          loads = await storage.getLoadsByAssignee(req.user.id);
        } else {
          // Team Leads and above can see all loads
          loads = await storage.getLoads();
        }
      } else {
        // Sales can see loads but not modify them
        loads = await storage.getLoads();
      }
      
      // Filter by status if provided
      if (status && typeof status === 'string') {
        loads = loads.filter(load => load.status === status);
      }
      
      // Filter by assigned user if provided
      if (assigned && typeof assigned === 'string') {
        const assignedId = parseInt(assigned, 10);
        if (!isNaN(assignedId)) {
          loads = loads.filter(load => load.assignedTo === assignedId);
        }
      }
      
      // Filter by lead ID if provided
      if (leadId && typeof leadId === 'string') {
        const leadIdNum = parseInt(leadId, 10);
        if (!isNaN(leadIdNum)) {
          loads = loads.filter(load => load.leadId === leadIdNum);
        }
      }
      
      res.json(loads);
    } catch (error) {
      next(error);
    }
  });

  loadRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const load = await storage.getLoad(Number(req.params.id));
      
      if (!load) {
        return res.status(404).json({ message: "Load not found" });
      }
      
      // Check if user has permission to view this load
      if (req.userRole.department === 'dispatch' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && load.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only view your own loads" });
        }
      }
      
      res.json(load);
    } catch (error) {
      next(error);
    }
  });

  loadRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Ensure user is in dispatch department or admin
      if (req.userRole.department !== 'dispatch' && req.userRole.department !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Only dispatch department can create loads" });
      }
      
      const loadData = insertLoadSchema.parse(req.body);
      
      // Verify lead exists and is active
      const lead = await storage.getLead(loadData.leadId);
      if (!lead) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }
      
      if (lead.status !== 'active') {
        return res.status(400).json({ message: "Cannot create load for inactive lead" });
      }
      
      const load = await storage.createLoad(loadData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'load',
        entityId: load.id,
        action: 'created',
        details: `Created load from ${load.origin} to ${load.destination}`
      });
      
      // Send notification through multiple channels
      notificationService.sendLoadNotification(
        load.id,
        'created',
        true
      ).catch(err => console.error('Error sending load notification:', err));
      
      res.status(201).json(load);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  loadRouter.patch("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Ensure user is in dispatch department or admin
      if (req.userRole.department !== 'dispatch' && req.userRole.department !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Only dispatch department can update loads" });
      }
      
      const loadId = Number(req.params.id);
      const load = await storage.getLoad(loadId);
      
      if (!load) {
        return res.status(404).json({ message: "Load not found" });
      }
      
      // Check if user has permission to update this load
      if (req.userRole.level === 1 && load.assignedTo !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You can only update your own loads" });
      }
      
      const updatedLoad = await storage.updateLoad(loadId, req.body);
      
      // Log the activity
      if (req.body.status && req.body.status !== load.status) {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'load',
          entityId: loadId,
          action: 'status_changed',
          details: `Changed load status from ${load.status} to ${req.body.status}`
        });
        
        // Send notification through multiple channels for status change
        notificationService.sendLoadNotification(
          load.id,
          'status_changed',
          true
        ).catch(err => console.error('Error sending load status notification:', err));
        
        // If status changed to 'delivered', trigger invoice creation logic
        if (req.body.status === 'delivered') {
          // This would normally be more complex, possibly creating an invoice
          // or adding this load to a pending invoice
        }
      } else {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'load',
          entityId: loadId,
          action: 'updated',
          details: `Updated load information`
        });
      }
      
      res.json(updatedLoad);
    } catch (error) {
      next(error);
    }
  });

  // Invoice routes
  const invoiceRouter = express.Router();
  app.use("/api/invoices", invoiceRouter);

  invoiceRouter.get("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  });

  invoiceRouter.get("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const invoice = await storage.getInvoice(Number(req.params.id));
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get the invoice items
      const items = await storage.getInvoiceItemsByInvoice(invoice.id);
      
      res.json({
        ...invoice,
        items
      });
    } catch (error) {
      next(error);
    }
  });

  invoiceRouter.post("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const invoiceData = insertInvoiceSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      // Verify the lead exists
      const lead = await storage.getLead(invoiceData.leadId);
      if (!lead) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }
      
      const invoice = await storage.createInvoice(invoiceData);
      
      // Create invoice items if provided
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          await storage.createInvoiceItem({
            ...item,
            invoiceId: invoice.id
          });
        }
      }
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'invoice',
        entityId: invoice.id,
        action: 'created',
        details: `Created invoice #${invoice.invoiceNumber} for $${invoice.totalAmount}`
      });
      
      // Get the created invoice items
      const items = await storage.getInvoiceItemsByInvoice(invoice.id);
      
      res.status(201).json({
        ...invoice,
        items
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  invoiceRouter.patch("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const invoiceId = Number(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, req.body);
      
      // Log the activity
      if (req.body.status && req.body.status !== invoice.status) {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'invoice',
          entityId: invoiceId,
          action: 'status_changed',
          details: `Changed invoice status from ${invoice.status} to ${req.body.status}`
        });
        
        // If status changed to 'paid', trigger commission calculation
        if (req.body.status === 'paid') {
          // This would normally trigger commission calculation
          // based on the invoice details
        }
      } else {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'invoice',
          entityId: invoiceId,
          action: 'updated',
          details: `Updated invoice information`
        });
      }
      
      // Get the invoice items
      const items = await storage.getInvoiceItemsByInvoice(invoiceId);
      
      res.json({
        ...updatedInvoice,
        items
      });
    } catch (error) {
      next(error);
    }
  });

  // Commission routes
  const commissionRouter = express.Router();
  app.use("/api/commissions", commissionRouter);

  commissionRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      let commissions;
      
      // If the user is a rep, only show their own commissions
      if (req.userRole.level === 1) {
        commissions = await storage.getCommissionsByUser(req.user.id);
      } else {
        // Managers and above can see all commissions
        commissions = await storage.getCommissions();
      }
      
      res.json(commissions);
    } catch (error) {
      next(error);
    }
  });

  commissionRouter.get("/user/:userId", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      
      // Check if requesting user has permission
      if (req.userRole.level === 1 && req.user.id !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only view your own commissions" });
      }
      
      const commissions = await storage.getCommissionsByUser(userId);
      res.json(commissions);
    } catch (error) {
      next(error);
    }
  });

  commissionRouter.post("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const commissionData = insertCommissionSchema.parse(req.body);
      
      // Verify the user exists
      const user = await storage.getUser(commissionData.userId);
      if (!user) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Verify the invoice exists
      const invoice = await storage.getInvoice(commissionData.invoiceId);
      if (!invoice) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const commission = await storage.createCommission(commissionData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'commission',
        entityId: commission.id,
        action: 'created',
        details: `Created ${commission.commissionType} commission for $${commission.amount}`
      });
      
      res.status(201).json(commission);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  // Activity routes
  const activityRouter = express.Router();
  app.use("/api/activities", activityRouter);
  
  // Notification settings routes
  const notificationSettingsRouter = express.Router();
  app.use("/api/notification-settings", notificationSettingsRouter);
  
  // Store notification settings in memory since we aren't using a DB yet
  const userNotificationSettings = new Map<number, NotificationPreferences>();
  
  // Get user notification settings
  notificationSettingsRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Get user's notification settings or return defaults
      const settings = userNotificationSettings.get(userId) || defaultNotificationPreferences;
      
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });
  
  // Update user notification settings
  notificationSettingsRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const userId = req.user.id;
      const settings = req.body as NotificationPreferences;
      
      // Validate the settings
      if (typeof settings !== 'object') {
        return res.status(400).json({ message: "Invalid notification settings format" });
      }
      
      // Save the settings
      userNotificationSettings.set(userId, settings);
      
      // Log activity
      await storage.createActivity({
        userId,
        entityType: 'user',
        entityId: userId,
        action: 'updated',
        details: 'Updated notification preferences'
      });
      
      res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  });

  activityRouter.get("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  activityRouter.get("/user/:userId", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      
      // Check if requesting user has permission
      if (req.userRole.level === 2 && req.user.id !== userId) {
        // In a real app, we would check if the userId belongs to the same team
        // For simplicity, we'll allow team leads to view any user's activities
      }
      
      const activities = await storage.getActivitiesByUser(userId, limit);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  activityRouter.get("/entity/:type/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const entityType = req.params.type;
      const entityId = Number(req.params.id);
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      
      const activities = await storage.getActivitiesByEntity(entityType, entityId, limit);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  // Dashboard data route
  app.get("/api/dashboard", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const roleLevel = req.userRole.level;
      const department = req.userRole.department;
      
      // Common metrics for all roles
      const dashboardData: any = {
        metrics: {}
      };
      
      if (department === 'sales' || department === 'admin') {
        // Sales department metrics
        const allLeads = await storage.getLeads();
        const qualifiedLeads = allLeads.filter(lead => lead.status === 'qualified');
        const activeClients = allLeads.filter(lead => lead.status === 'active');
        
        dashboardData.metrics.totalLeads = allLeads.length;
        dashboardData.metrics.qualifiedLeads = qualifiedLeads.length;
        dashboardData.metrics.activeClients = activeClients.length;
        
        // Get recent activities
        dashboardData.activities = await storage.getActivities(10);
        
        // Get recent leads (limited by role level)
        if (roleLevel === 1) {
          // Reps only see their own leads
          dashboardData.leads = (await storage.getLeadsByAssignee(req.user.id)).slice(0, 5);
        } else {
          // Team leads and above see all leads
          dashboardData.leads = allLeads.slice(0, 5);
        }
        
        // Get commission data
        if (roleLevel === 1) {
          // Reps only see their own commissions
          dashboardData.commissions = await storage.getCommissionsByUser(req.user.id);
        } else {
          // Team leads and above see summary commission data
          dashboardData.commissions = await storage.getCommissions();
        }
        
        // Calculate monthly commission for the user
        const userCommissions = await storage.getCommissionsByUser(req.user.id);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyCommissions = userCommissions.filter(c => {
          const commDate = new Date(c.calculationDate);
          return commDate.getMonth() === currentMonth && commDate.getFullYear() === currentYear;
        });
        
        dashboardData.metrics.monthlyCommission = monthlyCommissions.reduce((sum, c) => sum + c.amount, 0);
      } else if (department === 'dispatch') {
        // Dispatch department metrics
        const allLoads = await storage.getLoads();
        const inTransitLoads = allLoads.filter(load => load.status === 'in_transit');
        const deliveredLoads = allLoads.filter(load => load.status === 'delivered');
        const invoicedLoads = allLoads.filter(load => load.status === 'invoiced');
        
        dashboardData.metrics.totalLoads = allLoads.length;
        dashboardData.metrics.inTransitLoads = inTransitLoads.length;
        dashboardData.metrics.deliveredLoads = deliveredLoads.length;
        dashboardData.metrics.invoicedLoads = invoicedLoads.length;
        
        // Get recent activities
        dashboardData.activities = await storage.getActivities(10);
        
        // Get recent loads (limited by role level)
        if (roleLevel === 1) {
          // Reps only see their own loads
          dashboardData.loads = (await storage.getLoadsByAssignee(req.user.id)).slice(0, 5);
        } else {
          // Team leads and above see all loads
          dashboardData.loads = allLoads.slice(0, 5);
        }
        
        // Get commission data similar to sales
        if (roleLevel === 1) {
          dashboardData.commissions = await storage.getCommissionsByUser(req.user.id);
        } else {
          dashboardData.commissions = await storage.getCommissions();
        }
        
        // Calculate monthly commission for the user
        const userCommissions = await storage.getCommissionsByUser(req.user.id);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyCommissions = userCommissions.filter(c => {
          const commDate = new Date(c.calculationDate);
          return commDate.getMonth() === currentMonth && commDate.getFullYear() === currentYear;
        });
        
        dashboardData.metrics.monthlyCommission = monthlyCommissions.reduce((sum, c) => sum + c.amount, 0);
      }
      
      res.json(dashboardData);
    } catch (error) {
      next(error);
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
