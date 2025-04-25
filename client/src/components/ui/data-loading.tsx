import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type LoadingType = 'spinner' | 'skeleton' | 'text';

interface DataLoadingProps {
  /**
   * Whether the content is loading
   */
  isLoading: boolean;
  
  /**
   * The content to render when not loading
   */
  children: React.ReactNode;
  
  /**
   * Type of loading indicator to show
   * @default 'spinner'
   */
  type?: LoadingType;
  
  /**
   * Text to display with loading indicator
   * @default 'Loading...'
   */
  text?: string;
  
  /**
   * Minimum width for the loading container (for skeleton)
   */
  minWidth?: string;
  
  /**
   * Minimum height for the loading container (for skeleton)
   */
  minHeight?: string;
  
  /**
   * Number of skeleton items to render
   * @default 1
   */
  skeletonCount?: number;
  
  /**
   * Custom loading indicator
   */
  loadingIndicator?: React.ReactNode;
  
  /**
   * Additional classNames for the container
   */
  className?: string;
}

/**
 * Data loading indicator that wraps content and shows a loading state
 */
export function DataLoading({
  isLoading,
  children,
  type = 'spinner',
  text = 'Loading...',
  minWidth,
  minHeight,
  skeletonCount = 1,
  loadingIndicator,
  className
}: DataLoadingProps) {
  // If not loading, just render the children
  if (!isLoading) {
    return <>{children}</>;
  }
  
  // Custom loading indicator
  if (loadingIndicator) {
    return <>{loadingIndicator}</>;
  }
  
  // Handle different types of loading indicators
  if (type === 'spinner') {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center p-4",
          minHeight && `min-h-[${minHeight}]`,
          minWidth && `min-w-[${minWidth}]`,
          className
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    );
  }
  
  if (type === 'skeleton') {
    return (
      <div
        className={cn(
          "space-y-2",
          minHeight && `min-h-[${minHeight}]`,
          minWidth && `min-w-[${minWidth}]`,
          className
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              "w-full h-12 rounded-md", 
              i === 0 && "h-8"
            )}
          />
        ))}
      </div>
    );
  }
  
  // Default to text
  return (
    <div
      className={cn(
        "flex items-center justify-center p-4 text-muted-foreground",
        minHeight && `min-h-[${minHeight}]`,
        minWidth && `min-w-[${minWidth}]`,
        className
      )}
    >
      {text}
    </div>
  );
}

/**
 * Table skeleton loading indicator
 */
interface TableSkeletonProps {
  /**
   * Number of skeleton rows to render
   * @default 5
   */
  rows?: number;
  
  /**
   * Number of skeleton columns to render
   * @default 4
   */
  columns?: number;
  
  /**
   * Additional classNames for the container
   */
  className?: string;
}

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="flex gap-4 w-full">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-8 flex-1" />
        ))}
      </div>
      
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 w-full">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                "h-12 flex-1", 
                colIndex === 0 && "w-[40px] flex-none"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card skeleton loading indicator
 */
interface CardSkeletonProps {
  /**
   * Number of skeleton cards to render
   * @default 1
   */
  count?: number;
  
  /**
   * Whether to include a header in the skeleton
   * @default true
   */
  withHeader?: boolean;
  
  /**
   * Whether to include a footer in the skeleton
   * @default false
   */
  withFooter?: boolean;
  
  /**
   * Additional classNames for each card
   */
  className?: string;
}

export function CardSkeleton({ 
  count = 1, 
  withHeader = true, 
  withFooter = false,
  className 
}: CardSkeletonProps) {
  return (
    <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "rounded-lg border bg-card text-card-foreground shadow p-4 space-y-3",
            className
          )}
        >
          {withHeader && (
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          )}
          
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          
          {withFooter && (
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-8 w-1/3" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}