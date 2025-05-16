import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// Default fallback UI shown when an error occurs
function DefaultFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-4 border-2 border-red-200 bg-red-50 rounded-md">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          <h3 className="font-medium">Something went wrong</h3>
        </div>
        
        <p className="text-sm text-gray-700">{error.message}</p>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetErrorBoundary}
            className="flex items-center"
          >
            <RefreshCcw className="h-3.5 w-3.5 mr-1" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
  onReset?: () => void;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

/**
 * A reusable error boundary wrapper component that provides default 
 * error handling while allowing for custom fallback UI
 */
export function ErrorBoundaryWrapper({
  children,
  fallback,
  onReset,
  onError
}: ErrorBoundaryWrapperProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // This will be called when an error is caught
  const handleError = React.useCallback((error: Error, info: React.ErrorInfo) => {
    console.error('Caught error:', error, info);
    
    // Show a toast to notify the user
    toast({
      title: 'An error occurred',
      description: error.message || 'Something went wrong',
      variant: 'destructive',
    });
    
    // If it's an auth error, redirect to login
    if (
      error.message.includes('401') || 
      error.message.toLowerCase().includes('unauthorized') ||
      error.message.toLowerCase().includes('unauthenticated')
    ) {
      navigate('/auth');
    }
    
    // Call provided onError handler if any
    if (onError) {
      // Make sure we use the correct info type
      const safeInfo: React.ErrorInfo = {
        componentStack: info.componentStack || '',
        digest: (info as any).digest || undefined,
      };
      onError(error, safeInfo);
    }
  }, [toast, navigate, onError]);
  
  // Reset function that can be extended with custom logic
  const handleReset = React.useCallback(() => {
    if (onReset) {
      onReset();
    }
  }, [onReset]);
  
  return (
    <ErrorBoundary
      FallbackComponent={fallback || DefaultFallback}
      onReset={handleReset}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * A specialized version for data fetching components that handles retry logic
 */
export function QueryErrorBoundary({
  children,
  queryKey,
  fallback,
  onReset
}: {
  children: React.ReactNode;
  queryKey?: string | string[];
  fallback?: React.ComponentType<FallbackProps>;
  onReset?: () => void;
}) {
  const { toast } = useToast();
  
  // On reset, invalidate the relevant query to trigger a refetch
  const handleQueryReset = React.useCallback(() => {
    // If we have onReset handler, call that
    if (onReset) {
      onReset();
    }
    
    toast({
      title: 'Retrying...',
      description: 'Refreshing data from the server',
    });
    
    // We're not using query invalidation here since this component doesn't have
    // access to the query client directly. The parent component should handle
    // that in its onReset handler if needed.
  }, [toast, onReset]);
  
  return (
    <ErrorBoundaryWrapper
      onReset={handleQueryReset}
      fallback={fallback}
    >
      {children}
    </ErrorBoundaryWrapper>
  );
}