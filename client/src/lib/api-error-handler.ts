import { showToastError } from '@/components/ui/toast-error';
import { isErrorSuppressed } from '@/lib/global-error-handler';

interface FetchRetryOptions extends RequestInit {
  maxRetries?: number;
  initialDelay?: number;
  retryStatusCodes?: number[];
  maxDelay?: number;
}

/**
 * Retry a fetch request with exponential backoff
 * 
 * @param url The URL to fetch
 * @param options Fetch options with retry configuration
 * @returns Promise with fetch response
 */
export async function retryFetch(
  url: string,
  options: FetchRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    initialDelay = 300,
    retryStatusCodes = [408, 429, 500, 502, 503, 504],
    maxDelay = 5000,
    ...fetchOptions
  } = options;

  let delay = initialDelay;
  let retries = 0;
  let lastError: Error | null = null;

  // Ensure full URL
  const fullUrl = url.startsWith('http') ? url : url.startsWith('/api') 
    ? url
    : `/api${url.startsWith('/') ? url : `/${url}`}`;

  while (retries <= maxRetries) {
    try {
      const response = await fetch(fullUrl, fetchOptions);
      
      // If the response is ok or it's not a retryable status code, return it
      if (response.ok || !retryStatusCodes.includes(response.status)) {
        return response;
      }
      
      // If we got here, the status code is in our retry list
      lastError = new Error(`Received status ${response.status}`);
      
    } catch (error) {
      // Network error or other fetch failure
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // If this was our last retry attempt, throw the error
    if (retries === maxRetries) {
      break;
    }
    
    // Exponential backoff with jitter
    const jitter = Math.random() * 0.2 * delay;
    await new Promise(resolve => setTimeout(resolve, delay + jitter));
    
    // Increase delay for next retry, but cap at maxDelay
    delay = Math.min(delay * 1.5, maxDelay);
    retries++;
  }

  // We've used all our retries without success
  throw lastError || new Error('Failed to fetch after multiple attempts');
}

/**
 * Standard handler for API errors
 * 
 * @param error The error object
 * @param context The context where the error occurred (e.g., "dashboard")
 * @param resourceType The type of resource being accessed (e.g., "user data")
 * @throws The original error
 */
export function handleApiError(
  error: unknown,
  context: string,
  resourceType: string
): never {
  // Convert to Error if it's not already
  const err = error instanceof Error ? error : new Error(String(error));
  
  // Format date for log
  const timestamp = new Date().toISOString();
  
  // Log error with context
  console.error(`[${timestamp}] Error on ${context}`, err);
  
  // Get user-friendly message
  let userMessage = err.message;
  
  // Clean up common error messages
  if (userMessage.includes('fetch') || userMessage.includes('network')) {
    userMessage = `Unable to connect to the server. Please check your internet connection.`;
  } else if (userMessage.includes('timeout')) {
    userMessage = `The server is taking too long to respond. Please try again later.`;
  } else if (userMessage.includes('401')) {
    userMessage = `Your session has expired. Please log in again.`;
  } else if (userMessage.includes('403')) {
    userMessage = `You don't have permission to access this ${resourceType}.`;
  } else if (userMessage.includes('404')) {
    userMessage = `The requested ${resourceType} could not be found.`;
  } else if (userMessage.includes('500')) {
    userMessage = `An error occurred on the server while processing your request.`;
  } else if (!userMessage || userMessage === '[object Object]') {
    userMessage = `An unexpected error occurred while accessing ${resourceType}.`;
  }
  
  // Show user-friendly toast error if not suppressed
  if (!isErrorSuppressed(userMessage)) {
    showToastError({
      title: `Error in ${context}`,
      message: userMessage,
      severity: 'error',
    });
  }
  
  // Re-throw the error to be caught by the caller if needed
  throw err;
}