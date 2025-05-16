import * as React from "react"
import { AlertCircle, RefreshCcw, FileSearch } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ApiErrorHandler } from "./api-error-handler"

interface FetchErrorProps {
  /**
   * The error that occurred
   */
  error: Error | unknown
  
  /**
   * Entity type that failed to load (e.g., "leads", "tasks")
   */
  entityType?: string
  
  /**
   * Function to retry fetching data
   */
  onRetry?: () => void
  
  /**
   * Custom message to display
   */
  message?: string
  
  /**
   * Additional CSS class names
   */
  className?: string
  
  /**
   * Whether to show a skeleton while retrying
   */
  isRetrying?: boolean
  
  /**
   * Whether to show a small compact version
   */
  compact?: boolean
  
  /**
   * Whether to show technical error details (for developers)
   */
  showDetails?: boolean
  
  /**
   * Additional actions to be displayed in the footer
   */
  actions?: React.ReactNode
}

/**
 * Component for displaying fetch errors with retry capability
 */
export function FetchError({
  error,
  entityType = "data",
  onRetry,
  message,
  className,
  isRetrying = false,
  compact = false,
  showDetails = false,
  actions
}: FetchErrorProps) {
  // If the error is a specific API error (auth error, server error, etc.)
  // use the ApiErrorHandler for specialized handling
  if (error && (
    (error instanceof Error && 
     (error.message.includes("401") || 
      error.message.includes("403") || 
      error.message.includes("500"))) ||
    (typeof error === "object" && 
     error !== null && 
     ("status" in error || "statusCode" in error))
  )) {
    return (
      <ApiErrorHandler 
        error={error} 
        onRetry={onRetry} 
        className={className}
        showDetails={showDetails}
      />
    )
  }
  
  // Default error message if none provided
  const defaultMessage = `Failed to load ${entityType} data. Please refresh the page.`
  const displayMessage = message || defaultMessage
  
  // For compact view
  if (compact) {
    return (
      <div 
        className={cn(
          "p-3 rounded-md bg-red-50 border border-red-200 text-red-800",
          className
        )}
        role="alert"
      >
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{displayMessage}</p>
            {onRetry && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onRetry}
                className="mt-2 text-xs h-7"
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <RefreshCcw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCcw className="h-3 w-3 mr-1" />
                )}
                {isRetrying ? "Retrying..." : "Retry"}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // Full view
  return (
    <Card 
      className={cn(
        "border-2 border-red-200 bg-red-50 shadow-sm",
        className
      )}
      role="alert"
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-red-700 text-lg">
          <AlertCircle className="h-5 w-5" />
          Error Loading {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-4">{displayMessage}</p>
        
        {showDetails && error instanceof Error && (
          <div className="mt-4">
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground underline">
                Technical Details
              </summary>
              <pre className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground overflow-auto max-h-[200px]">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          </div>
        )}
        
        <div className="mt-6 flex items-center justify-center">
          <FileSearch className="h-16 w-16 text-muted-foreground/50" />
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2 pt-0">
        {onRetry && (
          <Button 
            variant="outline"
            onClick={onRetry}
            className="gap-1"
            disabled={isRetrying}
          >
            {isRetrying ? (
              <RefreshCcw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            {isRetrying ? "Retrying..." : "Retry"}
          </Button>
        )}
        
        {actions}
      </CardFooter>
    </Card>
  )
}

/**
 * Component for displaying an empty state with optional error information
 */
export function EmptyOrErrorState({
  isEmpty,
  isLoading,
  error,
  entityType = "items",
  emptyMessage,
  emptyIcon,
  onRetry,
  className
}: {
  isEmpty: boolean
  isLoading: boolean
  error: Error | unknown | null
  entityType: string
  emptyMessage?: React.ReactNode
  emptyIcon?: React.ReactNode
  onRetry?: () => void
  className?: string
}) {
  // While loading, don't show anything
  if (isLoading) return null
  
  // If there's an error, show the error component
  if (error) {
    return <FetchError error={error} entityType={entityType} onRetry={onRetry} className={className} />
  }
  
  // If it's empty, show empty state
  if (isEmpty) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
        {emptyIcon || <FileSearch className="h-12 w-12 text-muted-foreground/50 mb-4" />}
        <p className="text-muted-foreground">
          {emptyMessage || `No ${entityType} found.`}
        </p>
      </div>
    )
  }
  
  // If not empty, loading, or error, don't render anything
  return null
}