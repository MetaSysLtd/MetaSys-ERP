import { useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * Hook that provides a consistent way to handle errors from React Query
 */
export function useQueryErrorHandler() {
  const { toast } = useToast();

  /**
   * Handles an error from a React Query operation
   */
  const handleError = useCallback((error: Error) => {
    console.error('Query error:', error);
    
    // Get the error message
    const errorMessage = error?.message || 'An unknown error occurred';
    
    // Show a toast with the error message
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  }, [toast]);

  return { handleError };
}

// This is a component wrapper for error handling
interface QueryErrorHandlerProps {
  error: Error | null;
  children: ReactNode;
  fallback?: ReactNode;
}

export function QueryErrorHandler({ error, children, fallback }: QueryErrorHandlerProps) {
  const { handleError } = useQueryErrorHandler();
  
  // Handle the error with our hook
  if (error) {
    handleError(error);
    
    // Return a fallback UI if provided, otherwise show an error alert
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || 'An error occurred while loading the data.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  // No error, render children normally
  return <>{children}</>;
}