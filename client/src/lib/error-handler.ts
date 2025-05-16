import { toast } from "@/hooks/use-toast"
import { queryClient } from "./queryClient"

type ErrorType = 
  | 'auth' 
  | 'server' 
  | 'network' 
  | 'validation' 
  | 'not-found' 
  | 'forbidden' 
  | 'unknown'

type ErrorDetails = {
  statusCode?: number
  message: string
  source?: string
  technical?: string
  retry?: () => void
}

interface ErrorLogOptions {
  silent?: boolean
  showToast?: boolean
  clearCache?: boolean
  redirectToAuth?: boolean
}

/**
 * Classifies error based on error object or response
 */
export function classifyError(error: any): {
  type: ErrorType
  details: ErrorDetails
} {
  // Determine error status code
  const statusCode = error?.status || error?.statusCode || 
    (error?.response?.status) || 
    (error?.message?.match(/^\[(\d{3})\]/) ? 
      parseInt(error.message.match(/^\[(\d{3})\]/)[1]) : undefined);
  
  // Get error message
  const message = error?.message || 
    error?.response?.data?.message || 
    'An unexpected error occurred';
  
  // Get error source
  const source = error?.source || 
    (error?.config?.url ? `API request to ${error.config.url}` : 'Unknown source');
  
  // Get technical details for logging
  const technical = error?.stack || JSON.stringify(error, null, 2);
  
  // Classify error by type
  let type: ErrorType = 'unknown';
  
  // Check for auth errors
  if (statusCode === 401 || 
      message.toLowerCase().includes('unauthorized') || 
      message.toLowerCase().includes('unauthenticated') ||
      message.toLowerCase().includes('auth')) {
    type = 'auth';
  } 
  // Check for forbidden errors
  else if (statusCode === 403 || 
           message.toLowerCase().includes('forbidden') || 
           message.toLowerCase().includes('permission')) {
    type = 'forbidden';
  } 
  // Check for not found errors
  else if (statusCode === 404 || 
           message.toLowerCase().includes('not found')) {
    type = 'not-found';
  } 
  // Check for validation errors
  else if (statusCode === 400 || 
           message.toLowerCase().includes('validation') || 
           message.toLowerCase().includes('invalid')) {
    type = 'validation';
  } 
  // Check for server errors
  else if (statusCode && statusCode >= 500 || 
           message.toLowerCase().includes('server error')) {
    type = 'server';
  } 
  // Check for network errors
  else if (message.toLowerCase().includes('network') || 
           message.toLowerCase().includes('connection') || 
           message.toLowerCase().includes('offline')) {
    type = 'network';
  }
  
  return {
    type,
    details: {
      statusCode,
      message,
      source,
      technical
    }
  };
}

/**
 * Central error handler function
 */
export function handleError(error: any, options: ErrorLogOptions = {}) {
  const { silent = false, showToast = true, clearCache = false, redirectToAuth = true } = options;
  
  // Classify the error
  const { type, details } = classifyError(error);
  
  // Log error unless silent
  if (!silent) {
    console.error(`[${type.toUpperCase()} ERROR] ${details.message}`, error);
  }
  
  // Show toast notification
  if (showToast) {
    switch (type) {
      case 'auth':
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive"
        });
        break;
      case 'forbidden':
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this resource.",
          variant: "destructive"
        });
        break;
      case 'network':
        toast({
          title: "Network Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive"
        });
        break;
      case 'server':
        toast({
          title: "Server Error",
          description: "Something went wrong on our servers. Please try again later.",
          variant: "destructive"
        });
        break;
      case 'validation':
        toast({
          title: "Invalid Input",
          description: details.message,
          variant: "destructive"
        });
        break;
      case 'not-found':
        toast({
          title: "Not Found",
          description: details.message,
          variant: "destructive"
        });
        break;
      default:
        toast({
          title: "An error occurred",
          description: details.message,
          variant: "destructive"
        });
        break;
    }
  }
  
  // Clear cache if needed
  if (clearCache) {
    queryClient.clear();
  }
  
  // Redirect to auth page for auth errors if specified
  if (redirectToAuth && type === 'auth') {
    // Clear session cookie
    document.cookie = "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Create a redirect function that works outside of React components
    const redirectToLogin = () => {
      // Store current path for redirect after login if desired
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/auth?returnUrl=${returnUrl}`;
    };
    
    // Small delay to allow toast to show before redirect
    setTimeout(redirectToLogin, 1500);
  }
  
  return { type, details };
}

/**
 * React Query error handler function specifically for queries
 */
export function queryErrorHandler(error: unknown) {
  return handleError(error, {
    redirectToAuth: false // Let the query retry logic handle redirects
  });
}

/**
 * Generic error handling hook for use in components
 */
export function useErrorHandler() {
  return {
    handleError,
    classifyError
  };
}