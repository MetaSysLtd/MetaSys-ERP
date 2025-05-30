import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { organizations, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * This middleware injects the organization context into the request.
 * It sets req.orgId based on the user's selected organization or the default one.
 */
export const organizationMiddleware = async (req: any, res: Response, next: NextFunction) => {
  // Check if the user is authenticated via session
  if (!req.session?.userId) {
    return next();
  }

  try {
    // Get the organization ID from the session or from the request headers
    let orgId = req.session?.orgId;
    
    // If no organization is selected in session, check for org in headers
    if (!orgId && req.headers['x-organization-id']) {
      orgId = parseInt(req.headers['x-organization-id'] as string, 10);
    }
    
    // If still no organization selected, try to load the user and use their default org if assigned
    if (!orgId && req.session?.userId) {
      try {
        // Import would create circular dependency, so we'll use db directly
        const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
        if (user?.orgId) {
          orgId = user.orgId;
        }
      } catch (err) {
        console.error('Error loading user in middleware:', err);
      }
    }
    
    // If no org selected and user has no default, find or create a default org
    if (!orgId) {
      // Find the first active organization
      const [defaultOrg] = await db.select().from(organizations).where(eq(organizations.active, true)).limit(1);
      
      // If no organization exists, create a default one
      if (!defaultOrg) {
        const [newOrg] = await db.insert(organizations).values({
          name: 'Default Organization',
          code: 'DEFAULT',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        
        orgId = newOrg.id;
      } else {
        orgId = defaultOrg.id;
      }
      
      // Save this orgId to the session
      if (req.session) {
        req.session.orgId = orgId;
      }
    }
    
    // Set the orgId on the request object for use in route handlers
    req.orgId = orgId;
  } catch (error) {
    console.error('Error in organization middleware:', error);
  }
  
  next();
};

// Extend Express Request interface to include orgId property
declare global {
  namespace Express {
    interface Request {
      orgId?: number;
    }
    
    interface Session {
      orgId?: number;
    }
  }
}