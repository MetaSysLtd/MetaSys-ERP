import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import LoginPage from '@/pages/auth/login';

interface AuthBoundaryProps {
  children: ReactNode;
}

/**
 * Authentication boundary component that prevents app rendering during unstable auth states
 * This prevents cache conflicts and endless loops by ensuring stable authentication
 */
export function AuthBoundary({ children }: AuthBoundaryProps) {
  const { user, isLoading, error } = useAuth();
  
  // Show loading state during authentication check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#025E73] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-800">Authenticating...</h2>
          <p className="text-gray-600">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  // Show error state if authentication fails
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h2 className="text-xl font-semibold text-red-800">Authentication Error</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Render app only when authentication is stable
  return <>{children}</>;
}