import * as React from "react"
import { useQueryErrorHandler } from "@/hooks/use-query-error-handler"
import { GlobalErrorBoundary } from "@/components/error/global-error-boundary"

interface ErrorProviderProps {
  children: React.ReactNode
}

/**
 * Context for global error handling state and functions
 */
export const ErrorContext = React.createContext<{
  reportError: (error: Error | string) => void
  clearErrors: () => void
  hasErrors: boolean
}>({
  reportError: () => {},
  clearErrors: () => {},
  hasErrors: false
})

/**
 * Provider component that enables global error handling capabilities
 */
export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errors, setErrors] = React.useState<Error[]>([])
  const queryErrorHandler = useQueryErrorHandler()
  
  // Function to report an error to the global handler
  const reportError = React.useCallback((error: Error | string) => {
    const errorObject = typeof error === "string" ? new Error(error) : error
    
    console.error("[Global Error]", errorObject)
    setErrors(prev => [...prev, errorObject])
    
    // Use our query error handler for consistent handling
    queryErrorHandler.handleQueryError(errorObject, {
      showToast: true,
      redirectToAuth: false
    })
  }, [queryErrorHandler])
  
  // Function to clear all errors
  const clearErrors = React.useCallback(() => {
    setErrors([])
  }, [])
  
  // Window error handler for uncaught exceptions
  React.useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      reportError(event.error || new Error(event.message))
      // Prevent default to avoid duplicate error reporting
      event.preventDefault()
    }
    
    // Unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))
      
      reportError(error)
    }
    
    // Add event listeners
    window.addEventListener("error", handleWindowError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    
    // Log initialization
    console.log("Global error handlers initialized")
    
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("error", handleWindowError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [reportError])

  return (
    <ErrorContext.Provider
      value={{
        reportError,
        clearErrors,
        hasErrors: errors.length > 0
      }}
    >
      <GlobalErrorBoundary>
        {children}
      </GlobalErrorBoundary>
    </ErrorContext.Provider>
  )
}

/**
 * Hook to access global error handling functions
 */
export function useErrorContext() {
  const context = React.useContext(ErrorContext)
  
  if (!context) {
    throw new Error("useErrorContext must be used within an ErrorProvider")
  }
  
  return context
}