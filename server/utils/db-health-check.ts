import { db, pool } from '../db';
import { roles, organizations, users } from '@shared/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { storage } from '../storage';
import { logger } from '../logger';

/**
 * Performs a comprehensive database sanity check and attempts to fix common issues
 */
export async function performDatabaseHealthCheck(): Promise<boolean> {
  logger.info('Starting database health check...');
  
  try {
    // Check basic database connectivity
    const result = await pool.query('SELECT 1 as connected');
    if (result[0].connected !== 1) {
      logger.error('Database connectivity check failed');
      return false;
    }
    logger.info('✓ Database connection is operational');
    
    // Ensure default roles exist
    try {
      await ensureDefaultRolesExist();
    } catch (error) {
      logger.error('Failed to set default role:', error);
    }
    
    // Ensure default organizations exist
    await ensureDefaultOrganizationExists();
    
    // Verify user data integrity
    await verifyUserData();
    
    logger.info('Database health check completed successfully');
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Ensures that default system roles exist
 */
async function ensureDefaultRolesExist() {
  const roleCount = await db.select({ count: db.fn.count() }).from(roles);
  
  if (parseInt(roleCount[0].count as string) === 0) {
    await db.insert(roles).values([
      {
        name: 'System Admin',
        department: 'admin',
        level: 10,
        isSystemAdmin: true,
        canAssignRoles: true,
        canManageOrganizations: true,
        canAccessAllOrgs: true,
        canManageUsers: true,
        canManageRoles: true
      },
      {
        name: 'Organization Admin',
        department: 'admin',
        level: 8,
        isSystemAdmin: false,
        canAssignRoles: true,
        canManageOrganizations: false,
        canAccessAllOrgs: false,
        canManageUsers: true,
        canManageRoles: true
      },
      {
        name: 'Sales Manager',
        department: 'sales',
        level: 7,
        isSystemAdmin: false,
        canAssignRoles: true,
        canManageOrganizations: false,
        canAccessAllOrgs: false,
        canManageUsers: true,
        canManageRoles: false
      },
      {
        name: 'Dispatch Manager',
        department: 'dispatch',
        level: 7,
        isSystemAdmin: false,
        canAssignRoles: true,
        canManageOrganizations: false,
        canAccessAllOrgs: false,
        canManageUsers: true,
        canManageRoles: false
      },
      {
        name: 'HR Manager',
        department: 'hr',
        level: 7,
        isSystemAdmin: false,
        canAssignRoles: true,
        canManageOrganizations: false,
        canAccessAllOrgs: false,
        canManageUsers: true,
        canManageRoles: false
      }
    ]);
    
    logger.info('✓ Default roles created');
  } else {
    logger.info(`✓ Roles exist (${roleCount[0].count} found)`);
  }
}

/**
 * Ensures that a default organization exists
 */
async function ensureDefaultOrganizationExists() {
  const orgCount = await db.select({ count: db.fn.count() }).from(organizations);
  
  if (parseInt(orgCount[0].count as string) === 0) {
    await db.insert(organizations).values([
      {
        name: 'MetaSys Systems',
        type: 'company',
        active: true,
        adminEmail: 'admin@metasys.com',
        description: 'Main system administrator organization'
      },
      {
        name: 'MetaSys Logistics',
        type: 'dispatch',
        active: true,
        adminEmail: 'dispatch@metasys.com',
        description: 'Logistics and dispatching operations'
      },
      {
        name: 'MetaSys Sales',
        type: 'sales',
        active: true,
        adminEmail: 'sales@metasys.com',
        description: 'Sales and account management'
      },
      {
        name: 'MetaSys Operations',
        type: 'operations',
        active: true,
        adminEmail: 'operations@metasys.com',
        description: 'Day-to-day business operations'
      }
    ]);
    
    logger.info('✓ Default organizations created');
  } else {
    logger.info(`✓ Organizations exist (${orgCount[0].count} found)`);
  }
}

/**
 * Verifies user data integrity and fixes common issues
 */
async function verifyUserData() {
  // Check for users with null/empty first/last names
  const userCount = await db.select({ count: db.fn.count() }).from(users);
  logger.info(`Checking ${userCount[0].count} user records...`);
  
  const usersWithIssues = await db
    .select()
    .from(users)
    .where(
      or(
        isNull(users.firstName),
        isNull(users.lastName),
        eq(users.firstName, ''),
        eq(users.lastName, ''),
        isNull(users.active)
      )
    );
  
  // Fix any issues found
  let fixedCount = 0;
  
  for (const user of usersWithIssues) {
    const updates: any = {};
    
    if (!user.firstName || user.firstName === '') {
      updates.firstName = 'User';
    }
    
    if (!user.lastName || user.lastName === '') {
      updates.lastName = user.id.toString();
    }
    
    if (user.active === null || user.active === undefined) {
      updates.active = true;
    }
    
    if (Object.keys(updates).length > 0) {
      await db
        .update(users)
        .set(updates)
        .where(eq(users.id, user.id));
      
      fixedCount++;
    }
  }
  
  logger.info(`✓ User verification complete. Fixed ${fixedCount} users`);
}

// Helper function for the where clause
function or(...conditions) {
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  
  return conditions.reduce((acc, condition) => {
    if (!acc) return condition;
    return db.sql`(${acc} OR ${condition})`;
  });
}