import { useCallback, ReactNode, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';


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
  error: Error | null | undefined;
  children: ReactNode;
  fallback?: ReactNode;
}

export function QueryErrorHandler({ error, children, fallback }: QueryErrorHandlerProps) {
  // Static error message component to avoid re-renders
  const errorAlert = useMemo(() => {
    if (!error) return null;
    
    const errorMessage = error.message || 'An error occurred while loading the data.';
    
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );
  }, [error?.message]);
  
  // Log the error to console but don't use the toast handler to avoid loops
  useEffect(() => {
    if (error) {
      console.error("Error in QueryErrorHandler:", error);
    }
  }, [error]);

  // Handle the error display
  if (error) {
    // Return a fallback UI if provided, otherwise show an error alert
    if (fallback) {
      return <>{fallback}</>;
    }

    return errorAlert;
  }

  // No error, render children normally
  return <>{children}</>;
}