
import { createContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use the apiRequest helper for consistent error handling
        const res = await apiRequest("GET", API_ROUTES.AUTH.CURRENT_USER);
        const data = await res.json();
        
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user);
          setRole(data.role);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Log the attempt for debugging
      console.log(`Attempting to login with username: ${username}`);
      
      // Use apiRequest for consistent error handling and URL prefixing
      const res = await apiRequest("POST", API_ROUTES.AUTH.LOGIN, { username, password });
      
      // Log detailed information for debugging
      console.log(`Login attempt to ${API_ROUTES.AUTH.LOGIN}, status: ${res.status}`);
      
      const data = await res.json();
      console.log("Login response:", { status: res.status, data });
      
      if (!data.user) {
        throw new Error("Server returned no user data");
      }
      
      setIsAuthenticated(true);
      setUser(data.user);
      setRole(data.role);
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
      await apiRequest("POST", API_ROUTES.AUTH.LOGOUT);
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      window.location.href = '/login';
    } catch (err) {
      console.error("Logout error:", err);
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
