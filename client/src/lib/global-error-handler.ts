import { logErrorToServer, NetworkErrorType, showErrorToast } from './api-error-handler';

/**
 * Initialize global error handlers for uncaught exceptions and promise rejections
 */
export function initializeGlobalErrorHandlers(): void {
  // Track if the handler has been initialized
  let isInitialized = false;

  // Prevent multiple initializations
  if (isInitialized) {
    return;
  }

  // Set up handler for uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    
    // Don't report errors from browser extensions or third-party scripts
    const isTrusted = event.isTrusted;
    const isInternalScript = event.filename && (
      event.filename.includes(window.location.origin) || 
      !event.filename.startsWith('http')
    );
    
    if (isTrusted && isInternalScript) {
      logErrorToServer({
        type: NetworkErrorType.UNKNOWN,
        message: event.message || 'Uncaught error',
        originalError: event.error || new Error(event.message)
      }).catch(err => {
        console.error('Failed to log uncaught error:', err);
      });
      
      // Only show toast for internal script errors
      showErrorToast({
        type: NetworkErrorType.UNKNOWN,
        message: 'An unexpected error occurred. Our team has been notified.',
        originalError: event.error
      });
    }
  });

  // Set up handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Log the error to the server
    logErrorToServer({
      type: NetworkErrorType.UNKNOWN,
      message: event.reason?.message || 'Unhandled promise rejection',
      originalError: event.reason
    }).catch(err => {
      console.error('Failed to log unhandled rejection:', err);
    });
    
    // Show toast notification for user
    showErrorToast({
      type: NetworkErrorType.UNKNOWN,
      message: 'An operation failed to complete. Please try again.',
      originalError: event.reason
    });
  });
  
  // Monitor for application becoming online/offline
  window.addEventListener('online', () => {
    showErrorToast({
      type: NetworkErrorType.CONNECTION_ERROR,
      message: 'Your connection has been restored.',
      originalError: null
    });
  });
  
  window.addEventListener('offline', () => {
    showErrorToast({
      type: NetworkErrorType.CONNECTION_ERROR,
      message: 'You are currently offline. Some features may be unavailable.',
      originalError: null
    });
  });

  // Set up a periodic connectivity check
  setInterval(() => {
    if (!navigator.onLine) {
      // Create a connectivity check image
      const img = new Image();
      img.onload = () => {
        // If image loads while navigator.onLine is false, 
        // browser's online status may be incorrect
        if (!navigator.onLine) {
          console.log('Browser reports offline, but connectivity check succeeded');
        }
      };
      img.onerror = () => {
        // Confirm we're actually offline
        console.log('Connectivity check failed - offline status confirmed');
      };
      // Use a small favicon from our own domain
      img.src = `${window.location.origin}/favicon.ico?_=${Date.now()}`;
    }
  }, 30000); // Check every 30 seconds
  
  // Mark as initialized
  isInitialized = true;
  
  console.log('Global error handlers initialized');
}

/**
 * Sets up browser console to gracefully handle script errors
 * This is a developer tool that doesn't impact actual error handling
 */
export function setupDevConsole(): void {
  const originalConsoleError = console.error;
  
  // Enhanced console.error that provides more context
  console.error = function(...args) {
    // Call original first to preserve browser behavior
    originalConsoleError.apply(console, args);
    
    // Add timestamp and current route for easier debugging
    const timestamp = new Date().toISOString();
    const path = window.location.pathname;
    
    // Log stack trace to make it easier to debug errors
    originalConsoleError.apply(console, [
      `%c[${timestamp}] Error on ${path}`,
      'color: #FF5252; font-weight: bold;'
    ]);
    
    // Check if first arg is an Error object and add stack if exists
    if (args[0] instanceof Error && args[0].stack) {
      originalConsoleError.apply(console, [
        '%cStack trace:',
        'color: #FF5252;',
        args[0].stack
      ]);
    }
  };
  
  // Only use in development
  if (process.env.NODE_ENV !== 'production') {
    // Add a helper method to test error boundary
    (window as any).testErrorBoundary = () => {
      throw new Error('Test error boundary');
    };
    
    console.log('%cDevelopment tools loaded - Use window.testErrorBoundary() to test error handling', 
      'color: #4CAF50; font-weight: bold');
  }
}