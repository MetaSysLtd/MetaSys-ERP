import React, { Component, ErrorInfo, ReactNode } from 'react';
import { EmptyState } from './empty-state';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const moduleName = this.props.moduleName || 'module';
      return (
        <EmptyState
          title={`No data available`}
          description={`The ${moduleName} data is not available at the moment. This could be because it's still being set up or you don't have any data yet.`}
          icon="database"
          iconColor="#025E73"
        />
      );
    }

    return this.props.children;
  }
}

// Export both as default and named export for flexibility
export default ErrorBoundary;