import express, { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { APIError } from "../middleware/error-handler";

// Schema for client-side error validation
const clientErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string().optional(),
    stack: z.string().optional(),
    timestamp: z.string().optional(),
    url: z.string().optional(),
    userAgent: z.string().optional(),
    source: z.string().optional(),
    status: z.number().optional(),
  }),
  context: z.record(z.any()).optional(),
});

// Type for error statistics response
interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  byPath: Record<string, number>;
  recentErrors: any[];
}

// Create a router for error logging routes
const router = express.Router();

// Client-side error logging endpoint
router.post("/log-client-error", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse and validate the input data
    const validatedData = clientErrorSchema.parse(req.body);
    
    // Get user ID if user is authenticated
    const userId = req.session?.userId || null;
    
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[CLIENT ERROR]', validatedData.error.message);
      if (validatedData.error.stack) {
        console.error(validatedData.error.stack);
      }
      if (validatedData.context) {
        console.error('Context:', validatedData.context);
      }
    }
    
    // Store the error in the database
    if (storage.createClientErrorLog) {
      await storage.createClientErrorLog({
        userId,
        errorType: validatedData.error.type || 'ClientError',
        message: validatedData.error.message,
        stack: validatedData.error.stack,
        url: validatedData.error.url,
        userAgent: validatedData.error.userAgent,
        source: validatedData.error.source || 'client',
        status: validatedData.error.status || 0,
        context: validatedData.context ? JSON.stringify(validatedData.context) : null,
        timestamp: new Date(),
      });
    } else if (storage.createActivity) {
      // Fallback to activity log if specialized error log isn't available
      await storage.createActivity({
        userId: userId || 0,
        entityType: 'client_error',
        entityId: 0,
        action: 'client_error',
        details: JSON.stringify({
          error: validatedData.error,
          context: validatedData.context,
          timestamp: new Date().toISOString(),
        }),
      });
    }
    
    res.status(200).json({ message: 'Error logged successfully' });
  } catch (error) {
    next(error);
  }
});

// Admin route to fetch error statistics
router.get("/error-stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated and has admin rights
    if (!req.session?.userId) {
      throw new APIError('Unauthorized', 401);
    }
    
    // Check if user has admin role
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      throw new APIError('Unauthorized', 401);
    }
    
    const userRole = await storage.getRole(user.roleId);
    if (!userRole || userRole.level < 4) {
      throw new APIError('Forbidden: Admin access required', 403);
    }
    
    // Get error statistics from storage
    if (storage.getErrorStats) {
      const stats = await storage.getErrorStats();
      res.json(stats);
    } else {
      // Fallback when specialized error stats aren't available
      res.json({
        total: 0,
        byType: {},
        bySource: {},
        byPath: {},
        recentErrors: [],
        message: 'Error statistics not available'
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;