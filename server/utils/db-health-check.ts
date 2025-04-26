import { db } from '../db';
import { storage } from '../storage';
import { roles, users, organizations } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Performs a comprehensive database sanity check and attempts to fix common issues
 */
export async function performDatabaseHealthCheck() {
  console.log('Starting database health check...');
  
  try {
    // Check database connectivity using a simple query
    const result = await db.execute("SELECT 1 as connected");
    console.log('✓ Database connection is operational');
    
    // Check and create default roles if necessary
    await ensureDefaultRolesExist();
    
    // Check and create default organization if necessary
    await ensureDefaultOrganizationExists();
    
    // Verify user data and fix any issues
    await verifyUserData();
    
    console.log('Database health check completed successfully');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    throw error;
  }
}

/**
 * Ensures that default system roles exist
 */
async function ensureDefaultRolesExist() {
  const existingRoles = await db.select().from(roles);
  
  if (existingRoles.length === 0) {
    console.log('No roles found, creating default roles...');
    
    // Create Administrator role
    await storage.createRole({
      name: "Administrator",
      department: "admin",
      level: 5,
      permissions: ["all"],
      isDefault: false
    });
    
    // Create default user role
    await storage.createRole({
      name: "User",
      department: "general",
      level: 1,
      permissions: ["basic"],
      isDefault: true
    });
    
    console.log('✓ Default roles created');
  } else {
    // Check if there's a default role
    const defaultRole = existingRoles.find(role => role.isDefault);
    
    if (!defaultRole) {
      // Set the role with the lowest level as default
      const lowestLevelRole = existingRoles.reduce((prev, curr) => 
        prev.level < curr.level ? prev : curr
      );
      
      try {
        await db.update(roles)
          .set({ isDefault: true })
          .where(eq(roles.id, lowestLevelRole.id));
        
        console.log(`✓ Set role "${lowestLevelRole.name}" as default`);
      } catch (error) {
        console.error('Failed to set default role:', error);
      }
    } else {
      console.log(`✓ Default role exists: "${defaultRole.name}"`);
    }
  }
}

/**
 * Ensures that a default organization exists
 */
async function ensureDefaultOrganizationExists() {
  const existingOrgs = await db.select().from(organizations);
  
  if (existingOrgs.length === 0) {
    console.log('No organizations found, creating default organization...');
    
    await storage.createOrganization({
      name: "Default Organization",
      code: "DEFAULT",
      active: true
    });
    
    console.log('✓ Default organization created');
  } else {
    console.log(`✓ Organizations exist (${existingOrgs.length} found)`);
  }
}

/**
 * Verifies user data integrity and fixes common issues
 */
async function verifyUserData() {
  const allUsers = await db.select().from(users);
  console.log(`Checking ${allUsers.length} user records...`);
  
  let fixedCount = 0;
  
  for (const user of allUsers) {
    let needsUpdate = false;
    const updates: any = {};
    
    // Check if user has a role
    if (!user.roleId) {
      const defaultRole = await storage.getDefaultRole();
      if (defaultRole) {
        updates.roleId = defaultRole.id;
        needsUpdate = true;
        console.log(`Assigning default role to user ${user.id} (${user.username})`);
      }
    }
    
    // Check if user has an organization
    if (!user.orgId) {
      const orgs = await storage.getOrganizations();
      if (orgs && orgs.length > 0) {
        updates.orgId = orgs[0].id;
        needsUpdate = true;
        console.log(`Assigning default organization to user ${user.id} (${user.username})`);
      }
    }
    
    // Apply fixes if needed
    if (needsUpdate) {
      try {
        await storage.updateUser(user.id, updates);
        fixedCount++;
      } catch (error) {
        console.error(`Failed to update user ${user.id}:`, error);
      }
    }
  }
  
  console.log(`✓ User verification complete. Fixed ${fixedCount} users`);
}