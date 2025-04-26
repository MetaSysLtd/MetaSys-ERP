import { Router } from 'express';
import { storage } from '../storage';
import { logger } from '../logger';
import { z } from 'zod';
import { APIError, ValidationError } from '../middleware/error-handler';

const router = Router();

// Schema for client error validation
const clientErrorSchema = z.object({
  type: z.string().optional(),
  message: z.string().min(1, "Error message is required"),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().datetime().optional()
});

type ClientErrorLog = z.infer<typeof clientErrorSchema>;

// Schema for error statistics requests
const errorStatsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50)
});

// Route to log client-side errors
router.post('/client', async (req, res, next) => {
  try {
    // Validate error data
    const validationResult = clientErrorSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw new ValidationError('Invalid error log data', validationResult.error);
    }
    
    const errorData = validationResult.data;
    
    // Get user info if available
    const userId = req.session?.userId;
    const userIp = req.ip;
    const userAgent = req.headers['user-agent'] || errorData.userAgent;
    
    // Log the error
    logger.error(`Client error: [${errorData.type || 'ERROR'}] ${errorData.message} at ${errorData.url || req.headers.referer || 'unknown'} - User: ${userId || 'anonymous'}`);
    
    // Store in database if the method exists
    try {
      if (typeof storage.createClientErrorLog === 'function') {
        await storage.createClientErrorLog({
          type: errorData.type || 'CLIENT_ERROR',
          message: errorData.message,
          stack: errorData.stack || null,
          componentStack: errorData.componentStack || null,
          userId: userId || null,
          userIp,
          userAgent: userAgent || null,
          url: errorData.url || req.headers.referer || null,
          timestamp: errorData.timestamp ? new Date(errorData.timestamp) : new Date(),
        }).catch((dbError: Error) => {
          // Handle database errors gracefully - likely table doesn't exist yet
          if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
            logger.warn('Error logs table not available - system is still in setup phase');
          } else {
            logger.error('Error saving client error log:', dbError);
          }
        });
      } else {
        // Method doesn't exist in storage interface yet
        logger.info('Client error logging to database not configured yet - skipping');
      }
    } catch (dbError) {
      // Just log the storage error but don't fail the request
      logger.error('Failed to store client error in database:', dbError);
    }
    
    // Always return success to the client
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Route to get error statistics (admin only)
router.get('/stats', async (req, res, next) => {
  try {
    // Verify admin permissions
    if (!req.userRole?.isSystemAdmin) {
      throw new APIError('Unauthorized access', 403);
    }
    
    // Parse and validate query parameters
    const validationResult = errorStatsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      throw new ValidationError('Invalid query parameters', validationResult.error);
    }
    
    const params = validationResult.data;
    
    // Default to last 7 days if no dates provided
    if (!params.startDate) {
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 7);
      params.startDate = defaultStartDate.toISOString();
    }
    
    if (!params.endDate) {
      params.endDate = new Date().toISOString();
    }
    
    // Get error statistics from database
    let stats = [];
    
    if (typeof storage.getErrorStats === 'function') {
      try {
        stats = await storage.getErrorStats({
          startDate: new Date(params.startDate),
          endDate: new Date(params.endDate),
          type: params.type,
          limit: params.limit
        });
      } catch (dbError: any) {
        // Handle database errors gracefully - likely table doesn't exist yet
        if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
          logger.warn('Error logs table not available - system is still in setup phase');
          // Return empty stats
        } else {
          // Rethrow other errors
          throw dbError;
        }
      }
    } else {
      // Method doesn't exist in storage interface yet
      logger.info('Error stats retrieval not configured yet');
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;