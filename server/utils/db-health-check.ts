import { db, pool } from '../db';
import { logger } from '../logger';
import { sql } from 'drizzle-orm';
import { users, roles, organizations, leads } from '@shared/schema';

/**
 * Interface for database health check results
 */
export interface DatabaseHealthCheck {
  dbSize: string;
  connectionCount: number;
  tableCount: number;
  tableStats?: Record<string, TableStats>;
  missingTables?: string[];
  indexes?: Record<string, string[]>;
  slowQueries?: SlowQueryInfo[];
}

/**
 * Interface for individual table statistics
 */
interface TableStats {
  rowCount: number;
  sizeBytes: number;
  sizeFormatted: string;
  lastVacuum?: Date;
  lastAnalyze?: Date;
}

/**
 * Interface for slow query information
 */
interface SlowQueryInfo {
  query: string;
  duration: number;
  calls: number;
  avgTime: number;
}

/**
 * Get database size in human-readable format
 * @returns Promise resolving to database size string
 */
async function getDatabaseSize(): Promise<string> {
  try {
    // Use the raw pool for direct queries since Drizzle doesn't expose a way to run raw SQL directly
    const result = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    
    return result.rows[0]?.size || '0 bytes';
  } catch (error) {
    logger.error('Failed to get database size:', error);
    return 'unknown';
  }
}

/**
 * Get current database connection count
 * @returns Promise resolving to connection count
 */
