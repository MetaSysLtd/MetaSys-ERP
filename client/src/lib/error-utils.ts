import { retryFetch } from "./api-error-handler";

/**
 * Interface for additional error logging options
 */
interface LogErrorOptions {
  source?: string;
  status?: number;
  context?: Record<string, any>;
}

/**
 * Logs an error to the server for centralized error tracking
 * @param error - The error object to log
 * @param options - Optional additional information about the error
 */
export async function logError(error: Error, options: LogErrorOptions = {}): Promise<void> {
  try {
    // Get relevant error data
    const errorData = {
      error: {
        message: error.message,
        type: error.name || 'Error',
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...options.source && { source: options.source },
        ...options.status && { status: options.status },
      },
      context: options.context
    };

    // Send to server - don't await to avoid blocking UI
    // Use retryFetch with retry capabilities to ensure error logs are sent
    await retryFetch('/api/errors/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    });
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('Error Logged to Server');
      console.error(error);
      console.info('Context:', options);
      console.groupEnd();
    }
  } catch (loggingError) {
    // Fallback to console if server logging fails
    console.error('Failed to log error to server:', loggingError);
    console.error('Original error:', error);
  }
}

/**
 * Formats an error message for display to users
 * @param error - Error object, string, or API response data
 * @returns Formatted error message string
 */
export function formatErrorMessage(error: any): string {
  // Handle different error formats
  if (!error) {
    return 'An unknown error occurred';
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  // Error object
  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred';
  }

  // API error response object
  if (typeof error === 'object') {
    // Try to extract message from common API error formats
    if (error.message) {
      return error.message;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.errors && Array.isArray(error.errors)) {
      return error.errors.map((e: any) => e.message || e).join(', ');
    }

    // For validation errors that return multiple field errors
    if (error.data?.errors) {
      return Object.values(error.data.errors)
        .flat()
        .join(', ');
    }

    // Fallback to JSON stringifying the error
    try {
      return JSON.stringify(error);
    } catch (e) {
      return 'An unexpected error occurred';
    }
  }

  // Default fallback
  return 'An unexpected error occurred';
}

/**
 * Check if an object is an error
 * @param error - Object to check
 * @returns True if object is an Error instance
 */
export function isError(error: any): error is Error {
  return error instanceof Error;
}

/**
 * Create a descriptive user-facing error message
 * @param error - The error object or string
 * @param fallbackMessage - Fallback message if error cannot be parsed
 * @returns User-facing error message
 */
export function createUserFriendlyErrorMessage(
  error: any,
  fallbackMessage: string = 'Something went wrong. Please try again later.'
): string {
  // Network errors
  if (
    error?.message?.includes('Network Error') ||
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('NetworkError')
  ) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (error?.status === 401 || error?.statusCode === 401) {
    return 'Your session has expired. Please log in again.';
  }

  // Permission errors
  if (error?.status === 403 || error?.statusCode === 403) {
    return 'You do not have permission to perform this action.';
  }

  // Not found errors
  if (error?.status === 404 || error?.statusCode === 404) {
    return 'The requested resource was not found.';
  }

  // Validation errors
  if (error?.status === 422 || error?.statusCode === 422) {
    return formatErrorMessage(error) || 'Validation failed. Please check your input and try again.';
  }

  // Server errors
  if (
    error?.status >= 500 ||
    error?.statusCode >= 500 ||
    error?.message?.includes('Internal Server Error')
  ) {
    return 'The server encountered an error. Our team has been notified and is working on a fix.';
  }

  // Use formatted message if available, otherwise fall back
  const formattedMessage = formatErrorMessage(error);
  return formattedMessage !== 'An unexpected error occurred'
    ? formattedMessage
    : fallbackMessage;
}