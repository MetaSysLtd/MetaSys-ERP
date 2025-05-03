import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in its child component tree.
 * Logs error information and displays a fallback UI.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to backend error tracking system if available
    try {
      fetch('/api/errors/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          location: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      }).catch(err => {
        console.error('Failed to report error to backend:', err);
      });
    } catch (reportError) {
      console.error('Error while reporting error:', reportError);
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <CardTitle className="text-red-700 dark:text-red-400">Something went wrong</CardTitle>
              </div>
              <CardDescription className="text-red-700/70 dark:text-red-400/70">
                The application encountered an unexpected error.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-1">Error details:</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  {this.state.error?.message || 'Unknown error'}
                </p>

                <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-1">What happened?</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  The application encountered an unexpected error. This error has been automatically
                  reported to our technical team, who will work to resolve it as soon as possible.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Go to homepage
              </Button>
              <Button 
                onClick={this.resetErrorBoundary}
                className="bg-[#025E73] hover:bg-[#F2A71B] text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Try again
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export { ErrorBoundary };