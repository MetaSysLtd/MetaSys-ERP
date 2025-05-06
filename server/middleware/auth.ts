import { Request, Response, NextFunction } from 'express';
import { storage } from "../storage";

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ error: "Unauthorized: Please log in" });
}

// Create middleware for checking role level authorization
export function createAuthMiddleware(requiredLevel: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }
    
    // Get user role
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Invalid user" });
    }
    
    try {
      // Get user from storage
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }
      
      // Get role
      const role = await storage.getRole(user.roleId);
      if (!role) {
        return res.status(403).json({ error: "Forbidden: Role not found" });
      }
      
      // Check if role level is sufficient
      if (role.level < requiredLevel) {
        return res.status(403).json({ 
          error: "Forbidden: Insufficient permissions",
          required: requiredLevel,
          current: role.level
        });
      }
      
      // Add role to request object for convenience
      req.userRole = role;
      
      // Proceed to the next middleware/route handler
      next();
    } catch (error) {
      console.error("Error in auth middleware:", error);
      res.status(500).json({ error: "Server error during authorization" });
    }
  };
}