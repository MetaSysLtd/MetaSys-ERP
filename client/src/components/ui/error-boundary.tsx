import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Component to gracefully catch and display React errors
 * 
 * This component catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 * 
 * Features:
 * - Catches errors during rendering, in lifecycle methods, and in constructors
 * - Provides a reset button to attempt recovery
 * - Logs the full component stack trace to help with debugging
 * - Can be placed around specific components or sections that might fail
 * 
 * @example
 * ```tsx
 * <ErrorBoundary moduleName="user dashboard">
 *   <UserDashboard />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to console
    console.error("Error caught by ErrorBoundary:", error, {
      componentStack: errorInfo.componentStack
    });
  }

  handleReset = (): void => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render(): ReactNode {
    const { moduleName } = this.props;
    
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12 text-destructive" />}
          title={`Something went wrong ${moduleName ? `in ${moduleName}` : ''}`}
          description={this.state.error?.message || "An unexpected error occurred"}
          className="my-8 border border-destructive/10 bg-destructive/5"
          action={
            <Button 
              onClick={this.handleReset}
              variant="outline"
              className="mt-4"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          }
        />
      );
    }

    // Normally, just render children
    return this.props.children;
  }
}