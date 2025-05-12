import { queryClient, apiRequest } from './queryClient';
import { handleApiError, NetworkErrorType, retryFetch } from './api-error-handler';
import { createUserFriendlyErrorMessage } from './error-utils';
import { useToast } from '@/hooks/use-toast';
import { useSocketConnectionStatus } from '@/hooks/use-socket';
import { useEffect, useState } from 'react';
import { API_ROUTES } from '@shared/constants';

/**
 * Configuration for API requests
 */
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  defaultHeaders: Record<string, string>;
  retryCount: number;
  retryDelay: number;
}

// Default API configuration
export const apiConfig: ApiConfig = {
  baseUrl: '',
  timeout: 30000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  retryCount: 3,
  retryDelay: 1000
};

/**
 * Get the full URL for an API route
 * @param path - API path
 * @returns Full URL
 */
export function getApiUrl(path: string): string {
  const baseUrl = apiConfig.baseUrl || '';
  return `${baseUrl}${path}`;
}

/**
 * Create headers for API requests
 * @param customHeaders - Custom headers to include
 * @returns Complete headers object
 */
export function createHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  return {
    ...apiConfig.defaultHeaders,
    ...customHeaders
  };
}

/**
 * Hook to provide system connection status
 * @returns Status object with connection information
 */
export function useSystemStatus() {
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isHealthCheckPending, setIsHealthCheckPending] = useState<boolean>(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isConnected: isSocketConnected } = useSocketConnectionStatus();
  const { toast } = useToast();

  // Check server health
  const checkServerHealth = async () => {
    setIsHealthCheckPending(true);
    try {
      // Use retryFetch to automatically retry failed requests
      const response = await retryFetch(API_ROUTES.SYSTEM.HEALTH);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      // Update connection status
      const wasDisconnected = !isBackendConnected;
      setIsBackendConnected(true);
      setErrorMessage(null);
      setLastHealthCheck(new Date());

      // Show reconnected toast if we were disconnected before
      if (wasDisconnected) {
        toast({
          title: 'Connection Restored',
          description: 'Connection to the server has been restored.',
          variant: 'default',
          duration: 3000,
        });
      }

      return data;
    } catch (error) {
      // Handle the error
      const wasConnected = isBackendConnected;
      setIsBackendConnected(false);
      setErrorMessage(createUserFriendlyErrorMessage(error));
      setLastHealthCheck(new Date());

      // Show disconnected toast if we were connected before
      if (wasConnected) {
        toast({
          title: 'Connection Lost',
          description: 'Unable to connect to the server. We\'ll keep trying.',
          variant: 'destructive',
          duration: 5000,
        });
      }

      // Log the error
      handleApiError(error, false);

      return null;
    } finally {
      setIsHealthCheckPending(false);
    }
  };

  // Periodically check server health
  useEffect(() => {
    // Initial health check
    checkServerHealth();

    // Set up interval for periodic health checks
    const healthInterval = setInterval(() => {
      // Only check if we're not already checking
      if (!isHealthCheckPending) {
        checkServerHealth();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(healthInterval);
    };
  }, []);

  // Also check health when socket reconnects
  useEffect(() => {
    if (isSocketConnected && !isBackendConnected) {
      checkServerHealth();
    }
  }, [isSocketConnected]);

  return {
    isBackendConnected,
    isSocketConnected,
    isHealthCheckPending,
    lastHealthCheck,
    errorMessage,
    checkServerHealth,
    isFullyConnected: isBackendConnected && isSocketConnected
  };
}

/**
 * Component to display when server connection is lost
 */
export function ConnectionStatusBanner({ isBackendConnected, isSocketConnected, errorMessage, onRetry }: {
  isBackendConnected: boolean;
  isSocketConnected: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}) {
  if (isBackendConnected && isSocketConnected) {
    return null;
  }

  const connectionMessage = !isBackendConnected 
    ? 'Server connection lost'
    : !isSocketConnected
    ? 'Realtime updates disconnected'
    : 'Connection issues detected';

  const detailMessage = errorMessage || 'We\'re trying to reconnect...';

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 dark:bg-red-800 text-white py-2 px-4 z-50 flex items-center justify-between">
      <div>
        <span className="font-semibold">{connectionMessage}:</span>
        <span className="ml-2">{detailMessage}</span>
      </div>
      <button 
        onClick={onRetry}
        className="bg-white text-red-600 px-3 py-1 rounded-md text-sm hover:bg-gray-100 focus:ring-2 focus:ring-white"
      >
        Retry Now
      </button>
    </div>
  );
}

