import { createContext, useState, useEffect, ReactNode, useContext, useCallback, useRef } from "react";
import { API_ROUTES } from "@shared/constants";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  roleId: number;
  active: boolean;
  profileImageUrl: string | null;
  isSystemAdmin?: boolean;
}

interface Role {
  id: number;
  name: string;
  department: string;
  level: number;
  permissions: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  role: Role | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Cache keys for session storage
const AUTH_USER_CACHE_KEY = 'metasys_user_cache';
const AUTH_ROLE_CACHE_KEY = 'metasys_role_cache';
const AUTH_TIMESTAMP_KEY = 'metasys_auth_timestamp';

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  role: null,
  login: async () => {},
  logout: async () => {},
  error: null,
});

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Try to load initial user state from session storage for faster rendering
  const getInitialUser = () => {
    try {
      const cachedUser = sessionStorage.getItem(AUTH_USER_CACHE_KEY);
      const cachedTimestamp = sessionStorage.getItem(AUTH_TIMESTAMP_KEY);
      
      if (cachedUser && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        // Cache valid for 5 minutes
        if (now - timestamp < 5 * 60 * 1000) {
          return JSON.parse(cachedUser);
        }
      }
    } catch (e) {
      console.error('Failed to load auth cache:', e);
    }
    return null;
  };
  
  // Try to load initial role state from session storage
  const getInitialRole = () => {
    try {
      const cachedRole = sessionStorage.getItem(AUTH_ROLE_CACHE_KEY);
      const cachedTimestamp = sessionStorage.getItem(AUTH_TIMESTAMP_KEY);
      
      if (cachedRole && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        // Cache valid for 5 minutes
        if (now - timestamp < 5 * 60 * 1000) {
          return JSON.parse(cachedRole);
        }
      }
    } catch (e) {
      console.error('Failed to load role cache:', e);
    }
    return null;
  };

  // Initialize state with cached values if available
  const [user, setUser] = useState<User | null>(getInitialUser());
  const [role, setRole] = useState<Role | null>(getInitialRole());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getInitialUser());
  
  // Reference to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Track ongoing auth requests to prevent duplicates
  const authRequestInProgressRef = useRef(false);

  // Check auth status on mount
  useEffect(() => {
    // Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoized authentication check function
  const checkAuth = useCallback(async () => {
    // Prevent duplicate auth requests
    if (authRequestInProgressRef.current) {
      return;
    }
    
    authRequestInProgressRef.current = true;
    
    try {
      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000); // 5 second timeout
      
      console.log("Initiating auth check with /me endpoint");
      
      // Try to fetch with timeout
      const res = await fetch(API_ROUTES.AUTH.ME, {
        method: "GET",
        credentials: "include",
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // Clear the timeout as we got a response
      clearTimeout(timeoutId);
      
      console.log(`Auth check response received with status: ${res.status}`);

      if (res.status === 401) {
        console.log("Auth check returned 401 Unauthorized");
        if (isMountedRef.current) {
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
          setError("Please log in to continue");
        }
        return;
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText);
        throw new Error(`${res.status}: ${errorText}`);
      }

      const data = await res.json();

      if (data.authenticated === true || data.user) {
        console.log("Auth check: User is authenticated");
        if (isMountedRef.current) {
          setIsAuthenticated(true);
          setUser(data.user);
          setRole(data.role);
          setError(null);
          
          // Cache successful auth result in sessionStorage
          sessionStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(data.user));
          sessionStorage.setItem(AUTH_ROLE_CACHE_KEY, JSON.stringify(data.role));
          sessionStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
        }
      } else {
        console.log("Auth check: User is not authenticated");
        if (isMountedRef.current) {
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
          setError("Authentication status unknown");
        }
      }
    } catch (err: any) {
      console.error("Auth check error:", err);
      if (isMountedRef.current) {
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
        
        // Set a user-friendly error message
        if (err.message?.includes('timed out')) {
          setError("Session check timed out. Please refresh the page or try again later.");
        } else {
          setError(`Authentication error: ${err.message || "Unknown error"}`);
        }
      }
    } finally {
      console.log("Auth check complete, setting isLoading to false");
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      authRequestInProgressRef.current = false;
    }
  }, []);

  // Run auth check on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Optimized login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Attempting to login with username: ${username}`);

      const res = await fetch(API_ROUTES.AUTH.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });

      console.log(`Login attempt to ${API_ROUTES.AUTH.LOGIN}, status: ${res.status}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorMessage = errorData?.message || errorData?.error;

        // Provide more specific error messages based on status
        if (res.status === 401) {
          throw new Error('Invalid username or password');
        } else if (res.status === 403) {
          throw new Error('Account is locked or inactive');
        } else if (res.status === 429) {
          throw new Error('Too many login attempts. Please try again later');
        }

        throw new Error(errorMessage || `Login failed with status ${res.status}`);
      }

      const data = await res.json();
      console.log("Login response:", { status: res.status });

      if (!data.user) {
        throw new Error("Server returned no user data");
      }

      // Update the auth state
      setUser(data.user);
      setRole(data.role);
      setIsAuthenticated(true);
      
      // Cache successful login in session storage
      sessionStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(data.user));
      sessionStorage.setItem(AUTH_ROLE_CACHE_KEY, JSON.stringify(data.role));
      sessionStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
      
      return data.user;
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to login. Please check your credentials.");
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      // Re-throw the error so the login form component can also handle it
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Optimized logout function
  const logout = async () => {
    console.log("Logout requested");
    setIsLoading(true);

    try {
      // First clear client-side auth state immediately
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      
      // Clear session storage
      sessionStorage.removeItem(AUTH_USER_CACHE_KEY);
      sessionStorage.removeItem(AUTH_ROLE_CACHE_KEY);
      sessionStorage.removeItem(AUTH_TIMESTAMP_KEY);
      
      // Then make the server request to clear the session
      const res = await fetch(API_ROUTES.AUTH.LOGOUT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });

      if (!res.ok) {
        console.error(`Logout API call failed with status ${res.status}`);
        // Even if the server call fails, we still want to clear local state
      }
      
      console.log("Logout API call completed, redirecting to auth page");
      
      // Use consistent redirect to /auth page
      window.location.href = '/auth';
    } catch (err) {
      console.error("Logout error:", err);
      // Even if there's an error, clear state and redirect to login
      window.location.href = '/auth';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        role,
        login,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthContext, AuthProvider };