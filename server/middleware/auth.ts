import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Add type definitions for ExpressJS to recognize the user object
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      firstName: string;
      lastName: string;
      roleId: number;
      [key: string]: any;
    }

    interface Request {
      userRole?: {
        id: number;
        name: string;
        description: string | null;
        level: number;
        department: string;
        permissions: any;
        isAdmin: boolean;
        canManageUsers: boolean;
      };
    }
  }
}

// Middleware for checking authentication and minimum role level
export function auth(minimumLevel: number = 1) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.session || !req.isAuthenticated || !req.isAuthenticated()) {
      if (req.session) {
        req.session.destroy((err) => {
          if (err) console.error('Session destruction error:', err);
        });
      }
      return res.status(401).json({ error: "Unauthorized: Please log in to access this resource" });
    }

    // If no minimum level is required or user is admin, proceed
    if (minimumLevel <= 0) {
      return next();
    }

    // Check user's role if minimum level is required
    try {
      // Get user role
      const role = await storage.getRole(req.user?.roleId);

      // Store user role in request for later use
      req.userRole = role;

      // Check if role meets minimum level requirement
      if (!role || role.level < minimumLevel) {
        return res.status(403).json({ 
          error: "Forbidden: You don't have permission to access this resource",
          requiredLevel: minimumLevel,
          currentLevel: role?.level || 0
        });
      }

      // User has sufficient permission
      return next();

    } catch (error) {
      console.error("Error in auth middleware:", error);
      return res.status(500).json({ error: "Internal server error during authentication" });
    }
  };
}

// Middleware for checking if user is an admin
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  return auth(3)(req, res, next);
}

// Simple middleware for checking if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized: Please log in to access this resource" });
  }
  return next();
}