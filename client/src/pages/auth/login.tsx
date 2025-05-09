import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { API_ROUTES } from "@shared/constants";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Importing assets for login page
import desktopBannerPath from "@/assets/banners/bg-login-desktop.png";
import mobileBannerPath from "@/assets/backgrounds/gradient-bg.png"; // New gradient background
import logoLightPath from "@/assets/logos/MetaSys-Logo-Light.png";
import logoDarkPath from "@/assets/logos/MetaSys Logo-Dark.png";

// Enhanced validation schema with better error messages
const loginFormSchema = z.object({
  username: z
    .string()
    .min(1, { message: "Username is required" })
    .max(100, { message: "Username cannot exceed 100 characters" }),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .max(100, { message: "Password cannot exceed 100 characters" }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

function LoginForm() {
  const { login, error, user, isLoading: authLoading } = useAuth();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  const [loginAttempts, setLoginAttempts] = useState(0);

  useEffect(() => {
    // Redirect if user is already logged in
    if (user) {
      navigate("/");
    }

    // Set mobile state based on screen size
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, [user, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onBlur", // Validate fields when they lose focus
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);

    try {
      // Validate form data is present
      if (!data.username || !data.password) {
        toast({
          title: "Missing Information",
          description: "Username and password are required.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Attempt to login
      await login(data.username, data.password);

      // Reset login attempts on success
      setLoginAttempts(0);

      // Navigate on success
      navigate("/");
    } catch (err: any) {
      console.error("Login error caught in form:", err);

      // Extract error message from response or error object
      const errorData = err?.response?.data;
      const errorMessage = errorData?.message || errorData?.error || err.message || "Login failed. Please check your credentials.";

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });

      // Reset form on specific error types
      if (errorData?.missing?.includes("user") || errorData?.missing?.includes("valid_credentials")) {
        form.reset({ username: form.getValues("username"), password: "" });
      }

      // Increment login attempts
      setLoginAttempts(prev => prev + 1);

      // Show specific error message
      if (loginAttempts >= 2) {
        toast({
          title: "Multiple Failed Attempts",
          description: "Please verify your credentials or reset your password.",
          variant: "destructive",
          duration: 5000,
        });
      }

      // Reset form password field for security
      form.setValue('password', '');
      form.setFocus('password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // This is for redirecting to the right dashboard after login
  const getRedirectPath = () => {
    const roleId = user?.roleId || 1;
    return roleId >= 3 ? '/admin' : '/dashboard';
  };

  const isLoading = isSubmitting || authLoading;

  return (
    <div className={`login-page min-h-screen flex ${isMobile ? 'flex-col' : 'lg:flex-row md:flex-col-reverse'}`}>
      {/* Left side - Banner Image (hidden on mobile) */}
      {!isMobile && (
        <div className="lg:w-1/2 hidden md:block">
          <div className="h-full w-full relative">
            <img 
              src={desktopBannerPath} 
              alt="MetaSys ERP" 
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="text-white text-center max-w-md px-6">
                <h2 className="text-3xl font-bold mb-4">MetaSys ERP</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right side - Login Form */}
      <div 
        className={`lg:w-1/2 md:w-full flex flex-col justify-center items-center p-8
                    ${isMobile ? 'bg-no-repeat bg-cover bg-center' : 'bg-white/80 backdrop-blur'}`}
        style={isMobile ? { backgroundImage: `url(${mobileBannerPath})` } : {}}
      >
        {/* Logo at top - using dark version on login screen */}
        <div className="w-full max-w-md mb-8">
          <Link to={getRedirectPath()}>
            <img 
              src={logoDarkPath} 
              alt="MetaSys ERP" 
              className="h-14"
            />
          </Link>
        </div>

        {/* Login form card */}
        <Card 
          className="w-full max-w-md border-0 shadow-lg animate-[fadeUp_.4s_ease-out_both] 
                   bg-white/80 backdrop-blur dark:bg-gray-900/90"
        >
          <CardHeader className="space-y-1 pt-6">
            <CardTitle className="text-2xl font-bold text-[#011F26]">Sign In</CardTitle>
            <CardDescription className="text-[#411F26]/80">
              Access your MetaSys ERP account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#011F26]">Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-11 border-gray-300 focus:ring-[#025E73] focus:border-[#025E73] dark:border-gray-600"
                          placeholder="Enter your username"
                          autoComplete="username"
                          disabled={isLoading}
                          aria-disabled={isLoading}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#011F26]">Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          className="h-11 border-gray-300 focus:ring-[#025E73] focus:border-[#025E73] dark:border-gray-600"
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          disabled={isLoading}
                          aria-disabled={isLoading}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end mb-2">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-[#025E73] hover:text-[#412754] font-medium transition-colors"
                    onClick={() => navigate("/auth/forgot-password")}
                    type="button"
                    disabled={isLoading}
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 mt-2 bg-[#025E73] hover:bg-[#F2A71B] active:bg-[#C78A14] text-white 
                           transition-all duration-150 hover:scale-[1.03]"
                  disabled={isLoading}
                  aria-disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="pb-6 pt-0 border-t-0" />
        </Card>

        {/* Copyright text */}
        <div className="mt-8 text-center text-white text-sm">
          <p>&copy; {new Date().getFullYear()} MetaSys</p>
        </div>
      </div>
    </div>
  );
}

// Wrap the login form in an error boundary
export default function Login() {
  return (
    <ErrorBoundary>
      <LoginForm />
    </ErrorBoundary>
  );
}