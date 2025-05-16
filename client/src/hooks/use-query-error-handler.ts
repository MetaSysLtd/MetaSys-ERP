import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { handleError } from '@/lib/error-handler'
import { useToast } from '@/hooks/use-toast'

/**
 * Custom hook that sets up global query error handling 
 * for consistent error management across the application
 */
export function useQueryErrorHandler() {
  const queryClient = useQueryClient()
  const [, navigate] = useLocation()
  const { toast } = useToast()
  
  useEffect(() => {
    // Set up global query error handler
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      // Only handle errors
      if (event.type !== 'error') return
      
      const { error, query } = event
      
      // Extract query details
      const queryKey = query.queryKey
      const queryHash = query.queryHash
      
      // Skip errors that have already been handled (add a custom flag on errors)
      if ((error as any).__handled) return
      
      // Mark error as handled to prevent duplicate handling
      (error as any).__handled = true
      
      // Get query retry information
      const queryOptions = query.options
      const retryCount = queryOptions.retry ?? 3
      const currentRetryAttempt = queryOptions.retryCount ?? 0
      
      // Determine if this is the final retry attempt
      const isFinalRetry = currentRetryAttempt >= retryCount
      
      // Skip toast for non-final retries to avoid spamming user
      if (!isFinalRetry) return
      
      // Check if query is related to authentication
      const isAuthQuery = 
        Array.isArray(queryKey) && 
        (queryKey.includes('/api/auth/me') || 
         queryKey.includes('/api/user') || 
         queryKey.includes('/api/login') ||
         queryKey.some(part => 
           typeof part === 'string' && part.includes('auth')
         ))
      
      // Handle the error with appropriate options
      handleError(error, {
        // Show toast for final retry attempt
        showToast: true,
        // Redirect to auth page for auth errors on final retry
        redirectToAuth: isAuthQuery,
        // Don't clear cache automatically
        clearCache: false
      })
    })
    
    // Clean up subscription
    return () => {
      unsubscribe()
    }
  }, [queryClient, navigate, toast])
  
  // Return methods for manual error handling
  return {
    // Manually handle an error with the global handler
    handleQueryError: (error: unknown, options = {}) => handleError(error, options),
    
    // Manually invalidate queries
    invalidateQueries: (queryKey: any) => queryClient.invalidateQueries({ queryKey }),
    
    // Clear the query cache
    clearQueryCache: () => queryClient.clear(),
    
    // Reset a specific query
    resetQuery: (queryKey: any) => queryClient.resetQueries({ queryKey })
  }
}