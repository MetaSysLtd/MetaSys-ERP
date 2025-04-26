import { Router } from 'express';
import { performDatabaseHealthCheck } from '../utils/db-health-check';
import { logger } from '../logger';

const router = Router();

// Basic health check endpoint that always returns 200 OK
router.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Detailed system status with optional deep check
router.get('/', async (req, res) => {
  const deepCheck = req.query.deep === 'true';
  const memoryUsage = process.memoryUsage();
  
  try {
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        rss: formatBytes(memoryUsage.rss),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        heapUsed: formatBytes(memoryUsage.heapUsed),
        external: formatBytes(memoryUsage.external),
      },
      database: { status: 'unchecked' }
    };
    
    // If deep check is requested, perform more intensive tests
    if (deepCheck) {
      logger.info('Performing deep health check');
      
      // Test database connectivity and health
      const dbHealthy = await performDatabaseHealthCheck();
      status.database = {
        status: dbHealthy ? 'healthy' : 'unhealthy'
      };
      
      if (!dbHealthy) {
        status.status = 'degraded';
      }
    }
    
    res.json(status);
  } catch (error) {
    logger.error('Error in status check:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

// Error simulation endpoints for testing error handling
router.get('/test-error/:type', (req, res, next) => {
  const errorType = req.params.type;
  
  switch (errorType) {
    case 'sync':
      // Synchronous error
      logger.info('Simulating synchronous error for testing');
      throw new Error('Simulated synchronous error');
    
    case 'async':
      // Asynchronous error
      logger.info('Simulating asynchronous error for testing');
      setTimeout(() => {
        try {
          throw new Error('Simulated asynchronous error');
        } catch (error) {
          next(error);
        }
      }, 100);
      return; // Don't send response yet
    
    case '404':
      // 404 Not Found
      logger.info('Simulating 404 error for testing');
      return res.status(404).json({ 
        status: 'error', 
        error: 'Not Found',
        message: 'Resource not found (simulation)'
      });
    
    case '403':
      // 403 Forbidden
      logger.info('Simulating 403 error for testing');
      return res.status(403).json({ 
        status: 'error', 
        error: 'Forbidden',
        message: 'Access denied (simulation)'
      });
    
    case '500':
      // 500 Internal Server Error
      logger.info('Simulating 500 error for testing');
      return res.status(500).json({ 
        status: 'error', 
        error: 'Internal Server Error',
        message: 'Internal server error (simulation)'
      });
    
    case 'timeout':
      // Request timeout simulation
      logger.info('Simulating request timeout for testing');
      // Wait for 30 seconds without responding
      setTimeout(() => {
        res.status(200).json({ 
          status: 'ok', 
          message: 'Timeout simulation completed'
        });
      }, 30000);
      return;
    
    case 'database':
      // Database error simulation
      logger.info('Simulating database error for testing');
      const dbError = new Error('Simulated database connection error');
      dbError.name = 'DatabaseError';
      return next(dbError);
    
    default:
      return res.status(400).json({ 
        status: 'error', 
        error: 'Bad Request',
        message: `Unknown error type: ${errorType}`,
        validTypes: ['sync', 'async', '404', '403', '500', 'timeout', 'database']
      });
  }
});

// Format bytes to human-readable form
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;