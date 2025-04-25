import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { storage } from '../storage';

interface ErrorDetails {
  message: string;
  status: number;
  details?: any;
  code?: string;
  source?: string;
}

/**
 * Custom API error class for consistent error handling
 */
export class APIError extends Error {
  status: number;
  details?: any;
  code?: string;
  source?: string;

  constructor(
    message: string,
    status: number = 500,
    details?: any,
    code?: string,
    source?: string
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
    this.code = code;
    this.source = source;
  }
}

/**
 * Logs an error to the database and console
 */
async function logErrorToStorage(
  req: Request,
  error: Error,
  status: number,
  details?: any
): Promise<void> {
  try {
    // Get user ID from session if available
    const userId = req.session?.userId || null;

    // Log to console for immediate visibility
    console.error(
      `[${new Date().toISOString()}] ${status} ERROR:`,
      error.message,
      userId ? `User: ${userId}` : 'Unauthenticated',
      `Path: ${req.method} ${req.path}`,
      details ? `Details: ${JSON.stringify(details)}` : ''
    );

    // If verbose logging, also log stack trace
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }

    // Log to database if appropriate storage method exists
    if (storage.createErrorLog) {
      await storage.createErrorLog({
        userId,
        errorType: error.name || 'Error',
        message: error.message,
        status,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: details ? JSON.stringify(details) : null,
        stack: error.stack,
        timestamp: new Date(),
      });
    } else if (storage.createActivity) {
      // Fallback to activity log if specialized error log isn't available
      await storage.createActivity({
        userId: userId || 0,
        entityType: 'server_error',
        entityId: 0,
        action: 'server_error',
        details: JSON.stringify({
          error: error.message,
          status,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
          details,
        }),
      });
    }
  } catch (loggingError) {
    // Don't let logging errors affect the response
    console.error('Error while logging error:', loggingError);
  }
}

/**
 * Formats API error for consistent client response
 */
function formatErrorResponse(error: Error, status: number = 500): ErrorDetails {
  let errorDetails: ErrorDetails = {
    message: error.message || 'An unexpected error occurred',
    status: status,
  };

  // For custom API errors, add additional details
  if (error instanceof APIError) {
    errorDetails = {
      message: error.message,
      status: error.status,
      details: error.details,
      code: error.code,
      source: error.source,
    };
  }

  // For validation errors, format them consistently
  if (error instanceof ZodError) {
    const validationError = fromZodError(error);
    errorDetails = {
      message: validationError.message,
      status: 400,
      details: error.errors,
      code: 'VALIDATION_ERROR',
      source: 'zod',
    };
  }

  // Clean up error message for production
  if (process.env.NODE_ENV === 'production') {
    // Remove sensitive details or stack traces
    delete errorDetails.details;
    if (status >= 500) {
      errorDetails.message = 'Internal server error';
    }
  }

  return errorDetails;
}

/**
 * Global error handler middleware
 */
export const errorHandler = async (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let status = 500;
  let details;

  // Determine appropriate status code
  if (error instanceof APIError) {
    status = error.status;
    details = error.details;
  } else if (error instanceof ZodError) {
    status = 400;
    details = error.errors;
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    status = 401;
  } else if (error.message.includes('ECONNREFUSED') || error.message.includes('getaddrinfo')) {
    status = 503; // Service Unavailable for database connection issues
  }

  // Log the error
  await logErrorToStorage(req, error, status, details);

  // Format the error for client response
  const errorResponse = formatErrorResponse(error, status);

  // Notify admin if critical error
  if (status >= 500 && process.env.ADMIN_ERROR_NOTIFICATION === 'true') {
    try {
      // If user is logged in, include their info
      const userInfo = req.session?.userId
        ? await storage.getUser(req.session.userId)
        : null;

      // Send notification
      // This is just placeholder code - replace with your notification system
      console.error(`CRITICAL ERROR NOTIFICATION: ${errorResponse.message}`, {
        user: userInfo ? `${userInfo.firstName} ${userInfo.lastName} (${userInfo.email})` : 'Unauthenticated',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    } catch (notificationError) {
      console.error('Failed to send admin notification:', notificationError);
    }
  }

  // Send response
  res.status(errorResponse.status).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  // Skip for non-API routes (let the frontend handle those)
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const error = new APIError(`Route not found: ${req.method} ${req.path}`, 404);
  logErrorToStorage(req, error, 404);
  
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.path}`,
    status: 404,
    code: 'NOT_FOUND',
  });
};