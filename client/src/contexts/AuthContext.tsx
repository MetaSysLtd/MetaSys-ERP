import { createContext, useState, useEffect, ReactNode, useContext } from "react";
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

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  

  useEffect(() => {
    const checkAuth = async () => {
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
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal
        }).catch(err => {
          if (err.name === 'AbortError') {
            throw new Error('Session check timed out after 5 seconds');
          }
          throw err;
        });
        
        // Clear the timeout as we got a response
        clearTimeout(timeoutId);
        
        console.log(`Auth check response received with status: ${res.status}`);

        if (res.status === 401) {
          console.log("Auth check returned 401 Unauthorized");
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
          setError("Please log in to continue");
          return;
        }

        if (!res.ok) {
          const errorText = await res.text().catch(() => res.statusText);
          throw new Error(`${res.status}: ${errorText}`);
        }

        const data = await res.json();
        console.log("Auth check data:", data);

        if (data.authenticated === true || data.user) {
          console.log("Auth check: User is authenticated");
          setIsAuthenticated(true);
          setUser(data.user);
          setRole(data.role);
          setError(null);
        } else {
          console.log("Auth check: User is not authenticated");
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
          setError("Authentication status unknown");
        }
      } catch (err: any) {
        console.error("Auth check error:", err);
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
        
        // Set a user-friendly error message
        if (err.message?.includes('timed out')) {
          setError("Session check timed out. Please refresh the page or try again later.");
        } else {
          setError(`Authentication error: ${err.message || "Unknown error"}`);
        }
      } finally {
        console.log("Auth check complete, setting isLoading to false");
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

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
      console.log("Login response:", { status: res.status, data });

      if (!data.user) {
        throw new Error("Server returned no user data");
      }

      // First update the auth state
      setUser(data.user);
      setRole(data.role);
      setIsAuthenticated(true);
      
      // Verify the session is established with an immediate auth check (with timeout)
      try {
        console.log("Verifying session is established after login...");
        
        // Create an AbortController for timeout handling on verification
        const verifyController = new AbortController();
        const verifyTimeoutId = setTimeout(() => {
          verifyController.abort();
        }, 5000); // 5 second timeout
        
        const verifyRes = await fetch(API_ROUTES.AUTH.ME, {
          method: "GET",
          credentials: "include",
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: verifyController.signal
        }).catch(err => {
          if (err.name === 'AbortError') {
            console.warn("Session verification timed out. Session may not be properly established.");
            return null;
          }
          throw err;
        });
        
        clearTimeout(verifyTimeoutId);
        
        if (!verifyRes) {
          console.warn("Session verification timeout - but proceeding with login");
        } else if (!verifyRes.ok) {
          console.warn(`Session verification failed after login with status: ${verifyRes.status}`);
        } else {
          console.log("Session verification confirmed successful login");
          // Parse the verification data for extra confidence
          try {
            const verifyData = await verifyRes.json();
            console.log("Session verification data:", verifyData);
          } catch (parseErr) {
            console.warn("Error parsing verification response:", parseErr);
          }
        }
      } catch (verifyErr) {
        console.warn("Error during session verification:", verifyErr);
      }
      
      // Return successfully even if verification has issues
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

  const logout = async () => {
    console.log("Logout requested");
    setIsLoading(true);

    try {
      // First clear client-side auth state immediately to prevent flashing of protected content
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      
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
        // Even if the server call fails, we still want to clear local state and redirect
      }
      
      console.log("Logout API call completed, redirecting to auth page");
      
      // Use consistent redirect to /auth which is the main authentication page
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
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthContext, AuthProvider };