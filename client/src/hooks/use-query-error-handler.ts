import { useToast } from '@/hooks/use-toast';

/**
 * Utility to handle query errors with standardized toast messaging
 * @param error The error object from the failed query
 * @param title Optional custom title for the error toast
 */
export function QueryErrorHandler(error: any, title?: string) {
  console.error('Query error:', error);
  
  // Get error message
  const errorMessage = error?.message || 'An unexpected error occurred';
  
  // We'll use this in components that import this directly
  return {
    title: title || 'Request Failed',
    description: errorMessage,
    variant: 'destructive' as const
  };
}

/**
 * A hook that provides standardized error handling for React Query requests
 * This centralizes error handling logic across the application for better consistency
 */
export function useQueryErrorHandler() {
  const { toast } = useToast();

  const handleQueryError = (error: any, title?: string) => {
    const errorDetails = QueryErrorHandler(error, title);
    toast(errorDetails);
  };

  return { handleQueryError };
}