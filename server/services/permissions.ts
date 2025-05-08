import { Request, Response, NextFunction } from 'express';
import { users, roles, permissionTemplates } from '@shared/schema';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
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

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Gets user permissions from the database or cache
 */
export async function getUserPermissions(userId: number): Promise<UserPermissions | null> {
  const cacheKey = `permissions_${userId}`;
  const now = new Date();
  
  // Check if permissions are cached and not expired
  const cached = permissionsCache.get(cacheKey);
  if (cached && now.getTime() - cached.cachedAt.getTime() < CACHE_DURATION) {
    return cached;
  }
  
  try {
    // Get user with role
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        role: true
      }
    });
    
    if (!user || !user.role) {
      return null;
    }
    
    // Get the user's permissions
    const isSystemAdmin = user.role.level >= 5 || !!user.isSystemAdmin;
    let permissions: string[] = [];
    
    // If user has a role, get permissions from the role
    if (user.role.permissions) {
      permissions = Array.isArray(user.role.permissions) 
        ? user.role.permissions 
        : [];
    }
    
    // Get template permissions if available
    if (user.role.templateId) {
      const template = await db.query.permissionTemplates.findFirst({
        where: eq(permissionTemplates.id, user.role.templateId)
      });
      
      if (template && template.permissions) {
        const templatePermissions = template.permissions as string[];
        permissions = [...new Set([...permissions, ...templatePermissions])];
      }
    }
    
    // If user is system admin, grant all permissions
    if (isSystemAdmin) {
      permissions.push('*'); // Wildcard permission
    }
    
    // Cache the permissions
    const userPermissions: UserPermissions = {
      userId,
      orgId: user.orgId,
      isSystemAdmin,
      permissions,
      cachedAt: now
    };
    
    permissionsCache.set(cacheKey, userPermissions);
    return userPermissions;
  } catch (error) {
    logger.error('Error retrieving user permissions:', error);
    return null;
  }
}

/**
 * Clears the permissions cache for a specific user
 */
export function clearUserPermissionsCache(userId: number): void {
  const cacheKey = `permissions_${userId}`;
  permissionsCache.delete(cacheKey);
}

/**
 * Clears the entire permissions cache
 */
export function clearAllPermissionsCache(): void {
  permissionsCache.clear();
}

/**
 * Middleware to check if a user has a specific permission
 */
export function hasPermission(requiredPermission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Please log in' });
    }
    
    try {
      const userPermissions = await getUserPermissions(req.user.id);
      
      if (!userPermissions) {
        return res.status(403).json({ error: 'Forbidden: Permissions not available' });
      }
      
      // System admins have all permissions
      if (userPermissions.isSystemAdmin) {
        return next();
      }
      
      // Check if user has the required permission or a wildcard
      if (
        userPermissions.permissions.includes(requiredPermission) || 
        userPermissions.permissions.includes('*')
      ) {
        return next();
      }
      
      // Check for module wildcard permission
      // Example: If requiredPermission is 'crm.leads.view', check for 'crm.*'
      const moduleName = requiredPermission.split('.')[0];
      if (userPermissions.permissions.includes(`${moduleName}.*`)) {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions',
        missing: [requiredPermission]
      });
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({ error: 'Internal server error during permission check' });
    }
  };
}

/**
 * Checks if a user has a specific permission (non-middleware version)
 */
export async function checkPermission(
  userId: number, 
  requiredPermission: string
): Promise<boolean> {
  try {
    const userPermissions = await getUserPermissions(userId);
    
    if (!userPermissions) {
      return false;
    }
    
    // System admins have all permissions
    if (userPermissions.isSystemAdmin) {
      return true;
    }
    
    // Check if user has the required permission or a wildcard
    if (
      userPermissions.permissions.includes(requiredPermission) || 
      userPermissions.permissions.includes('*')
    ) {
      return true;
    }
    
    // Check for module wildcard permission
    const moduleName = requiredPermission.split('.')[0];
    if (userPermissions.permissions.includes(`${moduleName}.*`)) {
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Permission check error:', error);
    return false;
  }
}

/**
 * Middleware to check if a user has a specific role level
 */
export function hasRoleLevel(requiredLevel: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Please log in' });
    }
    
    try {
      // Get user's role
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
        with: {
          role: true
        }
      });
      
      if (!user || !user.role) {
        return res.status(403).json({ error: 'Forbidden: User role not found' });
      }
      
      // Check if user's role level is sufficient
      if (user.role.level < requiredLevel) {
        return res.status(403).json({
          error: 'Forbidden: Insufficient role level',
          details: `Required level: ${requiredLevel}, Current level: ${user.role.level}`
        });
      }
      
      return next();
    } catch (error) {
      logger.error('Role level check error:', error);
      return res.status(500).json({ error: 'Internal server error during role check' });
    }
  };
}