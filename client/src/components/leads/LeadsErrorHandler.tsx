import React from "react";
import { FetchError } from "@/components/error/fetch-error";
import { Button } from "@/components/ui/button";
import { RefreshCcw, LogIn } from "lucide-react";
import { useLocation } from "wouter";

interface LeadsErrorHandlerProps {
  /**
   * The error that occurred when trying to fetch leads
   */
  error: Error | unknown;
  
  /**
   * Function to retry fetching leads data
   */
  onRetry?: () => void;
  
  /**
   * Whether a retry is currently in progress
   */
  isRetrying?: boolean;
  
  /**
   * Optional class name for styling
   */
  className?: string;
}

/**
 * Specialized error handler for leads data loading issues
 */
export function LeadsErrorHandler({
  error,
  onRetry,
  isRetrying = false,
  className
}: LeadsErrorHandlerProps) {
  const [, navigate] = useLocation();
  
  // Check if error is authentication related
  const isAuthError = React.useMemo(() => {
    if (!error) return false;
    
    // Check error object or message
    if (typeof error === 'object') {
      const errorObj = error as any;
      if (errorObj.status === 401 || errorObj.statusCode === 401) return true;
      if (errorObj.message && typeof errorObj.message === 'string') {
        return errorObj.message.toLowerCase().includes('unauthorized') ||
               errorObj.message.toLowerCase().includes('unauthenticated') ||
               errorObj.message.toLowerCase().includes('auth') ||
               errorObj.message.toLowerCase().includes('login');
      }
    }
    
    // Check error string
    if (typeof error === 'string') {
      return error.toLowerCase().includes('unauthorized') ||
             error.toLowerCase().includes('unauthenticated') ||
             error.toLowerCase().includes('auth') ||
             error.toLowerCase().includes('login');
    }
    
    return false;
  }, [error]);
  
  if (isAuthError) {
    return (
      <div className={`rounded-md border-2 border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="flex flex-col items-center text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Authentication Required
          </h3>
          <p className="text-sm text-red-700 mb-4">
            Your session has expired or you are not logged in. 
            Please log in again to view leads data.
          </p>
          <div className="flex gap-3 mt-2">
            <Button 
              onClick={() => navigate("/auth")}
              className="gap-1"
            >
              <LogIn className="h-4 w-4" />
              Log In
            </Button>
            {onRetry && (
              <Button 
                variant="outline" 
                onClick={onRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <RefreshCcw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4 mr-1" />
                )}
                {isRetrying ? "Retrying..." : "Try Again"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // For non-auth errors, use the generic fetch error component
  return (
    <FetchError
      error={error}
      entityType="leads"
      onRetry={onRetry}
      isRetrying={isRetrying}
      className={className}
    />
  );
}