import React from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type QueryErrorHandlerProps<TData, TError> = {
  query: UseQueryResult<TData, TError>;
  children: (data: TData) => React.ReactNode;
  moduleName: string;
  loadingComponent?: React.ReactNode;
  emptyStateMessage?: string;
  emptyStateIcon?: React.ReactNode;
  emptyStateAction?: React.ReactNode;
};

/**
 * QueryErrorHandler - A component that gracefully handles error states in React Query
 * 
 * This component wraps around React Query results and provides consistent loading,
 * error, and empty state handling. It is designed to:
 * 
 * 1. Show a loading state while the query is loading (can be customized)
 * 2. Show an error state if the query fails (with a retry button)
 * 3. Show an empty state if the query returns no data
 * 4. Render children with the data if all is well
 * 
 * @example
 * ```tsx
 * <QueryErrorHandler
 *   query={usersQuery}
 *   moduleName="users"
 * >
 *   {(data) => (
 *     <UserTable data={data} />
 *   )}
 * </QueryErrorHandler>
 * ```
 */
export function QueryErrorHandler<TData, TError>({
  query,
  children,
  moduleName,
  loadingComponent,
  emptyStateMessage,
  emptyStateIcon,
  emptyStateAction,
}: QueryErrorHandlerProps<TData, TError>) {
  const { data, isLoading, isError, error, refetch } = query;

  // Loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <EmptyState
        icon={<Loader2 className="h-12 w-12 text-primary animate-spin" />}
        title="Loading data..."
        description="Please wait while we retrieve the latest information."
        className="my-8"
      />
    );
  }

  // Error state
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    
    return (
      <EmptyState
        icon={<AlertTriangle className="h-12 w-12 text-destructive" />}
        title={`Unable to load ${moduleName}`}
        description={errorMessage}
        className="my-8 border border-destructive/10 bg-destructive/5"
        action={
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        }
      />
    );
  }

  // Empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <EmptyState
        icon={emptyStateIcon || <AlertTriangle className="h-12 w-12 text-muted-foreground" />}
        title={`No ${moduleName} found`}
        description={emptyStateMessage || `We couldn't find any ${moduleName} matching your criteria.`}
        className="my-8"
        action={emptyStateAction}
      />
    );
  }

  // Data is available, render children with data
  return <>{children(data)}</>;
}