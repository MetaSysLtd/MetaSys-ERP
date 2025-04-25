import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useToast } from '@/hooks/use-toast';
import { formatErrorMessage } from './error-utils';

// Base configuration for API requests
const config: AxiosRequestConfig = {
  baseURL: '',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
};

// Create a centralized Axios instance for all API calls
export const api = axios.create(config);

// Setup for the toast notification (to be called from components)
let toastFunction: ((props: { title: string; description: string; variant: 'default' | 'destructive' | 'success' }) => void) | null = null;

export function useApiErrorHandler() {
  const { toast } = useToast();
  
  // Make toast function available to the error handler
  toastFunction = toast;
  
  return { api };
}

// Helper function to handle online/offline transitions
export function handleNetworkStatusChange(isOnline: boolean) {
  if (!isOnline && toastFunction) {
    toastFunction({
      title: 'Network Connection Lost',
      description: 'Please check your internet connection and try again.',
      variant: 'destructive',
    });
  } else if (isOnline && toastFunction) {
    toastFunction({
      title: 'Network Connection Restored',
      description: 'You are back online!',
      variant: 'success',
    });
  }
}

// Request interceptor - add authentication headers or other pre-request logic
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens or other headers here
    // For example:
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    return config;
  },
  (error) => {
    console.error('Request preparation error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle common error responses
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // You can process successful responses here if needed
    return response;
  },
  (error: AxiosError) => {
    if (!error.response) {
      // Network error
      const errorMessage = 'Network error occurred. Please check your connection and try again.';
      console.error(errorMessage, error);
      
      if (toastFunction) {
        toastFunction({
          title: 'Connection Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      // You could also redirect to an offline page or display a modal
      return Promise.reject(new Error(errorMessage));
    }
    
    const { status, data } = error.response;
    
    // Handle specific HTTP status codes
    switch (status) {
      case 401:
        // Unauthorized - redirect to login or refresh token
        console.error('Authentication error:', error);
        
        if (toastFunction) {
          toastFunction({
            title: 'Authentication Error',
            description: 'Your session has expired. Please log in again.',
            variant: 'destructive',
          });
        }
        
        // Optional: Redirect to login page
        // window.location.href = '/login';
        break;
        
      case 403:
        // Forbidden - user doesn't have permission
        console.error('Permission error:', error);
        
        if (toastFunction) {
          toastFunction({
            title: 'Permission Denied',
            description: 'You do not have permission to perform this action.',
            variant: 'destructive',
          });
        }
        break;
        
      case 404:
        // Not found
        console.error('Resource not found:', error);
        break;
        
      case 422:
        // Validation error (common in form submissions)
        console.error('Validation error:', error);
        break;
        
      case 429:
        // Rate limiting
        console.error('Rate limit exceeded:', error);
        
        if (toastFunction) {
          toastFunction({
            title: 'Too Many Requests',
            description: 'Please slow down and try again in a moment.',
            variant: 'destructive',
          });
        }
        break;
        
      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        console.error('Server error:', error);
        
        if (toastFunction) {
          toastFunction({
            title: 'Server Error',
            description: 'Our servers are experiencing issues. Please try again later.',
            variant: 'destructive',
          });
        }
        break;
        
      default:
        // Other errors
        console.error(`Error ${status}:`, error);
    }
    
    // Format error message for better user experience
    const errorMessage = formatErrorMessage(data) || 'An error occurred. Please try again.';
    
    // Create a new error with the formatted message
    const enhancedError = new Error(errorMessage);
    
    // Add additional properties to the error
    Object.assign(enhancedError, {
      status,
      data,
      originalError: error,
    });
    
    return Promise.reject(enhancedError);
  }
);

// Export a wrapped API instance for use in components
export default api;