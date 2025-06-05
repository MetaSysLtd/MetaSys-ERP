import { Request, Response, NextFunction } from "express";
import { getIo } from "../socket";
import { storage } from "../storage";

// Error categorization for proper routing and handling
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  SYSTEM = 'system',
  BUSINESS_LOGIC = 'business_logic'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface SystemError extends Error {
  statusCode?: number;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  userId?: number;
  orgId?: number;
  context?: Record<string, any>;
}

class ErrorTracker {
  private errorCounts = new Map<string, number>();
  private readonly maxErrorsPerHour = 100;
  private readonly cleanupIntervalMs = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Cleanup error counts every hour
    setInterval(() => this.cleanup(), this.cleanupIntervalMs);
  }

  private cleanup() {
    this.errorCounts.clear();
  }

  shouldThrottle(errorKey: string): boolean {
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);
    return count >= this.maxErrorsPerHour;
  }
}

const errorTracker = new ErrorTracker();

// Comprehensive error handler with notification integration
export const globalErrorHandler = (
  error: SystemError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set default error properties
  const statusCode = error.statusCode || 500;
  const category = error.category || ErrorCategory.SYSTEM;
  const severity = error.severity || ErrorSeverity.MEDIUM;
  
  // Create error context
  const errorContext = {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    orgId: req.user?.orgId,
    timestamp: new Date(),
    ...error.context
  };

  // Generate error key for throttling
  const errorKey = `${category}-${error.message}-${req.url}`;

  // Log error with context
  console.error(`[${severity.toUpperCase()}] ${category}: ${error.message}`, {
    stack: error.stack,
    context: errorContext
  });

  // Send real-time notification for high/critical errors
  if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
    if (!errorTracker.shouldThrottle(errorKey)) {
      notifyError(error, errorContext, category, severity);
    }
  }

  // Store error in database for analysis
  storeError(error, errorContext, category, severity).catch(dbError => {
    console.error('Failed to store error in database:', dbError);
  });

  // Send appropriate response based on error type
  const errorResponse: any = {
    status: 'error',
    message: getPublicErrorMessage(error, category),
    category,
    timestamp: errorContext.timestamp
  };

  // Add debug info in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.debug = {
      stack: error.stack,
      context: errorContext
    };
  }

  res.status(statusCode).json(errorResponse);
};

// Send real-time error notifications
async function notifyError(
  error: SystemError,
  context: Record<string, any>,
  category: ErrorCategory,
  severity: ErrorSeverity
) {
  try {
    const io = getIo();
    if (io) {
      // Emit to system administrators
      io.emit('system:error', {
        type: 'system_error',
        category,
        severity,
        message: error.message,
        context,
        timestamp: new Date()
      });

      // Emit user-specific notification if user context available
      if (context.userId) {
        io.to(`user:${context.userId}`).emit('notification:error', {
          type: 'error_notification',
          message: getPublicErrorMessage(error, category),
          severity,
          timestamp: new Date()
        });
      }
    }
  } catch (notificationError) {
    console.error('Failed to send error notification:', notificationError);
  }
}

// Store errors for analysis and monitoring
async function storeError(
  error: SystemError,
  context: Record<string, any>,
  category: ErrorCategory,
  severity: ErrorSeverity
) {
  try {
    // Create system notification for tracking
    await storage.createNotification({
      userId: context.userId || null,
      orgId: context.orgId || 1,
      type: 'system_error',
      title: `System Error: ${category}`,
      message: `${error.message} (${severity})`,
      entityType: 'system',
      entityId: null,
      read: false
    });
  } catch (dbError) {
    console.error('Database error while storing system error:', dbError);
  }
}

// Get user-friendly error messages
function getPublicErrorMessage(error: SystemError, category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.AUTHENTICATION:
      return 'Authentication failed. Please log in again.';
    case ErrorCategory.AUTHORIZATION:
      return 'You do not have permission to perform this action.';
    case ErrorCategory.VALIDATION:
      return error.message; // Validation errors are usually safe to expose
    case ErrorCategory.DATABASE:
      return 'A database error occurred. Please try again later.';
    case ErrorCategory.EXTERNAL_SERVICE:
      return 'An external service is temporarily unavailable.';
    case ErrorCategory.BUSINESS_LOGIC:
      return error.message; // Business logic errors are usually safe
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
}

// Error recovery middleware for specific operations
export const withErrorRecovery = (
  operation: string,
  fallbackValue: any = null
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        console.error(`Error in ${operation}:`, error);
        
        // Log error for monitoring
        const systemError: SystemError = Object.assign(new Error(), error, {
          category: ErrorCategory.BUSINESS_LOGIC,
          severity: ErrorSeverity.MEDIUM,
          context: { operation, args: args.slice(0, 2) } // Log first 2 args only
        });

        // Store error without blocking operation
        storeError(systemError, { operation }, ErrorCategory.BUSINESS_LOGIC, ErrorSeverity.MEDIUM)
          .catch(dbError => console.error('Failed to log error:', dbError));

        return fallbackValue;
      }
    };

    return descriptor;
  };
};

// Circuit breaker for external service calls
export class ServiceCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(serviceCall: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Service circuit breaker is open');
    }

    try {
      const result = await serviceCall();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    return this.failures >= this.threshold && 
           (Date.now() - this.lastFailureTime) < this.timeout;
  }

  private onSuccess() {
    this.failures = 0;
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
    path: req.path,
    method: req.method,
    timestamp: new Date()
  });
};

// Unhandled rejection handler
export const setupUnhandledRejectionHandler = () => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    const error: SystemError = {
      name: 'UnhandledRejection',
      message: reason?.toString() || 'Unknown rejection',
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.CRITICAL
    };

    storeError(error, { source: 'unhandledRejection' }, ErrorCategory.SYSTEM, ErrorSeverity.CRITICAL)
      .catch(dbError => console.error('Failed to log unhandled rejection:', dbError));
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    
    const systemError: SystemError = {
      ...error,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.CRITICAL
    };

    storeError(systemError, { source: 'uncaughtException' }, ErrorCategory.SYSTEM, ErrorSeverity.CRITICAL)
      .catch(dbError => console.error('Failed to log uncaught exception:', dbError));

    // Graceful shutdown
    process.exit(1);
  });
};