import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Authentication middleware
export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: 'Unauthorized: Please login to access this resource' });
  }

  // Add user role information to the request
  if (!req.userRole && req.user.roleId) {
    req.userRole = await storage.getRole(req.user.roleId);
  }

  next();
};

// Permission level middleware
export const checkPermission = (requiredLevel: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First, ensure user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Unauthorized: Please login to access this resource' });
    }

    // Get user role if not already loaded
    if (!req.userRole && req.user.roleId) {
      req.userRole = await storage.getRole(req.user.roleId);
    }

    // Check permission level
    if (!req.userRole || req.userRole.level < requiredLevel) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredLevel,
        current: req.userRole?.level || 0
      });
    }

    next();
  };
};

// Special permission middleware for modifying user profiles
export const checkUserModifyPermission = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: 'Unauthorized: Please login to access this resource' });
  }

  // Get user role if not already loaded
  if (!req.userRole && req.user.roleId) {
    req.userRole = await storage.getRole(req.user.roleId);
  }

  const targetUserId = parseInt(req.params.id);
  
  // Allow users to modify their own profile (except restricted fields)
  if (req.user.id === targetUserId) {
    // Check if restricted fields are being modified
    const restrictedFields = ['username', 'firstName', 'lastName', 'roleId'];
    const requestHasRestrictedFields = restrictedFields.some(field => field in req.body);
    
    // If user is trying to modify restricted fields, check permissions
    if (requestHasRestrictedFields) {
      // Allow admins (level 5+) or HR roles to modify restricted fields
      const roleName = req.userRole?.name?.toLowerCase() || '';
      const isHrRole = roleName.includes('hr') || roleName.includes('human resources');
      
      if (req.userRole?.level >= 5 || isHrRole) {
        return next();
      } else {
        return res.status(403).json({ 
          error: 'Insufficient permissions to modify restricted fields',
          restrictedFields
        });
      }
    }
    
    // No restricted fields being modified, allow the operation
    return next();
  }

  // If modifying another user, require admin level permissions
  if (req.userRole?.level >= 5) {
    return next();
  }
  
  // Special case for HR roles modifying employee profiles
  const roleName = req.userRole?.name?.toLowerCase() || '';
  const isHrRole = roleName.includes('hr') || roleName.includes('human resources');
  
  if (isHrRole) {
    return next();
  }

  return res.status(403).json({ error: 'Insufficient permissions to modify other user profiles' });
};

// Declare module augmentation for Request type
declare global {
  namespace Express {
    interface Request {
      userRole?: {
        id: number;
        name: string;
        level: number;
        [key: string]: any;
      };
    }
  }
}