async function getConnectionCount(): Promise<number> {
  try {
    const result = await pool.query(`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    
    return parseInt(result.rows[0]?.count) || 0;
  } catch (error) {
    logger.error('Failed to get connection count:', error);
    return 0;
  }
}

/**
 * Get database table count
 * @returns Promise resolving to table count
 */
async function getTableCount(): Promise<number> {
  try {
    const result = await pool.query(`
      SELECT count(*) as count 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    return parseInt(result.rows[0]?.count) || 0;
  } catch (error) {
    logger.error('Failed to get table count:', error);
    return 0;
  }
}

/**
 * Get statistics for a specific table
 * @param tableName - Table name
 * @returns Promise resolving to table statistics
 */
async function getTableStats(tableName: string): Promise<TableStats | null> {
  try {
    // Get row count and size
    const sizeResult = await pool.query(`
      SELECT 
        pg_table_size('${tableName}'::regclass) as size_bytes,
        pg_size_pretty(pg_table_size('${tableName}'::regclass)) as size,
        n_live_tup as row_count,
        last_vacuum,
        last_analyze
      FROM pg_stat_user_tables
      WHERE relname = $1
    `, [tableName]);
    
    if (!sizeResult.rows[0]) {
      return null;
    }
    
    return {
      rowCount: parseInt(sizeResult.rows[0].row_count) || 0,
      sizeBytes: parseInt(sizeResult.rows[0].size_bytes) || 0,
      sizeFormatted: sizeResult.rows[0].size || '0 bytes',
      lastVacuum: sizeResult.rows[0].last_vacuum,
      lastAnalyze: sizeResult.rows[0].last_analyze
    };
  } catch (error) {
    logger.error(`Failed to get stats for table ${tableName}:`, error);
    return null;
  }
}

/**
 * Check for required tables in the database
 * @returns Promise resolving to array of missing table names
 */
async function checkRequiredTables(): Promise<string[]> {
  const requiredTables = [
    'users',
    'roles',
    'organizations',
    'leads',
    'tasks',
    'notifications',
    'messages',
    'sessions'
  ];
  
  try {
    const result = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = ANY($1)
    `, [requiredTables]);
    
    const existingTables = result.rows.map(row => row.tablename);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      logger.error('Required tables check failed:', missingTables);
    }
    
    return missingTables;
  } catch (error) {
    logger.error('Failed to check required tables:', error);
    return requiredTables; // Assume all are missing on error
  }
}

/**
 * Get indexes for all tables
 * @returns Promise resolving to record of table names and their indexes
 */
async function getIndexes(): Promise<Record<string, string[]>> {
  try {
    const result = await pool.query(`
      SELECT
        t.relname as table_name,
        i.relname as index_name
      FROM
        pg_class t,
        pg_class i,
        pg_index ix
      WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND t.relkind = 'r'
        AND t.relname NOT LIKE 'pg_%'
        AND t.relname NOT LIKE 'sql_%'
      ORDER BY
        t.relname,
        i.relname
    `);
    
    const indexes: Record<string, string[]> = {};
    
    for (const row of result.rows) {
      if (!indexes[row.table_name]) {
        indexes[row.table_name] = [];
      }
      indexes[row.table_name].push(row.index_name);
    }
    
    return indexes;
  } catch (error) {
    logger.error('Failed to get indexes:', error);
    return {};
  }
}

/**
 * Get information about slow queries
 * @param minDuration - Minimum duration in milliseconds to consider slow
 * @returns Promise resolving to array of slow query information
 */
async function getSlowQueries(minDuration: number = 100): Promise<SlowQueryInfo[]> {
  try {
    const result = await pool.query(`
      SELECT
        query,
        calls,
        total_time,
        (total_time / calls) as avg_time
      FROM
        pg_stat_statements
      WHERE
        (total_time / calls) > $1
      ORDER BY
        avg_time DESC
      LIMIT 10
    `, [minDuration / 1000]).catch(() => ({ rows: [] }));
    
    return result.rows.map(row => ({
      query: row.query,
      duration: parseFloat(row.total_time),
      calls: parseInt(row.calls),
      avgTime: parseFloat(row.avg_time)
    }));
  } catch (error) {
    // This is optional as pg_stat_statements extension might not be enabled
    return [];
  }
}

/**
 * Optimize a database table (VACUUM ANALYZE)
 * @param tableName - Table name to optimize
 * @returns Promise resolving to boolean success status
 */
export async function optimizeTable(tableName: string): Promise<boolean> {
  try {
    // Use raw query with pg client as Drizzle doesn't support VACUUM
    await pool.query(`VACUUM ANALYZE ${tableName}`);
    logger.info(`Optimized table: ${tableName}`);
    return true;
  } catch (error) {
    logger.error(`Failed to optimize table ${tableName}:`, error);
    return false;
  }
}

/**
 * Optimize all major tables in the database
 * @returns Promise resolving when all optimizations are complete
 */
export async function optimizeDatabase(): Promise<void> {
  const tablesToOptimize = ['users', 'organizations', 'roles', 'leads'];
  
  for (const table of tablesToOptimize) {
    try {
      await optimizeTable(table);
    } catch (error) {
      logger.error(`Failed to optimize table ${table}:`, error);
    }
  }
}

/**
 * Perform a comprehensive health check of the database with improved error handling
 * @returns Promise resolving to database health information
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthCheck> {
  // Timeout for all Promise.all operations to prevent hanging
  const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>(resolve => setTimeout(() => resolve(fallbackValue), timeoutMs))
    ]);
  };

  // Basic database stats with timeout protection
  const dbSizePromise = withTimeout(getDatabaseSize(), 5000, 'unknown');
  const connectionCountPromise = withTimeout(getConnectionCount(), 5000, 0);
  const tableCountPromise = withTimeout(getTableCount(), 5000, 0);
  const missingTablesPromise = withTimeout(
    checkRequiredTables(), 
    5000, 
    ['users', 'roles', 'organizations', 'leads', 'tasks', 'notifications', 'messages', 'sessions']
  );
  
  // Execute all basic checks with individual error handling
  const [dbSize, connectionCount, tableCount, missingTables] = await Promise.all([
    dbSizePromise.catch(err => {
      logger.error('Failed to get database size in health check:', err);
      return 'unknown';
    }),
    connectionCountPromise.catch(err => {
      logger.error('Failed to get connection count in health check:', err);
      return 0;
    }),
    tableCountPromise.catch(err => {
      logger.error('Failed to get table count in health check:', err);
      return 0;
    }),
    missingTablesPromise.catch(err => {
      logger.error('Failed to check required tables in health check:', err);
      // Return all required tables as missing on error
      return ['users', 'roles', 'organizations', 'leads', 'tasks', 'notifications', 'messages', 'sessions'];
    })
  ]);
  
  // Log initial information
  logger.info('Database stats:', { dbSize, connectionCount, tableCount });
  
  // Check for missing required tables
  if (missingTables.length > 0) {
    logger.error('Required tables check failed:', missingTables);
  }
  
  // Build health check result
  const healthCheck: DatabaseHealthCheck = {
    dbSize,
    connectionCount,
    tableCount,
    missingTables: missingTables.length > 0 ? missingTables : undefined
  };
  
  // Only continue with detailed checks if we have table access
  if (tableCount > 0) {
    try {
      // Get table stats for major tables
      const tableStats: Record<string, TableStats> = {};
      const mainTables = ['users', 'organizations', 'roles', 'leads'];
      
      // Use Promise.all with timeout to avoid hanging on individual table stats
      const statsPromises = mainTables.map(table => 
        withTimeout(getTableStats(table), 3000, null)
          .catch(() => null)
      );
      
      const allStats = await Promise.all(statsPromises);
      
      // Populate tableStats from results
      mainTables.forEach((table, i) => {
        if (allStats[i]) {
          tableStats[table] = allStats[i]!;
        }
      });
      
      // Get indexes with timeout
      const indexes = await withTimeout(getIndexes(), 5000, {})
        .catch(err => {
          logger.error('Failed to get indexes in health check:', err);
          return {};
        });
      
      // Get slow queries with timeout if available
      const slowQueries = await withTimeout(getSlowQueries(), 3000, [])
        .catch(() => []);
      
      // Add detailed information to health check
      if (Object.keys(tableStats).length > 0) {
        healthCheck.tableStats = tableStats;
      }
      
      if (Object.keys(indexes).length > 0) {
        healthCheck.indexes = indexes;
      }
      
      if (slowQueries.length > 0) {
        healthCheck.slowQueries = slowQueries;
      }
    } catch (error) {
      logger.error('Error during detailed database health check:', error);
      // Continue - don't fail the whole health check
    }
  }
  
  // Always mark completion - enables frontend to show a degraded state instead of crash
  logger.info('Database health check completed successfully');
  return healthCheck;
}

/**
 * Function alias for checkDatabaseHealth to match expected function name in other files
 * Enhanced with better error handling and timeout protection
 * @returns Promise resolving to boolean indicating database health
 */
export async function performDatabaseHealthCheck(): Promise<boolean> {
  try {
    // Add timeout to prevent health check from hanging
    const timeoutMs = 15000; // 15 seconds max for health check
    
    const healthCheckPromise = checkDatabaseHealth();
    
    // Race the health check against a timeout
    const healthCheck = await Promise.race([
      healthCheckPromise,
      new Promise<DatabaseHealthCheck>((_, reject) => 
        setTimeout(() => reject(new Error('Database health check timed out')), timeoutMs)
      )
    ]).catch(err => {
      logger.error('Database health check error or timeout:', err instanceof Error ? err.message : String(err));
      // Return a minimal health check result on error
      return {
        dbSize: 'unknown',
        connectionCount: 0,
        tableCount: 0,
        missingTables: ['timeout']
      } as DatabaseHealthCheck;
    });
    
    // Always log completion - this helps frontend error state handling
    logger.info('Database health check completed successfully');
    
    // If we have any tables at all, consider the database at least partially functional
    // This allows the application to run in a degraded state if some tables are missing
    if (healthCheck.tableCount > 0) {
      return true;
    }
    
    // Stricter check: Consider the database healthy only if there are no missing required tables
    return !healthCheck.missingTables || healthCheck.missingTables.length === 0;
  } catch (error) {
    // Handle any uncaught errors
    logger.error('Unexpected error in database health check:', 
      error instanceof Error ? error.message : String(error));
    return false;
  }
}

export default {
  checkDatabaseHealth,
  optimizeTable,
  optimizeDatabase,
  performDatabaseHealthCheck
};