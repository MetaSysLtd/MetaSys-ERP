import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { User, Role } from "@shared/schema";

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userRole?: Role;
      orgId?: number;
    }
  }
}

// Centralized authentication middleware with comprehensive error handling
export const createAuthMiddleware = (requiredRoleLevel: number = 1) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated via session
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          status: "error",
          error: "Unauthorized: Please log in to access this resource",
          missing: ["session"] 
        });
      }

      // Fetch the user from storage with error handling
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        // Clean up invalid session
        req.session.destroy((err) => {
          if (err) console.error("Session destruction error:", err);
        });
        return res.status(401).json({ 
          status: "error",
          error: "Unauthorized: User not found", 
          missing: ["user"] 
        });
      }

      // Ensure user has organization assignment
      if (!user.orgId) {
        try {
          const orgs = await storage.getOrganizations();
          if (orgs && orgs.length > 0) {
            await storage.updateUser(user.id, { orgId: orgs[0].id });
            user.orgId = orgs[0].id;
            console.log(`Auto-assigned user ${user.id} to default organization ${orgs[0].id}`);
          } else {
            return res.status(400).json({ 
              status: "error",
              error: "No organization available for user assignment", 
              missing: ["orgId"] 
            });
          }
        } catch (orgError) {
          console.error("Organization assignment error:", orgError);
          return res.status(500).json({ 
            status: "error",
            error: "Failed to assign user to organization", 
            missing: ["orgId"] 
          });
        }
      }

      // Fetch and validate user role
      let role = await storage.getRole(user.roleId);
      if (!role) {
        try {
          const defaultRole = await storage.getDefaultRole();
          if (defaultRole) {
            await storage.updateUser(user.id, { roleId: defaultRole.id });
            user.roleId = defaultRole.id;
            role = defaultRole;
            console.log(`Auto-assigned user ${user.id} to default role ${defaultRole.id}`);
          } else {
            return res.status(403).json({ 
              status: "error",
              error: "No role assigned and no default role available", 
              missing: ["role", "permissions"] 
            });
          }
        } catch (roleError) {
          console.error("Role assignment error:", roleError);
          return res.status(500).json({ 
            status: "error",
            error: "Failed to assign user role", 
            missing: ["role"] 
          });
        }
      }

      // Check role permission level
      if (role.level < requiredRoleLevel) {
        return res.status(403).json({ 
          status: "error",
          error: "Forbidden: Insufficient permissions", 
          missing: ["permissions"],
          details: `Required level: ${requiredRoleLevel}, Current level: ${role.level}`
        });
      }

      // Attach user data to request
      req.user = user;
      req.userRole = role;
      req.orgId = user.orgId;

      // Update session with latest data
      req.session.orgId = user.orgId;

      next();
    } catch (error) {
      console.error("Authentication middleware error:", error);
      return res.status(500).json({
        status: "error",
        error: "Internal authentication error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
};

// Session validation middleware
export const validateSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) {
    return res.status(500).json({
      status: "error",
      error: "Session not initialized"
    });
  }
  next();
};

// Organization context middleware
export const addOrgContext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user && req.user.orgId) {
      req.orgId = req.user.orgId;
    }
    next();
  } catch (error) {
    console.error("Organization context error:", error);
    next();
  }
};

// Basic auth setup function for compatibility
export const setupAuth = (app: any) => {
  // Login endpoint
  app.post("/auth/login", async (req: any, res: any) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          error: "Username and password are required" 
        });
      }

      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ 
          error: "Invalid credentials" 
        });
      }

      // For now, simple password check (in production, use proper hashing)
      if (user.password !== password) {
        return res.status(401).json({ 
          error: "Invalid credentials" 
        });
      }

      // Set session
      if (req.session) {
        req.session.userId = user.id;
        req.session.orgId = user.orgId;
      }

      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        message: "Login successful"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });

  // Auth check endpoint
  app.get("/auth/me", async (req: any, res: any) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Not authenticated" 
        });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ 
          error: "User not found" 
        });
      }

      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        authenticated: true,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });

  // Logout endpoint
  app.post("/auth/logout", (req: any, res: any) => {
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ 
            error: "Logout failed" 
          });
        }
        res.json({ message: "Logout successful" });
      });
    } else {
      res.json({ message: "Already logged out" });
    }
  });

  console.log("Auth middleware setup completed");
};