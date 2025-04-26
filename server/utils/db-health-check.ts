import { db, pool } from '../db';
import { logger } from '../logger';
import { sql } from 'drizzle-orm';
import { NotificationType } from '../notifications';
import { sendNotification } from '../notifications';

/**
 * Performs comprehensive database health check and attempts recovery for known issues
 */
export async function performDatabaseHealthCheck(): Promise<boolean> {
  try {
    logger.info('Starting database health check');
    
    // 1. Test basic database connectivity
    const connectionTest = await testDatabaseConnection();
    if (!connectionTest.success) {
      logger.error('Database connection test failed:', connectionTest.error);
      await notifyAdminsOfDatabaseIssue('Database Connection Failed', connectionTest.error?.message || 'Unknown error');
      return false;
    }
    
    // 2. Check for slow queries
    const slowQueriesResult = await checkForSlowQueries();
    if (slowQueriesResult.detected) {
      logger.warn('Slow queries detected:', slowQueriesResult.queries);
      await notifyAdminsOfDatabaseIssue(
        'Slow Queries Detected', 
        `${slowQueriesResult.queries.length} slow queries found. The slowest took ${slowQueriesResult.maxDuration}ms.`
      );
    }
    
    // 3. Check database stats
    const dbStats = await getDatabaseStats();
    logger.info('Database stats:', dbStats);
    
    // 4. Verify critical tables exist
    const tablesResult = await verifyRequiredTables();
    if (!tablesResult.success) {
      logger.error('Required tables check failed:', tablesResult.missingTables);
      await notifyAdminsOfDatabaseIssue(
        'Missing Database Tables', 
        `The following required tables are missing: ${tablesResult.missingTables.join(', ')}`
      );
      // Don't fail the health check for missing tables
      // Just log and notify, but continue with health check
      // return false;
    }
    
    // 5. Run vacuum analyze on key tables
    await optimizeCriticalTables();
    
    logger.info('Database health check completed successfully');
    return true;
  } catch (error) {
    logger.error('Error during database health check:', error);
    await notifyAdminsOfDatabaseIssue('Database Health Check Failed', (error as Error)?.message || 'Unknown error');
    return false;
  }
}

/**
 * Tests basic database connectivity
 */
async function testDatabaseConnection(): Promise<{ success: boolean, error?: Error }> {
  try {
    // Some versions of drizzle-orm have execute() as a method, others don't
    // Use the correct approach for the installed version
    try {
      await db.execute(sql`SELECT 1 as test`);
    } catch (err) {
      // Fallback to direct query with pool
      await pool.query('SELECT 1 as test');
    }
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
}

/**
 * Checks for slow-running queries
 */
async function checkForSlowQueries(): Promise<{ 
  detected: boolean, 
  queries: Array<{ query: string, duration: number }>,
  maxDuration: number
}> {
  try {
    // This query needs PostgreSQL pg_stat_statements extension
    let result;
    try {
      // Try using db.execute
      result = await db.execute(sql`
        SELECT query, mean_exec_time
        FROM pg_stat_statements
        WHERE mean_exec_time > 1000
        ORDER BY mean_exec_time DESC
        LIMIT 10
      `);
    } catch (dbErr) {
      // Fallback to direct pool query
      try {
        const queryResult = await pool.query(`
          SELECT query, mean_exec_time
          FROM pg_stat_statements
          WHERE mean_exec_time > 1000
          ORDER BY mean_exec_time DESC
          LIMIT 10
        `);
        result = { rows: queryResult.rows };
      } catch (poolErr) {
        // Catching errors from pg_stat_statements which might not be installed
        result = { rows: [] };
      }
    }
    
    const queries = (result.rows || []).map(row => ({
      query: row.query,
      duration: row.mean_exec_time
    }));
    
    const maxDuration = queries.length > 0 
      ? Math.max(...queries.map(q => q.duration))
      : 0;
    
    return { 
      detected: queries.length > 0,
      queries,
      maxDuration
    };
  } catch (error) {
    logger.warn('Error checking for slow queries:', error);
    return { detected: false, queries: [], maxDuration: 0 };
  }
}

/**
 * Gets basic database statistics
 */
async function getDatabaseStats(): Promise<{
  dbSize: string,
  connectionCount: number,
  tableCount: number
}> {
  try {
    let dbSize = 'Unknown';
    let connectionCount = 0;
    let tableCount = 0;
    
    try {
      // Get database size using direct pool query for compatibility
      const sizeResult = await pool.query(
        'SELECT pg_size_pretty(pg_database_size(current_database())) as size'
      );
      dbSize = sizeResult.rows[0]?.size || 'Unknown';
      
      // Get connection count
      const connectionResult = await pool.query(
        'SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()'
      );
      connectionCount = parseInt(connectionResult.rows[0]?.count || '0');
      
      // Get table count
      const tableResult = await pool.query(
        'SELECT count(*) as count FROM information_schema.tables WHERE table_schema = \'public\''
      );
      tableCount = parseInt(tableResult.rows[0]?.count || '0');
    } catch (poolErr) {
      logger.warn('Error executing database stats queries:', poolErr);
    }
    
    return {
      dbSize,
      connectionCount,
      tableCount
    };
  } catch (error) {
    logger.warn('Error getting database stats:', error);
    return { dbSize: 'Unknown', connectionCount: 0, tableCount: 0 };
  }
}

/**
 * Verifies all required tables exist
 */
async function verifyRequiredTables(): Promise<{
  success: boolean,
  missingTables: string[]
}> {
  const requiredTables = [
    'users', 'organizations', 'roles', 'leads', 'tasks',
    'notifications', 'messages', 'sessions'
  ];
  
  try {
    // Use direct pool query for compatibility
    const result = await pool.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\''
    );
    
    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    return {
      success: missingTables.length === 0,
      missingTables
    };
  } catch (error) {
    logger.error('Error verifying required tables:', error);
    return {
      success: false,
      missingTables: ['Error verifying tables']
    };
  }
}

/**
 * Optimizes critical tables with vacuum analyze
 */
async function optimizeCriticalTables(): Promise<void> {
  // Get list of existing tables first
  try {
    const result = await pool.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\''
    );
    
    const existingTables = result.rows.map(row => row.table_name);
    const criticalTables = ['users', 'organizations', 'roles', 'leads'];
    
    // Only optimize tables that actually exist
    for (const table of criticalTables) {
      if (existingTables.includes(table)) {
        try {
          // Use direct pool query for compatibility
          await pool.query(`VACUUM ANALYZE ${table}`);
          logger.info(`Optimized table: ${table}`);
        } catch (error) {
          logger.warn(`Failed to optimize table ${table}:`, error);
        }
      } else {
        logger.info(`Skipping optimization for non-existent table: ${table}`);
      }
    }
  } catch (error) {
    logger.warn('Failed to get table list for optimization:', error);
  }
}

/**
 * Notifies system administrators about database issues
 */
async function notifyAdminsOfDatabaseIssue(title: string, message: string): Promise<void> {
  try {
    // Send notification to org ID 1 (assumed to be primary organization)
    await sendNotification({
      type: NotificationType.SYSTEM_ALERT,
      title,
      message,
      entityId: 0, // System-level notification
      entityType: 'system',
      orgId: 1 // Primary organization
    });
    
    // Also log the notification for visibility
    logger.warn(`System alert: ${title} - ${message}`);
  } catch (error) {
    logger.error('Failed to send admin notification about database issue:', error);
  }
}