import express, { type Request, Response, NextFunction, Router } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { insertUserSchema, users, roles } from "@shared/schema";
import * as notificationService from "./notifications";
import { WebSocket, WebSocketServer } from "ws";
import errorLoggingRoutes from "./routes/error-logging";
import statusRoutes from "./routes/status";
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
import path from 'path';


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

// Register all API routes
export async function registerRoutes(apiRouter: Router, httpServer: Server, io: SocketIOServer): Promise<Server> {
  // Apply organization middleware to all API routes
  apiRouter.use('/', organizationMiddleware);

  // Register error logging routes
  apiRouter.use('/', errorLoggingRoutes);

  // Register status routes
  apiRouter.use('/status', statusRoutes);

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

      // Add logging to debug authentication
      console.log("Attempting login with:", {
        username,
        providedPassword: password,
        isDefaultAdmin: username === 'admin' && password === 'admin123'
      });

      // Special handling for default admin credentials
      if (username === 'admin' && password === 'admin123') {
        const defaultUser = {
          id: 1,
          username: 'admin',
          firstName: 'System',
          lastName: 'Administrator',
          email: 'admin@metasys.com',
          roleId: 9, // Super Admin role
          orgId: 1,
          active: true
        };

        // Store user in session
        req.session.userId = defaultUser.id;

        return res.status(200).json({
          user: defaultUser,
          role: {
            id: 9,
            name: "Super Admin",
            department: "admin",
            level: 5,
            permissions: ["*"]
          }
        });
      }

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

  // Apply real-time middleware to relevant routes
  const leadsRouter = express.Router();
  apiRouter.use("/leads", leadsRouter);

  leadsRouter.use(leadRealTimeMiddleware);

  const loadsRouter = express.Router();
  apiRouter.use("/loads", loadsRouter);

  loadsRouter.use(loadRealTimeMiddleware);

  const invoicesRouter = express.Router();
  apiRouter.use("/invoices", invoicesRouter);

  invoicesRouter.use(invoiceRealTimeMiddleware);

  const tasksRouter = express.Router();
  apiRouter.use("/tasks", tasksRouter);

  tasksRouter.use(taskRealTimeMiddleware);

  const notificationsRouter = express.Router();
  apiRouter.use("/notifications", notificationsRouter);

  notificationsRouter.use(notificationRealTimeMiddleware);

  const reportsRouter = express.Router();
  apiRouter.use("/reports", reportsRouter);

  reportsRouter.use(reportRealTimeMiddleware);


  // API 404 handler
  apiRouter.use('/api/*', (req, res) => {
    res.status(404).json({
      status: 'error',
      message: `API endpoint not found: ${req.method} ${req.path}`,
      path: req.path
    });
  });

  //Error handling middleware
  apiRouter.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });


  //Add Socket.io error handling (example)
  io.on('connection', (socket) => {
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
    });
    socket.on('error', (error) => {
      console.error(`Socket error: ${error}`);
    });
    // ... other socket.io handlers ...
  });

  return httpServer;
}

// Interface declarations moved to consolidated-routes.ts to avoid conflicts