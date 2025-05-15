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
    <div className="flex h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-lg p-8 grid grid-cols-1 md:grid-cols-2 gap-8 font-[Inter]">
        {/* Left side - Logo & ERP Features */}
        <div className="flex flex-col justify-center px-4 order-2 md:order-1">
          <div className="mb-6">
            <img
              src="/logo.svg" 
              alt="MetaSys Logo"
              className="w-16 h-16 mb-6"
            />
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Enterprise Resource Planning
            </h3>
            <p className="text-gray-600 mb-6">
              Discover the power of synergy between innovation and technology. MetaSys equips you with purpose-driven consulting and robust agile development to turn vision into digital success.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">CRM Management</h4>
              <p className="text-sm text-gray-600">
                Manage your customer relationships efficiently with our advanced lead qualification system.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Dispatch System</h4>
              <p className="text-sm text-gray-600">
                Streamline your dispatch operations with real-time tracking and automated reporting.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">HR & Finance</h4>
              <p className="text-sm text-gray-600">
                Comprehensive HR and financial management tools to optimize your business processes.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Reporting & Analytics</h4>
              <p className="text-sm text-gray-600">
                Make data-driven decisions with detailed reports and analytics dashboards.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="bg-white rounded-lg p-6 shadow-md order-1 md:order-2">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome to MetaSys ERP
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Please sign in with your account credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#025E73]"
                placeholder="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#025E73]"
                placeholder="password"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#025E73] text-white rounded-md py-2 transition-all duration-200 hover:bg-[#011F26]"
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

          <p className="text-xs text-center text-gray-400 mt-4">
            Default login: username <b>"admin"</b>, password <b>"admin123"</b>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
