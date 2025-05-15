import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  active: boolean;
  orgId: number | null;
}

interface Role {
  id: number;
  name: string;
  department: string;
  level: number;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const {
    data,
    isLoading,
    error,
    refetch: checkAuth,
  } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        console.log("Checking authentication status...");
        const res = await apiRequest("GET", "/api/auth/me");
        
        if (!res.ok) {
          if (res.status === 401) {
            console.log("User not authenticated");
            setIsAuthenticated(false);
            return { user: null, role: null };
          }
          throw new Error("Failed to fetch authentication status");
        }
        
        const data = await res.json();
        console.log("Auth data received:", data);
        
        if (data && data.user) {
          setIsAuthenticated(true);
          return data;
        } else {
          setIsAuthenticated(false);
          return { user: null, role: null };
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setIsAuthenticated(false);
        throw err;
      }
    },
    retry: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Refresh auth status every 5 minutes
  });
  
  const login = async (username: string, password: string) => {
    try {
      console.log("Attempting login...");
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Invalid username or password");
      }
      
      const authData = await res.json();
      console.log("Login successful:", authData);
      
      // Update authentication state immediately
      queryClient.setQueryData(["/api/auth/me"], authData);
      setIsAuthenticated(true);
      
      // Redirect to dashboard
      setLocation("/");
      
      return authData;
    } catch (err: any) {
      console.error("Login error:", err);
      toast({
        title: "Login failed",
        description: err.message || "Failed to login",
        variant: "destructive",
      });
      throw err;
    }
  };
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Attempting logout...");
      const res = await apiRequest("POST", "/api/auth/logout");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to logout");
      }
      return await res.json();
    },
    onSuccess: () => {
      // Clear auth data
      queryClient.setQueryData(["/api/auth/me"], { user: null, role: null });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Update state
      setIsAuthenticated(false);
      
      // Redirect to login
      setLocation("/login");
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  // Effect to handle initial auth check when the app loads
  useEffect(() => {
    // This will trigger the auth check query
    checkAuth();
  }, []);
  
  return (
    <AuthContext.Provider
      value={{
        user: data?.user || null,
        role: data?.role || null,
        isLoading,
        isAuthenticated,
        error: error as Error | null,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}