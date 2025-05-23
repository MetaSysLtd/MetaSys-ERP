import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-800 flex items-center text-sm">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {this.props.title || 'Something went wrong'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-red-700 mb-3">
              {this.props.description || 'An error occurred while loading this component.'}
            </p>
            {this.props.onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  this.setState({ hasError: false });
                  this.props.onRetry?.();
                }}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Try again
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
interface UseErrorHandlerOptions {
  onError?: (error: Error) => void;
  fallbackMessage?: string;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { toast } = useToast();

  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    
    // Call custom error handler if provided
    options.onError?.(error);
    
    // Show toast notification
    toast({
      title: "Something went wrong",
      description: options.fallbackMessage || "Please try again or contact support if the problem persists.",
      variant: "destructive",
    });
  }, [toast, options]);

  return { handleError };
}

// Wrapper component for query errors
interface QueryErrorWrapperProps {
  error: Error | null;
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  retryFn?: () => void;
  emptyState?: React.ReactNode;
  hasData?: boolean;
}

export function QueryErrorWrapper({
  error,
  isLoading,
  children,
  loadingComponent,
  retryFn,
  emptyState,
  hasData = true
}: QueryErrorWrapperProps) {
  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#025E73]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBoundary
        title="Failed to load data"
        description="There was a problem loading this information."
        onRetry={retryFn}
      >
        <div /> {/* Placeholder child to satisfy TypeScript */}
      </ErrorBoundary>
    );
  }

  if (!hasData && emptyState) {
    return <>{emptyState}</>;
  }

  return <>{children}</>;
}