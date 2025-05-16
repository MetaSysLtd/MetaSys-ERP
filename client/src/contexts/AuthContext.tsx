import { createContext, useState, useEffect, ReactNode } from "react";
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
  const [authCheckCount, setAuthCheckCount] = useState(0);
  const MAX_AUTH_CHECKS = 3;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        
        console.log(`Checking authentication (attempt ${authCheckCount + 1}/${MAX_AUTH_CHECKS})`);
        
        if (authCheckCount >= MAX_AUTH_CHECKS) {
          console.warn("Maximum auth check attempts reached, stopping retries");
          setIsLoading(false);
          return;
        }
        
        setAuthCheckCount(prevCount => prevCount + 1);
        
        const res = await fetch(`${API_ROUTES.AUTH.ME}?_t=${timestamp}`, {
          method: "GET",
          credentials: "include",
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (res.status === 401) {
          console.log("Authentication check failed - not authenticated");
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(`${res.status}: ${await res.text() || res.statusText}`);
        }

        const data = await res.json();

        if (data.authenticated && data.user) {
          console.log("Authentication check successful - user authenticated", data.user.id);
          
          // Store auth state timestamp in localStorage as a fallback
          localStorage.setItem('metasys_auth_timestamp', timestamp.toString());
          
          setIsAuthenticated(true);
          setUser(data.user);
          setRole(data.role);
          setIsLoading(false);
          
          // Set a periodic check to keep session alive (more frequent in production)
          const intervalId = setInterval(() => {
            console.log("Running session keepalive check...");
            fetch(`${API_ROUTES.AUTH.ME}?_t=${new Date().getTime()}`, {
              method: "GET",
              credentials: "include",
              headers: { 'Cache-Control': 'no-cache' }
            })
            .then(response => {
              if (!response.ok) {
                console.warn("Session refresh returned non-OK status:", response.status);
              }
              return response.json();
            })
            .then(data => {
              if (!data.authenticated) {
                console.warn("Session is no longer valid during keepalive");
              }
            })
            .catch(e => console.warn("Session refresh error:", e));
          }, 5 * 60 * 1000); // Every 5 minutes
          
          return () => clearInterval(intervalId);
        } else {
          console.log("Authentication check returned not authenticated status");
          localStorage.removeItem('metasys_auth_timestamp');
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
          setIsLoading(false);
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
  }, [authCheckCount]);

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
      
      // Immediately verify that session was established correctly
      try {
        console.log("Verifying session establishment...");
        const verifyRes = await fetch(`${API_ROUTES.AUTH.ME}?_t=${Date.now()}`, {
          method: "GET",
          credentials: "include",
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (verifyRes.ok) {
          console.log("Session verification successful");
        } else {
          console.warn("Session verification failed with status:", verifyRes.status);
        }
      } catch (verifyErr) {
        console.warn("Session verification error:", verifyErr);
      }

      if (!data.user) {
        throw new Error("Server returned no user data");
      }

      // Update authentication state
      setIsAuthenticated(true);
      setUser(data.user);
      setRole(data.role);
      
      // Immediately verify the session was established by making a follow-up auth check
      // This ensures cookies were properly set
      setTimeout(async () => {
        try {
          const verifyRes = await fetch(`${API_ROUTES.AUTH.ME}?_t=${new Date().getTime()}`, {
            method: "GET",
            credentials: "include",
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          if (verifyRes.ok) {
            console.log("Session verification successful after login");
          } else {
            console.warn("Session verification failed after login:", verifyRes.status);
          }
        } catch (verifyErr) {
          console.warn("Error verifying session after login:", verifyErr);
        }
      }, 500);
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