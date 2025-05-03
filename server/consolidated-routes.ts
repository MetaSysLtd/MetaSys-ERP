import express, { type Request, Response, NextFunction, Router } from "express";
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
  insertTaskSchema, insertDashboardWidgetSchema, users, roles, dispatch_clients, 
  organizations, dashboardWidgets
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from './db';
import * as slackNotifications from "./slack";
import * as notificationService from "./notifications";
import * as leaderboardService from "./leaderboard";
import { NotificationPreferences, defaultNotificationPreferences } from "./notifications";
// Removed WebSocket import as we're using Socket.IO exclusively
import errorLoggingRoutes from "./routes/error-logging";
import statusRoutes from "./routes/status";
import { registerModuleRoutes } from "./routes/index";
import { organizationMiddleware } from "./middleware/organizationMiddleware";
import { 
  leadRealTimeMiddleware, 
  loadRealTimeMiddleware, 
  invoiceRealTimeMiddleware,
  userRealTimeMiddleware,
  taskRealTimeMiddleware,
  reportRealTimeMiddleware,
  notificationRealTimeMiddleware
} from "./utils/real-time-handler";

// Helper function to handle date objects correctly for database insertion
function createDateObject(dateString?: string | null) {
  return dateString ? new Date(dateString) : null;
}

// Auth middleware function with enhanced guard clauses
const createAuthMiddleware = (requiredRoleLevel: number = 1) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated via session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        error: "Unauthorized: Please log in to access this resource",
        missing: ["session"] 
      });
    }

    try {
      // Fetch the user from storage
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ 
          error: "Unauthorized: User not found", 
          missing: ["user"] 
        });
      }

      // Check if user has necessary properties
      if (!user.orgId) {
        // Attempt to assign to default organization
        try {
          const orgs = await storage.getOrganizations();
          if (orgs && orgs.length > 0) {
            await storage.updateUser(user.id, { orgId: orgs[0].id });
            user.orgId = orgs[0].id;
            console.log(`Assigned user ${user.id} to default organization ${orgs[0].id}`);
          } else {
            return res.status(400).json({ 
              error: "Invalid user structure. Missing orgId and no default organization available.", 
              missing: ["orgId"] 
            });
          }
        } catch (orgError) {
          console.error("Error assigning default organization:", orgError);
          return res.status(400).json({ 
            error: "Failed to assign default organization", 
            missing: ["orgId"] 
          });
        }
      }

      // Fetch the user's role
      const role = await storage.getRole(user.roleId);
      if (!role) {
        // Try to assign default role
        try {
          const defaultRole = await storage.getDefaultRole();
          if (defaultRole) {
            await storage.updateUser(user.id, { roleId: defaultRole.id });
            user.roleId = defaultRole.id;
            console.log(`Assigned user ${user.id} to default role ${defaultRole.id}`);
            
            // Now fetch the role again
            const updatedRole = await storage.getRole(defaultRole.id);
            if (updatedRole) {
              req.user = user;
              req.userRole = updatedRole;
              
              // Check if the role level is sufficient after fixing
              if (updatedRole.level < requiredRoleLevel) {
                return res.status(403).json({ 
                  error: "Forbidden: Insufficient permissions", 
                  missing: ["permissions"],
                  details: `Required level: ${requiredRoleLevel}, Current level: ${updatedRole.level}`
                });
              }
              
              next();
              return;
            }
          }
        } catch (roleError) {
          console.error("Error assigning default role:", roleError);
        }
        
        return res.status(403).json({ 
          error: "User is not assigned to any role. Contact Admin.", 
          missing: ["role", "permissions"] 
        });
      }

      // Check if the user's role level is sufficient
      if (role.level < requiredRoleLevel) {
        return res.status(403).json({ 
          error: "Forbidden: Insufficient permissions", 
          missing: ["permissions"],
          details: `Required level: ${requiredRoleLevel}, Current level: ${role.level}`
        });
      }

      // Add user and role to the request object for use in route handlers
      req.user = user;
      req.userRole = role;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      next(error);
    }
  };
};

let io: SocketIOServer;

async function calculateSalesCommission(userId: number, month: string, calculatedBy: number): Promise<any> {
  // Implementation details removed for brevity
  return { userId, month, deals: [], total: 0, stats: {} };
}

async function calculateDispatchCommission(userId: number, month: string, calculatedBy: number): Promise<any> {
  // Implementation details removed for brevity
  return { userId, month, deals: [], total: 0, stats: {} };
}

// Register all API routes
// Time Tracking Types
interface ClockEvent {
  id: number;
  userId: number;
  type: "IN" | "OUT";
  timestamp: string;
  createdAt: string;
}

interface ClockStatus {
  status: "IN" | "OUT";
  lastEvent?: ClockEvent;
}

// In-memory storage for time tracking events (will be moved to database later)
let clockEvents: ClockEvent[] = [
  {
    id: 1,
    userId: 1,
    type: "IN",
    timestamp: new Date(new Date().setHours(9, 0, 0)).toISOString(),
    createdAt: new Date(new Date().setHours(9, 0, 0)).toISOString()
  },
  {
    id: 2,
    userId: 1,
    type: "OUT",
    timestamp: new Date(new Date().setHours(12, 0, 0)).toISOString(),
    createdAt: new Date(new Date().setHours(12, 0, 0)).toISOString()
  },
  {
    id: 3,
    userId: 1,
    type: "IN",
    timestamp: new Date(new Date().setHours(13, 0, 0)).toISOString(),
    createdAt: new Date(new Date().setHours(13, 0, 0)).toISOString()
  },
  {
    id: 4,
    userId: 1,
    type: "OUT",
    timestamp: new Date(new Date().setHours(17, 0, 0)).toISOString(),
    createdAt: new Date(new Date().setHours(17, 0, 0)).toISOString()
  }
];

// Helper functions for time tracking
function getUserClockEvents(userId: number): ClockEvent[] {
  return clockEvents.filter(event => event.userId === userId);
}

function getUserClockStatus(userId: number): ClockStatus {
  const userEvents = getUserClockEvents(userId);
  
  if (userEvents.length === 0) {
    return { status: "OUT" };
  }
  
  // Sort events by timestamp (newest first)
  const sortedEvents = [...userEvents].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  return {
    status: sortedEvents[0].type,
    lastEvent: sortedEvents[0]
  };
}

