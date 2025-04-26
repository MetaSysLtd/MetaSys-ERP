import { toast } from '@/hooks/use-toast';

/**
 * Network error types
 */
export enum NetworkErrorType {
  TIMEOUT = 'timeout',
  CONNECTION_ERROR = 'connection_error',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  AUTH_ERROR = 'auth_error',
  UNKNOWN = 'unknown'
}

/**
 * Data structure for network error information
 */
export interface NetworkError {
  type: NetworkErrorType;
  status?: number;
  message: string;
  originalError?: unknown;
}

/**
 * Determines the retry delay in milliseconds using exponential backoff
 * @param attempt - Current attempt number (starts at 1)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Delay in milliseconds
 */
export function getRetryDelay(attempt: number, baseDelay = 1000, maxDelay = 30000): number {
  // Calculate exponential backoff with jitter
  const expBackoff = Math.min(maxDelay, baseDelay * Math.pow(2, attempt - 1));
  // Add some randomness (jitter) to prevent thundering herd problem
  const jitter = Math.random() * 0.5 * expBackoff;
  return Math.floor(expBackoff + jitter);
}

/**
 * Process API error response and extract error details
 * @param error - The error caught during API request
 * @returns Structured network error object
 */
export function processApiError(error: unknown): NetworkError {
  // Default error message if we can't determine specifics
  let type = NetworkErrorType.UNKNOWN;
  let status: number | undefined = undefined;
  let message = 'An unexpected error occurred. Please try again later.';
  
  if (!navigator.onLine) {
    type = NetworkErrorType.CONNECTION_ERROR;
    message = 'You appear to be offline. Please check your internet connection and try again.';
  } else if (error instanceof Response || (error && typeof error === 'object' && 'status' in error)) {
    // Handle Response objects or objects with status property
    const response = error as Response;
    status = response.status;
    
    if (status >= 500) {
      type = NetworkErrorType.SERVER_ERROR;
      message = 'The server encountered an error. Our team has been notified.';
    } else if (status === 401 || status === 403) {
      type = NetworkErrorType.AUTH_ERROR;
      message = status === 401 
        ? 'Your session has expired. Please log in again.'
        : 'You do not have permission to perform this action.';
    } else if (status >= 400) {
      type = NetworkErrorType.CLIENT_ERROR;
      message = 'There was an issue with your request. Please check your input and try again.';
    }
  } else if (error instanceof Error) {
    // Handle standard Error objects
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      type = NetworkErrorType.TIMEOUT;
      message = 'The request timed out. Please try again.';
    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      type = NetworkErrorType.CONNECTION_ERROR;
      message = 'Could not connect to the server. Please check your connection.';
    }
    
    // Use the error message if it exists and seems reasonably user-friendly
    if (error.message && 
        error.message.length < 150 && 
        !error.message.includes('SyntaxError') &&
        !error.message.includes('Unexpected token')) {
      message = error.message;
    }
  }
  
  return {
    type,
    status,
    message,
    originalError: error
  };
}

/**
 * Log client-side errors to the server for tracking
 * @param error - The error to log
 */
export async function logErrorToServer(error: NetworkError): Promise<void> {
  try {
    await fetch('/api/errors/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: error.type,
        status: error.status,
        message: error.message,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        error: error.originalError instanceof Error ? {
          name: error.originalError.name,
          message: error.originalError.message,
          stack: error.originalError.stack,
        } : String(error.originalError)
      }),
    });
  } catch (err) {
    // Silent failure - we don't want to trigger additional errors while logging
    console.error('Failed to log error to server:', err);
  }
}

/**
 * Shows an appropriate toast notification for the given error
 * @param error - The network error to display
 */
export function showErrorToast(error: NetworkError): void {
  const variant = error.type === NetworkErrorType.CONNECTION_ERROR ? 'default' : 'destructive';
  
  toast({
    title: getErrorTitle(error.type),
    description: error.message,
    variant,
    duration: 5000,
  });
}

/**
 * Get a user-friendly title for an error type
 * @param type - The network error type
 * @returns User-friendly title
 */
function getErrorTitle(type: NetworkErrorType): string {
  switch (type) {
    case NetworkErrorType.TIMEOUT:
      return 'Request Timeout';
    case NetworkErrorType.CONNECTION_ERROR:
      return 'Connection Error';
    case NetworkErrorType.SERVER_ERROR:
      return 'Server Error';
    case NetworkErrorType.CLIENT_ERROR:
      return 'Request Error';
    case NetworkErrorType.AUTH_ERROR:
      return 'Authentication Error';
    case NetworkErrorType.UNKNOWN:
    default:
      return 'Unexpected Error';
  }
}

/**
 * Handle API errors in a standardized way
 * @param error - The error caught during API request
 * @param showToast - Whether to show toast notification
 * @param logToServer - Whether to log the error to the server
 * @returns Processed network error
 */
export function handleApiError(
  error: unknown, 
  showToast = true, 
  logToServer = true
): NetworkError {
  const processedError = processApiError(error);
  
  // Log to console for debugging
  console.error('API Error:', processedError);
  
  // Optionally show toast notification
  if (showToast) {
    showErrorToast(processedError);
  }
  
  // Optionally log to server
  if (logToServer) {
    logErrorToServer(processedError).catch(err => {
      console.error('Failed to log error:', err);
    });
  }
  
  // Special handling for auth errors - redirect to login if needed
  if (processedError.type === NetworkErrorType.AUTH_ERROR && processedError.status === 401) {
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/auth') {
      // Don't redirect immediately to prevent redirect loops
      setTimeout(() => {
        window.location.href = `/auth?redirect=${encodeURIComponent(currentPath)}`;
      }, 1500);
    }
  }
  
  return processedError;
}

/**
 * Create a fetch wrapper with automatic retries and error handling
 * @param fetchFn - The original fetch function
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds
 * @returns Enhanced fetch function with retries
 */
export function createRetryFetch(
  fetchFn = fetch,
  maxRetries = 3,
  baseDelay = 2000
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const response = await fetchFn(input, init);
        
        // Only retry on network errors or 5xx server errors
        if (!response.ok && response.status >= 500) {
          const error = new Error(`Server error: ${response.status} ${response.statusText}`);
          (error as any).response = response; // Attach response to error for reference
          throw error;
        }
        
        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        
        // Don't retry if this is the last attempt or if it's a client-side error
        if (
          attempt > maxRetries ||
          (lastError.name !== 'TypeError' && !(lastError instanceof TypeError)) ||
          !navigator.onLine
        ) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = getRetryDelay(attempt, baseDelay);
        console.log(`API request failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`, lastError);
        
        // Show a connection issue toast only on the first retry
        if (attempt === 1) {
          toast({
            title: 'Connection issue',
            description: 'We\'re having trouble connecting. Trying again...',
            duration: delay + 1000,
          });
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we got here, all retries failed
    throw lastError;
  };
}

// Export a singleton instance of the retry fetch
export const retryFetch = createRetryFetch(fetch, 3, 2000);