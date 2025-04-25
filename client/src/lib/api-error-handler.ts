import axios, { AxiosError } from 'axios';
import { logError } from './error-utils';
import { toast } from '@/hooks/use-toast';

/**
 * Configure global axios interceptors for consistent error handling
 */
export function setupAxiosInterceptors() {
  // Request interceptor - add authorization headers, etc.
  axios.interceptors.request.use(
    async (config) => {
      // Set common headers or transform request data here if needed
      return config;
    },
    (error) => {
      logError(error, { source: 'axios-request-interceptor' });
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors consistently
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      handleAxiosError(error);
      return Promise.reject(error);
    }
  );
}

/**
 * Handle Axios errors in a standard way
 */
function handleAxiosError(error: AxiosError) {
  // Determine error type and message
  let title = 'Request Error';
  let message = 'An error occurred while processing your request.';
  let errorType = 'api';

  if (!error.response) {
    // Network error (no response from server)
    title = 'Network Error';
    message = 'Could not connect to the server. Please check your internet connection.';
    errorType = 'network';
  } else {
    const status = error.response.status;
    const responseData = error.response.data as any;
    
    // Handle specific status codes
    switch (status) {
      case 401:
        title = 'Authentication Required';
        message = 'Please log in to continue.';
        errorType = 'auth';
        break;
      case 403:
        title = 'Permission Denied';
        message = 'You do not have permission to perform this action.';
        errorType = 'auth';
        break;
      case 404:
        title = 'Not Found';
        message = 'The requested resource was not found.';
        errorType = 'api';
        break;
      case 422:
        title = 'Validation Error';
        message = responseData?.message || 'Please check your input and try again.';
        errorType = 'validation';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        title = 'Server Error';
        message = 'Something went wrong on our servers. Please try again later.';
        errorType = 'server';
        break;
      default:
        if (responseData?.message) {
          message = responseData.message;
        }
        break;
    }
  }

  // Log the error to our logging service
  logError(error, { 
    source: 'axios-error-handler',
    status: error.response?.status,
    type: errorType
  });

  // Standard notification for all API errors
  toast({
    title,
    description: message,
    variant: 'destructive'
  });
}

/**
 * Set up listeners for network status changes
 */
export function setupNetworkStatusListeners() {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Clean up function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Handler for when the app regains internet connection
 */
function handleOnline() {
  toast({
    title: 'Connection Restored',
    description: 'Your internet connection has been restored.',
  });
}

/**
 * Handler for when the app loses internet connection
 */
function handleOffline() {
  toast({
    title: 'Connection Lost',
    description: 'You are currently offline. Some features may not be available.',
    variant: 'destructive'
  });
}