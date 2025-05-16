import * as React from "react"
import { AlertCircle, AlertTriangle, Ban, RefreshCcw, Server } from "lucide-react"
import { ErrorCard } from "@/components/ui/error-card"
import { AuthErrorHandler } from "@/components/auth/auth-error-handler"

interface ErrorResponse {
  status?: number
  statusCode?: number
  message?: string
  error?: string
  authenticated?: boolean
  [key: string]: any
}

interface ApiErrorProps {
  /**
   * The error object or response from API
   */
  error: Error | ErrorResponse | any
  
  /**
   * Function to retry the request
   */
  onRetry?: () => void
  
  /**
   * Additional class name for styling
   */
  className?: string
  
  /**
   * Whether to show technical details
   */
  showDetails?: boolean
}

/**
 * Component that displays appropriate error messages based on API error types
 */
export function ApiErrorHandler({
  error,
  onRetry,
  className,
  showDetails = false
}: ApiErrorProps) {
  // Parse and normalize the error
  const parsedError = React.useMemo(() => {
    try {
      // Handle already structured error objects
      if (error && typeof error === 'object') {
        if ('status' in error || 'statusCode' in error) {
          return error;
        }
        
        // If error has a response property (like Axios errors)
        if (error.response) {
          return {
            status: error.response.status,
            statusCode: error.response.status,
            message: error.response.data?.message || error.message,
            error: error.response.data?.error || error.message,
            details: JSON.stringify(error.response.data, null, 2)
          };
        }
        
        // If it's a regular Error object
        if (error instanceof Error) {
          return {
            message: error.message,
            error: error.name,
            details: error.stack
          };
        }
      }
      
      // Handle string errors
      if (typeof error === 'string') {
        return {
          message: error,
          error: 'Error'
        };
      }
      
      // Unknown error format
      return {
        message: 'An unexpected error occurred',
        error: 'Unknown Error',
        details: typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error)
      };
    } catch (e) {
      // Error while parsing error (meta!)
      return {
        message: 'Failed to parse error details',
        error: 'Error Parsing',
        details: String(error)
      };
    }
  }, [error]);
  
  // Determine status code - prioritize status property, fallback to extracting from message
  const statusCode = parsedError.status || parsedError.statusCode || 
    (typeof parsedError.message === 'string' && parsedError.message.match(/^(\d{3})/) ? 
      parseInt(parsedError.message.match(/^(\d{3})/)[1]) : 0);
  
  // Error for authentication issues (401, 403)
  if (statusCode === 401 || parsedError.message?.includes('Unauthorized') || parsedError.message?.includes('unauthenticated')) {
    return (
      <AuthErrorHandler 
        message={parsedError.message || "You need to login to access this resource"} 
        statusCode={401}
        errorDetails={showDetails ? parsedError.details : undefined}
        className={className}
      />
    );
  }
  
  // Error for permission issues
  if (statusCode === 403 || parsedError.message?.includes('Forbidden') || parsedError.message?.includes('permission')) {
    return (
      <AuthErrorHandler
        message={parsedError.message || "You don't have permission to access this resource"} 
        statusCode={403}
        errorDetails={showDetails ? parsedError.details : undefined}
        className={className}
      />
    );
  }
  
  // Error for not found
  if (statusCode === 404 || parsedError.message?.includes('Not Found')) {
    return (
      <ErrorCard
        title="Resource Not Found"
        message={parsedError.message || "The requested resource could not be found"}
        details={showDetails ? parsedError.details : undefined}
        severity="medium"
        showBack={true}
        className={className}
      />
    );
  }
  
  // Error for bad request
  if (statusCode === 400 || parsedError.message?.includes('Bad Request')) {
    return (
      <ErrorCard
        title="Invalid Request"
        message={parsedError.message || "The request was invalid or contained incorrect parameters"}
        details={showDetails ? parsedError.details : undefined}
        severity="medium"
        showRefresh={!!onRetry}
        onRefresh={onRetry}
        className={className}
      />
    );
  }
  
  // Error for server errors
  if (statusCode >= 500 || parsedError.message?.includes('Server Error')) {
    return (
      <ErrorCard
        title="Server Error"
        message={parsedError.message || "There was a problem on our servers. Please try again later."}
        details={showDetails ? parsedError.details : undefined}
        severity="high"
        showRefresh={!!onRetry}
        onRefresh={onRetry}
        className={className}
      />
    );
  }
  
  // Generic error fallback
  return (
    <ErrorCard
      title="Error"
      message={parsedError.message || "An unexpected error occurred"}
      details={showDetails ? parsedError.details : undefined}
      severity="medium"
      showRefresh={!!onRetry}
      onRefresh={onRetry}
      className={className}
    />
  );
}

/**
 * Custom hook for handling API errors
 */
export function useApiErrorHandler() {
  const [apiError, setApiError] = React.useState<Error | null>(null);
  
  const handleError = React.useCallback((error: any) => {
    setApiError(error);
    return error;
  }, []);
  
  const clearError = React.useCallback(() => {
    setApiError(null);
  }, []);
  
  return {
    apiError,
    handleError,
    clearError,
    hasError: !!apiError,
    ApiErrorComponent: apiError ? (
      <ApiErrorHandler 
        error={apiError} 
        onRetry={clearError} 
      />
    ) : null
  };
}