import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { logger } from '../logger';
import { AuthenticationError, AuthorizationError } from './error-handler';

// Enhanced Auth middleware function with improved session handling
export const createAuthMiddleware = (requiredRoleLevel: number = 1) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Log authentication attempt for debugging
      const sessionInfo = req.session ? {
        hasSession: true,
        sessionData: { userId: req.session.userId, orgId: req.session.orgId }
      } : { hasSession: false };
      
      console.log(`Auth check for session: ${req.sessionID}`, sessionInfo);
      
      // Check if user is authenticated via session
      if (!req.session || !req.session.userId) {
        logger.warn(`Authentication failed: No valid session or userId for path ${req.method} ${req.path}`);
        console.log(`No valid session or userId found: ${req.sessionID || 'no session id'}`);
        
        // Always save session state changes
        if (req.session) {
          console.log('Session exists but no userId in it:', {
            sessionID: req.sessionID,
            sessionData: req.session
          });
          
          await new Promise<void>((resolve) => {
            req.session.save(() => resolve());
          });
        }
        
        return res.status(401).json({ 
          status: "error",
          message: "Unauthorized: Please log in to access this resource",
          authenticated: false
        });
      }

      // Fetch the user from storage
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        logger.warn(`Authentication failed: User not found for userId ${req.session.userId}`);
        
        // Save and then destroy the session to ensure proper cleanup
        await new Promise<void>((resolve) => {
          req.session.userId = undefined;
          req.session.orgId = undefined;
          req.session.save(() => {
            req.session.destroy(() => {
              resolve();
            });
          });
        });
        
        return res.status(401).json({ 
          status: "error",
          message: "Unauthorized: User not found", 
          authenticated: false
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
            
            // Save the session with updated organization
            req.session.orgId = orgs[0].id;
            await new Promise<void>((resolve) => {
              req.session.save(() => resolve());
            });
            
            logger.info(`Assigned user ${user.id} to default organization ${orgs[0].id}`);
          } else {
            return res.status(400).json({ 
              status: "error",
              message: "Invalid user structure. Missing orgId and no default organization available."
            });
          }
        } catch (orgError) {
          logger.error("Error assigning default organization:", orgError);
          return res.status(400).json({ 
            status: "error",
            message: "Failed to assign default organization"
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
            logger.info(`Assigned user ${user.id} to default role ${defaultRole.id}`);
            
            // Now fetch the role again
            const updatedRole = await storage.getRole(defaultRole.id);
            if (updatedRole) {
              req.user = user;
              req.userRole = updatedRole;
              
              // Check if the role level is sufficient after fixing
              if (updatedRole.level < requiredRoleLevel) {
                return res.status(403).json({ 
                  status: "error",
                  message: `Forbidden: Insufficient permissions. Required level: ${requiredRoleLevel}, Current level: ${updatedRole.level}`
                });
              }
              
              next();
              return;
            }
          }
        } catch (roleError) {
          logger.error("Error assigning default role:", roleError);
        }
        
        return res.status(403).json({ 
          status: "error",
          message: "User is not assigned to any role. Contact Admin."
        });
      }

      // Check if the user's role level is sufficient
      if (role.level < requiredRoleLevel) {
        return res.status(403).json({ 
          status: "error",
          message: `Forbidden: Insufficient permissions. Required level: ${requiredRoleLevel}, Current level: ${role.level}`
        });
      }

      // Add user and role to the request object for use in route handlers
      req.user = user;
      req.userRole = role;
      
      // Log successful authentication for debugging purposes
      logger.debug(`User ${user.id} (${user.username}) authenticated for ${req.method} ${req.path}`);
      
      next();
    } catch (error) {
      logger.error("Auth middleware error:", error);
      next(error);
    }
  };
};

// Standalone session check middleware that only verifies session existence
// This is used as a lightweight check for routes that don't need full role validation
export function sessionAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth for public routes
  if (req.path.startsWith('/api/public/') || 
      req.path === '/api/auth/login' || 
      req.path === '/api/auth/me' ||
      req.path === '/api/auth/register') {
    console.log(`Skipping auth check for public route: ${req.path}`);
    return next();
  }
  
  // Check if user is authenticated via session
  if (!req.session || !req.session.userId) {
    logger.debug(`Session check failed for ${req.method} ${req.path}`);
    return res.status(401).json({ 
      authenticated: false 
    });
  }
  
  // Authenticated, proceed
  next();
}

// Role authorization middleware
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip in development if specified
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      return next();
    }
    
    if (!req.userRole || !roles.includes(req.userRole.department)) {
      return next(new AuthorizationError('You do not have permission to access this resource'));
    }
    next();
  };
}

// Admin authorization middleware
export function requireAdmin() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip in development if specified
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      return next();
    }
    
    if (!req.userRole || req.userRole.level < 5) {
      return next(new AuthorizationError('This action requires administrator privileges'));
    }
    next();
  };
}

// Permission check middleware
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip in development if specified
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      return next();
    }
    
    if (!req.userRole || !(req.userRole.permissions && req.userRole.permissions.includes(permission))) {
      return next(new AuthorizationError(`You lack the required permission: ${permission}`));
    }
    next();
  };
}