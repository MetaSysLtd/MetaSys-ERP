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
    const result = await sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `.execute(db);
    
    return result[0]?.size || '0 bytes';
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
    const result = await sql`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `.execute(db);
    
    return parseInt(result[0]?.count) || 0;
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
    const result = await sql`
      SELECT count(*) as count 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `.execute(db);
    
    return parseInt(result[0]?.count) || 0;
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
    const sizeResult = await sql`
      SELECT 
        pg_table_size('${sql.raw(tableName)}'::regclass) as size_bytes,
        pg_size_pretty(pg_table_size('${sql.raw(tableName)}'::regclass)) as size,
        n_live_tup as row_count,
        last_vacuum,
        last_analyze
      FROM pg_stat_user_tables
      WHERE relname = ${tableName}
    `.execute(db);
    
    if (!sizeResult[0]) {
      return null;
    }
    
    return {
      rowCount: parseInt(sizeResult[0].row_count) || 0,
      sizeBytes: parseInt(sizeResult[0].size_bytes) || 0,
      sizeFormatted: sizeResult[0].size || '0 bytes',
      lastVacuum: sizeResult[0].last_vacuum,
      lastAnalyze: sizeResult[0].last_analyze
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
    const result = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = ANY(${requiredTables})
    `.execute(db);
    
    const existingTables = result.map(row => row.tablename);
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
    const result = await sql`
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
    `.execute(db);
    
    const indexes: Record<string, string[]> = {};
    
    for (const row of result) {
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
    const result = await sql`
      SELECT
        query,
        calls,
        total_time,
        (total_time / calls) as avg_time
      FROM
        pg_stat_statements
      WHERE
        (total_time / calls) > ${minDuration / 1000}
      ORDER BY
        avg_time DESC
      LIMIT 10
    `.execute(db).catch(() => []);
    
    return result.map(row => ({
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
 * Perform a comprehensive health check of the database
 * @returns Promise resolving to database health information
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthCheck> {
  // Basic database stats
  const [dbSize, connectionCount, tableCount, missingTables] = await Promise.all([
    getDatabaseSize(),
    getConnectionCount(),
    getTableCount(),
    checkRequiredTables()
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
  
  // Only continue with detailed checks if all required tables exist
  if (missingTables.length === 0) {
    try {
      // Get table stats for major tables
      const tableStats: Record<string, TableStats> = {};
      const mainTables = ['users', 'organizations', 'roles', 'leads'];
      
      for (const table of mainTables) {
        const stats = await getTableStats(table);
        if (stats) {
          tableStats[table] = stats;
        }
      }
      
      // Get indexes
      const indexes = await getIndexes();
      
      // Get slow queries if available
      const slowQueries = await getSlowQueries();
      
      // Add detailed information to health check
      healthCheck.tableStats = tableStats;
      healthCheck.indexes = indexes;
      
      if (slowQueries.length > 0) {
        healthCheck.slowQueries = slowQueries;
      }
    } catch (error) {
      logger.error('Error during detailed database health check:', error);
    }
  }
  
  logger.info('Database health check completed successfully');
  return healthCheck;
}

/**
 * Function alias for checkDatabaseHealth to match expected function name in other files
 * @returns Promise resolving to boolean indicating database health
 */
export async function performDatabaseHealthCheck(): Promise<boolean> {
  try {
    const healthCheck = await checkDatabaseHealth();
    
    // Consider the database healthy if there are no missing tables
    return !healthCheck.missingTables || healthCheck.missingTables.length === 0;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

export default {
  checkDatabaseHealth,
  optimizeTable,
  optimizeDatabase,
  performDatabaseHealthCheck
};