export async function registerRoutes(apiRouter: Router, httpServer: Server): Promise<Server> {
  // Apply organization middleware to all API routes
  apiRouter.use('/', organizationMiddleware);
  
  // Register error logging routes
  apiRouter.use('/', errorLoggingRoutes);
  
  // Register status routes
  apiRouter.use('/status', statusRoutes);
  
  // Time Tracking Module Router
  const timeTrackingRouter = express.Router();
  apiRouter.use('/time-tracking', timeTrackingRouter);
  
  // Get current clock status
  timeTrackingRouter.get("/status", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const status = getUserClockStatus(req.user.id);
      res.json(status);
    } catch (error) {
      next(error);
    }
  });

  // Get all clock events for a user
  timeTrackingRouter.get("/events", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const events = getUserClockEvents(req.user.id);
      res.json(events);
    } catch (error) {
      next(error);
    }
  });

  // Get today's clock events for a user
  timeTrackingRouter.get("/events/day", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const events = getUserClockEvents(req.user.id).filter(event => {
        const eventDate = new Date(event.timestamp);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
      });

      res.json(events);
    } catch (error) {
      next(error);
    }
  });

  // Clock in/out
  timeTrackingRouter.post("/clock", createAuthMiddleware(1), express.json(), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { type } = req.body;
      if (type !== "IN" && type !== "OUT") {
        return res.status(400).json({ error: "Invalid clock type. Must be 'IN' or 'OUT'" });
      }

      // Check if the current status matches the requested action
      const currentStatus = getUserClockStatus(req.user.id);
      if (currentStatus.status === type) {
        return res.status(400).json({ 
          error: `Already clocked ${type === 'IN' ? 'in' : 'out'}`,
          message: `You are already clocked ${type === 'IN' ? 'in' : 'out'}`
        });
      }

      // Create a new clock event
      const newEvent: ClockEvent = {
        id: clockEvents.length + 1,
        userId: req.user.id,
        type,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Add to the events array
      clockEvents.push(newEvent);

      res.status(201).json({
        message: `Successfully clocked ${type === 'IN' ? 'in' : 'out'}`,
        event: newEvent
      });
    } catch (error) {
      next(error);
    }
  });

  // HR Module Router
  const hrRouter = express.Router();
  apiRouter.use('/hr', hrRouter);

  // Get team members (all users with their roles)
  hrRouter.get("/team", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Return all users with their roles
      const users = await storage.getUsers();
      const teamMembers = await Promise.all(users.map(async (user) => {
        try {
          const role = await storage.getRole(user.roleId);
          const { password, ...safeUser } = user;
          return { ...safeUser, role };
        } catch (error) {
          const { password, ...safeUser } = user;
          return { ...safeUser, role: null };
        }
      }));
      
      res.json(teamMembers);
    } catch (error) {
      next(error);
    }
  });

  // Get job postings
  hrRouter.get("/jobs", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Mock job postings data
      res.json([
        {
          id: 1,
          title: "Senior Dispatcher",
          department: "Operations",
          location: "Chicago, IL",
          type: "Full-time",
          postedDate: "2025-04-15",
          status: "Active",
          applicants: 12
        },
        {
          id: 2,
          title: "Sales Representative",
          department: "Sales",
          location: "Remote",
          type: "Full-time",
          postedDate: "2025-04-20",
          status: "Active",
          applicants: 8
        },
        {
          id: 3,
          title: "Administrative Assistant",
          department: "Admin",
          location: "Chicago, IL",
          type: "Part-time",
          postedDate: "2025-04-25",
          status: "Active",
          applicants: 15
        }
      ]);
    } catch (error) {
      next(error);
    }
  });

  // Get employee records (minimal version for now)
  hrRouter.get("/employees", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const users = await storage.getUsers();
      const employees = users.map(user => {
        const { password, ...safeUser } = user;
        return {
          ...safeUser,
          department: user.roleId === 2 ? "Sales" : user.roleId === 3 ? "Dispatch" : "Administration",
          startDate: "2025-01-01", // Placeholder
          status: "Active"
        };
      });
      
      res.json(employees);
    } catch (error) {
      next(error);
    }
  });

  // Finance Module Router
  const financeRouter = express.Router();
  apiRouter.use('/finance', financeRouter);

  // Get financial summary
  financeRouter.get("/summary", createAuthMiddleware(1), async (req, res, next) => {
    try {
      res.json({
        revenue: {
          monthly: 246500,
          ytd: 980000,
          previousMonth: 227600
        },
        expenses: {
          monthly: 184720,
          ytd: 760500,
          previousMonth: 192600
        },
        cashFlow: {
          monthly: 61780,
          ytd: 219500,
          previousMonth: 35000
        },
        invoices: {
          pending: 87320,
          count: 12
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Get expenses
  financeRouter.get("/expenses", createAuthMiddleware(1), async (req, res, next) => {
    try {
      res.json([
        {
          id: 1,
          category: "Payroll",
          amount: 120000,
          date: "2025-05-01",
          description: "Monthly payroll"
        },
        {
          id: 2,
          category: "Rent",
          amount: 15000,
          date: "2025-05-01",
          description: "Office rent"
        },
        {
          id: 3,
          category: "Software",
          amount: 4500,
          date: "2025-05-03",
          description: "SaaS subscriptions"
        },
        {
          id: 4,
          category: "Utilities",
          amount: 2800,
          date: "2025-05-05",
          description: "Electricity and internet"
        },
        {
          id: 5,
          category: "Insurance",
          amount: 8600,
          date: "2025-05-10",
          description: "Business insurance"
        }
      ]);
    } catch (error) {
      next(error);
    }
  });

  // Get profit and loss report
  financeRouter.get("/profit-loss", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const year = req.query.year || new Date().getFullYear();
      const month = req.query.month || new Date().getMonth() + 1;
      
      res.json({
        period: `${year}-${month.toString().padStart(2, '0')}`,
        revenue: {
          total: 246500,
          breakdown: {
            "Freight Services": 198000,
            "Consulting": 32500,
            "Brokerage Fees": 16000
          }
        },
        expenses: {
          total: 184720,
          breakdown: {
            "Payroll": 120000,
            "Rent": 15000,
            "Software": 4500,
            "Utilities": 2800,
            "Insurance": 8600,
            "Marketing": 7820,
            "Maintenance": 5200,
            "Travel": 12300,
            "Miscellaneous": 8500
          }
        },
        netProfit: 61780,
        profitMargin: 25.06
      });
    } catch (error) {
      next(error);
    }
  });

  // Marketing Module Router
  const marketingRouter = express.Router();
  apiRouter.use('/marketing', marketingRouter);

  // Get marketing campaigns
  marketingRouter.get("/campaigns", createAuthMiddleware(1), async (req, res, next) => {
    try {
      res.json([
        {
          id: 1,
          name: "Q2 Email Series",
          type: "Email",
          status: "Active",
          startDate: "2025-04-01",
          endDate: "2025-06-30",
          leads: 45,
          conversionRate: 8.3
        },
        {
          id: 2,
          name: "Social Media Promotion",
          type: "Social",
          status: "Active",
          startDate: "2025-04-15",
          endDate: "2025-05-15",
          leads: 32,
          conversionRate: 6.2
        },
        {
          id: 3,
          name: "Industry Conference",
          type: "Event",
          status: "Active",
          startDate: "2025-05-10",
          endDate: "2025-05-12",
          leads: 28,
          conversionRate: 12.5
        },
        {
          id: 4,
          name: "Website Redesign",
          type: "Website",
          status: "Draft",
          startDate: null,
          endDate: null,
          leads: 0,
          conversionRate: 0
        }
      ]);
    } catch (error) {
      next(error);
    }
  });

  // Client Portal Router
  const portalRouter = express.Router();
  apiRouter.use('/client-portal', portalRouter);

  portalRouter.get("/clients", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Mock data for clients
      res.json([
        {
          id: 1,
          companyName: "ABC Logistics",
          contactName: "John Smith",
          email: "john@abclogistics.com",
          phoneNumber: "312-555-1234",
          mcNumber: "MC-123456",
          dotNumber: "DOT-987654",
          status: "Active",
          createdAt: "2025-01-15T00:00:00.000Z"
        },
        {
          id: 2,
          companyName: "FastFreight Inc",
          contactName: "Jessica Brown",
          email: "jessica@fastfreight.com",
          phoneNumber: "773-555-6789",
          mcNumber: "MC-456789",
          dotNumber: "DOT-654321",
          status: "Active",
          createdAt: "2025-02-20T00:00:00.000Z"
        },
        {
          id: 3,
          companyName: "Global Transport LLC",
          contactName: "Mark Wilson",
          email: "mark@globaltransport.com",
          phoneNumber: "312-555-9876",
          mcNumber: "MC-789123",
          dotNumber: "DOT-321654",
          status: "Active",
          createdAt: "2025-03-10T00:00:00.000Z"
        }
      ]);
    } catch (error) {
      next(error);
    }
  });

  portalRouter.get("/account/:clientId", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const clientId = parseInt(req.params.clientId);
      
      // Mock data for specific client
      const mockClients = [
        {
          id: 1,
          companyName: "ABC Logistics",
          contactName: "John Smith",
          email: "john@abclogistics.com",
          phoneNumber: "312-555-1234",
          mcNumber: "MC-123456",
          dotNumber: "DOT-987654",
          status: "Active",
          createdAt: "2025-01-15T00:00:00.000Z",
          billingAddress: "123 Main St, Chicago, IL 60601",
          paymentTerms: "Net 30",
          creditLimit: 50000,
          notes: "Preferred carrier for Midwest routes"
        },
        {
          id: 2,
          companyName: "FastFreight Inc",
          contactName: "Jessica Brown",
          email: "jessica@fastfreight.com",
          phoneNumber: "773-555-6789",
          mcNumber: "MC-456789",
          dotNumber: "DOT-654321",
          status: "Active",
          createdAt: "2025-02-20T00:00:00.000Z",
          billingAddress: "456 Oak Ave, Chicago, IL 60607",
          paymentTerms: "Net 15",
          creditLimit: 75000,
          notes: "Specializes in expedited freight"
        },
        {
          id: 3,
          companyName: "Global Transport LLC",
          contactName: "Mark Wilson",
          email: "mark@globaltransport.com",
          phoneNumber: "312-555-9876",
          mcNumber: "MC-789123",
          dotNumber: "DOT-321654",
          status: "Active",
          createdAt: "2025-03-10T00:00:00.000Z",
          billingAddress: "789 Elm St, Chicago, IL 60622",
          paymentTerms: "Net 45",
          creditLimit: 100000,
          notes: "International shipping expertise"
        }
      ];
      
      const client = mockClients.find(c => c.id === clientId);
      
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      next(error);
    }
  });
  
  // Leaderboard routes
  apiRouter.get('/leaderboard/sales', createAuthMiddleware(1), async (req, res) => {
    try {
      if (!req.user || !req.user.orgId) {
        return res.status(401).json({ error: 'Unauthorized - Missing organization' });
      }
      
      const salesLeaderboard = await leaderboardService.getSalesLeaderboard(req.user.orgId);
      res.json(salesLeaderboard);
    } catch (error: any) {
      console.error('Error fetching sales leaderboard:', error);
      res.status(500).json({ 
        status: 'error', 
        message: error.message || 'Failed to fetch sales leaderboard'
      });
    }
  });
  
  apiRouter.get('/leaderboard/dispatch', createAuthMiddleware(1), async (req, res) => {
    try {
      if (!req.user || !req.user.orgId) {
        return res.status(401).json({ error: 'Unauthorized - Missing organization' });
      }
      
      const dispatchLeaderboard = await leaderboardService.getDispatchLeaderboard(req.user.orgId);
      res.json(dispatchLeaderboard);
    } catch (error: any) {
      console.error('Error fetching dispatch leaderboard:', error);
      res.status(500).json({ 
        status: 'error', 
        message: error.message || 'Failed to fetch dispatch leaderboard'
      });
    }
  });
  
  apiRouter.get('/leaderboard/combined', createAuthMiddleware(1), async (req, res) => {
    try {
      if (!req.user || !req.user.orgId) {
        return res.status(401).json({ error: 'Unauthorized - Missing organization' });
      }
      
      const combinedLeaderboard = await leaderboardService.getCombinedLeaderboard(req.user.orgId);
      res.json(combinedLeaderboard);
    } catch (error: any) {
      console.error('Error fetching combined leaderboard:', error);
      res.status(500).json({ 
        status: 'error', 
        message: error.message || 'Failed to fetch combined leaderboard'
      });
    }
  });
  
  apiRouter.get('/leaderboard/week-over-week', createAuthMiddleware(1), async (req, res) => {
    try {
      if (!req.user || !req.user.orgId) {
        return res.status(401).json({ error: 'Unauthorized - Missing organization' });
      }
      
      const weekOverWeek = await leaderboardService.getWeekOverWeekComparison(req.user.orgId);
      res.json(weekOverWeek);
    } catch (error: any) {
      console.error('Error fetching week-over-week comparison:', error);
      res.status(500).json({ 
        status: 'error', 
        message: error.message || 'Failed to fetch week-over-week comparison'
      });
    }
  });
  
  // We don't need to initialize Socket.IO here as it's already done in server/index.ts
  // and imported from server/socket.ts
  
  // Don't initialize a separate WebSocket server to avoid conflicts
  // Socket.IO is initialized only once in the entire application

  // Authentication routes
  const authRouter = express.Router();
  apiRouter.use("/auth", authRouter);

  // Login route with enhanced error handling
  authRouter.post("/login", express.json(), async (req, res, next) => {
    try {
      // Explicitly set JSON content type
      res.setHeader('Content-Type', 'application/json');
      
      console.log("Login attempt received:", { 
        body: req.body,
        contentType: req.get('Content-Type'),
        method: req.method,
        path: req.path,
        url: req.url,
        originalUrl: req.originalUrl
      });
      
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          error: "Authentication failed",
          details: "Username and password are required",
          missing: ["credentials"]
        });
      }

      // Add verbose logging to debug the issue
      console.log(`Login attempt for username: ${username}`);
      
      let user;
      // Check database connectivity before querying
      try {
        user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`User not found: ${username}`);
          return res.status(401).json({ 
            error: "Authentication failed", 
            details: "Invalid username or password", 
            missing: ["user"] 
          });
        }
        
        // Simple password comparison - in a real app, use bcrypt
        if (user.password !== password) {
          console.log(`Invalid password for user: ${username}`);
          return res.status(401).json({ 
            error: "Authentication failed", 
            details: "Invalid username or password", 
            missing: ["valid_credentials"] 
          });
        }
        
        // Validate that user has necessary fields
        if (!user.firstName || !user.lastName) {
          console.warn(`User ${username} has incomplete profile data`);
        }
        
        // Ensure user has organization ID
        if (!user.orgId) {
          console.log(`User ${username} has no organization, attempting to assign default org`);
          try {
            const orgs = await storage.getOrganizations();
            if (orgs && orgs.length > 0) {
              await storage.updateUser(user.id, { orgId: orgs[0].id });
              user.orgId = orgs[0].id;
              console.log(`Assigned user ${user.id} to default organization ${orgs[0].id}`);
            }
          } catch (orgError) {
            console.error("Error assigning default organization:", orgError);
          }
        }
      } catch (dbError) {
        console.error("Database error during login:", dbError);
        return res.status(500).json({
          error: "Authentication failed due to database error",
          details: "An internal server error occurred while processing your request",
          missing: ["database_connection"]
        });
      }

      if (!user) {
        return res.status(500).json({
          error: "Authentication failed",
          details: "User could not be retrieved",
          missing: ["user"]
        });
      }

      // Store user in session
      req.session.userId = user.id;
      
      try {
        // Try to get role information, but handle any errors
        const role = await storage.getRole(user.roleId);
        
        // Return user info (except password)
        const { password: _, ...userInfo } = user;
        
        // Log successful login
        console.log(`User ${username} logged in successfully`);
        
        return res.status(200).json({ 
          user: userInfo,
          role: role ? role : null
        });
      } catch (roleError) {
        console.error(`Error fetching role for user ${username}:`, roleError);
        
        // Return user info without role if there's an error getting role
        const { password: _, ...userInfo } = user;
        
        return res.status(200).json({ 
          user: userInfo,
          role: null,
          message: "Authentication successful but role data is unavailable"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
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
        console.log("No userId in session");
        return res.status(401).json({ authenticated: false });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        console.log(`User with id ${req.session.userId} not found`);
        req.session.destroy(() => {});
        return res.status(401).json({ authenticated: false });
      }

      // Try to get role information but handle errors gracefully
      try {
        const role = await storage.getRole(user.roleId);
        
        // Return user info (except password)
        const { password: _, ...userInfo } = user;
        return res.status(200).json({ 
          authenticated: true,
          user: userInfo,
          role
        });
      } catch (roleError) {
        console.error(`Error fetching role for user ${user.username}:`, roleError);
        
        // Return user info without role
        const { password: _, ...userInfo } = user;
        return res.status(200).json({ 
          authenticated: true,
          user: userInfo,
          role: null,
          message: "Authentication successful but role data is unavailable"
        });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      next(error);
    }
  });

  // User-Organization management routes
  authRouter.get("/user-organizations", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "Unauthorized: User not found", 
          missing: ["user"] 
        });
      }
      
      // Get user's organizations
      const organizations = await storage.getUserOrganizations(req.user.id);
      res.json(organizations);
    } catch (error) {
      next(error);
    }
  });

  // User routes
  const userRouter = express.Router();
  apiRouter.use("/users", userRouter);

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
      if (req.user?.id !== user.id && req.userRole?.level < 3) {
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
        userId: req.user?.id || 0,
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

  // Get users by department
  userRouter.get("/department/:department", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const department = req.params.department;
      
      // Get users in this department
      const users = await storage.getUsersByDepartment(department);
      
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

  // Organization routes
  const orgRouter = express.Router();
  apiRouter.use("/organizations", orgRouter);

  // Get all organizations
  orgRouter.get("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      next(error);
    }
  });

  // Get current user's organization
  orgRouter.get("/current", async (req, res, next) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Unauthorized: Please log in to access this resource",
          missing: ["session"] 
        });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ 
          error: "Unauthorized: User not found", 
          missing: ["user"] 
        });
      }

      if (!user.orgId) {
        return res.status(404).json({ 
          error: "Not found: User is not assigned to any organization", 
          missing: ["organization"] 
        });
      }

      const org = await storage.getOrganization(user.orgId);
      if (!org) {
        return res.status(404).json({ 
          error: "Not found: Organization does not exist", 
          missing: ["organization"] 
        });
      }

      res.json(org);
    } catch (error) {
      next(error);
    }
  });

  // Create new organization
  orgRouter.post("/", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const orgData = insertOrganizationSchema.parse(req.body);
      const org = await storage.createOrganization(orgData);
      res.status(201).json(org);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  // Get organization by ID
  orgRouter.get("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const org = await storage.getOrganization(Number(req.params.id));
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(org);
    } catch (error) {
      next(error);
    }
  });

  // Update organization
  orgRouter.patch("/:id", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const orgId = Number(req.params.id);
      const org = await storage.getOrganization(orgId);
      
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Update the organization
      const updatedOrg = await storage.updateOrganization(orgId, req.body);
      res.json(updatedOrg);
    } catch (error) {
      next(error);
    }
  });

  // Commissions routes
  const commissionsRouter = express.Router();
  apiRouter.use("/commissions", commissionsRouter);

  // GET monthly commissions for user
  commissionsRouter.get("/monthly/user/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      const month = req.query.month as string || new Date().toISOString().slice(0, 7); // Default to current month
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          status: "error", 
          message: "User not found" 
        });
      }

      // Default commission response
      const commissions = {
        userId,
        month,
        deals: [],
        total: 0,
        previousMonth: {
          total: 0
        },
        stats: {
          totalDeals: 0,
          avgCommission: 0,
          percentChange: 0
        }
      };
      
      // Check if the user has a sales or dispatch role
      const role = await storage.getUserRole(userId);
      
      if (role?.department === "sales") {
        // Calculate sales commissions
        const salesCommissions = await calculateSalesCommission(userId, month, req.user?.id || 0);
        res.json(salesCommissions);
      } else if (role?.department === "dispatch") {
        // Calculate dispatch commissions
        const dispatchCommissions = await calculateDispatchCommission(userId, month, req.user?.id || 0);
        res.json(dispatchCommissions);
      } else {
        // Return default structure for users without commissions
        res.json(commissions);
      }
    } catch (error) {
      console.error("Error fetching user commissions:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch commission data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET commissions for all users
  commissionsRouter.get("/monthly", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const month = req.query.month as string || new Date().toISOString().slice(0, 7); // Default to current month
      const department = req.query.department as string || "all"; // Filter by department
      
      // Fetch users with their roles
      const users = await storage.getAllUsers();
      const userIds = users.map(u => u.id);
      
      // Get commissions for each user
      const usersWithCommissions = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const role = await storage.getUserRole(userId);
            
            // Skip users not in the requested department
            if (department !== "all" && role?.department !== department) {
              return null;
            }
            
            let commissions;
            if (role?.department === "sales") {
              commissions = await calculateSalesCommission(userId, month, req.user?.id || 0);
            } else if (role?.department === "dispatch") {
              commissions = await calculateDispatchCommission(userId, month, req.user?.id || 0);
            } else {
              // Default empty commission data
              commissions = {
                userId,
                month,
                deals: [],
                total: 0,
                previousMonth: { total: 0 },
                stats: { totalDeals: 0, avgCommission: 0, percentChange: 0 }
              };
            }
            
            const user = users.find(u => u.id === userId);
            
            return {
              ...commissions,
              user: {
                id: user?.id,
                name: `${user?.firstName} ${user?.lastName}`,
                department: role?.department || "unknown"
              }
            };
          } catch (error) {
            console.error(`Error calculating commissions for user ${userId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out nulls and sort by total commission amount
      const filteredResults = usersWithCommissions
        .filter(Boolean)
        .sort((a, b) => b.total - a.total);
      
      res.json(filteredResults);
    } catch (error) {
      console.error("Error fetching all commissions:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch commission data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Leads routes with real-time middleware
  const leadsRouter = express.Router();
  apiRouter.use("/leads", leadsRouter);
  
  leadsRouter.use(leadRealTimeMiddleware);
  
  // GET all leads
  leadsRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      next(error);
    }
  });
  
  // GET lead by ID
  leadsRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadId = Number(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      next(error);
    }
  });
  
  // POST create new lead
  leadsRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadData = insertLeadSchema.parse({
        ...req.body,
        createdBy: req.user?.id,
        orgId: req.user?.orgId
      });
      
      const newLead = await storage.createLead(leadData);
      
      // Create activity record
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'lead',
        entityId: newLead.id,
        action: 'created',
        details: `Created lead: ${newLead.name}`
      });
      
      // Send notifications
      await notificationService.sendLeadNotification({
        leadId: newLead.id,
        action: 'created',
        title: 'New Lead Created',
        message: `New lead '${newLead.name}' was created`,
        createdBy: req.user?.id || 0
      });
      
      res.status(201).json(newLead);
    } catch (error) {
      console.error("Error creating lead:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });
  
  // PATCH update lead
  leadsRouter.patch("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadId = Number(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      const updatedLead = await storage.updateLead(leadId, {
        ...req.body,
        updatedBy: req.user?.id
      });
      
      // Create activity record
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'lead',
        entityId: leadId,
        action: 'updated',
        details: `Updated lead: ${lead.name}`
      });
      
      // Send notifications if status changed
      if (req.body.status && req.body.status !== lead.status) {
        await notificationService.sendLeadNotification({
          leadId: leadId,
          action: 'status_changed',
          title: 'Lead Status Changed',
          message: `Lead '${lead.name}' status changed from '${lead.status}' to '${req.body.status}'`,
          createdBy: req.user?.id || 0
        });
      }
      
      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead:", error);
      next(error);
    }
  });

  // Clients routes (CRM)
  const clientsRouter = express.Router();
  apiRouter.use("/clients", clientsRouter);
  
  // GET all clients
  clientsRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      next(error);
    }
  });
  
  // GET client by ID
  clientsRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const clientId = Number(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      next(error);
    }
  });

  // Dispatch clients routes
  const dispatchClientRouter = express.Router();
  apiRouter.use("/dispatch/clients", dispatchClientRouter);
  
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
      
      // Return a structured JSON response
      res.status(200).json({
        status: "success",
        data: clientsWithLeads || []
      });
    } catch (error) {
      console.error("Error fetching dispatch clients:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch dispatch clients",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  dispatchClientRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const client = await storage.getDispatchClient(Number(req.params.id));
      
      if (!client) {
        return res.status(404).json({ 
          status: "error", 
          message: "Dispatch client not found" 
        });
      }
      
      // Get the associated lead
      const lead = await storage.getLead(client.leadId);
      
      // Get loads for this client
      const loads = await storage.getLoadsByClient(client.id);
      
      res.status(200).json({
        status: "success",
        data: {
          ...client,
          lead,
          loads
        }
      });
    } catch (error) {
      console.error("Error fetching dispatch client:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch dispatch client",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  dispatchClientRouter.post("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const clientData = insertDispatchClientSchema.parse({
        ...req.body,
        createdBy: req.user?.id,
        orgId: req.user?.orgId
      });
      
      // Create the dispatch client
      const newClient = await storage.createDispatchClient(clientData);
      
      // Create activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'dispatch_client',
        entityId: newClient.id,
        action: 'created',
        details: `Created dispatch client for lead ID: ${clientData.leadId}`
      });
      
      // Send notifications
      await notificationService.sendDispatchNotification({
        clientId: newClient.id,
        action: 'client_created',
        title: 'New Dispatch Client Created',
        message: `A new dispatch client was created from lead ID ${clientData.leadId}`,
        createdBy: req.user?.id || 0
      });
      
      res.status(201).json({
        status: "success",
        data: newClient
      });
    } catch (error) {
      console.error("Error creating dispatch client:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: "error",
          message: fromZodError(error).message
        });
      }
      res.status(500).json({ 
        status: "error", 
        message: "Failed to create dispatch client",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  dispatchClientRouter.patch("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const clientId = Number(req.params.id);
      const client = await storage.getDispatchClient(clientId);
      
      if (!client) {
        return res.status(404).json({ 
          status: "error", 
          message: "Dispatch client not found" 
        });
      }
      
      // Update the client
      const updatedClient = await storage.updateDispatchClient(clientId, {
        ...req.body,
        updatedBy: req.user?.id
      });
      
      // Create activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'dispatch_client',
        entityId: clientId,
        action: 'updated',
        details: `Updated dispatch client with ID: ${clientId}`
      });
      
      // If status changed, send notification
      if (req.body.status && req.body.status !== client.status) {
        await notificationService.sendDispatchNotification({
          clientId: clientId,
          action: 'client_status_changed',
          title: 'Dispatch Client Status Changed',
          message: `Dispatch client status changed from '${client.status}' to '${req.body.status}'`,
          createdBy: req.user?.id || 0
        });
      }
      
      res.status(200).json({
        status: "success",
        data: updatedClient
      });
    } catch (error) {
      console.error("Error updating dispatch client:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to update dispatch client",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Approve client endpoint
  dispatchClientRouter.patch("/:id/approve", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const clientId = Number(req.params.id);
      const client = await storage.getDispatchClient(clientId);
      
      if (!client) {
        return res.status(404).json({ 
          status: "error", 
          message: "Dispatch client not found" 
        });
      }
      
      if (client.status !== 'pending') {
        return res.status(400).json({ 
          status: "error", 
          message: "Client is not in pending status" 
        });
      }
      
      // Update to approved status
      const updatedClient = await storage.updateDispatchClient(clientId, {
        status: 'active',
        approvedBy: req.user?.id,
        approvedDate: new Date(),
        onboardingDate: req.body.onboardingDate ? new Date(req.body.onboardingDate) : new Date(),
        updatedBy: req.user?.id
      });
      
      // Create activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'dispatch_client',
        entityId: clientId,
        action: 'approved',
        details: `Approved dispatch client with ID: ${clientId}`
      });
      
      // Send notification
      await notificationService.sendDispatchNotification({
        clientId: clientId,
        action: 'client_approved',
        title: 'Dispatch Client Approved',
        message: `Dispatch client has been approved and activated`,
        createdBy: req.user?.id || 0
      });
      
      res.status(200).json({
        status: "success",
        data: updatedClient
      });
    } catch (error) {
      console.error("Error approving dispatch client:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to approve dispatch client",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Load routes for dispatch module
  const dispatchLoadRouter = express.Router();
  apiRouter.use("/dispatch/loads", dispatchLoadRouter);
  
  dispatchLoadRouter.use(loadRealTimeMiddleware);

  // GET loads
  dispatchLoadRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Fetch loads based on organization and user role
      const loads = await storage.getLoads(req.user?.orgId || 0);
      res.json(loads || []);
    } catch (error) {
      console.error("Error fetching dispatch loads:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch loads",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET a specific load
  dispatchLoadRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const loadId = Number(req.params.id);
      const load = await storage.getLoad(loadId);
      
      if (!load) {
        return res.status(404).json({ 
          status: "error", 
          message: "Load not found" 
        });
      }
      
      res.json(load);
    } catch (error) {
      console.error("Error fetching specific load:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch load details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create a new load
  dispatchLoadRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const loadData = {
        ...req.body,
        createdBy: req.user?.id || 0,
        orgId: req.user?.orgId || 0
      };
      
      const newLoad = await storage.createLoad(loadData);
      res.status(201).json(newLoad);
    } catch (error) {
      console.error("Error creating load:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to create load",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update a load
  dispatchLoadRouter.patch("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const loadId = Number(req.params.id);
      const load = await storage.getLoad(loadId);
      
      if (!load) {
        return res.status(404).json({ 
          status: "error", 
          message: "Load not found" 
        });
      }
      
      const updatedLoad = await storage.updateLoad(loadId, {
        ...req.body,
        updatedBy: req.user?.id
      });
      
      res.json(updatedLoad);
    } catch (error) {
      console.error("Error updating load:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to update load",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Tracking endpoint for dispatch
  const trackingRouter = express.Router();
  apiRouter.use("/dispatch/tracking", trackingRouter);

  // GET tracking data for loads
  trackingRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Get all loads in transit
      const loadsInTransit = await storage.getLoadsByStatus('in_transit');
      
      // Get tracking data for each load
      const loadsWithTracking = await Promise.all(
        loadsInTransit.map(async (load) => {
          // Get last known location (simplified for this example)
          const lastLocation = {
            latitude: Math.random() * 90,
            longitude: Math.random() * 180,
            timestamp: new Date().toISOString(),
            speed: Math.floor(Math.random() * 70),
            heading: Math.floor(Math.random() * 360)
          };
          
          return {
            ...load,
            tracking: {
              lastLocation,
              estimatedArrival: new Date(Date.now() + Math.random() * 86400000 * 3).toISOString(),
              distanceRemaining: Math.floor(Math.random() * 500),
              delayMinutes: Math.random() > 0.7 ? Math.floor(Math.random() * 120) : 0
            }
          };
        })
      );
      
      res.json(loadsWithTracking);
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch tracking data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // UI Preferences routes
  const prefsRouter = express.Router();
  apiRouter.use("/ui-prefs", prefsRouter);

  // Get current user's UI preferences
  prefsRouter.get("/me", async (req, res, next) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Unauthorized: Please log in to access this resource",
          missing: ["session"] 
        });
      }

      const prefs = await storage.getUserPreferences(req.session.userId);
      if (!prefs) {
        // Return default preferences
        return res.json({
          userId: req.session.userId,
          theme: 'light',
          sidebarCollapsed: false,
          dashboardLayout: 'default',
          notificationSettings: defaultNotificationPreferences
        });
      }
      
      res.json(prefs);
    } catch (error) {
      next(error);
    }
  });

  // Update current user's UI preferences
  prefsRouter.post("/me", async (req, res, next) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Unauthorized: Please log in to access this resource",
          missing: ["session"] 
        });
      }

      // Get existing prefs or create new ones
      let prefs = await storage.getUserPreferences(req.session.userId);
      
      if (!prefs) {
        // Create new preferences
        prefs = await storage.createUserPreferences({
          userId: req.session.userId,
          ...req.body
        });
      } else {
        // Update existing preferences
        prefs = await storage.updateUserPreferences(req.session.userId, req.body);
      }
      
      res.json(prefs);
    } catch (error) {
      next(error);
    }
  });

  // Notifications routes
  const notificationsRouter = express.Router();
  apiRouter.use("/notifications", notificationsRouter);
  
  notificationsRouter.use(notificationRealTimeMiddleware);

  // Get all notifications for current user
  notificationsRouter.get("/", async (req, res, next) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Unauthorized: Please log in to access this resource",
          missing: ["session"] 
        });
      }

      const notifications = await storage.getUserNotifications(req.session.userId);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  // Get lead notifications
  notificationsRouter.get("/leads", async (req, res, next) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Unauthorized: Please log in to access this resource",
          missing: ["session"] 
        });
      }

      const notifications = await storage.getUserNotificationsByType(
        req.session.userId, 
        ['lead_created', 'lead_updated', 'lead_status_changed']
      );
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  // Create a new notification
  notificationsRouter.post("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const notification = await storage.createNotification({
        ...req.body,
        createdBy: req.user?.id
      });
      
      // Broadcast to connected clients via Socket.IO
      if (io) {
        // Broadcast to specific user if userId is specified
        if (notification.userId) {
          io.to(`user-${notification.userId}`).emit('notification', notification);
        } 
        // Otherwise broadcast to the entire organization
        else if (notification.orgId) {
          io.to(`org-${notification.orgId}`).emit('notification', notification);
        }
      }
      
      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  });

  // Mark notification as read
  notificationsRouter.patch("/:id/read", async (req, res, next) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Unauthorized: Please log in to access this resource",
          missing: ["session"] 
        });
      }

      const notificationId = Number(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Check if notification belongs to this user
      if (notification.userId && notification.userId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden: This notification doesn't belong to you" });
      }
      
      const updatedNotification = await storage.updateNotification(notificationId, {
        read: true,
        readAt: new Date()
      });
      
      res.json(updatedNotification);
    } catch (error) {
      next(error);
    }
  });
  
  // Message routes
  const messagesRouter = express.Router();
  apiRouter.use("/messages", messagesRouter);

  // Get all conversations for the current user
  messagesRouter.get("/conversations", async (req, res, next) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Unauthorized: Please log in to access this resource",
          missing: ["session"] 
        });
      }

      // For now, just return some mock data
      res.json([
        {
          id: "conv1",
          participants: [
            { id: req.session.userId, name: "Current User" },
            { id: 2, name: "Jane Smith" }
          ],
          lastMessage: {
            id: "msg1",
            conversationId: "conv1",
            senderId: 2,
            content: "When will the report be ready?",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            read: false
          },
          unreadCount: 1
        },
        {
          id: "conv2",
          participants: [
            { id: req.session.userId, name: "Current User" },
            { id: 3, name: "Michael Johnson" }
          ],
          lastMessage: {
            id: "msg2",
            conversationId: "conv2",
            senderId: req.session.userId,
            content: "I've sent the invoice to the client.",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            read: true
          },
          unreadCount: 0
        }
      ]);
    } catch (error) {
      next(error);
    }
  });

  // Dashboard routes
  const dashboardRouter = express.Router();
  apiRouter.use("/dashboard", dashboardRouter);

  // Get dashboard data
  dashboardRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Get counts of various entities
      const leadCount = await storage.getLeadCount();
      const clientCount = await storage.getClientCount();
      const loadCount = await storage.getLoadCount();
      const invoiceCount = await storage.getInvoiceCount();
      
      // Get recent items
      const recentLeads = await storage.getRecentLeads(5);
      const recentLoads = await storage.getRecentLoads(5);
      const recentInvoices = await storage.getRecentInvoices(5);
      
      res.json({
        counts: {
          leads: leadCount,
          clients: clientCount,
          loads: loadCount,
          invoices: invoiceCount
        },
        recent: {
          leads: recentLeads,
          loads: recentLoads,
          invoices: recentInvoices
        },
        activities: await storage.getActivities(10)
      });
    } catch (error) {
      next(error);
    }
  });

  // Get metrics for dashboard
  dashboardRouter.get("/metrics", createAuthMiddleware(1), async (req, res, next) => {
    try {
      res.json({
        performance: {
          sales: {
            target: 100000,
            current: 75000,
            lastMonth: 68000,
            growth: 10.29
          },
          dispatch: {
            target: 80,
            current: 62,
            lastMonth: 58,
            growth: 6.9
          }
        },
        revenue: {
          monthly: [
            { month: "Jan", amount: 32000 },
            { month: "Feb", amount: 45000 },
            { month: "Mar", amount: 51000 },
            { month: "Apr", amount: 48000 },
            { month: "May", amount: 55000 },
            { month: "Jun", amount: 62000 }
          ],
          total: 293000,
          growth: 14.2
        },
        customers: {
          active: 120,
          new: 15,
          retention: 92.5
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Dashboard Widgets routes
  // Get all dashboard widgets for the current user
  dashboardRouter.get("/widgets", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const widgets = await storage.getDashboardWidgets(req.user.id);
      res.json(widgets);
    } catch (error) {
      next(error);
    }
  });

  // Get a specific dashboard widget
  dashboardRouter.get("/widgets/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const widgetId = parseInt(req.params.id);
      
      if (isNaN(widgetId)) {
        return res.status(400).json({ error: "Invalid widget ID" });
      }

      const widget = await storage.getDashboardWidget(widgetId);
      
      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }

      // Check if the widget belongs to the current user
      if (widget.userId !== req.user?.id) {
        return res.status(403).json({ error: "You don't have permission to access this widget" });
      }

      res.json(widget);
    } catch (error) {
      next(error);
    }
  });

  // Create a new dashboard widget
  dashboardRouter.post("/widgets", createAuthMiddleware(1), express.json(), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      try {
        const widgetData = insertDashboardWidgetSchema.parse({
          ...req.body,
          userId: req.user.id,
          orgId: req.user.orgId || null
        });

        const newWidget = await storage.createDashboardWidget(widgetData);
        res.status(201).json(newWidget);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          return res.status(400).json({ 
            error: "Validation error", 
            details: fromZodError(validationError).message 
          });
        }
        throw validationError;
      }
    } catch (error) {
      next(error);
    }
  });

  // Update a dashboard widget
  dashboardRouter.patch("/widgets/:id", createAuthMiddleware(1), express.json(), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const widgetId = parseInt(req.params.id);
      
      if (isNaN(widgetId)) {
        return res.status(400).json({ error: "Invalid widget ID" });
      }

      // Check if the widget exists and belongs to the current user
      const existingWidget = await storage.getDashboardWidget(widgetId);
      
      if (!existingWidget) {
        return res.status(404).json({ error: "Widget not found" });
      }

      if (existingWidget.userId !== req.user.id) {
        return res.status(403).json({ error: "You don't have permission to modify this widget" });
      }

      // Update the widget
      const updatedWidget = await storage.updateDashboardWidget(widgetId, req.body);
      
      if (!updatedWidget) {
        return res.status(500).json({ error: "Failed to update widget" });
      }

      res.json(updatedWidget);
    } catch (error) {
      next(error);
    }
  });

  // Delete a dashboard widget
  dashboardRouter.delete("/widgets/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const widgetId = parseInt(req.params.id);
      
      if (isNaN(widgetId)) {
        return res.status(400).json({ error: "Invalid widget ID" });
      }

      // Check if the widget exists and belongs to the current user
      const existingWidget = await storage.getDashboardWidget(widgetId);
      
      if (!existingWidget) {
        return res.status(404).json({ error: "Widget not found" });
      }

      if (existingWidget.userId !== req.user.id) {
        return res.status(403).json({ error: "You don't have permission to delete this widget" });
      }

      // Delete the widget
      const success = await storage.deleteDashboardWidget(widgetId);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to delete widget" });
      }

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Reorder dashboard widgets
  dashboardRouter.post("/widgets/reorder", createAuthMiddleware(1), express.json(), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { widgets } = req.body;
      
      if (!Array.isArray(widgets)) {
        return res.status(400).json({ error: "Invalid widgets data. Expected an array." });
      }

      // Check if all widgets belong to the current user
      for (const widget of widgets) {
        if (!widget.id || widget.userId !== req.user.id) {
          return res.status(403).json({ 
            error: "You don't have permission to reorder one or more widgets" 
          });
        }
      }

      // Reorder the widgets
      const updatedWidgets = await storage.reorderDashboardWidgets(widgets);
      res.json(updatedWidgets);
    } catch (error) {
      next(error);
    }
  });

  // Invoice routes
  const invoiceRouter = express.Router();
  apiRouter.use("/invoices", invoiceRouter);

  // Get all invoices with pagination and filtering
  invoiceRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Build filters from query params
      const filters: any = {};
      
      if (req.query.status) {
        filters.status = req.query.status;
      }
      
      if (req.query.leadId) {
        filters.leadId = parseInt(req.query.leadId as string);
      }
      
      if (req.query.dateFrom && req.query.dateTo) {
        filters.dateFrom = req.query.dateFrom;
        filters.dateTo = req.query.dateTo;
      }
      
      if (req.query.createdBy) {
        filters.createdBy = parseInt(req.query.createdBy as string);
      }
      
      if (req.orgId) {
        filters.orgId = req.orgId;
      }
      
      const result = await storage.getInvoices(page, limit, filters);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Get invoice by ID
  invoiceRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoiceWithItems(id);
      
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  });

  // Create new invoice
  invoiceRouter.post("/", createAuthMiddleware(2), express.json(), async (req, res, next) => {
    try {
      // Validate request body
      const validatedData = insertInvoiceSchema.parse(req.body);
      
      // Add creator ID from session
      const invoiceData = {
        ...validatedData,
        createdBy: req.session.userId as number
      };
      
      let result;
      
      // Use transaction for creating invoice with items if provided
      if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
        const itemsData = req.body.items.map(item => ({
          loadId: item.loadId,
          description: item.description,
          amount: item.amount
        }));
        
        // Create invoice with items in a single transaction
        result = await storage.createInvoiceWithItems(invoiceData, itemsData);
      } else {
        // Create invoice only (no items)
        const newInvoice = await storage.createInvoice(invoiceData);
        result = { invoice: newInvoice, items: [] };
      }
      
      // Emit real-time update
      if (invoiceRealTimeMiddleware && invoiceRealTimeMiddleware.emitInvoiceCreated) {
        invoiceRealTimeMiddleware.emitInvoiceCreated(result);
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating invoice:', error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          error: "Validation error",
          details: validationError.details
        });
      }
      next(error);
    }
  });

  // Update invoice
  invoiceRouter.patch("/:id", createAuthMiddleware(2), express.json(), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if invoice exists
      const existingInvoice = await storage.getInvoice(id);
      if (!existingInvoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      // Only allow updates to specific fields
      const allowedUpdates = [
        'status', 'notes', 'dueDate', 'paidDate', 'paidAmount'
      ];
      
      const updates: any = {};
      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      const updatedInvoice = await storage.updateInvoice(id, updates);
      
      // Emit real-time update
      if (invoiceRealTimeMiddleware && invoiceRealTimeMiddleware.emitInvoiceUpdated) {
        invoiceRealTimeMiddleware.emitInvoiceUpdated(updatedInvoice);
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      next(error);
    }
  });

  // Mark invoice as paid
  invoiceRouter.post("/:id/mark-paid", createAuthMiddleware(2), express.json(), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate request body
      if (!req.body.paidDate || !req.body.paidAmount) {
        return res.status(400).json({ 
          error: "Validation error",
          details: "paidDate and paidAmount are required"
        });
      }
      
      const paidDate = new Date(req.body.paidDate);
      const paidAmount = parseFloat(req.body.paidAmount);
      
      const updatedInvoice = await storage.markInvoiceAsPaid(id, paidDate, paidAmount);
      
      if (!updatedInvoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      // Emit real-time update
      if (invoiceRealTimeMiddleware && invoiceRealTimeMiddleware.emitInvoiceUpdated) {
        invoiceRealTimeMiddleware.emitInvoiceUpdated(updatedInvoice);
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      next(error);
    }
  });

  // Delete invoice
  invoiceRouter.delete("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if invoice exists
      const existingInvoice = await storage.getInvoice(id);
      if (!existingInvoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      const success = await storage.deleteInvoice(id);
      
      if (success) {
        // Emit real-time update
        if (invoiceRealTimeMiddleware && invoiceRealTimeMiddleware.emitInvoiceDeleted) {
          invoiceRealTimeMiddleware.emitInvoiceDeleted(id);
        }
        
        res.status(200).json({ success: true, message: "Invoice deleted successfully" });
      } else {
        res.status(500).json({ success: false, message: "Failed to delete invoice" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Generate invoices for delivered loads
  invoiceRouter.post("/generate-for-delivered", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const { weekly = true, dateRange } = req.body;
      
      // Parse date range if provided
      let parsedDateRange;
      if (dateRange && dateRange.start && dateRange.end) {
        parsedDateRange = {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        };
      }
      
      // Generate invoices with proper client grouping
      const result = await storage.generateInvoicesForDeliveredLoads({
        weekly,
        dateRange: parsedDateRange
      });
      
      // Create notifications for each invoice
      if (result.invoices.length > 0) {
        for (const invoice of result.invoices) {
          // Get lead/client info for the notification
          const lead = await storage.getLead(invoice.leadId);
          
          if (lead) {
            // Create a notification for finance team
            await storage.createNotification({
              title: 'New Weekly Invoice Generated',
              message: `Invoice #${invoice.invoiceNumber} for ${lead.companyName} has been generated for $${invoice.totalAmount.toFixed(2)}`,
              type: 'invoice_generated',
              entityType: 'invoice',
              entityId: invoice.id,
              orgId: invoice.orgId,
              read: false,
              createdAt: new Date()
            });
            
            // Emit real-time updates for each new invoice if socket middleware exists
            if (invoiceRealTimeMiddleware && typeof invoiceRealTimeMiddleware.emitInvoiceCreated === 'function') {
              const invoiceWithItems = await storage.getInvoiceWithItems(invoice.id);
              if (invoiceWithItems) {
                invoiceRealTimeMiddleware.emitInvoiceCreated(invoiceWithItems);
              }
            }
          }
        }
      }
      
      res.status(200).json({ 
        success: true, 
        message: `Generated ${result.count} invoices for delivered loads`,
        invoices: result.invoices
      });
    } catch (error) {
      console.error('Error generating invoices:', error);
      next(error);
    }
  });
  
  // Generate weekly invoices specifically
  invoiceRouter.post("/generate-weekly", createAuthMiddleware(2), async (req, res, next) => {
    try {
      // Always use weekly setting (last 7 days)
      const result = await storage.generateInvoicesForDeliveredLoads({
        weekly: true
      });
      
      // Create notifications and emit events
      if (result.invoices.length > 0) {
        for (const invoice of result.invoices) {
          // Get lead/client info for the notification
          const lead = await storage.getLead(invoice.leadId);
          
          if (lead) {
            // Create a notification for finance team
            await storage.createNotification({
              title: 'Weekly Invoice Generated',
              message: `Invoice #${invoice.invoiceNumber} for ${lead.companyName} has been generated for $${invoice.totalAmount.toFixed(2)}`,
              type: 'invoice_generated',
              entityType: 'invoice',
              entityId: invoice.id,
              orgId: invoice.orgId,
              read: false,
              createdAt: new Date()
            });
          }
          
          // Emit real-time updates
          if (invoiceRealTimeMiddleware && typeof invoiceRealTimeMiddleware.emitInvoiceCreated === 'function') {
            const invoiceWithItems = await storage.getInvoiceWithItems(invoice.id);
            if (invoiceWithItems) {
              invoiceRealTimeMiddleware.emitInvoiceCreated(invoiceWithItems);
            }
          }
        }
      }
      
      res.status(200).json({ 
        success: true, 
        message: `Generated ${result.count} weekly invoices with client grouping`,
        invoices: result.invoices
      });
    } catch (error) {
      console.error('Error generating weekly invoices:', error);
      next(error);
    }
  });
  
  // Approve and send invoice email
  invoiceRouter.post("/:id/approve-and-send", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const invoiceId = Number(req.params.id);
      
      // Get the invoice with items
      const invoiceWithItems = await storage.getInvoiceWithItems(invoiceId);
      
      if (!invoiceWithItems) {
        return res.status(404).json({ 
          success: false,
          message: "Invoice not found"
        });
      }
      
      const { invoice, items } = invoiceWithItems;
      
      // Get the lead/client info
      const lead = await storage.getLead(invoice.leadId);
      
      if (!lead) {
        return res.status(404).json({ 
          success: false,
          message: "Client information not found"
        });
      }
      
      // First update the invoice status to 'sent'
      const updatedInvoice = await storage.updateInvoice(invoiceId, { 
        status: 'sent',
        approvedBy: req.user?.id || 1,  // Default to admin if no user ID
        updatedAt: new Date()
      });
      
      // Format invoice items for email
      const emailItems = items.map(item => ({
        description: item.description,
        quantity: 1,
        unitPrice: item.amount,
        amount: item.amount
      }));
      
      // Import email function
      const { sendInvoiceEmail } = await import('./email');
      
      // Send email to client
      const emailResult = await sendInvoiceEmail({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        companyName: lead.companyName,
        contactEmail: lead.email || lead.contactEmail || '',
        contactName: lead.contactName,
        totalAmount: invoice.totalAmount,
        dueDate: invoice.dueDate,
        items: emailItems,
        notes: invoice.notes || `Invoice for transportation services. Due date: ${new Date(invoice.dueDate).toLocaleDateString()}`
      });
      
      // Create notification for the invoice being sent
      await storage.createNotification({
        title: 'Invoice Sent to Client',
        message: `Invoice #${invoice.invoiceNumber} for ${lead.companyName} has been approved and sent via email`,
        type: 'invoice_sent',
        entityType: 'invoice',
        entityId: invoice.id,
        orgId: invoice.orgId,
        read: false,
        createdAt: new Date()
      });
      
      // Emit real-time update if available
      if (invoiceRealTimeMiddleware && typeof invoiceRealTimeMiddleware.emitInvoiceUpdated === 'function') {
        const refreshedInvoice = await storage.getInvoiceWithItems(invoiceId);
        if (refreshedInvoice) {
          invoiceRealTimeMiddleware.emitInvoiceUpdated(refreshedInvoice);
        }
      }
      
      res.status(200).json({ 
        success: true,
        message: `Invoice approved and ${emailResult ? 'sent via email' : 'could not be sent via email (check SMTP settings)'}`,
        invoice: updatedInvoice,
        emailSent: emailResult
      });
    } catch (error) {
      console.error('Error approving and sending invoice:', error);
      next(error);
    }
  });

  // Performance targets routes
  const targetsRouter = express.Router();
  apiRouter.use("/performance-targets", targetsRouter);

  // Get performance targets
  targetsRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      res.json({
        sales: {
          monthly: 100000,
          quarterly: 300000,
          annual: 1200000
        },
        dispatch: {
          loads: {
            monthly: 80,
            quarterly: 240,
            annual: 960
          },
          revenue: {
            monthly: 80000,
            quarterly: 240000,
            annual: 950000
          }
        },
        user: req.user?.id ? {
          id: req.user.id,
          sales: {
            monthly: 20000,
            quarterly: 60000,
            annual: 240000,
            current: {
              month: 15000,
              quarter: 42000,
              year: 95000
            }
          },
          dispatch: req.userRole?.department === 'dispatch' ? {
            loads: {
              monthly: 15,
              quarterly: 45,
              annual: 180,
              current: {
                month: 12,
                quarter: 32,
                year: 76
              }
            }
          } : null
        } : null
      });
    } catch (error) {
      next(error);
    }
  });

  // Leaderboard routes for weekly performance metrics
  const leaderboardRouter = express.Router();
  apiRouter.use("/leaderboard", leaderboardRouter);

  // Get sales leaderboard data
  leaderboardRouter.get("/sales", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Extract the query parameter for date, defaulting to current date
      const dateParam = req.query.date ? new Date(req.query.date as string) : new Date();
      const orgId = req.user?.orgId || 1;
      
      // Get the sales leaderboard data from service
      const leaderboardData = await leaderboardService.getSalesLeaderboard(orgId, dateParam);
      res.json(leaderboardData);
    } catch (error) {
      console.error('Error fetching sales leaderboard:', error);
      next(error);
    }
  });

  // Get dispatch leaderboard data
  leaderboardRouter.get("/dispatch", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Extract the query parameter for date, defaulting to current date
      const dateParam = req.query.date ? new Date(req.query.date as string) : new Date();
      const orgId = req.user?.orgId || 1;
      
      // Get the dispatch leaderboard data from service
      const leaderboardData = await leaderboardService.getDispatchLeaderboard(orgId, dateParam);
      res.json(leaderboardData);
    } catch (error) {
      console.error('Error fetching dispatch leaderboard:', error);
      next(error);
    }
  });

  // Get combined leaderboard data
  leaderboardRouter.get("/combined", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Extract the query parameter for date, defaulting to current date
      const dateParam = req.query.date ? new Date(req.query.date as string) : new Date();
      const orgId = req.user?.orgId || 1;
      
      // Get the combined leaderboard data from service
      const leaderboardData = await leaderboardService.getCombinedLeaderboard(orgId, dateParam);
      res.json(leaderboardData);
    } catch (error) {
      console.error('Error fetching combined leaderboard:', error);
      next(error);
    }
  });

  // Get week-over-week comparison
  leaderboardRouter.get("/week-comparison", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const orgId = req.user?.orgId || 1;
      
      // Get the week-over-week comparison data
      const comparisonData = await leaderboardService.getWeekOverWeekComparison(orgId);
      res.json(comparisonData);
    } catch (error) {
      console.error('Error fetching week-over-week comparison:', error);
      next(error);
    }
  });

  // Dispatch reports routes
  const dispatchReportsRouter = express.Router();
  apiRouter.use("/dispatch-reports", dispatchReportsRouter);

  // Get dispatch reports
  dispatchReportsRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const { dispatcherId, date } = req.query;
      
      // Mock data for reports
      res.json({
        date: date || new Date().toISOString().split('T')[0],
        dispatcherId: dispatcherId || req.user?.id || 0,
        assignedLoads: 8,
        completedLoads: 5,
        cancelledLoads: 1,
        pendingLoads: 2,
        loadDetails: [
          {
            id: 101,
            loadNumber: "LD-2025-101",
            client: "ABC Logistics",
            origin: "Los Angeles, CA",
            destination: "Phoenix, AZ",
            status: "completed",
            driver: "John Smith",
            pickupDate: "2025-05-03T08:00:00Z",
            deliveryDate: "2025-05-03T16:00:00Z",
            notes: "Delivered on time"
          },
          {
            id: 102,
            loadNumber: "LD-2025-102",
            client: "XYZ Freight",
            origin: "San Diego, CA",
            destination: "Las Vegas, NV",
            status: "in_transit",
            driver: "Maria Rodriguez",
            pickupDate: "2025-05-03T10:00:00Z",
            deliveryDate: "2025-05-03T20:00:00Z",
            notes: "Running on schedule"
          }
        ],
        metrics: {
          onTimeDelivery: 94.2,
          avgLoadValue: 1250,
          totalRevenue: 10000,
          customerSatisfaction: 4.8
        }
      });
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}

// Add custom interfaces for request object with user and role
declare global {
  namespace Express {
    interface Request {
      user?: typeof users.$inferSelect;
      userRole?: typeof roles.$inferSelect;
      orgId?: number;
    }
    
    interface Session {
      userId?: number;
    }
  }
}