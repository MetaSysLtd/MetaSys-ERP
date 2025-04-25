
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";

import {
  Card,
  CardContent,
  CardDescription,
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
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Importing assets for login page
import desktopBannerPath from "@/assets/banners/bg-login-desktop.png";
import mobileBannerPath from "@/assets/banners/bg-login-mobile.png";
import logoLightPath from "@/assets/logos/MetaSys Logo-Light.png";

const loginFormSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function Login() {
  const { login, error, user } = useAuth();
  const [_, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      navigate("/");
    } catch (err) {
      // Auth context already handles the error
    } finally {
      setIsLoading(false);
    }
  };

  // This is for redirecting to the right dashboard after login
  const getRedirectPath = () => {
    // Check if the user has admin role by checking the roleId
    // Admin roles usually have higher roleId values
    return user?.roleId >= 3 ? '/admin/dashboard' : '/dashboard';
  };

  return (
    <div className={`min-h-screen flex ${isMobile ? 'flex-col' : 'lg:flex-row md:flex-col-reverse'}`}>
      {/* Left side - Banner Image (hidden on mobile) */}
      {!isMobile && (
        <div className="lg:w-1/2 hidden md:block">
          <img 
            src={desktopBannerPath} 
            alt="MetaSys ERP" 
            className="h-full w-full object-cover"
          />
        </div>
      )}
      
      {/* Right side - Login Form */}
      <div 
        className={`lg:w-1/2 md:w-full flex flex-col justify-center items-center p-8
                    ${isMobile ? 'bg-no-repeat bg-cover bg-center' : 'bg-white/80 backdrop-blur'}`}
        style={isMobile ? { backgroundImage: `url(${mobileBannerPath})` } : {}}
      >
        {/* Logo at top */}
        <div className="w-full max-w-md mb-8">
          <Link to={getRedirectPath()}>
            <img 
              src={logoLightPath} 
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
                <AlertTitle>Error</AlertTitle>
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
                  >
                    Forgot password?
                  </Button>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 mt-2 bg-[#025E73] hover:bg-[#F2A71B] active:bg-[#C78A14] text-white 
                           transition-all duration-150 hover:scale-[1.03]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Footer text */}
        <div className="mt-8 text-center text-white text-sm">
          <p>MetaSys ERP &copy; {new Date().getFullYear()} - Complete AI-driven Enterprise Suite</p>
        </div>
      </div>
    </div>
  );
}
