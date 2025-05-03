import { ErrorHandler } from "@/components/ui/toast-error";

/**
 * Retry fetch with exponential backoff
 * @param url The URL to fetch from
 * @param options Fetch options
 * @param attempts Maximum number of attempts (default: 3)
 * @param delay Initial delay in ms (default: 1000)
 */
export async function retryFetch(
  url: string,
  options: RequestInit = {},
  attempts = 3,
  delay = 1000
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (!res.ok && attempts > 1) {
      // Only retry for network errors or server errors (5xx)
      if (!res.ok && (res.status >= 500 || res.status === 0)) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryFetch(url, options, attempts - 1, delay * 1.5);
      }
    }
    return res;
  } catch (err) {
    if (attempts > 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryFetch(url, options, attempts - 1, delay * 1.5);
    }
    throw err;
  }
}

/**
 * Handle API errors consistently
 * This function handles API errors and displays appropriate error messages
 */
export function handleApiError(error: any, location: string = "API Request", moduleName?: string): null {
  // Don't display error toasts for auth-related errors
  if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
    console.error(`Auth error in ${location}:`, error);
    return null;
  }
  
  // Limit connection errors to a single toast
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Network Error')) {
    // Only log this error to console, don't display toast
    console.error(`Network error in ${location}:`, error);
    return null;
  }
  
  // Pass to the global error handler for other errors
  ErrorHandler.handleError(error, location, moduleName);
  return null;
}