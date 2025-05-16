import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Global in-flight request cache to prevent duplicate requests
const inFlightRequests = new Map<string, Promise<any>>();

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Generate a cache key for the request
function getCacheKey(url: string, method: string = 'GET', body?: any): string {
  if (method === 'GET') {
    return `${method}:${url}`;
  }
  // For non-GET requests, include the stringified body in the cache key
  return `${method}:${url}:${body ? JSON.stringify(body) : ''}`;
}

export async function apiRequest(
  urlOrConfig: string | { url?: string; method: string; body?: string | object; headers?: Record<string, string> },
  methodOrOptions?: string | Record<string, unknown>,
  data?: unknown | undefined,
): Promise<Response> {
  // Handle overloaded function signatures
  let url: string;
  let method: string;
  let requestData: unknown | undefined;
  let requestHeaders: Record<string, string> = {};
  
  // Check if first parameter is URL (string) or config object
  if (typeof urlOrConfig === 'string') {
    // First form: apiRequest(url, method, data)
    url = urlOrConfig;
    method = methodOrOptions as string;
    requestData = data;
    
    if (requestData) {
      requestHeaders = { "Content-Type": "application/json" };
    }
  } else {
    // Second form: apiRequest(config)
    url = urlOrConfig.url || methodOrOptions as string;
    method = urlOrConfig.method;
    requestHeaders = { "Content-Type": "application/json", ...urlOrConfig.headers };
    
    // Handle body
    requestData = urlOrConfig.body;
  }
  
  // Only deduplicate GET requests
  if (method === 'GET') {
    const cacheKey = getCacheKey(url, method);
    
    // Check if this exact request is already in flight
    const existingRequest = inFlightRequests.get(cacheKey);
    if (existingRequest) {
      console.log('Using in-flight request for:', url);
      return existingRequest;
    }
    
    // Create the new request and store it in the cache
    const requestPromise = fetch(url, {
      method: method || 'GET',
      headers: requestHeaders,
      credentials: "include",
    }).then(async (res) => {
      // Remove from in-flight requests when done
      inFlightRequests.delete(cacheKey);
      
      // Process response
      await throwIfResNotOk(res);
      return res;
    }).catch(err => {
      // Also remove on error
      inFlightRequests.delete(cacheKey);
      throw err;
    });
    
    // Store the promise in the cache
    inFlightRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }
  
  // For non-GET requests, proceed normally without caching
  console.log('Making API request to:', url, 'with method:', method);
  
  const res = await fetch(url, {
    method: method || 'GET',
    headers: requestHeaders,
    body: typeof requestData === 'string' ? requestData : requestData ? JSON.stringify(requestData) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Don't modify the URL, assume it's correct as specified in API_ROUTES
    const url = queryKey[0] as string;
    const cacheKey = getCacheKey(url, 'GET');
    
    // Try to get from memory cache first (with 10 second TTL for frequently accessed data)
    const cachedData = getCachedData(cacheKey, 10000);
    if (cachedData) {
      return cachedData;
    }
    
    // Use deduplication for GET requests if an identical request is in flight
    const existingRequest = inFlightRequests.get(cacheKey);
    if (existingRequest) {
      console.log('Using in-flight query for:', url);
      try {
        const res = await existingRequest;
        
        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }
        
        const data = await res.json();
        // Cache successful responses
        setCachedData(cacheKey, data);
        return data;
      } catch (error) {
        // If the request fails, don't cache the error
        console.error('Error in existing request:', error);
        throw error;
      }
    }
    
    console.log('Making query to:', url);
    
    // Create new request promise with better error handling
    const requestPromise = fetch(url, {
      credentials: "include",
      // Add cache-busting for critical auth requests
      headers: url.includes('/auth/') ? { 
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      } : {},
    }).then(async (res) => {
      // Remove from in-flight cache immediately
      inFlightRequests.delete(cacheKey);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return { status: 401, json: async () => null };
      }
      
      await throwIfResNotOk(res);
      return res;
    }).catch(err => {
      // Also remove on error
      inFlightRequests.delete(cacheKey);
      console.error(`Query error for ${url}:`, err.message);
      throw err;
    });
    
    // Store in in-flight requests cache
    inFlightRequests.set(cacheKey, requestPromise);
    
    try {
      // Wait for the response and parse JSON
      const res = await requestPromise;
      if (res.status === 401 && unauthorizedBehavior === "returnNull") {
        return null;
      }
      
      const data = await res.json();
      
      // Cache successful responses that aren't authentication related
      if (!url.includes('/auth/')) {
        setCachedData(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error(`Failed to fetch data from ${url}:`, error);
      throw error;
    }
  };

// Enhanced request deduplication with additional result caching
const requestCache = new Map<string, {
  timestamp: number;
  data: any;
}>();

// Helper to get cached data if it's still fresh
function getCachedData(cacheKey: string, maxAge: number = 10000): any | null {
  const cached = requestCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < maxAge) {
    console.log('Using memory-cached result for:', cacheKey);
    return cached.data;
  }
  return null;
}

// Helper to store data in the cache
function setCachedData(cacheKey: string, data: any): void {
  requestCache.set(cacheKey, {
    timestamp: Date.now(),
    data
  });
}

// Clean up old cache entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  requestCache.forEach((value, key) => {
    if (now - value.timestamp > maxAge) {
      requestCache.delete(key);
    }
  });
}, 5 * 60 * 1000);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 120000, // Increased to 2 minutes for better performance
      gcTime: 300000, // 5 minutes garbage collection time to reduce memory usage
      retry: (failureCount, error) => {
        // Don't retry auth errors or when we've already tried 2 times
        if (error instanceof Error) {
          const message = error.message || '';
          return !message.includes('401') && failureCount < 2;
        }
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff with max 10s
    },
    mutations: {
      retry: false,
    },
  },
});
