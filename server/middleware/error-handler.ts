import { Request, Response, NextFunction } from 'express';
import { log } from '../vite';

/**
 * Custom error class with standardized structure
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'SERVER_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Custom error for validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

/**
 * Custom error for not found resources
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND_ERROR', details);
  }
}

/**
 * Custom error for unauthorized access
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access', details?: any) {
    super(message, 401, 'UNAUTHORIZED_ERROR', details);
  }
}

/**
 * Custom error for forbidden actions
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden action', details?: any) {
    super(message, 403, 'FORBIDDEN_ERROR', details);
  }
}

/**
 * Custom error for conflict situations
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

/**
 * Custom error for database errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

/**
 * Custom error for external service errors
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

/**
 * Async route handler wrapper to catch errors from async functions
 * @param fn - The async route handler function to wrap
 * @returns A wrapped function that forwards errors to the error handler middleware
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log the error for server-side debugging
  log(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.error(err);

  // Default error values if not an AppError
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'SERVER_ERROR';
  let details = err.details;

  // Handle specific error types
  if (err.name === 'ZodError') {
    statusCode = 422;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    details = err.errors;
  } else if (err.code === 'P2002') {
    // Drizzle ORM - unique constraint violation
    statusCode = 409;
    message = 'This record already exists';
    code = 'CONFLICT_ERROR';
  } else if (err.code === 'P2025') {
    // Drizzle ORM - not found
    statusCode = 404;
    message = 'Record not found';
    code = 'NOT_FOUND_ERROR';
  }

  // Send the error response
  res.status(statusCode).json({
    error: {
      message,
      code,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

/**
 * Handle 404 errors for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) {
    // Only treat API routes as potentially missing
    next(new NotFoundError('Route not found'));
  } else {
    // For non-API routes, let the frontend router handle it
    next();
  }
};

/**
 * Authorization middleware to check if user is authenticated
 */
export const requireAuth = (req: Request & { isAuthenticated?: () => boolean }, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return next(new UnauthorizedError('Authentication required'));
  }
  next();
};

/**
 * Authorization middleware to check if user has required role
 * @param allowedRoles - Array of role names that can access this route
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request & { isAuthenticated?: () => boolean, userRole?: { name: string } }, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userRole = req.userRole?.name;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return next(new ForbiddenError(`Required role: ${allowedRoles.join(' or ')}`));
    }
    
    next();
  };
};

/**
 * Middleware to validate request body against Zod schema
 * @param schema - Zod schema to validate against
 */
export const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(new ValidationError('Invalid request data', error));
    }
  };
};