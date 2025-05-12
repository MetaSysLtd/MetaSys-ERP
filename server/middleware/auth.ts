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
    try {
      // Check if session exists
      if (!req.session) {
        return res.status(401).json({ 
          status: "error",
          message: "No session found",
          authenticated: false 
        });
      }

      // Check if user is authenticated
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ 
          status: "error",
          message: "Unauthorized: Please log in to access this resource",
          authenticated: false 
        });
      }

      // Add user info to request
      if (!req.user) {
        return res.status(401).json({
          status: "error", 
          message: "User data not found",
          authenticated: false
        });
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

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check session validity
    if (!req.session?.userId) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Unauthorized: Please log in to access this resource',
        authenticated: false,
        code: 'SESSION_MISSING'
      });
    }

    // Check session expiration
    const sessionExpiry = req.session?.cookie?.expires;
    if (sessionExpiry && new Date(sessionExpiry) < new Date()) {
      return res.status(401).json({
        status: 'error',
        message: 'Session expired: Please log in again',
        authenticated: false,
        code: 'SESSION_EXPIRED'
      });
    }

    // Add user info to request for subsequent middleware
    req.user = {
      id: req.session.userId,
      organizationId: req.session.organizationId
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next(error);
  }
};