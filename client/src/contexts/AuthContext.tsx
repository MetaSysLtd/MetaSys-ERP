import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { API_ROUTES } from "@shared/constants";
import { useSessionKeepalive } from "@/hooks/use-session-keepalive";

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

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  role: null,
  login: async () => {},
  logout: async () => {},
  error: null,
});

function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track auth checks to prevent infinite loops in session validation
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // CRITICAL SECURITY FIX: Authentication state isolation and cleanup
  useEffect(() => {
    // Clear ALL authentication-related cache on mount to prevent state conflicts
    const clearAuthCache = () => {
      localStorage.clear();
      sessionStorage.clear();
      // Clear any existing intervals that might interfere with auth
      const highestId = Number(window.setTimeout(() => {}, 0));
      for (let i = 0; i < highestId; i++) {
        window.clearInterval(i);
      }
    };
    
    clearAuthCache();
    
    // Initial state is always unauthenticated until proven otherwise
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    
    const checkAuth = async () => {
      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        
        console.log('Performing single authentication check...');
        
        const res = await fetch(`${API_ROUTES.AUTH.ME}?_t=${timestamp}`, {
          method: "GET",
          credentials: "include",
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        // SECURITY FIX: Handle all non-200 responses as unauthenticated
        if (!res.ok) {
          console.log(`Authentication check failed with status ${res.status} - not authenticated`);
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
          setIsLoading(false);
          return;
        }

        const data = await res.json();

        // SECURITY FIX: Stricter validation of authentication data
        if (data.authenticated === true && data.user && data.user.id) {
          console.log("Authentication check successful - user authenticated", data.user.id);
          
          setIsAuthenticated(true);
          setUser(data.user);
          setRole(data.role);
          setIsLoading(false);
          setAuthCheckComplete(true);
        } else {
          console.log("Authentication check returned not authenticated status");
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
          setIsLoading(false);
          setAuthCheckComplete(true);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); // Only run once on mount

  // Session keepalive handler
  const handleSessionExpired = useCallback(() => {
    console.log('Session expired, logging out...');
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    setError('Your session has expired. Please log in again.');
  }, []);

  // Use session keepalive hook
  useSessionKeepalive({
    isAuthenticated,
    onSessionExpired: handleSessionExpired
  });

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Attempting to login with username: ${username}`);

      // Generate a timestamp to help with caching prevention
      const timestamp = Date.now();
      localStorage.setItem('login_attempt_timestamp', timestamp.toString());
      
      // Use enhanced fetch options to ensure proper cookie handling
      const res = await fetch(API_ROUTES.AUTH.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: "include", // Critical for cookie-based auth
        body: JSON.stringify({ 
          username, 
          password,
          timestamp // Include timestamp in payload to help with tracking
        })
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
      console.log("Login response:", { status: res.status, data });
      
      // Check if login response contains user data
      if (!data || !data.id) {
        throw new Error("Server returned no user data");
      }

      // Set authentication state directly from login response
      setIsAuthenticated(true);
      setUser(data);
      // Set default role to allow sidebar to render immediately
      setRole({ 
        id: 0, 
        name: 'User', 
        department: 'General',
        level: 1, 
        permissions: [] 
      });
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

  const logout = async () => {
    setIsLoading(true);

    try {
      // Clear state first for immediate UI feedback
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      
      // Clear any stored user data
      window.localStorage.removeItem('user');
      window.sessionStorage.clear();
      
      // Make the logout request to the server
      const res = await fetch(API_ROUTES.AUTH.LOGOUT, {
        method: "POST",
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) {
        console.error(`Logout failed with status ${res.status}`);
      }
      
      // Using replace() instead of href to prevent adding to browser history
      // This helps prevent back-button access to protected pages after logout
      window.location.replace('/auth');
    } catch (err) {
      console.error("Logout error:", err);
      // Still redirect even if there's an error, using replace for consistency
      window.location.replace('/auth');
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
}

export { AuthContext, AuthProvider };