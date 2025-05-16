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
      
      // First make sure we're not mixing up credentials
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      const res = await fetch(API_ROUTES.AUTH.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });

      console.log(`Login attempt to ${API_ROUTES.AUTH.LOGIN}, status: ${res.status}`);

      // Parse response data regardless of status
      let data;
      try {
        data = await res.json();
        console.log("Login response received:", { 
          status: res.status,
          hasData: !!data, 
          hasUser: !!data?.user,
          responseData: data
        });
      } catch (err) {
        console.error("Failed to parse response JSON:", err);
        data = null;
      }

      if (!res.ok) {
        const errorMessage = data?.error || data?.message || data?.details;

        // Provide more specific error messages based on status
        if (res.status === 401) {
          throw new Error(errorMessage || 'Invalid username or password');
        } else if (res.status === 403) {
          throw new Error(errorMessage || 'Account is locked or inactive');
        } else if (res.status === 429) {
          throw new Error(errorMessage || 'Too many login attempts. Please try again later');
        }

        throw new Error(errorMessage || `Login failed with status ${res.status}`);
      }

      if (!data || !data.user) {
        console.error("Server returned invalid response structure:", data);
        throw new Error("Server returned no user data");
      }

      // Update the auth state
      setUser(data.user);
      setRole(data.role);
      setIsAuthenticated(true);
      
      // Add additional logging for debugging
      console.log("Login success - storing auth data in session storage", {
        user: data.user.id,
        role: data.role?.name || 'no role'
      });
      
      // Cache successful login in session storage
      sessionStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(data.user));
      sessionStorage.setItem(AUTH_ROLE_CACHE_KEY, JSON.stringify(data.role));
      sessionStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
      
      // Force redirect to dashboard after successful login for better reliability
      setTimeout(() => {
        console.log("Redirecting to dashboard after successful login");
        window.location.href = "/";
      }, 500);
      
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

  // Improved logout function with better state cleanup
  const logout = async () => {
    console.log("Logout requested");
    setIsLoading(true);

    try {
      // Clear ALL browser storage to ensure complete logout
      sessionStorage.clear();
      localStorage.removeItem("metasys_ui_prefs");
      localStorage.removeItem("lastAuthCheck");
      
      // Then make the server request to clear the session
      // Wait for this to complete before redirecting
      const res = await fetch(API_ROUTES.AUTH.LOGOUT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });

      // Only after server response, update the state
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      
      if (!res.ok) {
        console.error(`Logout API call failed with status ${res.status}`);
        // Add a forced clear of cookies by setting expired cookie
        document.cookie = "metasys.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
      
      console.log("Logout API call completed, redirecting to auth page");
      
      // Use consistent redirect to /auth page
      // The setTimeout ensures all state changes have processed before redirect
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    } catch (err) {
      console.error("Logout error:", err);
      // Even if there's an error, clear state and redirect to login
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      
      // Attempt to clear cookies directly
      document.cookie = "metasys.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
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