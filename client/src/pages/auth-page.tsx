// client/src/pages/auth-page.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const AuthPage = () => {
  const { user, login, error: authError } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.href = "/";
    }
  }, [user]);

  // Update error state when auth error changes
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      await login(username, password);
      // Successful login will redirect via the useEffect above
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden font-[Inter] flex items-center justify-center relative">
      {/* Full-screen background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url('/assets/images/login/banner-mobile.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Desktop-only banner on left */}
      <div className="hidden md:block absolute left-0 top-0 w-1/2 h-full z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('/assets/images/login/banner-15.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md mx-auto px-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            {/* Logo */}
            <img
              src="/assets/images/login/logo-dark.png"
              alt="MetaSys Logo"
              className="mx-auto h-12 mb-4"
            />
            <h2 className="text-xl font-bold text-gray-800">
              Welcome to MetaSys ERP
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Please sign in with your account credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#025E73] focus:border-transparent"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#025E73] focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#025E73] hover:bg-[#011F26] text-white font-medium rounded-md py-2 transition-all duration-200"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
