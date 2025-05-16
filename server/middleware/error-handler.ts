import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { logger } from '../logger';

// Custom error class for API errors
export class APIError extends Error {
  statusCode: number;
  errorCode?: string;
  details?: any;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    errorCode?: string,
    details?: any,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Different types of errors
export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details, true);
  }
}

export class AuthenticationError extends APIError {
  constructor(message = 'Unauthorized: Please log in to access this resource') {
    super(message, 401, 'AUTHENTICATION_ERROR', undefined, true);
  }
}

export class AuthorizationError extends APIError {
  constructor(message = 'Forbidden: You do not have permission to perform this action') {
    super(message, 403, 'AUTHORIZATION_ERROR', undefined, true);
  }
}

export class NotFoundError extends APIError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND', undefined, true);
  }
}

export class ConflictError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details, true);
  }
}

export class RateLimitError extends APIError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, 'RATE_LIMIT', undefined, true);
  }
}

// JSON parsing error handler
export function jsonErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON payload',
      error: 'INVALID_JSON',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  next(err);
}

// Global error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  const timestamp = new Date().toISOString();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
  
  let statusCode = 500;
  let errorMessage = 'Internal Server Error';
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let details: any = undefined;
  let isOperational = false;
  
  // If this is our custom API error, use its values
  if (err instanceof APIError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    errorCode = err.errorCode || 'API_ERROR';
    details = err.details;
    isOperational = err.isOperational;
  } else if (err.name === 'ZodError') {
    // Handle Zod validation errors
    statusCode = 400;
    errorMessage = 'Validation error';
    errorCode = 'VALIDATION_ERROR';
    details = err;
    isOperational = true;
  }
  
  // Format the error for the log
  const errorLog = {
    timestamp,
    requestId,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.session?.userId || null,
    statusCode,
    errorCode,
    errorMessage,
    stack: err.stack,
    details,
    isOperational
  };
  
  // Log the error - different log level based on severity
  if (statusCode >= 500) {
    logger.error(`[${timestamp}] ${statusCode} ERROR: ${errorMessage} User: ${req.session?.userId || 'unknown'} Path: ${req.method} ${req.originalUrl} `, err);
    
    // Store critical errors in database for monitoring
    try {
      // Check if the storage interface has the createErrorLog method
      if (typeof storage.createErrorLog === 'function') {
        storage.createErrorLog({
          level: 'error',
          message: errorMessage,
          code: errorCode,
          path: req.originalUrl,
          method: req.method,
          userId: req.session?.userId || null,
          userIp: req.ip,
          userAgent: req.headers['user-agent'] || null,
          stackTrace: err.stack || null,
          timestamp: new Date(),
        }).catch((logErr: Error) => {
          // Handle database errors gracefully - likely table doesn't exist yet
          if (logErr.message.includes('relation') && logErr.message.includes('does not exist')) {
            logger.warn('Error logs table not available - system is still in setup phase');
          } else {
            logger.error('Error saving error log:', logErr);
          }
        });
      } else {
        // Method doesn't exist in storage interface yet
        logger.info('Error logging to database not configured yet - skipping');
      }
    } catch (logErr) {
      logger.error('Failed to save error log:', logErr);
    }
  } else if (statusCode >= 400) {
    logger.warn(`[${timestamp}] ${statusCode} WARN: ${errorMessage} User: ${req.session?.userId || 'unknown'} Path: ${req.method} ${req.originalUrl}`);
  }
  
  // Send appropriate response to client
  // Don't expose error stack in production
  const response = {
    status: 'error',
    message: errorMessage,
    error: errorCode,
    path: req.originalUrl,
    method: req.method,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    ...(details && { details }),
  };
  
  res.status(statusCode).json(response);
}

// 404 handler - should be added after all other routes
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  // Skip 404 errors for assets and favicon since they're common and noisy
  if (req.path.startsWith('/assets/') || req.path === '/favicon.ico') {
    return res.status(404).end();
  }

  // For API routes, return proper JSON errors
  if (req.path.startsWith('/api/')) {
    // Always return a structured JSON response for API routes
    return res.status(404).json({
      status: "error",
      message: `Route not found: ${req.method} ${req.path}`,
      path: req.path,
      method: req.method
    });
  }

  // For any other non-API routes, let them be handled by the frontend router (SPA)
  // This is crucial for client-side routing to work properly
  // In development, Vite middleware will handle this and serve index.html
  // In production, the static middleware will serve index.html
  next();
}

// Session expired handler with improved login endpoint handling
export function sessionHandler(req: Request, res: Response, next: NextFunction) {
  // Always log session check for debugging
  console.log(`DEBUG: Session check for ${req.method} ${req.path}`);
  
  // Skip authentication check for login and public routes
  if (req.path === '/api/auth/login' || 
      req.path === '/api/auth/register') {
    console.log(`DEBUG: Skipping session check for login/register endpoint: ${req.path}`);
    return next();
  }
  
  if (req.path.startsWith('/api/') && 
      !req.path.startsWith('/api/auth') && 
      !req.path.startsWith('/api/status') && 
      !req.path.startsWith('/api/public') && 
      !req.session.userId) {
    // Skip auth check for the /api/errors endpoint to avoid infinite loops
    if (req.path.startsWith('/api/errors/')) {
      return next();
    }
    
    // Return a structured JSON response for authentication errors
    return res.status(401).json({
      status: "error",
      message: "Unauthorized: Please log in to access this resource",
      authenticated: false
    });
  }
  next();
}

// Role authorization middleware
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip in development if specified
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      return next();
    }
    
    if (!req.userRole || !roles.includes(req.userRole.department)) {
      return next(new AuthorizationError('You do not have permission to access this resource'));
    }
    next();
  };
}

// Admin authorization middleware
export function requireAdmin() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip in development if specified
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      return next();
    }
    
    if (!req.userRole || !req.userRole.isSystemAdmin) {
      return next(new AuthorizationError('This action requires administrator privileges'));
    }
    next();
  };
}

// Permission check middleware
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip in development if specified
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      return next();
    }
    
    if (!req.userRole || !(req.userRole as any)[permission]) {
      return next(new AuthorizationError(`You lack the required permission: ${permission}`));
    }
    next();
  };
}