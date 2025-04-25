import axios from 'axios';

interface ErrorLogData {
  message: string;
  type: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  timestamp?: string;
  userAgent?: string;
  [key: string]: any;
}

interface LogErrorOptions {
  source?: string;
  status?: number;
  type?: string;
  context?: Record<string, any>;
}

/**
 * Send an error to the server-side error logging endpoint
 */
export async function logError(
  error: Error | any,
  options: LogErrorOptions = {}
): Promise<void> {
  try {
    // Prepare error data for logging
    const errorData: ErrorLogData = {
      message: error?.message || 'Unknown error',
      type: options.type || error?.name || 'Error',
      stack: error?.stack,
      componentStack: error?.componentStack, // For React errors
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...options.context
    };

    // Add response details if it's an API error
    if (error?.response) {
      errorData.status = error.response.status;
      errorData.statusText = error.response.statusText;
      errorData.responseData = error.response.data;
      errorData.endpoint = error.config?.url;
      errorData.method = error.config?.method;
    }

    // Add source information
    if (options.source) {
      errorData.source = options.source;
    }

    // Send error to server logging endpoint
    await axios.post('/api/log-client-error', {
      error: errorData,
      context: options.context
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Logger]', errorData);
    }
  } catch (loggingError) {
    // Fallback to console if error logging fails
    console.error('[Error Logging Failed]', error);
    console.error('[Logging Error]', loggingError);
  }
}

/**
 * Format an error message for display to users
 */
export function formatErrorMessage(error: any): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // If it's a string, return it directly
  if (typeof error === 'string') {
    return error;
  }

  // For axios or network errors
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // For validation errors from server
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    if (Array.isArray(errors)) {
      return errors.map(e => e.message || e).join('. ');
    }
    return Object.values(errors).flat().join('. ');
  }

  // For Zod validation errors
  if (error.formErrors?.fieldErrors) {
    const fieldErrors = error.formErrors.fieldErrors;
    return Object.values(fieldErrors).flat().join('. ');
  }

  // For regular errors with message property
  if (error.message) {
    return error.message;
  }

  // Default fallback
  return 'An unexpected error occurred';
}

/**
 * Get the appropriate variant for toast notifications based on error type
 */
export function getErrorVariant(error: any): 'destructive' | 'default' {
  if (!error) return 'destructive';

  // Network or server errors are destructive
  if (error.status >= 500 || !error.response) {
    return 'destructive';
  }

  // Validation errors (400, 422) use default style
  if (error.status === 400 || error.status === 422) {
    return 'default';
  }

  // Default to destructive for auth errors and others
  return 'destructive';
}