import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function LoginPage() {
  const [location, setLocation] = useLocation();
  const { login, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // Redirect if already logged in
  if (isAuthenticated) {
    setLocation("/");
    return null;
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Log the attempt for debugging
      console.log(`Attempting to login with username: ${username}`);
      
      await login(username, password);
      
      // Success toast
      toast({
        title: "Login successful",
        description: "Welcome to MetaSys ERP",
      });
      
      // Redirect after successful login (handled by hook)
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Better error handling
      setError(err.message || "Failed to login. Please check your credentials.");
      
      toast({
        title: "Login failed",
        description: err.message || "Invalid username or password",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="h-screen flex flex-col md:flex-row items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-t-4 border-t-[#025E73]">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#025E73] to-[#011F26] bg-clip-text text-transparent">
              MetaSys ERP Login
            </CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-[#025E73] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#025E73] to-[#011F26] hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-gray-500 text-center">
              <p>Default admin credentials:</p>
              <p className="font-mono text-xs">Username: admin</p>
              <p className="font-mono text-xs">Password: admin123</p>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <div className="w-full max-w-md p-8 hidden md:block">
        <div className="text-center md:text-left md:pl-8">
          <h1 className="text-3xl font-bold text-[#025E73] mb-4">
            Welcome to MetaSys ERP
          </h1>
          <p className="text-gray-600 mb-6">
            Your comprehensive enterprise resource planning solution with integrated 
            CRM, dispatch, and finance management.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-[#025E73] rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-800">CRM Module</h3>
                <p className="text-sm text-gray-600">
                  Track, qualify and manage your leads efficiently
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-[#025E73] rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-800">Dispatch System</h3>
                <p className="text-sm text-gray-600">
                  Streamline dispatch operations and reporting
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-[#025E73] rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-800">Financial Tools</h3>
                <p className="text-sm text-gray-600">
                  Manage commissions and track business performance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}