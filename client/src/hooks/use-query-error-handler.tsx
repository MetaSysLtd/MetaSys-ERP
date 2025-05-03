import React, { ReactNode } from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export interface QueryErrorHandlerProps<TData, TError> {
  query: UseQueryResult<TData, TError>;
  children: (data: TData) => ReactNode;
  moduleName?: string;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
  emptyComponent?: ReactNode;
  isDataEmpty?: (data: TData) => boolean;
}

/**
 * A component to handle common query states like loading, error, and empty data
 */
export function QueryErrorHandler<TData, TError>({
  query,
  children,
  moduleName = 'Data',
  loadingComponent,
  errorComponent,
  emptyComponent,
  isDataEmpty,
}: QueryErrorHandlerProps<TData, TError>) {
  const { data, isLoading, error } = query;

  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return (
      <div className="flex items-center justify-center p-8 h-32">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#025E73]" />
          <span className="text-sm font-medium text-gray-600">Loading {moduleName.toLowerCase()}...</span>
        </div>
      </div>
    );
  }

  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    return (
      <EmptyState
        title={`${moduleName} unavailable`}
        description="The requested information is not available at the moment. Please try again later."
        icon="database"
        iconColor="#F2A71B"
      />
    );
  }

  if (!data || (isDataEmpty && isDataEmpty(data))) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }
    return (
      <EmptyState
        title={`No ${moduleName.toLowerCase()} found`}
        description={`No ${moduleName.toLowerCase()} are currently available.`}
        icon="empty"
      />
    );
  }

  return <>{children(data)}</>;
}

// The hook has been removed to fix HMR issues
// We're using the QueryErrorHandler component instead