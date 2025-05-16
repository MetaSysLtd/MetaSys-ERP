import * as React from "react"
import { useLocation } from "wouter"
import { ErrorCard } from "@/components/ui/error-card"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"

interface AuthErrorHandlerProps {
  /**
   * The error message to display
   */
  message?: string
  
  /**
   * The error code (e.g., 401, 403)
   */
  statusCode?: number
  
  /**
   * Raw error response for debugging
   */
  errorDetails?: string
  
  /**
   * Whether to show a login button
   */
  showLoginButton?: boolean
  
  /**
   * Class name to apply to the error card
   */
  className?: string
}

/**
 * A specialized error handler for authentication errors
 * Provides contextual actions and messaging for auth-related issues
 */
export function AuthErrorHandler({
  message = "You are not authorized to access this resource. Please log in again.",
  statusCode = 401,
  errorDetails,
  showLoginButton = true,
  className
}: AuthErrorHandlerProps) {
  const [location, navigate] = useLocation()
  
  // Format error details for display if provided
  const formattedDetails = errorDetails 
    ? errorDetails 
    : statusCode === 401 
      ? '{"status":"error","message":"Unauthorized: Please log in to access this resource","authenticated":false}'
      : statusCode === 403
      ? '{"status":"error","message":"Forbidden: You do not have permission to access this resource","authenticated":true}'
      : undefined
  
  // Redirect to login with return URL
  const handleLogin = React.useCallback(() => {
    // Store the current location as the return URL
    const returnUrl = encodeURIComponent(location)
    navigate(`/auth?returnUrl=${returnUrl}`)
  }, [navigate, location])
  
  // Custom login button action
  const loginAction = showLoginButton ? (
    <Button 
      size="sm" 
      variant="default"
      onClick={handleLogin}
      className="gap-1 bg-[#025E73] hover:bg-[#014A5C]"
    >
      <LogIn className="h-4 w-4" />
      Login
    </Button>
  ) : undefined
  
  return (
    <ErrorCard
      title={statusCode === 401 ? "Authentication Required" : "Access Denied"}
      message={message}
      details={formattedDetails}
      showRefresh={false}
      showBack={true}
      severity={statusCode === 403 ? "high" : "medium"}
      action={loginAction}
      className={className}
    />
  )
}

/**
 * Hook that listens for authentication errors in the fetch responses
 * and handles them appropriately
 */
export function useAuthErrorHandler() {
  const [, navigate] = useLocation()
  
  const handleAuthError = React.useCallback((error: any) => {
    // Check if the error is an authentication error
    if (error?.status === 401 || error?.statusCode === 401) {
      // Clear any auth tokens/cookies if needed
      document.cookie = "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      
      // Redirect to login
      navigate("/auth")
      
      return true // Error was handled
    }
    
    return false // Error was not handled
  }, [navigate])
  
  return { handleAuthError }
}