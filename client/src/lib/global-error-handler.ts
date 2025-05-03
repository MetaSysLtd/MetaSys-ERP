import { toast } from '@/hooks/use-toast';

/**
 * Initialize global error handlers
 * 
 * This function sets up global error handlers for:
 * 1. Unhandled promise rejections
 * 2. Global window error events
 * 3. React Query errors (via middleware)
 * 
 * It provides consistent error handling across the application
 * to ensure users get appropriate feedback for any error.
 */
export function initializeGlobalErrorHandlers() {
  // Track which errors we've already shown to avoid duplicate toasts
  const shownErrors = new Set<string>();

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || 'An unexpected error occurred';
    
    // Only show each unique error once
    if (!shownErrors.has(errorMessage)) {
      shownErrors.add(errorMessage);
      
      // Remove from set after a delay so the same error can be shown again later if needed
      setTimeout(() => shownErrors.delete(errorMessage), 10000);
      
      // Log error to console
      console.error('[Unhandled Promise Rejection]', event.reason);
      
      // Don't show toast for expected login-related errors
      if (
        !errorMessage.includes('Authentication') &&
        !errorMessage.includes('401') &&
        !errorMessage.includes('unauthorized')
      ) {
        toast({
          title: 'Application Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
    
    // Prevent the error from showing in the console (we've already logged it)
    event.preventDefault();
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    const errorMessage = event.error?.message || 'An unexpected error occurred';
    
    // Only show each unique error once
    if (!shownErrors.has(errorMessage)) {
      shownErrors.add(errorMessage);
      
      // Remove from set after a delay so the same error can be shown again later if needed
      setTimeout(() => shownErrors.delete(errorMessage), 10000);
      
      // Log error to console
      console.error('[Global Error]', event.error);
      
      // Don't show toast for expected errors
      if (
        !errorMessage.includes('chunk') &&
        !errorMessage.includes('loading') &&
        !errorMessage.includes('network') &&
        !errorMessage.includes('script')
      ) {
        toast({
          title: 'Application Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  });
  
  // Add a custom test function to the window object for testing error boundaries
  window.testErrorBoundary = () => {
    console.log('%cDevelopment tools loaded - Use window.testErrorBoundary() to test error handling', 'color: #4CAF50; font-weight: bold');
    throw new Error('This is a test error thrown by window.testErrorBoundary()');
  };
  
  console.log('Global error handlers initialized');
}

// Utility for suppressing known/handled errors globally
type SuppressedErrorConfig = {
  // List of error messages that should be suppressed
  messages: string[];
  // Time in ms after which the suppression should expire
  timeout?: number;
};

// Track suppressed error messages
const suppressedErrors: Record<string, number> = {};

/**
 * Suppress specific error messages from being shown as toasts
 * 
 * @param config Configuration for suppressing errors
 * @returns A function to remove the suppression
 */
export function suppressErrors(config: SuppressedErrorConfig): () => void {
  const now = Date.now();
  const timeout = config.timeout || 10000; // Default 10 seconds
  
  // Add each message to the suppressed list with an expiration timestamp
  config.messages.forEach(message => {
    suppressedErrors[message] = now + timeout;
  });
  
  // Return function to cancel the suppression
  return () => {
    config.messages.forEach(message => {
      delete suppressedErrors[message];
    });
  };
}

/**
 * Check if an error message is currently suppressed
 * 
 * @param message The error message to check
 * @returns True if the message is suppressed, false otherwise
 */
export function isErrorSuppressed(message: string): boolean {
  const now = Date.now();
  
  // Check if message is in suppressed list and not expired
  for (const [suppressedMsg, expiry] of Object.entries(suppressedErrors)) {
    if (
      message.includes(suppressedMsg) && 
      expiry > now
    ) {
      return true;
    }
  }
  
  return false;
}

// Extension for window interface
declare global {
  interface Window {
    testErrorBoundary: () => void;
  }
}