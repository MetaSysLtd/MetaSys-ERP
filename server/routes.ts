import express, { type Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  insertUserSchema, insertRoleSchema, insertLeadSchema, 
  insertLoadSchema, insertInvoiceSchema, insertInvoiceItemSchema,
  insertCommissionSchema, insertActivitySchema, insertDispatchClientSchema,
  users, roles, dispatch_clients
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
    interface Session {
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
      cookie: { 
        maxAge: 86400000, // 24 hours
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      },
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

  // Admin routes
  app.get("/api/admin", createAuthMiddleware(5), async (req, res, next) => {
    try {
      // Verify user is an admin
      if (req.userRole?.department !== 'admin' || req.userRole?.level < 5) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      // Get system health metrics
      const systemHealth = {
        cpu: Math.floor(Math.random() * 40) + 20, // Random value between 20-60%
        memory: Math.floor(Math.random() * 30) + 30, // Random value between 30-60%
        disk: Math.floor(Math.random() * 30) + 50, // Random value between 50-80%
        network: Math.floor(Math.random() * 40) + 20, // Random value between 20-60%
        uptime: 99.98, // High uptime percentage
      };
      
      // Get security metrics
      const securityMetrics = {
        lastScan: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        vulnerabilities: 0,
        failedLogins: {
          count: 3,
          lastAttempt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        securityEvents: [
          {
            type: 'failed_login',
            user: 'sarah.johnson',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            details: 'Failed login attempt from IP 192.168.1.100'
          },
          {
            type: 'password_change',
            user: 'john.smith',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            details: 'Password changed successfully'
          },
          {
            type: 'security_scan',
            user: 'system',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            details: 'Scheduled security scan completed with 0 vulnerabilities'
          }
        ]
      };
      
      // Get users data
      const users = await storage.getAllUsers();
      
      // Get tasks data - simulated for now
      const tasks = [
        {
          id: 'task-1',
          name: 'Daily Database Backup',
          status: 'completed',
          lastRun: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'task-2',
          name: 'Data Synchronization',
          status: 'running',
          lastRun: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          progress: 78
        },
        {
          id: 'task-3',
          name: 'Weekly Analytics Report',
          status: 'scheduled',
          lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      // Get recent activities
      const activities = await storage.getActivities(10);
      
      res.json({
        systemHealth,
        securityMetrics,
        users: users.map((u: typeof users.$inferSelect) => ({
          id: u.id,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          roleId: u.roleId,
          active: u.active,
          lastActivity: activities.find(a => a.userId === u.id)?.timestamp || null
        })),
        tasks,
        activities
      });
    } catch (error) {
      next(error);
    }
  });

  // Generate weekly invoices
  app.post("/api/invoices/generate-weekly", createAuthMiddleware(4), async (req, res, next) => {
    try {
      // This will generate invoices for all active loads that don't have invoices yet
      // In a real implementation, this would query for all completed loads without invoices
      
      // Get all leads
      const leads = await storage.getAllLeads();
      if (!leads.length) {
        return res.status(400).json({ message: "No leads available to generate invoices for" });
      }
      
      // Get all loads that are completed but not invoiced
      const loads = await storage.getLoadsForInvoicing();
      if (!loads.length) {
        return res.status(400).json({ message: "No uninvoiced loads available" });
      }
      
      // Group loads by client (lead)
      const loadsByLead: Record<number, any[]> = {};
      
      for (const load of loads) {
        if (!loadsByLead[load.leadId]) {
          loadsByLead[load.leadId] = [];
        }
        loadsByLead[load.leadId].push(load);
      }
      
      // Generate an invoice for each lead that has loads
      const createdInvoices = [];
      
      for (const [leadId, leadLoads] of Object.entries(loadsByLead)) {
        if (leadLoads.length === 0) continue;
        
        // Generate invoice number
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000).toString();
        const invoiceNumber = `INV-${year}${month}-${random}`;
        
        // Calculate total amount
        const totalAmount = leadLoads.reduce((total, load) => total + load.totalAmount, 0);
        
        // Create the invoice
        const invoice = await storage.createInvoice({
          leadId: parseInt(leadId),
          invoiceNumber,
          totalAmount,
          status: 'draft',
          issuedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdBy: req.user.id,
          notes: `Automatically generated weekly invoice for ${leadLoads.length} loads.`
        });
        
        // Create invoice items for each load
        for (const load of leadLoads) {
          await storage.createInvoiceItem({
            invoiceId: invoice.id,
            loadId: load.id,
            description: `Load #${load.loadNumber}: ${load.origin} to ${load.destination}`,
            amount: load.totalAmount
          });
          
          // Mark the load as invoiced
          await storage.updateLoad(load.id, { invoiced: true });
        }
        
        createdInvoices.push(invoice);
      }
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'invoice',
        entityId: 0, // System-wide activity
        action: 'generate-weekly',
        details: `Generated ${createdInvoices.length} weekly invoices`
      });
      
      return res.status(200).json({ 
        success: true, 
        message: `Successfully generated ${createdInvoices.length} invoices`,
        count: createdInvoices.length,
        invoices: createdInvoices.map(inv => inv.id)
      });
    } catch (error) {
      console.error("Error generating weekly invoices:", error);
      next(error);
    }
  });

  // Invoice email endpoints
  app.post("/api/invoices/:id/send", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { template = 'standard', message = '' } = req.body;
      
      // Get the invoice
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get the lead (client) information
      const lead = await storage.getLead(invoice.leadId);
      if (!lead) {
        return res.status(404).json({ message: "Client information not found" });
      }
      
      // Get the invoice items
      const items = await storage.getInvoiceItems(invoiceId);
      
      // Get the user who created the invoice
      const creator = await storage.getUser(invoice.createdBy);
      if (!creator) {
        return res.status(404).json({ message: "Invoice creator not found" });
      }
      
      // Get load information for each item
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const load = await storage.getLoad(item.loadId);
        return {
          ...item,
          loadInfo: load ? {
            loadNumber: load.loadNumber,
            origin: load.origin,
            destination: load.destination,
            date: load.date
          } : undefined
        };
      }));
      
      // Import InvoiceTemplateType from invoiceTemplates
      const { sendInvoiceEmailWithTemplate, InvoiceTemplateType } = await import('./invoiceTemplates');
      
      // Prepare email data
      const emailData = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: lead.companyName,
        clientEmail: lead.email,
        clientContactName: lead.contactName,
        totalAmount: invoice.totalAmount,
        issuedDate: invoice.issuedDate,
        dueDate: invoice.dueDate,
        items: enrichedItems,
        notes: invoice.notes,
        createdBy: {
          name: `${creator.firstName} ${creator.lastName}`,
          email: creator.email,
          phone: creator.phoneNumber
        },
        customMessage: message
      };
      
      // Determine template type
      let templateType: any;
      switch (template) {
        case 'friendly':
          templateType = InvoiceTemplateType.FRIENDLY_REMINDER;
          break;
        case 'urgent':
          templateType = InvoiceTemplateType.URGENT_PAYMENT;
          break;
        case 'overdue':
          templateType = InvoiceTemplateType.OVERDUE_NOTICE;
          break;
        case 'standard':
        default:
          templateType = InvoiceTemplateType.STANDARD;
          break;
      }
      
      // Send the email
      const success = await sendInvoiceEmailWithTemplate(
        templateType,
        emailData,
        message
      );
      
      if (success) {
        // If the invoice was in draft status, update it to sent
        if (invoice.status === 'draft') {
          await storage.updateInvoice(invoiceId, {
            status: 'sent'
          });
        }
        
        // Log the activity
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'invoice',
          entityId: invoiceId,
          action: 'sent',
          details: `Invoice ${invoice.invoiceNumber} sent to ${lead.email} using ${template} template`
        });
        
        return res.status(200).json({ 
          success: true, 
          message: "Invoice sent successfully" 
        });
      } else {
        throw new Error("Failed to send invoice email");
      }
    } catch (error) {
      console.error("Error sending invoice:", error);
      next(error);
    }
  });
  
  // Dashboard data route
  app.get("/api/dashboard", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const roleLevel = req.userRole?.level || 5;  // Default to admin level if undefined
      const department = req.userRole?.department || 'admin';  // Default to admin department if undefined
      
      // Common metrics for all roles
      const dashboardData: any = {
        metrics: {},
        activities: [],
        leads: [],
        employees: []
      };
      
      // Add dummy data for visualization
      // KPI Metrics
      dashboardData.metrics = {
        totalLeads: 142,
        qualifiedLeads: 87,
        leadsConverted: 65,
        totalLoads: 118,
        activeLoads: 32,
        completedLoads: 86,
        totalRevenue: 528750,
        totalProfit: 158625,
        profitMargin: 30,
        invoicesPending: 24
      };
      
      // Revenue data
      dashboardData.revenueData = {
        total: 528750,
        byMonth: [
          { month: 'Jan', revenue: 35000, target: 40000 },
          { month: 'Feb', revenue: 42000, target: 42000 },
          { month: 'Mar', revenue: 48500, target: 45000 },
          { month: 'Apr', revenue: 51200, target: 48000 },
          { month: 'May', revenue: 53700, target: 50000 },
          { month: 'Jun', revenue: 58900, target: 52000 },
          { month: 'Jul', revenue: 63400, target: 55000 },
          { month: 'Aug', revenue: 67800, target: 58000 },
          { month: 'Sep', revenue: 72500, target: 60000 },
          { month: 'Oct', revenue: 78250, target: 65000 },
          { month: 'Nov', revenue: 84500, target: 70000 },
          { month: 'Dec', revenue: 91200, target: 75000 }
        ]
      };
      
      // Team metrics
      dashboardData.teamMetrics = {
        performanceData: [
          { name: 'Sarah', calls: 42, conversions: 8 },
          { name: 'John', calls: 38, conversions: 7 },
          { name: 'Alex', calls: 45, conversions: 10 },
          { name: 'Maya', calls: 36, conversions: 9 },
          { name: 'Dave', calls: 40, conversions: 6 }
        ],
        avgCallsPerDay: 40.2,
        callsChangePercentage: 12,
        conversionRate: 18.4,
        conversionChangePercentage: 5.2,
        teamTarget: 45
      };
      
      // Sales performance
      dashboardData.salesPerformance = {
        performanceData: [
          { name: 'Sarah', calls: 42, conversions: 8 },
          { name: 'John', calls: 38, conversions: 7 },
          { name: 'Alex', calls: 45, conversions: 10 },
          { name: 'Maya', calls: 36, conversions: 9 },
          { name: 'Dave', calls: 40, conversions: 6 }
        ],
        avgCallsPerDay: 40.2,
        callsChangePercentage: 12,
        conversionRate: 18.4,
        conversionChangePercentage: 5.2,
        teamTarget: 45
      };
      
      // Dispatch performance
      dashboardData.dispatchPerformance = {
        performanceData: [
          { name: 'Mike', loads: 22, invoices: 18 },
          { name: 'Lisa', loads: 18, invoices: 15 },
          { name: 'Carlos', loads: 25, invoices: 22 },
          { name: 'Priya', loads: 20, invoices: 19 },
          { name: 'Raj', loads: 17, invoices: 14 }
        ],
        avgLoadsPerDay: 20.4,
        loadsChangePercentage: 8.2,
        invoiceRate: 88,
        invoiceChangePercentage: 3.5,
        teamTarget: 22
      };
      
      // Onboarding metrics
      dashboardData.onboardingMetrics = {
        total: 65,
        completed: 42,
        inProgress: 18,
        stalled: 5,
        conversion: 78
      };
      
      // Finance data
      dashboardData.finance = {
        revenue: 528750,
        expenses: {
          salaries: 185000,
          operations: 98500,
          tools: 22750,
          commissions: 63900,
          other: 35600
        },
        profit: 158625,
        cashOnHand: 245000,
        accountsReceivable: 128500,
        accountsPayable: 87200
      };
      
      // Employee data
      dashboardData.employees = {
        total: 28,
        active: 26,
        onLeave: 2,
        byDepartment: [
          { department: 'Sales', count: 10 },
          { department: 'Dispatch', count: 8 },
          { department: 'Finance', count: 4 },
          { department: 'HR', count: 2 },
          { department: 'Admin', count: 4 }
        ],
        attendance: {
          present: 24,
          absent: 2,
          late: 2
        },
        newHires: 3,
        topPerformers: [
          { name: 'Alex Johnson', department: 'Sales', achievement: '125% of target' },
          { name: 'Carlos Rodriguez', department: 'Dispatch', achievement: '98% load efficiency' },
          { name: 'Priya Sharma', department: 'Finance', achievement: 'Cost optimization lead' }
        ]
      };
      
      // Activity feed
      dashboardData.activities = [
        { type: 'lead_created', user: 'Sarah Kim', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), details: 'New lead from ABC Logistics' },
        { type: 'load_completed', user: 'Carlos Rodriguez', timestamp: new Date(Date.now() - 55 * 60000).toISOString(), details: 'Load #L-2458 delivered successfully' },
        { type: 'invoice_paid', user: 'System', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), details: 'Invoice #INV-8751 marked as paid' },
        { type: 'lead_qualified', user: 'John Smith', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), details: 'Lead #L-1022 moved to qualified' },
        { type: 'new_user', user: 'Admin', timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), details: 'Added Rachel Green to Dispatch team' },
        { type: 'commission_paid', user: 'Finance', timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), details: 'Commissions processed for March' },
        { type: 'load_assigned', user: 'Mike Willis', timestamp: new Date(Date.now() - 25 * 3600000).toISOString(), details: 'Load #L-2457 assigned to carrier FAST-XL' },
        { type: 'lead_updated', user: 'Maya Johnson', timestamp: new Date(Date.now() - 26 * 3600000).toISOString(), details: 'Updated contact info for Acme Shipping' },
        { type: 'invoice_created', user: 'Lisa Chen', timestamp: new Date(Date.now() - 28 * 3600000).toISOString(), details: 'Created invoice #INV-8752 for $8,750' },
        { type: 'system_update', user: 'System', timestamp: new Date(Date.now() - 48 * 3600000).toISOString(), details: 'System maintenance completed' }
      ];
      
      // Recent leads
      dashboardData.leads = [
        { id: 'L-1025', company: 'Globex Shipping', contact: 'Mark Rogers', status: 'new', value: 15000, assignee: 'Sarah Kim', lastActivity: 'Initial contact made', lastUpdated: new Date(Date.now() - 35 * 60000).toISOString() },
        { id: 'L-1024', company: 'Oceanic Freight', contact: 'Jessica Wong', status: 'qualified', value: 22500, assignee: 'John Smith', lastActivity: 'Needs analysis completed', lastUpdated: new Date(Date.now() - 3 * 3600000).toISOString() },
        { id: 'L-1023', company: 'Continental Logistics', contact: 'Robert Chen', status: 'nurturing', value: 18000, assignee: 'Alex Johnson', lastActivity: 'Follow-up call scheduled', lastUpdated: new Date(Date.now() - 24 * 3600000).toISOString() },
        { id: 'L-1022', company: 'Alliance Transport', contact: 'Maria Garcia', status: 'qualified', value: 31000, assignee: 'Maya Johnson', lastActivity: 'Proposal sent', lastUpdated: new Date(Date.now() - 26 * 3600000).toISOString() },
        { id: 'L-1021', company: 'Pacific Carriers', contact: 'David Kim', status: 'won', value: 27500, assignee: 'Dave Wilson', lastActivity: 'Contract signed', lastUpdated: new Date(Date.now() - 48 * 3600000).toISOString() }
      ];
      
      // Commission data
      dashboardData.commissions = {
        total: 63900,
        byTeam: [
          { team: 'Sales', amount: 42600 },
          { team: 'Dispatch', amount: 21300 }
        ],
        topEarners: [
          { name: 'Alex Johnson', amount: 8750 },
          { name: 'Sarah Kim', amount: 7200 },
          { name: 'Carlos Rodriguez', amount: 6850 },
          { name: 'John Smith', amount: 5900 },
          { name: 'Maya Johnson', amount: 5400 }
        ],
        byMonth: [
          { month: 'Jan', amount: 3200 },
          { month: 'Feb', amount: 3800 },
          { month: 'Mar', amount: 4500 },
          { month: 'Apr', amount: 5100 },
          { month: 'May', amount: 5800 },
          { month: 'Jun', amount: 6300 },
          { month: 'Jul', amount: 6900 },
          { month: 'Aug', amount: 7100 },
          { month: 'Sep', amount: 7400 },
          { month: 'Oct', amount: 7800 },
          { month: 'Nov', amount: 8200 },
          { month: 'Dec', amount: 8800 }
        ]
      };
      
      // Try to get real data from database if available
      try {
        // Real database metrics based on role
        if (department === 'sales' || department === 'admin') {
          // Get leads data if available
          const allLeads = await storage.getLeads();
          if (allLeads && allLeads.length > 0) {
            const qualifiedLeads = allLeads.filter(lead => lead.status === 'qualified');
            const activeClients = allLeads.filter(lead => lead.status === 'active');
            
            // Update metrics with real data
            dashboardData.metrics.realLeadsCount = allLeads.length;
            dashboardData.metrics.realQualifiedLeads = qualifiedLeads.length;
            dashboardData.metrics.realActiveClients = activeClients.length;
            
            // Get user-specific leads if needed
            if (roleLevel === 1 && req.user) {
              const userLeads = await storage.getLeadsByAssignee(req.user.id);
              if (userLeads && userLeads.length > 0) {
                dashboardData.userLeads = userLeads.slice(0, 5);
              }
            }
          }
        } else if (department === 'dispatch') {
          // Get loads data if available
          const allLoads = await storage.getLoads();
          if (allLoads && allLoads.length > 0) {
            const inTransitLoads = allLoads.filter(load => load.status === 'in_transit');
            const deliveredLoads = allLoads.filter(load => load.status === 'delivered');
            
            // Update metrics with real data
            dashboardData.metrics.realLoadsCount = allLoads.length;
            dashboardData.metrics.realInTransitLoads = inTransitLoads.length;
            dashboardData.metrics.realDeliveredLoads = deliveredLoads.length;
            
            // Get user-specific loads if needed
            if (roleLevel === 1 && req.user) {
              const userLoads = await storage.getLoadsByAssignee(req.user.id);
              if (userLoads && userLoads.length > 0) {
                dashboardData.userLoads = userLoads.slice(0, 5);
              }
            }
          }
        }
        
        // Get activities for all roles
        const activities = await storage.getActivities(10);
        if (activities && activities.length > 0) {
          dashboardData.realActivities = activities;
        }
      } catch (error) {
        console.log('Error fetching real data, using dummy data:', error);
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
