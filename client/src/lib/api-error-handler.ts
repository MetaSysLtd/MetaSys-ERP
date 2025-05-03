import { toast } from '@/hooks/use-toast';

/**
 * Maximum number of retry attempts for API calls
 */
const MAX_RETRIES = 3;

/**
 * Delay between retry attempts (exponential backoff)
 */
const RETRY_DELAY_MS = 1000;

/**
 * Standardized API error handling
 * Returns a standardized error object rather than throwing to allow graceful degradation
 * 
 * @param error - The error that occurred
 * @param module - The module where the error occurred (for logging)
 * @param resource - The resource being accessed (for user-friendly messages)
 * @returns An empty object to prevent component errors
 */
export function handleApiError(error: unknown, module: string, resource: string): any {
  console.error(`[${new Date().toLocaleString()}] Error on ${module}`, error);
  
  // Create appropriate user message
  let message = '';
  if (error instanceof Error) {
    // Check for network error
    if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
      message = `Unable to connect to server. Please check your internet connection.`;
    } else {
      message = error.message || `Error loading ${resource}`;
    }
  } else {
    message = `Unable to load ${resource}`;
  }
  
  // Don't flood the user with error toasts from the same resource
  // This prevents overwhelming the user if multiple components fail at once
  // or if a polling operation continuously fails
  if (!window.suppressedErrorMessages?.includes(message)) {
    window.suppressedErrorMessages = window.suppressedErrorMessages || [];
    window.suppressedErrorMessages.push(message);
    
    // Remove message from suppression list after a delay
    setTimeout(() => {
      if (window.suppressedErrorMessages) {
        window.suppressedErrorMessages = window.suppressedErrorMessages.filter(m => m !== message);
      }
    }, 10000); // 10 seconds
    
    toast({
      title: `Error in ${module}`,
      description: message,
      variant: 'destructive',
    });
  }
  
  // Return empty data rather than throwing, allowing components to render with fallbacks
  return {};
}

/**
 * Fetch wrapper with retry functionality
 * 
 * @param url - The URL to fetch
 * @param options - Optional fetch options
 * @param retries - Number of retries (internal use)
 * @returns Promise resolving to the fetch response
 */
export async function retryFetch(
  url: string,
  options?: RequestInit,
  retries = 0
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok && retries < MAX_RETRIES) {
      // Calculate delay with exponential backoff
      const delay = RETRY_DELAY_MS * Math.pow(2, retries);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with incremented counter
      return retryFetch(url, options, retries + 1);
    }
    
    return response;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      // Calculate delay with exponential backoff
      const delay = RETRY_DELAY_MS * Math.pow(2, retries);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with incremented counter
      return retryFetch(url, options, retries + 1);
    }
    
    // Rethrow if max retries exceeded
    throw error;
  }
}

/**
 * Global error suppression tracking
 */
declare global {
  interface Window {
    suppressedErrorMessages?: string[];
  }
}