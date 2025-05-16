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
    
    // Use deduplication for GET requests
    const existingRequest = inFlightRequests.get(cacheKey);
    if (existingRequest) {
      console.log('Using in-flight query for:', url);
      const res = await existingRequest;
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      return await res.json();
    }
    
    console.log('Making query to:', url);
    
    // Create new request promise and cache it
    const requestPromise = fetch(url, {
      credentials: "include",
    }).then(async (res) => {
      // Remove from cache
      inFlightRequests.delete(cacheKey);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return { status: 401, json: async () => null };
      }
      
      await throwIfResNotOk(res);
      return res;
    }).catch(err => {
      // Also remove on error
      inFlightRequests.delete(cacheKey);
      throw err;
    });
    
    // Store in cache
    inFlightRequests.set(cacheKey, requestPromise);
    
    // Wait for the response and parse JSON
    const res = await requestPromise;
    return res.status === 401 && unauthorizedBehavior === "returnNull" 
      ? null 
      : await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute stale time is a better balance
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
