import * as React from "react"
import { ErrorBoundary } from "react-error-boundary"
import { AlertCircle, RefreshCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocation } from "wouter"

interface FallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

/**
 * Error fallback component displayed when an error is caught by the ErrorBoundary
 */
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const [, navigate] = useLocation()

  // Determine if the error is authentication-related
  const isAuthError = React.useMemo(() => {
    return error.message.includes("401") || 
           error.message.includes("403") ||
           error.message.includes("unauthorized") ||
           error.message.includes("Unauthorized") ||
           error.message.includes("authenticated") ||
           error.message.toLowerCase().includes("auth") ||
           error.message.toLowerCase().includes("login") ||
           error.message.toLowerCase().includes("permission")
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="w-full max-w-md border-2 border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            {isAuthError ? "Authentication Error" : "Unexpected Error"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            {isAuthError 
              ? "You are not authorized to access this resource. Please log in again."
              : "Something went wrong. We've been notified and are working to fix the issue."}
          </p>
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
        </CardContent>
        <CardFooter className="flex gap-2">
          {isAuthError ? (
            <Button 
              variant="default"
              onClick={() => navigate("/auth")}
              className="gap-1 bg-[#025E73] hover:bg-[#014A5C]"
            >
              Log In Again
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={resetErrorBoundary}
              className="gap-1"
            >
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          
          <Button 
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-1"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

/**
 * Global error boundary component to wrap around the entire application
 * or specific sections that need error handling
 */
export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  const handleReset = () => {
    // You could add additional reset logic here, like clearing cache or state
    window.location.reload()
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={handleReset}
      onError={(error) => {
        // Log errors to your monitoring service
        console.error("Caught by error boundary:", error)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Component-level error boundary for wrapping individual components
 * that might fail independently
 */
export function ComponentErrorBoundary({ 
  children,
  fallback
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        fallback ? (
          <>{fallback}</>
        ) : (
          <div className="p-4 border rounded-md bg-red-50 border-red-200">
            <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Component Error
            </h3>
            <p className="text-xs text-red-700 mb-3">
              This component encountered an error and couldn't be displayed.
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={resetErrorBoundary}
              className="text-xs"
            >
              <RefreshCcw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )
      )}
    >
      {children}
    </ErrorBoundary>
  )
}