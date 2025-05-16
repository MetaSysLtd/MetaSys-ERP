// client/src/pages/auth-page.tsx
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Define prop and state types for the LoginForm component
interface LoginFormProps {
  login: (username: string, password: string) => Promise<void>;
  authError?: string | null;
}

interface LoginFormState {
  username: string;
  password: string;
  submitting: boolean;
  error: string | null;
}

// Create a standalone LoginForm component with its own internal state
class LoginForm extends React.Component<LoginFormProps, LoginFormState> {
  constructor(props: LoginFormProps) {
    super(props);
    this.state = {
      username: "",
      password: "",
      submitting: false,
      error: null
    };
  }

  handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({ username: e.target.value });
  };

  handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({ password: e.target.value });
  };

  handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    // Clear both component error and any previous auth errors
    this.setState({ submitting: true, error: null });
    
    try {
      // Attempt to login
      await this.props.login(this.state.username, this.state.password);
      
      // If login is successful, keep the submitting state true
      // The parent component will handle redirects based on user state
      console.log("Login successful, waiting for redirect");
      
      // If we're still here after 5 seconds, something might be wrong with the redirect
      // This is a fallback to ensure users don't get stuck on submitting state
      setTimeout(() => {
        // Only reset if we're still mounted and haven't redirected
        if (this && !this._unmounted) {
          this.setState({ submitting: false });
        }
      }, 5000);
      
    } catch (err: any) {
      console.error("Login error:", err);
      this.setState({ 
        error: "Invalid username or password",
        submitting: false
      });
    }
  };
  
  // Track component mount state to avoid setState on unmounted component
  private _unmounted = false;
  
  componentDidMount() {
    this._unmounted = false;
  }
  
  componentWillUnmount() {
    this._unmounted = true;
  }

  render(): React.ReactNode {
    return (
      <form onSubmit={this.handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            value={this.state.username}
            onChange={this.handleUsernameChange}
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
            value={this.state.password}
            onChange={this.handlePasswordChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#025E73] focus:border-transparent"
            placeholder="Enter your password"
            required
          />
        </div>

        {/* Display only one error message - prioritize component error over auth context error */}
        {(this.state.error || this.props.authError) && (
          <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md">
            {this.state.error || this.props.authError}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-[#025E73] hover:bg-[#011F26] text-white font-medium rounded-md py-2 transition-all duration-200"
          disabled={this.state.submitting}
        >
          {this.state.submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    );
  }
}

// Define the type for the LoginCard component props
interface LoginCardProps {
  login: (username: string, password: string) => Promise<void>;
  authError?: string | null;
}

// Create a standalone LoginCard component
const LoginCard: React.FC<LoginCardProps> = ({ login, authError }) => (
  <div className="bg-white rounded-lg shadow-lg p-8">
    <div className="text-center mb-6">
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
    <LoginForm login={login} authError={authError} />
  </div>
);

// Main component using functional approach
const AuthPage: React.FC = () => {
  const { user, login, error: authError } = useAuth();

  // Redirect if already logged in
  React.useEffect(() => {
    // Check if the user is authenticated, and only redirect when we have a user object
    if (user) {
      console.log('User is authenticated, redirecting to dashboard');
      // Use window.location to ensure a full page refresh which re-initializes everything
      window.location.href = "/";
    }
  }, [user]);

  return (
    <>
      {/* MOBILE VIEW */}
      <div className="md:hidden h-screen w-full overflow-hidden font-[Inter] flex items-center justify-center relative">
        {/* Full-screen background image for mobile */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('/assets/images/login/banner-mobile.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Login Card for mobile */}
        <div className="w-full max-w-md mx-auto px-4 z-10">
          <LoginCard login={login} authError={authError} />
        </div>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden md:flex h-screen w-full overflow-hidden font-[Inter]">
        {/* Left side - Banner Image */}
        <div className="w-1/2 h-full relative">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url('/assets/images/login/banner-15.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        </div>

        {/* Right side - Login Form */}
        <div className="w-1/2 flex items-center justify-center bg-white">
          <div className="w-full max-w-md px-12">
            <LoginCard login={login} authError={authError} />
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;