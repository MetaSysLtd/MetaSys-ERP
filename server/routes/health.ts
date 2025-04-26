import { Router, Request, Response } from 'express';
import { uptime } from 'os';
import { db } from '../db';
import { logger } from '../logger';
import { checkDatabaseHealth } from '../utils/db-health-check';
import { PERMISSIONS } from '@shared/constants';
import { requirePermission } from '../services/permissions';

const router = Router();

/**
 * Format system uptime into a human-readable string
 * @returns Formatted uptime string
 */
function formatUptime(): string {
  const uptimeInSeconds = process.uptime();
  
  const days = Math.floor(uptimeInSeconds / (60 * 60 * 24));
  const hours = Math.floor((uptimeInSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((uptimeInSeconds % (60 * 60)) / 60);
  const seconds = Math.floor(uptimeInSeconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

/**
 * Format memory usage in a human-readable way
 * @param bytes - Memory size in bytes
 * @returns Formatted memory string
 */
function formatMemory(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * @route GET /api/health
 * @description Basic health check endpoint for monitoring and load balancers
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check if database is accessible
    let dbStatus = 'connected';
    let dbError = null;
    
    try {
      // Simple query to check if database is responding
      await db.execute('SELECT 1');
    } catch (error) {
      dbStatus = 'disconnected';
      dbError = (error as Error).message;
      logger.error('Database health check failed:', error);
    }
    
    // Simple health response
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: formatUptime(),
      db: dbStatus
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: (error as Error).message
    });
  }
});

/**
 * @route GET /api/health/detailed
 * @description Detailed system health information for monitoring and diagnostics
 * @access Requires MANAGE_SYSTEM permission
 */
router.get('/detailed', requirePermission(PERMISSIONS.MANAGE_SYSTEM), async (req: Request, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    const system = {
      uptime: formatUptime(),
      systemUptime: formatUptime(),
      nodeVersion: process.version,
      memoryUsage: {
        rss: formatMemory(memoryUsage.rss),
        heapTotal: formatMemory(memoryUsage.heapTotal),
        heapUsed: formatMemory(memoryUsage.heapUsed),
        external: formatMemory(memoryUsage.external),
        arrayBuffers: formatMemory(memoryUsage.arrayBuffers || 0)
      },
      cpuUsage: process.cpuUsage(),
      pid: process.pid,
      platform: process.platform
    };
    
    // Check database health
    let database = { status: 'unknown', details: null, error: null };
    try {
      const dbHealth = await checkDatabaseHealth();
      database = {
        status: 'healthy',
        details: dbHealth,
        error: null
      };
    } catch (error) {
      database = {
        status: 'unhealthy',
        details: null,
        error: (error as Error).message
      };
      logger.error('Detailed database health check failed:', error);
    }
    
    // Generate response
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      system,
      database,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Detailed health check failed',
      error: (error as Error).message
    });
  }
});

/**
 * @route POST /api/health/readiness
 * @description Forced health check endpoint for readiness probes (e.g. K8s)
 * @access Public
 */
router.post('/readiness', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await db.execute('SELECT 1');
    
    // All checks passed
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Service not ready
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      message: 'Service is not ready',
      error: (error as Error).message
    });
  }
});

/**
 * @route POST /api/health/liveness
 * @description Forced health check endpoint for liveness probes (e.g. K8s)
 * @access Public
 */
router.post('/liveness', async (req: Request, res: Response) => {
  // Simple liveness check - if the server responds, it's alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

export default router;