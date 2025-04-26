import { Request, Response, NextFunction } from 'express';
import { users, roles, permissions, rolePermissions } from '@shared/schema';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { PERMISSIONS } from '@shared/constants';
import { logger } from '../logger';

/**
 * Interface representing a user's permissions
 */
interface UserPermissions {
  userId: number;
  orgId: number | null;
  isSystemAdmin: boolean;
  permissions: string[];
  cachedAt: Date;
}

// Cache to store user permissions to avoid repeated database queries
const permissionsCache = new Map<string, UserPermissions>();
const PERMISSIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch permissions for a user from database
 * @param userId - User ID
 * @param orgId - Organization ID
 * @returns Promise resolving to list of permission codes
 */
export async function fetchUserPermissions(userId: number, orgId: number | null): Promise<string[]> {
  try {
    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return [];
    }

    // If user is system admin, they have all permissions
    if (user.isSystemAdmin) {
      return Object.values(PERMISSIONS);
    }

    // Get user's role
    const [userRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, user.roleId));
    
    if (!userRole) {
      return [];
    }

    // Get permissions for the role
    const rolePerms = await db
      .select({
        permissionCode: permissions.code
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(rolePermissions.roleId, userRole.id));

    return rolePerms.map(p => p.permissionCode);
  } catch (error) {
    logger.error('Error fetching user permissions:', error);
    return [];
  }
}

/**
 * Get permissions for a user with caching
 * @param userId - User ID
 * @param orgId - Organization ID
 * @returns Promise resolving to list of permission codes
 */
export async function getUserPermissions(userId: number, orgId: number | null): Promise<string[]> {
  const cacheKey = `${userId}-${orgId}`;
  const cachedPermissions = permissionsCache.get(cacheKey);
  
  // Return cached permissions if they exist and are still valid
  if (cachedPermissions && (Date.now() - cachedPermissions.cachedAt.getTime() < PERMISSIONS_CACHE_TTL)) {
    return cachedPermissions.permissions;
  }
  
  // Fetch fresh permissions
  const permissions = await fetchUserPermissions(userId, orgId);
  
  // Cache the result
  permissionsCache.set(cacheKey, {
    userId,
    orgId,
    isSystemAdmin: permissions.length === Object.values(PERMISSIONS).length,
    permissions,
    cachedAt: new Date()
  });
  
  return permissions;
}

/**
 * Clear permissions cache for a user
 * @param userId - User ID
 * @param orgId - Optional organization ID
 */
export function clearPermissionsCache(userId: number, orgId?: number | null): void {
  if (orgId !== undefined) {
    // Clear specific user-org cache
    permissionsCache.delete(`${userId}-${orgId}`);
  } else {
    // Clear all caches for this user
    for (const [key, value] of permissionsCache.entries()) {
      if (value.userId === userId) {
        permissionsCache.delete(key);
      }
    }
  }
}

/**
 * Check if a user has a specific permission
 * @param userId - User ID
 * @param orgId - Organization ID
 * @param permission - Permission code to check
 * @returns Promise resolving to boolean
 */
export async function userHasPermission(
  userId: number, 
  permission: string, 
  orgId: number | null = null
): Promise<boolean> {
  const permissions = await getUserPermissions(userId, orgId);
  return permissions.includes(permission);
}

/**
 * Express middleware to check if the current user has a specific permission
 * @param permission - Permission code to check
 * @returns Express middleware function
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // No user in request
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Authentication required' 
        });
      }
      
      const userId = req.user.id;
      const orgId = req.user.orgId || null;
      
      // Check system admin status first (quick check)
      if (req.user.isSystemAdmin) {
        return next();
      }
      
      // Check specific permission
      const hasPermission = await userHasPermission(userId, permission, orgId);
      
      if (hasPermission) {
        return next();
      }
      
      // Permission denied
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not have permission to perform this action' 
      });
    } catch (error) {
      logger.error(`Permission check error for "${permission}":`, error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while checking permissions' 
      });
    }
  };
}

/**
 * Express middleware to check if the current user has at least one of the specified permissions
 * @param requiredPermissions - Array of permission codes to check
 * @returns Express middleware function
 */
export function requireAnyPermission(requiredPermissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // No user in request
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Authentication required' 
        });
      }
      
      const userId = req.user.id;
      const orgId = req.user.orgId || null;
      
      // Check system admin status first (quick check)
      if (req.user.isSystemAdmin) {
        return next();
      }
      
      // Get all user permissions
      const userPermissions = await getUserPermissions(userId, orgId);
      
      // Check if user has at least one of the required permissions
      const hasAnyPermission = requiredPermissions.some(perm => 
        userPermissions.includes(perm)
      );
      
      if (hasAnyPermission) {
        return next();
      }
      
      // Permission denied
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not have permission to perform this action' 
      });
    } catch (error) {
      logger.error(`Permission check error:`, error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while checking permissions' 
      });
    }
  };
}

/**
 * Express middleware to check if the current user has all of the specified permissions
 * @param requiredPermissions - Array of permission codes to check
 * @returns Express middleware function
 */
export function requireAllPermissions(requiredPermissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // No user in request
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Authentication required' 
        });
      }
      
      const userId = req.user.id;
      const orgId = req.user.orgId || null;
      
      // Check system admin status first (quick check)
      if (req.user.isSystemAdmin) {
        return next();
      }
      
      // Get all user permissions
      const userPermissions = await getUserPermissions(userId, orgId);
      
      // Check if user has all of the required permissions
      const hasAllPermissions = requiredPermissions.every(perm => 
        userPermissions.includes(perm)
      );
      
      if (hasAllPermissions) {
        return next();
      }
      
      // Permission denied
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not have all required permissions to perform this action' 
      });
    } catch (error) {
      logger.error(`Permission check error:`, error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while checking permissions' 
      });
    }
  };
}

/**
 * Express middleware to restrict access to system administrators only
 * @returns Express middleware function
 */
export function requireSystemAdmin() {
  return (req: Request, res: Response, next: NextFunction) => {
    // No user in request
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }
    
    // Check system admin flag
    if (req.user.isSystemAdmin) {
      return next();
    }
    
    // Access denied
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'System administrator access required' 
    });
  };
}

/**
 * Express middleware to restrict access to the organization's admin users
 * @returns Express middleware function
 */
export function requireOrganizationAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // No user in request
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Authentication required' 
        });
      }
      
      // System admins have access to everything
      if (req.user.isSystemAdmin) {
        return next();
      }
      
      // Check if user has the org admin permission
      const hasOrgAdminPermission = await userHasPermission(
        req.user.id, 
        PERMISSIONS.MANAGE_ORGANIZATION, 
        req.user.orgId || null
      );
      
      if (hasOrgAdminPermission) {
        return next();
      }
      
      // Access denied
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Organization administrator access required' 
      });
    } catch (error) {
      logger.error('Organization admin check error:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while checking permissions' 
      });
    }
  };
}