import express, { type Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  insertUserSchema, insertRoleSchema, insertLeadSchema, 
  insertLoadSchema, insertInvoiceSchema, insertInvoiceItemSchema,
  insertCommissionSchema, insertActivitySchema, insertDispatchClientSchema,
  insertOrganizationSchema, insertCommissionRuleSchema, insertCommissionMonthlySchema,
  insertTaskSchema, users, roles, dispatch_clients, organizations
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import path from "path";
import * as slackNotifications from "./slack";
import * as notificationService from "./notifications";
import { NotificationPreferences, defaultNotificationPreferences } from "./notifications";
import { WebSocket, WebSocketServer } from "ws";

// Helper function to handle date objects correctly for database insertion
function createDateObject(dateString?: string | null) {
  return dateString ? new Date(dateString) : null;
}
import { organizationMiddleware } from "./middleware/organizationMiddleware";

// Socket.IO instance will be initialized in registerRoutes
let io: SocketIOServer;

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

// Add some seed data for testing
// Helper to safely create a date object
function createDate(dateString?: string | null): Date | null {
  if (!dateString) return null;
  try {
    return new Date(dateString);
  } catch (error) {
    console.error("Invalid date format:", dateString);
    return new Date(); // fallback to current date
  }
}

// Create a date string in ISO format for database compatibility
function createDateString(): string {
  return new Date().toISOString();
}

// Safe date handling - ensures any date value is processed correctly for db compatibility
function safeDate(date: Date | string | null): Date | null {
  if (!date) return null;
  
  // For Drizzle with PostgreSQL, we always want to return a proper Date object
  // This creates a consistent format regardless of storage implementation
  
  // If already a string, parse it to a Date
  if (typeof date === 'string') {
    try {
      return new Date(date);
    } catch (e) {
      console.error('Invalid date string:', date);
      return new Date(); // fallback
    }
  }
  
  // If it's already a Date object, return it as is
  return date;
}

async function addSeedDataIfNeeded() {
  try {
    // Check if we already have some dispatch clients
    const clients = await storage.getDispatchClients();
    if (clients.length === 0) {
      console.log("Adding seed dispatch clients...");
      
      // First, make sure we have some leads
      const leads = await storage.getLeads();
      
      if (leads.length === 0) {
        // Create some test leads first
        const lead1 = await storage.createLead({
          companyName: "FastFreight Carriers",
          contactName: "John Smith",
          email: "john@fastfreight.example",
          phoneNumber: "555-123-4567",
          status: "Active",
          mcNumber: "MC-123456",
          dotNumber: "DOT-7890123",
          assignedTo: 1,
          orgId: 1,
          notes: "Large carrier with national routes",
          equipmentType: "Dry Van",
          factoringStatus: "approved",
          serviceCharges: 5,
          createdBy: 1 // Admin user
        });
        
        const lead2 = await storage.createLead({
          companyName: "Highway Express Logistics",
          contactName: "Maria Rodriguez",
          email: "maria@highway-express.example",
          phoneNumber: "555-987-6543",
          status: "Active",
          mcNumber: "MC-456789",
          dotNumber: "DOT-2345678",
          assignedTo: 1,
          orgId: 1,
          notes: "Mid-sized regional carrier",
          equipmentType: "Reefer",
          factoringStatus: "pending",
          serviceCharges: 6,
          createdBy: 1 // Admin user
        });
        
        const lead3 = await storage.createLead({
          companyName: "Mountain Trucking Co.",
          contactName: "Robert Chen",
          email: "robert@mountain-trucking.example",
          phoneNumber: "555-567-1234",
          status: "Active",
          mcNumber: "MC-789012",
          dotNumber: "DOT-3456789",
          assignedTo: 1,
          orgId: 1,
          notes: "Specialized in refrigerated freight",
          equipmentType: "Reefer",
          factoringStatus: "not_required",
          serviceCharges: 4,
          createdBy: 1 // Admin user
        });
        
        const lead4 = await storage.createLead({
          companyName: "Coastal Shipping LLC",
          contactName: "Sarah Johnson",
          email: "sarah@coastal-shipping.example",
          phoneNumber: "555-222-3333",
          status: "InProgress",
          mcNumber: "MC-345678",
          dotNumber: "DOT-9012345",
          assignedTo: 1,
          orgId: 1,
          notes: "Interested in long-term partnership",
          equipmentType: "Flatbed",
          factoringStatus: "pending",
          serviceCharges: 6,
          createdBy: 1 // Admin user
        });
        
        const lead5 = await storage.createLead({
          companyName: "Midwest Haulers Inc.",
          contactName: "Michael Brown",
          email: "michael@midwest-haulers.example",
          phoneNumber: "555-444-5555",
          status: "FollowUp",
          mcNumber: "MC-567890",
          dotNumber: "DOT-1234567",
          assignedTo: 1,
          orgId: 1,
          notes: "Family-owned business, established 1985",
          equipmentType: "Dry Van",
          factoringStatus: "approved",
          serviceCharges: 5,
          createdBy: 1 // Admin user
        });
        
        // Now create some dispatch clients linked to these leads
        await storage.createDispatchClient({
          leadId: lead1.id,
          status: "active",
          orgId: 1,
          notes: "Premium client, priority dispatch",
          // Don't pass a date object directly; the database handle will convert it properly
          onboardingDate: safeDate(new Date()),
          approvedBy: 1
        });
        
        await storage.createDispatchClient({
          leadId: lead2.id,
          status: "active",
          orgId: 1,
          notes: "Regular client with consistent loads",
          onboardingDate: safeDate(new Date()),
          approvedBy: 1
        });
        
        await storage.createDispatchClient({
          leadId: lead3.id,
          status: "pending_onboard",
          orgId: 1,
          notes: "Waiting for paperwork submission",
          onboardingDate: null,
          approvedBy: null
        });
        
        await storage.createDispatchClient({
          leadId: lead4.id,
          status: "pending_onboard",
          orgId: 1,
          notes: "Needs insurance verification",
          onboardingDate: null,
          approvedBy: null
        });
        
        await storage.createDispatchClient({
          leadId: lead5.id,
          status: "lost",
          orgId: 1,
          notes: "Went with competitor due to pricing",
          onboardingDate: safeDate(new Date()),
          approvedBy: 1
        });
        
        console.log("Seed data added successfully!");
      } else {
        // We have leads but no dispatch clients, create clients for existing leads
        for (const lead of leads.slice(0, 5)) {
          // Determine a status based on lead status
          let status = "pending_onboard";
          if (lead.status === "Active") {
            status = Math.random() > 0.3 ? "active" : "pending_onboard";
          } else if (lead.status === "Lost") {
            status = "lost";
          }
          
          await storage.createDispatchClient({
            leadId: lead.id,
            status,
            orgId: lead.orgId || 1,
            notes: `Client created from lead ${lead.companyName}`,
            onboardingDate: status === "active" ? safeDate(new Date()) : null,
            approvedBy: status === "active" ? 1 : null
          });
        }
        
        console.log("Created dispatch clients from existing leads");
      }
    }
  } catch (error) {
    console.error("Error adding seed data:", error);
  }
}

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
  
  // Apply organization middleware to all API routes
  app.use('/api', organizationMiddleware);
  
  // Add seed data if needed
  await addSeedDataIfNeeded();
  
  // Create HTTP server
  let httpServer = createServer(app);
  
  // Initialize Socket.IO
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  // Set up Socket.IO events
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

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

  // User-Organization management routes
  userRouter.get("/:userId/organizations", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's organizations
      const organizations = await storage.getUserOrganizations(userId);
      res.json(organizations);
    } catch (error) {
      next(error);
    }
  });
  
  userRouter.post("/:userId/organizations", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate organization IDs
      const { organizationIds } = req.body;
      if (!Array.isArray(organizationIds)) {
        return res.status(400).json({ message: "organizationIds must be an array" });
      }
      
      // Verify all organization IDs exist
      for (const orgId of organizationIds) {
        const org = await storage.getOrganization(Number(orgId));
        if (!org) {
          return res.status(404).json({ message: `Organization with ID ${orgId} not found` });
        }
      }
      
      // Set user's organizations
      await storage.setUserOrganizations(userId, organizationIds.map(id => Number(id)));
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'user',
        entityId: userId,
        action: 'updated_organizations',
        details: `Updated organization access for user: ${user.username}`
      });
      
      res.status(200).json({ message: "User organizations updated successfully" });
    } catch (error) {
      next(error);
    }
  });

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
        leads = await storage.getLeadsByStatus('Active');
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
      } else if (req.userRole.department === 'dispatch' && lead.status !== 'Active') {
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
        createdBy: req.user.id,
        orgId: req.orgId // Add organization ID from the request context
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
        
        // Step 7: Activation Workflow - Create dispatch client record when lead status changes to "Active"
        if (req.body.status === 'Active') {
          // Check if this lead already has a dispatch client record
          const existingClient = await storage.getDispatchClientByLeadId(leadId);
          
          if (!existingClient) {
            // Create new dispatch client with status "Pending Onboard"
            const dispatchClient = await storage.createDispatchClient({
              leadId: leadId,
              status: 'pending_onboard',
              orgId: req.user.id, // Typically would be organization ID
              notes: `Auto-created when lead ${lead.companyName} was activated`,
              onboardingDate: null,
              approvedBy: null
            });
            
            // Log activity for dispatch client creation
            await storage.createActivity({
              userId: req.user.id,
              entityType: 'dispatch_client',
              entityId: dispatchClient.id,
              action: 'created',
              details: `Created dispatch client record for lead ${lead.companyName}`
            });
            
            // Send notification to dispatch team
            await notificationService.sendDispatchNotification(
              dispatchClient.id,
              'created',
              {
                userId: req.user.id,
                userName: `${req.user.firstName} ${req.user.lastName}`,
                leadId: leadId,
                companyName: lead.companyName
              }
            );
            
            console.log(`Created dispatch client ${dispatchClient.id} for activated lead ${leadId}`);
          }
        }
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
      
      const loadData = insertLoadSchema.parse({
        ...req.body,
        orgId: req.orgId // Add organization ID from the request context
      });
      
      // Verify lead exists and is active
      const lead = await storage.getLead(loadData.leadId);
      if (!lead) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }
      
      if (lead.status !== 'Active') {
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

  // Dispatch Client routes
  const dispatchClientRouter = express.Router();
  app.use("/api/dispatch/clients", dispatchClientRouter);
  
  dispatchClientRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      let clients = await storage.getDispatchClients();
      
      // Load the associated lead data for each client
      const clientsWithLeads = await Promise.all(
        clients.map(async (client) => {
          const lead = await storage.getLead(client.leadId);
          return {
            ...client,
            lead
          };
        })
      );
      
      res.json(clientsWithLeads);
    } catch (error) {
      next(error);
    }
  });
  
  dispatchClientRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const client = await storage.getDispatchClient(Number(req.params.id));
      
      if (!client) {
        return res.status(404).json({ message: "Dispatch client not found" });
      }
      
      // Get the associated lead
      const lead = await storage.getLead(client.leadId);
      
      // Get loads for this client
      const loads = await storage.getLoadsByLead(client.leadId);
      
      res.json({
        ...client,
        lead,
        loads
      });
    } catch (error) {
      next(error);
    }
  });
  
  dispatchClientRouter.post("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const clientData = insertDispatchClientSchema.parse(req.body);
      
      // Check if lead exists
      const lead = await storage.getLead(clientData.leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if a dispatch client already exists for this lead
      const existingClient = await storage.getDispatchClientByLeadId(clientData.leadId);
      if (existingClient) {
        return res.status(400).json({ message: "A dispatch client already exists for this lead" });
      }
      
      const client = await storage.createDispatchClient(clientData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'dispatch_client',
        entityId: client.id,
        action: 'created',
        details: `Created dispatch client for lead ${lead.companyName}`
      });
      
      // Send notification
      await notificationService.sendDispatchNotification(
        client.id,
        'created',
        {
          userId: req.user.id,
          userName: `${req.user.firstName} ${req.user.lastName}`,
          leadId: clientData.leadId,
          companyName: lead.companyName
        }
      );
      
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });
  
  dispatchClientRouter.patch("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const clientId = Number(req.params.id);
      const client = await storage.getDispatchClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Dispatch client not found" });
      }
      
      // Get the lead for notifications
      const lead = await storage.getLead(client.leadId);
      
      // Check if status is being updated
      const isStatusChange = req.body.status && req.body.status !== client.status;
      
      // Update the client
      const updatedClient = await storage.updateDispatchClient(clientId, req.body);
      
      // Log the appropriate activity
      if (isStatusChange) {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'dispatch_client',
          entityId: clientId,
          action: 'status_changed',
          details: `Changed dispatch client status from ${client.status} to ${req.body.status}`
        });
        
        // Send notification for status change
        await notificationService.sendDispatchNotification(
          clientId,
          'status_changed',
          {
            userId: req.user.id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            leadId: client.leadId,
            companyName: lead.companyName
          }
        );
        
        // If client is being activated from pending, perform additional setup
        if (client.status === 'pending_onboard' && req.body.status === 'active') {
          // Additional setup could go here (e.g., creating default settings)
          console.log(`Activated dispatch client ${clientId} - performing setup`);
        }
      } else {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'dispatch_client',
          entityId: clientId,
          action: 'updated',
          details: `Updated dispatch client information`
        });
        
        // Send notification for general update
        await notificationService.sendDispatchNotification(
          clientId,
          'updated',
          {
            userId: req.user.id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            leadId: client.leadId,
            companyName: lead.companyName
          }
        );
      }
      
      res.json(updatedClient);
    } catch (error) {
      next(error);
    }
  });

  // Invoice routes
  const invoiceRouter = express.Router();
  app.use("/api/invoices", invoiceRouter);

  invoiceRouter.get("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      // Get pagination parameters from query
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = (page - 1) * limit;
      
      // Get all invoices first
      const allInvoices = await storage.getInvoices();
      
      // Enrich invoices with client names for frontend display
      const enrichedInvoices = await Promise.all(
        allInvoices.map(async (invoice) => {
          // Get the lead (client) data for the invoice
          const lead = await storage.getLead(invoice.leadId);
          return {
            ...invoice,
            clientName: lead ? `${lead.companyName}` : `Client ${invoice.leadId}`
          };
        })
      );
      
      // Apply pagination
      const paginatedInvoices = enrichedInvoices.slice(offset, offset + limit);
      
      // Add pagination metadata
      res.json({
        data: paginatedInvoices,
        pagination: {
          total: allInvoices.length,
          page,
          limit,
          pages: Math.ceil(allInvoices.length / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
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
      
      // Get the lead (client) data for the invoice
      const lead = await storage.getLead(invoice.leadId);
      
      res.json({
        ...invoice,
        clientName: lead ? `${lead.companyName}` : `Client ${invoice.leadId}`,
        items
      });
    } catch (error) {
      console.error("Error fetching invoice:", error);
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
  
  // Admin commission routes
  const adminCommissionRouter = express.Router();
  app.use("/api/admin/commissions", adminCommissionRouter);
  
  // Get top commission earners for admin dashboard
  adminCommissionRouter.get("/top-earners", createAuthMiddleware(4), async (req, res, next) => {
    try {
      // Get query parameters
      const type = req.query.type as string || 'all';
      const month = req.query.month as string || new Date().toISOString().slice(0, 7); // Format: YYYY-MM
      const limit = parseInt(req.query.limit as string || '5');
      
      // Get top commission earners
      const commissions = await storage.getTopCommissionEarners({
        orgId: req.user.orgId || 1,
        month,
        limit,
        type: type === 'all' ? undefined : type as 'sales' | 'dispatch'
      });
      
      // Get previous month for comparison
      const [year, monthNum] = month.split('-').map(Number);
      const prevDate = new Date(year, monthNum - 2, 1); // -2 because months are 0-indexed
      const prevMonth = prevDate.toISOString().slice(0, 7);
      
      // Get previous month commissions for comparison
      const prevCommissions = await storage.getTopCommissionEarners({
        orgId: req.user.orgId || 1,
        month: prevMonth,
        limit: 50, // Get more to ensure we can match all current users
        type: type === 'all' ? undefined : type as 'sales' | 'dispatch'
      });
      
      // Add previous month amounts for trending indicators
      const result = commissions.map(comm => {
        const prevComm = prevCommissions.find(pc => pc.userId === comm.userId);
        return {
          ...comm,
          previousAmount: prevComm ? prevComm.amount : undefined
        };
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

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

  // UI Preferences routes
  const uiPreferencesRouter = express.Router();
  app.use("/api/ui-prefs", uiPreferencesRouter);

  // Get user UI preferences
  uiPreferencesRouter.get("/me", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      
      // Get user preferences (will return default if table doesn't exist)
      const prefs = await storage.getUserPreferences(userId);
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching UI preferences:", error);
      // Return default preferences even on error
      if (req.user) {
        res.json({
          id: 0,
          userId: req.user.id,
          sidebarPinned: true,
          sidebarCollapsed: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        next(error);
      }
    }
  });

  // Update UI preferences
  uiPreferencesRouter.patch("/me", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const updates = req.body;
      
      // The updateUserPreferences method now handles everything
      // It will create new preferences if they don't exist or
      // update existing ones if they do exist
      const updatedPrefs = await storage.updateUserPreferences(userId, {
        ...updates
      });

      // Emit socket event for real-time updates
      io.emit("uiPrefsUpdated", updatedPrefs);
      
      res.json(updatedPrefs);
    } catch (error) {
      next(error);
    }
  });
  
  // For backwards compatibility (temporary)
  app.use("/api/ui-preferences", uiPreferencesRouter);

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

  // Admin commission routes handler
  adminCommissionRouter.post("/:type", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const type = req.params.type;
      if (type !== 'sales' && type !== 'dispatch') {
        return res.status(400).json({ message: "Invalid commission rule type" });
      }
      
      // Validate the tiers based on type
      const { tiers } = req.body;
      if (!Array.isArray(tiers) || tiers.length === 0) {
        return res.status(400).json({ message: "Tiers must be a non-empty array" });
      }
      
      // Validate tier structure based on type
      for (const tier of tiers) {
        if (typeof tier.min !== 'number' || typeof tier.max !== 'number') {
          return res.status(400).json({ message: "Each tier must have min and max values" });
        }
        
        if (type === 'sales') {
          if (typeof tier.active !== 'number' || typeof tier.inbound !== 'number') {
            return res.status(400).json({ 
              message: "Sales tiers must have active and inbound values" 
            });
          }
        } else if (type === 'dispatch') {
          if (typeof tier.pct !== 'number') {
            return res.status(400).json({ 
              message: "Dispatch tiers must have a percentage value" 
            });
          }
        }
      }
      
      // Create a new commission rule
      const rule = await storage.createCommissionRule({
        type,
        orgId: req.user?.orgId || 1, // Default to org 1 if not available
        tiers,
        updatedBy: req.user?.id || 0
      });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'commission_rule',
        entityId: rule.id,
        action: 'updated',
        details: `Updated ${type} commission rules`
      });

      // Emit a socket event for real-time updates
      io.emit('commissionRulesUpdated', { type });
      
      res.status(201).json(rule);
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

  // Generate invoices (for weekly or custom date range)
  app.post("/api/invoices/generate", createAuthMiddleware(4), async (req, res, next) => {
    try {
      // Get date range parameter
      const range = req.query.range as string || 'weekly';
      
      // Get all leads
      const leads = await storage.getLeads();
      if (!leads.length) {
        return res.status(400).json({ message: "No leads available to generate invoices for" });
      }
      
      // Get all loads that are completed but not invoiced
      // Filter loads based on date range and status
      const allLoads = await storage.getLoads();
      let loads;
      
      if (range === 'weekly') {
        // Get loads from the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        loads = allLoads.filter(load => 
          load.status === 'delivered' && 
          !load.invoiceId && // Not already invoiced
          new Date(load.deliveryDate) >= weekAgo
        );
      } else if (range === 'custom') {
        // Get all loads that are delivered but not invoiced (regardless of date)
        loads = allLoads.filter(load => 
          load.status === 'delivered' && 
          !load.invoiceId // Not already invoiced
        );
      } else {
        return res.status(400).json({ message: "Invalid range parameter. Use 'weekly' or 'custom'." });
      }
      
      if (!loads.length) {
        return res.status(400).json({ message: "No uninvoiced loads available in the specified range" });
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
        const totalAmount = leadLoads.reduce((total, load) => {
          // Make sure we're calculating the actual total properly
          const loadTotal = load.freightAmount + load.serviceCharge;
          return total + loadTotal;
        }, 0);
        
        // Create the invoice
        const invoice = await storage.createInvoice({
          leadId: parseInt(leadId),
          invoiceNumber,
          totalAmount,
          status: 'draft',
          issuedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdBy: req.user?.id || 1,
          notes: `Automatically generated invoice for ${leadLoads.length} loads.`
        });
        
        // Create invoice items for each load
        for (const load of leadLoads) {
          await storage.createInvoiceItem({
            invoiceId: invoice.id,
            loadId: load.id,
            description: `Load: ${load.origin} to ${load.destination}`,
            amount: load.freightAmount + load.serviceCharge
          });
          
          // Mark the load as invoiced by adding the invoice ID
          await storage.updateLoad(load.id, { status: 'invoiced', invoiceId: invoice.id });
        }
        
        createdInvoices.push(invoice);
      }
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 1,
        entityType: 'invoice',
        entityId: 0, // System-wide activity
        action: range === 'weekly' ? 'generate-weekly' : 'generate-custom',
        details: `Generated ${createdInvoices.length} invoices (${range} range)`
      });
      
      return res.status(200).json({ 
        success: true, 
        message: `Successfully generated ${createdInvoices.length} invoices`,
        count: createdInvoices.length,
        invoices: createdInvoices.map(inv => inv.id)
      });
    } catch (error) {
      console.error("Error generating invoices:", error);
      next(error);
    }
  });
  
  // Legacy route for backward compatibility
  app.post("/api/invoices/generate-weekly", createAuthMiddleware(4), async (req, res, next) => {
    try {
      // This will generate invoices for all active loads that don't have invoices yet
      // In a real implementation, this would query for all completed loads without invoices
      
      // Get all leads
      const leads = await storage.getLeads();
      if (!leads.length) {
        return res.status(400).json({ message: "No leads available to generate invoices for" });
      }
      
      // Get all loads that are completed but not invoiced
      // Filter loads that are "delivered" status and not already invoiced
      const allLoads = await storage.getLoads();
      const loads = allLoads.filter(load => 
        load.status === 'delivered' && 
        !load.invoiceId // We'll use this to determine if it's been invoiced
      );
      
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
        const totalAmount = leadLoads.reduce((total, load) => {
          // Make sure we're calculating the actual total properly
          const loadTotal = load.freightAmount + load.serviceCharge;
          return total + loadTotal;
        }, 0);
        
        // Create the invoice
        const invoice = await storage.createInvoice({
          leadId: parseInt(leadId),
          invoiceNumber,
          totalAmount,
          status: 'draft',
          issuedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdBy: req.user?.id || 1,
          notes: `Automatically generated weekly invoice for ${leadLoads.length} loads.`
        });
        
        // Create invoice items for each load
        for (const load of leadLoads) {
          await storage.createInvoiceItem({
            invoiceId: invoice.id,
            loadId: load.id,
            description: `Load: ${load.origin} to ${load.destination}`,
            amount: load.freightAmount + load.serviceCharge
          });
          
          // Mark the load as invoiced by adding the invoice ID
          await storage.updateLoad(load.id, { status: 'invoiced', invoiceId: invoice.id });
        }
        
        createdInvoices.push(invoice);
      }
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 1,
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
        invoicesPending: 24,
        activeDispatchClients: 28,
        dispatchClientsChange: 8,
        dispatchClientsTrend: 'up'
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
            
            // Get active dispatch clients
            try {
              const activeClients = await storage.getDispatchClientsByStatus('Active');
              if (activeClients) {
                dashboardData.metrics.activeDispatchClients = activeClients.length;
              }
            } catch (error) {
              console.log('Error fetching active dispatch clients:', error);
            }
            
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
  // Organization routes
  const orgRouter = express.Router();
  app.use("/api/organizations", orgRouter);

  orgRouter.get("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      next(error);
    }
  });

  orgRouter.get("/active", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const activeOrgs = await storage.getActiveOrganizations();
      res.json(activeOrgs);
    } catch (error) {
      next(error);
    }
  });

  orgRouter.get("/current", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Return the current organization if it's set in the request
      if (!req.orgId) {
        return res.status(404).json({ message: "No organization selected" });
      }
      
      const organization = await storage.getOrganization(req.orgId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error) {
      next(error);
    }
  });

  orgRouter.get("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const organization = await storage.getOrganization(Number(req.params.id));
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error) {
      next(error);
    }
  });

  orgRouter.post("/", createAuthMiddleware(5), async (req, res, next) => {
    try {
      const orgData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(orgData);
      res.status(201).json(organization);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  orgRouter.put("/:id", createAuthMiddleware(5), async (req, res, next) => {
    try {
      const orgId = Number(req.params.id);
      const organization = await storage.getOrganization(orgId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      const orgData = insertOrganizationSchema.partial().parse(req.body);
      const updatedOrg = await storage.updateOrganization(orgId, orgData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'organization',
        entityId: orgId,
        action: 'updated',
        details: `Updated organization: ${organization.name}`
      });
      
      res.json(updatedOrg);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });
  
  // Delete organization route
  orgRouter.delete("/:id", createAuthMiddleware(5), async (req, res, next) => {
    try {
      const orgId = Number(req.params.id);
      const organization = await storage.getOrganization(orgId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Don't allow deletion of the default organization
      if (organization.code === "DEFAULT") {
        return res.status(403).json({ message: "Cannot delete the default organization" });
      }
      
      // Count users in this organization
      const usersInOrg = await storage.getUsersByOrganization(orgId);
      if (usersInOrg.length > 0) {
        return res.status(400).json({ 
          message: `Cannot delete organization with ${usersInOrg.length} active users. Reassign users first.` 
        });
      }
      
      // Perform the deletion - soft delete by setting active=false
      const updatedOrg = await storage.updateOrganization(orgId, { active: false });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'organization',
        entityId: orgId,
        action: 'deleted',
        details: `Deleted organization: ${organization.name}`
      });
      
      res.json({ message: "Organization deleted successfully", organization: updatedOrg });
    } catch (error) {
      next(error);
    }
  });

  // Get all organizations the user has access to
  authRouter.get("/user-organizations", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const organizations = await storage.getUserOrganizations(req.user.id);
      res.json(organizations);
    } catch (error) {
      next(error);
    }
  });
  
  // Switch organization route (GET version)
  authRouter.get("/switch", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const orgId = req.query.orgId;
      
      if (!orgId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }
      
      const organization = await storage.getOrganization(Number(orgId));
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Check if user has access to this organization
      const userOrgIds = await storage.getUserOrganizationIds(req.user.id);
      if (!userOrgIds.includes(Number(orgId))) {
        return res.status(403).json({ 
          message: "You don't have access to this organization" 
        });
      }
      
      // Store the selected organization ID in the session
      req.session.orgId = organization.id;
      
      // Also update the user's current organization in the database
      await storage.updateUser(req.user.id, {
        orgId: Number(orgId)
      });
      
      res.json({ message: `Switched to ${organization.name}`, organization });
    } catch (error) {
      next(error);
    }
  });

  // Switch organization route
  authRouter.post("/switch-organization", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const { organizationId } = req.body;
      
      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }
      
      const organization = await storage.getOrganization(Number(organizationId));
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Check if user has access to this organization
      const userOrgIds = await storage.getUserOrganizationIds(req.user.id);
      if (!userOrgIds.includes(Number(organizationId))) {
        return res.status(403).json({ 
          message: "You don't have access to this organization" 
        });
      }
      
      // Store the selected organization ID in the session
      req.session.orgId = organization.id;
      
      // Also update the user's current organization in the database
      await storage.updateUser(req.user.id, {
        orgId: Number(organizationId)
      });
      
      res.json({ message: `Switched to ${organization.name}`, organization });
    } catch (error) {
      next(error);
    }
  });

  // Commission Rules routes
  const commissionRuleRouter = express.Router();
  app.use("/api/commission-rules", commissionRuleRouter);

  commissionRuleRouter.get("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const { type, orgId } = req.query;
      let rules = [];

      if (type && orgId) {
        // Get rules by type and organization
        rules = await storage.getCommissionRulesByType(type as string);
        rules = rules.filter(rule => rule.orgId === Number(orgId));
      } else if (type) {
        // Get rules by type only
        rules = await storage.getCommissionRulesByType(type as string);
      } else if (orgId) {
        // Get rules by organization only
        rules = await storage.getCommissionRulesByOrg(Number(orgId));
      } else {
        // Get all rules
        const allRules = [];
        
        // Get sales commission rules
        const salesRules = await storage.getCommissionRulesByType("sales");
        allRules.push(...salesRules);
        
        // Get dispatch commission rules
        const dispatchRules = await storage.getCommissionRulesByType("dispatch");
        allRules.push(...dispatchRules);
        
        rules = allRules;
      }
      
      res.json(rules);
    } catch (error) {
      next(error);
    }
  });

  commissionRuleRouter.get("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const rule = await storage.getCommissionRule(id);
      
      if (!rule) {
        return res.status(404).json({ message: "Commission rule not found" });
      }
      
      res.json(rule);
    } catch (error) {
      next(error);
    }
  });

  commissionRuleRouter.post("/", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const ruleData = insertCommissionRuleSchema.parse(req.body);
      
      // Make sure updatedBy is set to the current user
      const rule = await storage.createCommissionRule({
        ...ruleData,
        updatedBy: req.user?.id || 0
      });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'commission_rule',
        entityId: rule.id,
        action: 'created',
        details: `Created ${rule.type} commission rule`
      });
      
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  commissionRuleRouter.patch("/:id", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const rule = await storage.getCommissionRule(id);
      
      if (!rule) {
        return res.status(404).json({ message: "Commission rule not found" });
      }
      
      // Make sure updatedBy is set to the current user
      const updatedRule = await storage.updateCommissionRule(id, {
        ...req.body,
        updatedBy: req.user?.id || 0
      });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'commission_rule',
        entityId: id,
        action: 'updated',
        details: `Updated ${rule.type} commission rule`
      });
      
      res.json(updatedRule);
    } catch (error) {
      next(error);
    }
  });

  // Monthly Commissions routes
  const commissionMonthlyRouter = express.Router();
  app.use("/api/commissions-monthly", commissionMonthlyRouter);

  commissionMonthlyRouter.get("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const { userId, month, orgId } = req.query;
      let commissions = [];

      if (userId && month) {
        // Get commission by user and month
        const commission = await storage.getCommissionMonthlyByUserAndMonth(
          Number(userId), 
          month as string
        );
        if (commission) {
          commissions = [commission];
        }
      } else if (userId) {
        // Get commissions by user
        commissions = await storage.getCommissionsMonthlyByUser(Number(userId));
      } else if (month) {
        // Get commissions by month
        commissions = await storage.getCommissionsMonthlyByMonth(month as string);
      } else if (orgId) {
        // Get commissions by organization
        commissions = await storage.getCommissionsMonthlyByOrg(Number(orgId));
      } else {
        // Get all commissions (limited by role permissions)
        if (req.userRole?.level >= 4) {
          // Admins and department heads can see all commissions
          const allCommissions = [];
          
          // Get latest month's commissions
          const currentDate = new Date();
          const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
          
          const latestCommissions = await storage.getCommissionsMonthlyByMonth(currentMonth);
          allCommissions.push(...latestCommissions);
          
          commissions = allCommissions;
        } else {
          // Others can only see their own commissions
          commissions = await storage.getCommissionsMonthlyByUser(req.user?.id || 0);
        }
      }
      
      res.json(commissions);
    } catch (error) {
      next(error);
    }
  });

  commissionMonthlyRouter.get("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const commission = await storage.getCommissionMonthly(id);
      
      if (!commission) {
        return res.status(404).json({ message: "Monthly commission not found" });
      }
      
      // Check if user has permission to view this commission
      if (req.userRole?.level < 4 && commission.userId !== req.user?.id) {
        return res.status(403).json({ 
          message: "You don't have permission to view this commission report" 
        });
      }
      
      res.json(commission);
    } catch (error) {
      next(error);
    }
  });
  
  // Get top commission earners for a specific month and organization
  commissionMonthlyRouter.get("/top-earners", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const { month, limit = 5, type, previousMonth } = req.query;
      const orgId = req.user?.orgId || 0;
      
      // Default to current month if not specified
      const targetMonth = month ? String(month) : new Date().toISOString().substring(0, 7);
      
      // Get top earners for current month
      const topEarners = await storage.getTopCommissionEarners({
        orgId,
        month: targetMonth,
        limit: Number(limit),
        type: type as 'sales' | 'dispatch' | undefined
      });
      
      // If we need to include previous month data for comparison
      if (previousMonth === 'true') {
        // Calculate previous month in YYYY-MM format
        const [year, monthNum] = targetMonth.split('-').map(Number);
        const prevMonthDate = new Date(year, monthNum - 2, 1); // Month is 0-indexed
        const prevMonth = prevMonthDate.toISOString().substring(0, 7);
        
        // Get previous month data for the same users
        const userIds = topEarners.map(earner => earner.userId);
        
        // Get all commission records for the previous month
        const prevMonthCommissions = await storage.getCommissionsMonthlyByMonth(prevMonth);
        
        // Filter to only include our top earners from current month and same org
        const filteredPrevMonthCommissions = prevMonthCommissions.filter(
          comm => userIds.includes(comm.userId) && comm.orgId === orgId
        );
        
        // Create a map for quick lookup
        const prevMonthMap = new Map(
          filteredPrevMonthCommissions.map(comm => [comm.userId, comm.totalCommission])
        );
        
        // Add previous amount to each earner
        const earnersWithPrevious = topEarners.map(earner => ({
          ...earner,
          previousAmount: prevMonthMap.get(earner.userId) || 0
        }));
        
        return res.json(earnersWithPrevious);
      }
      
      res.json(topEarners);
    } catch (error) {
      next(error);
    }
  });

  commissionMonthlyRouter.post("/calculate", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const { userId, month } = req.body;
      
      if (!userId || !month) {
        return res.status(400).json({ 
          message: "Both userId and month are required" 
        });
      }
      
      // Get the user
      const user = await storage.getUser(Number(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get the user's role to determine calculation method
      const role = await storage.getRole(user.roleId);
      if (!role) {
        return res.status(404).json({ message: "User role not found" });
      }
      
      let calculatedCommission = null;
      
      // Calculate commission based on department
      if (role.department === 'sales') {
        calculatedCommission = await calculateSalesCommission(userId, month, req.user?.id || 0);
      } else if (role.department === 'dispatch') {
        calculatedCommission = await calculateDispatchCommission(userId, month, req.user?.id || 0);
      } else {
        return res.status(400).json({ 
          message: `Cannot calculate commission for ${role.department} department` 
        });
      }
      
      if (!calculatedCommission) {
        return res.status(404).json({ 
          message: "Could not calculate commission - insufficient data" 
        });
      }
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'commission_monthly',
        entityId: calculatedCommission.id,
        action: 'calculated',
        details: `Calculated ${role.department} commission for ${user.firstName} ${user.lastName} (${month})`
      });
      
      // Emit socket events for real-time updates
      io.emit(`commission_update_${userId}`, {
        type: 'updated',
        data: calculatedCommission
      });
      
      // Emit admin-specific event for dashboard updates
      io.emit('commission_admin_update', {
        type: 'updated',
        department: role.department,
        month,
        orgId: user.orgId
      });
      
      res.json(calculatedCommission);
    } catch (error) {
      next(error);
    }
  });

  commissionMonthlyRouter.post("/calculate-all", createAuthMiddleware(5), async (req, res, next) => {
    try {
      const { month } = req.body;
      
      if (!month) {
        return res.status(400).json({ message: "Month is required (YYYY-MM format)" });
      }
      
      // Get all active users
      const allUsers = await storage.getUsers();
      const activeUsers = allUsers.filter(user => user.active);
      
      const results = [];
      
      // Calculate commissions for all users
      for (const user of activeUsers) {
        // Get the user's role
        const role = await storage.getRole(user.roleId);
        if (!role) continue;
        
        // Only calculate for sales and dispatch roles
        if (role.department !== 'sales' && role.department !== 'dispatch') {
          continue;
        }
        
        let calculatedCommission = null;
        
        // Calculate commission based on department
        if (role.department === 'sales') {
          calculatedCommission = await calculateSalesCommission(user.id, month, req.user?.id || 0);
        } else if (role.department === 'dispatch') {
          calculatedCommission = await calculateDispatchCommission(user.id, month, req.user?.id || 0);
        }
        
        if (calculatedCommission) {
          results.push(calculatedCommission);
        }
      }
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'commission_monthly',
        entityId: 0, // Batch operation
        action: 'calculated_all',
        details: `Calculated all commissions for ${month}`
      });
      
      // Emit socket event for admin dashboard
      io.emit('commission_admin_update', {
        type: 'calculated_all',
        month,
        count: results.length,
        orgId: req.user?.orgId
      });
      
      // Also emit individual events for each affected user
      results.forEach(commission => {
        io.emit(`commission_update_${commission.userId}`, {
          type: 'updated',
          data: commission
        });
      });
      
      res.json({ 
        message: `Calculated commissions for ${results.length} users`,
        commissions: results
      });
    } catch (error) {
      next(error);
    }
  });

  // Helper function to calculate sales commission
  async function calculateSalesCommission(userId: number, month: string, calculatedBy: number): Promise<any> {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) return null;
    
    // Get the commission rule for sales
    const salesRules = await storage.getCommissionRulesByType("sales");
    const orgRules = salesRules.filter(rule => rule.orgId === user.orgId);
    if (orgRules.length === 0) return null;
    
    // Use the latest rule
    const rule = orgRules.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
    
    // Parse the tiers from the rule
    const tiers = rule.tiers as { active: number, pct?: number, fixed?: number }[];
    
    // Count active leads for this user for the specified month
    // This is a simplified version - in a real app, we would filter by created month
    // and status change date to ensure we only count leads activated in the target month
    const userLeads = await storage.getLeadsByAssignee(userId);
    const activeLeads = userLeads.filter(lead => lead.status === 'active');
    const activeLeadCount = activeLeads.length;
    
    // Get existing commission record if any
    let commissionRecord = await storage.getCommissionMonthlyByUserAndMonth(userId, month);
    
    // Calculate the fixed amount and percentage
    let fixedAmount = 0;
    let calculatedPct = 0;
    let appliedTier = null;
    
    // Find the appropriate tier based on active lead count
    for (const tier of tiers) {
      if (activeLeadCount >= tier.active) {
        appliedTier = tier;
        if (tier.fixed !== undefined) {
          fixedAmount = tier.fixed;
        }
        if (tier.pct !== undefined) {
          calculatedPct = tier.pct;
        }
      }
    }
    
    // Calculate total amount (simplified - in a real app we would factor in lead value)
    // Adjust for inbound leads if needed
    const inboundFactor = 0.75; // 25% reduction for inbound leads
    const starterCloserSplit = { starter: 0.4, closer: 0.6 }; // 40% starter, 60% closer
    
    // Dummy values for metrics - in a real app, these would be calculated from actual data
    const inboundLeadCount = Math.floor(activeLeadCount * 0.3); // Assuming 30% are inbound
    const outboundLeadCount = activeLeadCount - inboundLeadCount;
    const teamTargetMet = activeLeadCount >= 10; // Example target
    const teamLeadBonus = teamTargetMet ? activeLeadCount * 1000 : 0; // 1000 PKR per active lead after target
    
    // Calculate adjusted amount based on inbound/outbound mix
    const adjustedFixedAmount = (
      (inboundLeadCount * fixedAmount * inboundFactor) + 
      (outboundLeadCount * fixedAmount)
    ) / activeLeadCount;
    
    // Apply percentage adjustment if applicable
    let finalAmount = adjustedFixedAmount;
    if (calculatedPct !== 0) {
      const percentageAdjustment = (finalAmount * calculatedPct) / 100;
      finalAmount += percentageAdjustment;
    }
    
    // Add team lead bonus if applicable
    if (user.roleId === 2) { // Assuming roleId 2 is for Team Leads
      finalAmount += teamLeadBonus;
    }
    
    // If we have an existing record, update it, otherwise create a new one
    if (commissionRecord) {
      commissionRecord = await storage.updateCommissionMonthly(commissionRecord.id, {
        amount: finalAmount,
        metrics: {
          activeLeads: activeLeadCount,
          inboundLeads: inboundLeadCount,
          outboundLeads: outboundLeadCount,
          teamTargetMet,
          appliedTier: appliedTier ? appliedTier.active : 0,
          fixedAmount,
          adjustedAmount: adjustedFixedAmount,
          teamLeadBonus
        },
        updatedBy: calculatedBy
      });
    } else {
      commissionRecord = await storage.createCommissionMonthly({
        userId,
        orgId: user.orgId || 0,
        month,
        amount: finalAmount,
        baseAmount: fixedAmount,
        bonusAmount: teamLeadBonus,
        percentageAdjustment: calculatedPct,
        type: "sales",
        metrics: {
          activeLeads: activeLeadCount,
          inboundLeads: inboundLeadCount,
          outboundLeads: outboundLeadCount,
          teamTargetMet,
          appliedTier: appliedTier ? appliedTier.active : 0,
          fixedAmount,
          adjustedAmount: adjustedFixedAmount,
          teamLeadBonus
        },
        status: "calculated",
        approvedBy: null,
        approvedAt: null,
        updatedBy: calculatedBy
      });
    }
    
    return commissionRecord;
  }

  // Helper function to calculate dispatch commission
  async function calculateDispatchCommission(userId: number, month: string, calculatedBy: number): Promise<any> {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) return null;
    
    // Get the commission rule for dispatch
    const dispatchRules = await storage.getCommissionRulesByType("dispatch");
    const orgRules = dispatchRules.filter(rule => rule.orgId === user.orgId);
    if (orgRules.length === 0) return null;
    
    // Use the latest rule
    const rule = orgRules.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
    
    // Parse the tiers from the rule
    const tiers = rule.tiers as { min: number, max: number, pct: number }[];
    
    // Get loads managed by this dispatcher for the specified month
    // This is a simplified version - in a real app, we would filter by month
    const userLoads = await storage.getLoadsByAssignee(userId);
    const completedLoads = userLoads.filter(load => load.status === 'completed');
    
    // Calculate total invoice amount from completed loads
    // In a real app, we would sum the actual invoice amounts
    const invoiceTotal = completedLoads.reduce((sum, load) => {
      // Dummy invoice amount - in real app, we'd get from the invoice
      const loadValue = Math.floor(Math.random() * 1000) + 500; // Random value between 500-1500
      return sum + loadValue;
    }, 0);
    
    // Get existing commission record if any
    let commissionRecord = await storage.getCommissionMonthlyByUserAndMonth(userId, month);
    
    // Calculate the percentage based on invoice total
    let calculatedPct = 0;
    let salaryPenalty = 0;
    let appliedTier = null;
    
    // Check for salary penalty if invoice total is below threshold
    if (invoiceTotal < 650) {
      salaryPenalty = -25; // 25% reduction
    }
    
    // Find the appropriate tier based on invoice total
    for (const tier of tiers) {
      if (invoiceTotal >= tier.min && invoiceTotal <= tier.max) {
        appliedTier = tier;
        calculatedPct = tier.pct;
      }
    }
    
    // Calculate additional bonuses
    
    // Own lead bonus (3000 PKR per onboarded lead)
    const ownLeadCount = 2; // Dummy value - in real app, we'd count actual own leads
    const ownLeadBonus = ownLeadCount * 3000;
    
    // New lead bonus (2000 PKR per new lead)
    const newLeadCount = 3; // Dummy value - in real app, we'd count actual new leads
    const newLeadBonus = newLeadCount * 2000;
    
    // First-2-weeks invoice bonus (3%)
    const first2WeeksInvoiceAmount = invoiceTotal * 0.4; // Dummy value - assuming 40% of invoices were in first 2 weeks
    const first2WeeksBonus = first2WeeksInvoiceAmount * 0.03;
    
    // Active trucks bonus (3000 PKR per lead if ≥3 active trucks)
    const activeLeads = 4; // Dummy value - in real app, we'd count actual active leads
    const activeTrucksBonus = activeLeads >= 3 ? activeLeads * 3000 : 0;
    
    // More than 5 active leads in month bonus (5000 PKR)
    const activeLeadsBonus = activeLeads > 5 ? 5000 : 0;
    
    // Calculate base amount from invoice total and percentage
    const baseAmount = (invoiceTotal * calculatedPct) / 100;
    
    // Calculate total bonuses
    const totalBonuses = ownLeadBonus + newLeadBonus + first2WeeksBonus + activeTrucksBonus + activeLeadsBonus;
    
    // Apply salary penalty if applicable
    const penaltyAmount = salaryPenalty !== 0 ? (baseAmount * salaryPenalty) / 100 : 0;
    
    // Calculate final amount
    const finalAmount = baseAmount + totalBonuses + penaltyAmount;
    
    // If we have an existing record, update it, otherwise create a new one
    if (commissionRecord) {
      commissionRecord = await storage.updateCommissionMonthly(commissionRecord.id, {
        amount: finalAmount,
        metrics: {
          invoiceTotal,
          completedLoads: completedLoads.length,
          appliedTier: appliedTier ? `${appliedTier.min}-${appliedTier.max}` : 'None',
          ownLeadCount,
          newLeadCount,
          first2WeeksInvoiceAmount,
          activeLeads,
          baseAmount,
          ownLeadBonus,
          newLeadBonus,
          first2WeeksBonus,
          activeTrucksBonus,
          activeLeadsBonus,
          totalBonuses,
          penaltyAmount
        },
        updatedBy: calculatedBy
      });
    } else {
      commissionRecord = await storage.createCommissionMonthly({
        userId,
        orgId: user.orgId || 0,
        month,
        amount: finalAmount,
        baseAmount,
        bonusAmount: totalBonuses,
        percentageAdjustment: calculatedPct,
        penaltyPct: salaryPenalty,
        type: "dispatch",
        metrics: {
          invoiceTotal,
          completedLoads: completedLoads.length,
          appliedTier: appliedTier ? `${appliedTier.min}-${appliedTier.max}` : 'None',
          ownLeadCount,
          newLeadCount,
          first2WeeksInvoiceAmount,
          activeLeads,
          baseAmount,
          ownLeadBonus,
          newLeadBonus,
          first2WeeksBonus,
          activeTrucksBonus,
          activeLeadsBonus,
          totalBonuses,
          penaltyAmount
        },
        status: "calculated",
        approvedBy: null,
        approvedAt: null,
        updatedBy: calculatedBy
      });
    }
    
    return commissionRecord;
  }

  // Automatically recalculate commissions when a lead status changes to active
  app.patch("/api/leads/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const leadId = Number(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Update lead
      const updatedLead = await storage.updateLead(leadId, req.body);
      
      // Check if status changed to active
      if (req.body.status === 'active' && lead.status !== 'active') {
        // Trigger commission recalculation for the assigned sales rep
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        // Only recalculate if we have an assigned user
        if (lead.assignedTo) {
          await calculateSalesCommission(lead.assignedTo, currentMonth, req.user?.id || 0);
        }
      }
      
      res.json(updatedLead);
    } catch (error) {
      next(error);
    }
  });

  // Automatically recalculate commissions when a load is marked as completed
  app.patch("/api/loads/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const loadId = Number(req.params.id);
      const load = await storage.getLoad(loadId);
      
      if (!load) {
        return res.status(404).json({ message: "Load not found" });
      }
      
      // Update load
      const updatedLoad = await storage.updateLoad(loadId, req.body);
      
      // Check if status changed to completed
      if (req.body.status === 'completed' && load.status !== 'completed') {
        // Trigger commission recalculation for the assigned dispatcher
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        // Only recalculate if we have an assigned user
        if (load.assignedTo) {
          await calculateDispatchCommission(load.assignedTo, currentMonth, req.user?.id || 0);
        }
      }
      
      res.json(updatedLoad);
    } catch (error) {
      next(error);
    }
  });

  // Task Management API Routes
  // Get all tasks with optional filtering
  app.get("/api/tasks", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const options: { status?: string; priority?: string; limit?: number } = {};
      if (status) options.status = status;
      if (priority) options.priority = priority;
      if (limit) options.limit = limit;
      
      const tasks = await storage.getTasks(options);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  // Get a specific task by ID
  app.get("/api/tasks/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  // Get tasks assigned to a specific user
  app.get("/api/tasks/user/:userId", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const tasks = await storage.getTasksByAssignee(userId);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  // Get tasks for a specific entity (lead, load, etc.)
  app.get("/api/tasks/entity/:type/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const entityType = req.params.type;
      const entityId = parseInt(req.params.id);
      const tasks = await storage.getTasksByEntity(entityType, entityId);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  // Create a new task
  app.post("/api/tasks", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Validate request body against schema
      const validatedData = insertTaskSchema.parse(req.body);
      
      // Create task
      const task = await storage.createTask(validatedData);
      
      // Log activity
      if (req.user?.id) {
        await storage.createActivity({
          userId: req.user.id,
          entityType: "task",
          entityId: task.id,
          action: "created",
          details: `Task created: ${task.title}`
        });
      }
      
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  });

  // Update a task
  app.patch("/api/tasks/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Update task
      const updatedTask = await storage.updateTask(taskId, req.body);
      
      // Log activity if status is changing
      if (req.body.status && req.body.status !== task.status && req.user?.id) {
        await storage.createActivity({
          userId: req.user.id,
          entityType: "task",
          entityId: taskId,
          action: "status_changed",
          details: `Task status changed from ${task.status} to ${req.body.status}`
        });
      }
      
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });

  // Time Tracking routes
  // Get current clock status for a user
  app.get("/api/time-tracking/status", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const status = await storage.getCurrentClockStatus(req.user.id);
      res.json({ status });
    } catch (error) {
      next(error);
    }
  });

  // Clock in/out endpoint
  app.post("/api/time-tracking/clock", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const { type } = req.body;
      
      if (!type || !['IN', 'OUT'].includes(type)) {
        return res.status(400).json({ message: "Invalid clock event type. Must be 'IN' or 'OUT'" });
      }
      
      // Get current status to prevent duplicate events
      const currentStatus = await storage.getCurrentClockStatus(req.user.id);
      
      if (currentStatus === type) {
        return res.status(400).json({ 
          message: `You are already clocked ${type === 'IN' ? 'in' : 'out'}` 
        });
      }
      
      // Create clock event
      const clockEvent = await storage.createClockEvent({
        userId: req.user.id,
        type
      });
      
      // Create activity log
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'clock_event',
        entityId: clockEvent.id,
        action: `clock_${type.toLowerCase()}`,
        details: `User clocked ${type.toLowerCase()}`
      });
      
      res.status(201).json({
        message: `Successfully clocked ${type === 'IN' ? 'in' : 'out'}`,
        event: clockEvent
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get clock events for the current user
  app.get("/api/time-tracking/events", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const events = await storage.getClockEventsByUser(req.user.id);
      res.json(events);
    } catch (error) {
      next(error);
    }
  });
  
  // Get clock events for a specific day for the current user
  app.get("/api/time-tracking/events/day", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const dateStr = req.query.date as string;
      let date: Date;
      
      if (dateStr) {
        date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      } else {
        date = new Date(); // Default to today
      }
      
      const events = await storage.getClockEventsByUserAndDay(req.user.id, date);
      res.json(events);
    } catch (error) {
      next(error);
    }
  });
  
  // Admin endpoint to get clock events for any user
  app.get("/api/time-tracking/events/user/:userId", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const events = await storage.getClockEventsByUser(userId);
      res.json(events);
    } catch (error) {
      next(error);
    }
  });

  // Team Management routes
  const teamRouter = express.Router();
  app.use("/api/teams", teamRouter);
  
  // Get all team members by department
  teamRouter.get("/department/:department", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const department = req.params.department;
      
      // Validate department parameter
      if (!['sales', 'dispatch', 'admin', 'finance', 'hr'].includes(department)) {
        return res.status(400).json({ message: "Invalid department. Must be one of: sales, dispatch, admin, finance, hr" });
      }
      
      // Get users by role department
      const users = await storage.getUsersByDepartment(department);
      
      // Enhance with role information and count metrics
      const teamMembers = await Promise.all(users.map(async (user) => {
        const role = await storage.getRole(user.roleId);
        
        // Add department-specific metrics
        let metrics = {};
        if (department === 'sales') {
          const activeLeadCount = await storage.getActiveLeadCountByUser(user.id);
          metrics = { activeLeadCount: activeLeadCount || 0 };
        } else if (department === 'dispatch') {
          const loadCount = await storage.getActiveLoadCountByUser(user.id);
          metrics = { loadCount: loadCount || 0 };
        }
        
        return {
          ...user,
          roleName: role?.name || 'Unknown',
          ...metrics
        };
      }));
      
      res.json(teamMembers);
    } catch (error) {
      next(error);
    }
  });

  // Get all sales team members
  teamRouter.get("/sales", createAuthMiddleware(2), async (req, res, next) => {
    try {
      // Get users with sales roles
      const users = await storage.getUsersByDepartment('sales');
      
      // Enhance with role and lead information
      const teamMembers = await Promise.all(users.map(async (user) => {
        const role = await storage.getRole(user.roleId);
        const activeLeadCount = await storage.getActiveLeadCountByUser(user.id);
        
        return {
          ...user,
          roleName: role?.name || 'Unknown',
          activeLeadCount: activeLeadCount || 0
        };
      }));
      
      res.json(teamMembers);
    } catch (error) {
      next(error);
    }
  });

  // Get performance metrics for sales team members
  teamRouter.get("/sales/performance/:month?", createAuthMiddleware(2), async (req, res, next) => {
    try {
      // Get month parameter or default to current month
      const month = req.params.month || safeDate(new Date())?.substring(0, 7); // Format: YYYY-MM
      
      // Get sales team members
      const salesUsers = await storage.getUsersByDepartment('sales');
      
      // Build performance data for each team member
      const performanceData = await Promise.all(salesUsers.map(async (user) => {
        // Get commission data for the month
        const commission = await storage.getUserCommissionByMonth(user.id, month);
        
        // Get active leads count and closed deals
        const activeLeadsCount = await storage.getActiveLeadCountByUser(user.id);
        const closedDealsCount = await storage.getClosedDealCountByUserForMonth(user.id, month);
        
        return {
          id: user.id, 
          userId: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          activeLeads: activeLeadsCount || 0,
          closedDeals: closedDealsCount || 0,
          invoiceTotal: commission?.invoiceTotal || 0,
          ownLeadBonus: commission?.ownLeadBonus || 0,
          totalCommission: commission?.totalCommission || 0
        };
      }));
      
      res.json(performanceData);
    } catch (error) {
      next(error);
    }
  });

  // Get all dispatch team members
  teamRouter.get("/dispatch", createAuthMiddleware(2), async (req, res, next) => {
    try {
      // Get users with dispatch roles
      const users = await storage.getUsersByDepartment('dispatch');
      
      // Enhance with role and load information
      const teamMembers = await Promise.all(users.map(async (user) => {
        const role = await storage.getRole(user.roleId);
        const loadCount = await storage.getActiveLoadCountByUser(user.id);
        
        return {
          ...user,
          roleName: role?.name || 'Unknown',
          loadCount: loadCount || 0
        };
      }));
      
      res.json(teamMembers);
    } catch (error) {
      next(error);
    }
  });

  // Get performance metrics for dispatch team members
  teamRouter.get("/dispatch/performance/:month?", createAuthMiddleware(2), async (req, res, next) => {
    try {
      // Get month parameter or default to current month
      const month = req.params.month || safeDate(new Date())?.substring(0, 7); // Format: YYYY-MM
      
      // Get dispatch team members
      const dispatchUsers = await storage.getUsersByDepartment('dispatch');
      
      // Build performance data for each team member
      const performanceData = await Promise.all(dispatchUsers.map(async (user) => {
        // Get commission data for the month
        const commission = await storage.getUserCommissionByMonth(user.id, month);
        
        // Get load count and revenue metrics
        const loadCount = await storage.getActiveLoadCountByUser(user.id);
        const grossRevenue = await storage.getGrossRevenueByUserForMonth(user.id, month);
        const directGrossRevenue = await storage.getDirectGrossRevenueByUserForMonth(user.id, month);
        
        return {
          id: user.id, 
          userId: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          loadCount: loadCount || 0,
          grossRevenue: grossRevenue || 0,
          directGrossRevenue: directGrossRevenue || 0,
          bonusAmount: commission?.tierFixed || 0,
          totalCommission: commission?.totalCommission || 0
        };
      }));
      
      res.json(performanceData);
    } catch (error) {
      next(error);
    }
  });

  // Get KPIs for a specific user
  app.get("/api/teams/user/:userId/kpi", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const month = req.query.month as string || createDateString().substring(0, 7); // Format: YYYY-MM
      
      // Find the user to determine their department
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const role = await storage.getRole(user.roleId);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      let kpiData;
      
      // Get department-specific KPIs
      if (role.department === 'sales') {
        const data = await storage.getSalesUserKPIs(userId, month);
        kpiData = {
          department: 'sales',
          metrics: {
            activeLeads: data.activeLeads || 0,
            closedDeals: data.closedDeals || 0,
            invoiceTotal: data.invoiceTotal || 0,
            ownLeadBonus: data.ownLeadBonus || 0,
            totalCommission: data.totalCommission || 0
          }
        };
      } else if (role.department === 'dispatch') {
        const data = await storage.getDispatchUserKPIs(userId, month);
        kpiData = {
          department: 'dispatch',
          metrics: {
            loadCount: data.loadCount || 0,
            grossRevenue: data.grossRevenue || 0,
            directGrossRevenue: data.directGrossRevenue || 0,
            bonusAmount: data.bonusAmount || 0,
            totalCommission: data.totalCommission || 0
          }
        };
      } else {
        kpiData = {
          department: role.department,
          metrics: {
            message: 'No specific KPIs defined for this department'
          }
        };
      }
      
      res.json(kpiData);
    } catch (error) {
      next(error);
    }
  });

  // Use the existing httpServer
  return httpServer;
}
