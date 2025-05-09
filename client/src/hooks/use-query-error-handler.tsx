import { useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query'; // Added import


/**
 * Hook that provides a consistent way to handle errors from React Query
 */
export function useQueryErrorHandler() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Handles an error from a React Query operation
   */
  const handleError = useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    // Show toast notification
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
      duration: 5000
    });

    // Clear invalid queries
    if (errorMessage.includes('401')) {
      queryClient.clear();
    }
  }, [queryClient, toast]);

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
    // Don't call handleError here to avoid infinite loops
    // Just display the error UI
    
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