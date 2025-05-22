import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = "";
    
    // Try to parse as JSON first
    try {
      const errorJson = await res.json();
      errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
    } catch {
      // If not JSON, get as text
      errorMessage = await res.text() || res.statusText;
    }
    
    // Handle specific status codes
    if (res.status === 401) {
      // If we're already on the auth page, don't redirect again
      if (!window.location.pathname.includes('/auth')) {
        console.error('Authentication error detected, redirecting to login');
        // Clear any stale state and redirect to login
        window.localStorage.removeItem('user');
        window.sessionStorage.clear();
        window.location.href = '/auth';
        throw new Error('Unauthorized: Please log in to access this resource');
      }
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let requestHeaders: Record<string, string> = {};
  
  if (data) {
    requestHeaders = { "Content-Type": "application/json" };
  }
  
  // Ensure URLs are properly formatted with a leading /api if needed
  if (url && !url.startsWith('http') && !url.startsWith('/api') && !url.startsWith('api/')) {
    url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
  } else if (url && url.startsWith('api/')) {
    url = `/${url}`;
  }
  
  console.log('Making API request to:', url, 'with method:', method);
  
  const res = await fetch(url, {
    method: method || 'GET',
    headers: requestHeaders,
    body: data ? JSON.stringify(data) : undefined,
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
    // Ensure URL is properly formatted with /api prefix if needed
    let url = queryKey[0] as string;
    
    // Ensure URLs are properly formatted with a leading /api if needed
    if (url && !url.startsWith('http') && !url.startsWith('/api') && !url.startsWith('api/')) {
      url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
    } else if (url && url.startsWith('api/')) {
      url = `/${url}`;
    }
    
    console.log('Making query to:', url);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
