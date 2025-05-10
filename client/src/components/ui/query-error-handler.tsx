import { ReactNode, useMemo, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface QueryErrorHandlerProps {
  error: Error | null | undefined;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component wrapper for handling query errors
 * It displays a fallback UI when an error occurs
 */
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
  
  // Log the error to console
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