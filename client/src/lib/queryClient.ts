import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  urlOrConfig: string | { url?: string; method: string; body?: string; headers?: Record<string, string> },
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
    const res = await fetch(queryKey[0] as string, {
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
