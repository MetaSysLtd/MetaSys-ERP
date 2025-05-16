import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { LeadsErrorHandler } from './LeadsErrorHandler';
import { ErrorBoundaryWrapper } from '@/components/error/ErrorBoundaryWrapper';

interface LeadsLoadingCardProps {
  /**
   * Loading state
   */
  isLoading: boolean;
  
  /**
   * Error state if any
   */
  error: Error | null;
  
  /**
   * Children to render when data is loaded
   */
  children: React.ReactNode;
  
  /**
   * Function to retry loading data
   */
  onRetry?: () => void;
  
  /**
   * Title to display in card header
   */
  title?: string;
  
  /**
   * Number of items to show in skeleton
   */
  skeletonCount?: number;
  
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * A card component that handles different states of leads data loading:
 * - Loading (shows skeleton)
 * - Error (shows appropriate error message)
 * - Success (shows children)
 */
export function LeadsLoadingCard({ 
  isLoading, 
  error, 
  children, 
  onRetry,
  title = "Leads",
  skeletonCount = 3,
  className = ""
}: LeadsLoadingCardProps) {
  // Track if we're currently retrying
  const [isRetrying, setIsRetrying] = React.useState(false);
  
  // Handle retry with loading state
  const handleRetry = React.useCallback(() => {
    if (onRetry) {
      setIsRetrying(true);
      
      // Call the retry function
      Promise.resolve(onRetry())
        .catch(err => console.error("Error during retry:", err))
        .finally(() => {
          // After a small delay to prevent flashing UI
          setTimeout(() => {
            setIsRetrying(false);
          }, 500);
        });
    }
  }, [onRetry]);
  
  return (
    <ErrorBoundaryWrapper
      onReset={handleRetry}
    >
      <Card className={`${className} overflow-hidden`}>
        <CardHeader className="pb-3">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        
        <CardContent>
          {isLoading || isRetrying ? (
            // Loading skeleton
            <div className="space-y-4">
              {Array(skeletonCount).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <LeadsErrorHandler 
              error={error} 
              onRetry={handleRetry}
              isRetrying={isRetrying}
            />
          ) : (
            // Content
            children
          )}
        </CardContent>
        
        {(error || isLoading) && (
          <CardFooter className="pt-0 flex justify-end">
            {error && onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center"
              >
                <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </ErrorBoundaryWrapper>
  );
}