/**
 * Generate query key for TanStack Query
 * @param path - API path
 * @param params - Query parameters
 * @returns Query key array
 */
export function generateQueryKey(path: string, params?: Record<string, any>): (string | Record<string, any>)[] {
  if (!params) {
    return [path];
  }
  return [path, params];
}

/**
 * Invalidate all queries that start with a specific path prefix
 * @param pathPrefix - Path prefix to match
 */
export function invalidateQueriesByPrefix(pathPrefix: string): void {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey) && typeof queryKey[0] === 'string') {
        return queryKey[0].startsWith(pathPrefix);
      }
      return false;
    },
  });
}

/**
 * Generic API error class for standardized error handling
 */
export class ApiError extends Error {
  status: number;
  data: any;
  errorCode?: string;

  constructor(message: string, status: number, errorCode?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.data = data;
  }
}

/**
 * Validate response and extract API error information
 * @param response - Fetch Response object
 * @returns Promise resolving to response if OK, or rejecting with ApiError
 */
export async function validateApiResponse(response: Response): Promise<Response> {
  if (response.ok) {
    return response;
  }

  try {
    const errorData = await response.json();
    const errorMessage = errorData.message || errorData.error || response.statusText;
    const enhancedMessage = response.status === 401 
      ? 'Session expired. Please login again.'
      : response.status === 403
      ? 'You do not have permission to access this resource'
      : response.status === 404
      ? 'The requested resource was not found'
      : `Failed to load data: ${errorMessage}`;

    throw new ApiError(
      enhancedMessage,
      response.status,
      errorData.error,
      errorData
    );
  } catch (e) {
    if (e instanceof ApiError) {
      throw e;
    }

    // Network or parsing error
    throw new ApiError(
      'Network error occurred. Please check your connection.',
      response.status || 500
    );
  }
}

export async function apiRequest(method: string, endpoint: string, data?: any, retries = 3) {
  try {
    const response = await retryFetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include'
    }, retries);

    // Enhanced 401 handling with retry mechanism
    if (response.status === 401) {
      try {
        // Try to refresh the token
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (refreshResponse.ok) {
          // Clear any cached queries
          queryClient.clear();
          // Retry original request after token refresh
          return apiRequest(method, endpoint, data, 1);
        } else {
          // Handle failed refresh
          queryClient.clear();
          window.dispatchEvent(new CustomEvent('auth:expired', { 
            detail: { 
              redirect: true, 
              message: 'Your session has expired. Please log in again.',
              returnUrl: window.location.pathname
            }
          }));
          throw new ApiError('Session expired', 401, 'AUTH_EXPIRED');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        queryClient.clear();
        window.dispatchEvent(new CustomEvent('auth:required', {
          detail: { 
            redirect: true,
            returnUrl: window.location.pathname
          }
        }));
        throw new ApiError('Authentication required', 401, 'AUTH_REQUIRED');
      }
    }

    // Handle other errors
    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.message || 'API request failed',
        response.status,
        error.code,
        error.data
      );
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('API request failed:', error);
    throw new ApiError('Network error occurred', 500);
  }
}

export default {
  getApiUrl,
  createHeaders,
  useSystemStatus,
  ConnectionStatusBanner,
  generateQueryKey,
  invalidateQueriesByPrefix,
  validateApiResponse,
  apiRequest,
  retryFetch
};