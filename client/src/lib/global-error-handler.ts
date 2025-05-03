import { ErrorHandler } from '@/components/ui/toast-error';

/**
 * Initialize global error handlers for the application
 * This will prevent red error messages from being shown to users
 * and instead show user-friendly empty states
 */
export function initializeGlobalErrorHandlers() {
  // Store the original console.error to use for actual errors
  const originalConsoleError = console.error;

  // Override console.error to filter out query-related errors
  console.error = (...args: any[]) => {
    const errorMessage = args[0]?.toString() || '';
    
    // Don't show red toast errors for these common scenarios
    if (
      errorMessage.includes('Query data cannot be undefined') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('No data available')
    ) {
      // Still log to console but don't show toast
      originalConsoleError('[Suppressed Toast]', ...args);
      return;
    }
    
    // For actual errors, use the original console.error
    originalConsoleError(...args);
  };

  // Add testErrorBoundary to Window interface
  (window as any).testErrorBoundary = () => {
    throw new Error('This is a test error from the error boundary');
  };

  console.log('Global error handlers initialized');
}

/**
 * Setup enhanced development console tools
 * This function adds additional console utilities for development
 */
export function setupDevConsole() {
  if (process.env.NODE_ENV === 'development') {
    // Add test error boundary function to global window object
    (window as any).testErrorBoundary = () => {
      throw new Error('This is a test error from the error boundary');
    };
    
    // Log that development tools are loaded
    console.log('%cDevelopment tools loaded - Use window.testErrorBoundary() to test error handling', 'color: #4CAF50; font-weight: bold');
  }
}

/**
 * Creates a function to handle data-not-found scenarios consistently
 * instead of showing error messages
 */
export function createDataErrorHandler(moduleName: string) {
  return (error: any) => {
    console.log(`No ${moduleName} data available:`, error);
    // Don't pass to ErrorHandler to avoid showing error toasts
    return null;
  };
}

/**
 * Applies global error handling for fetch requests
 */
export function handleFetchError(error: any, moduleName: string = 'data') {
  // Log the error but don't show toast notification
  console.log(`Error fetching ${moduleName}:`, error);
  return null;
}