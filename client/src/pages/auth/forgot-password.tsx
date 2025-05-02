import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { toast } from "@/hooks/use-toast";

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
import { AlertCircle, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Importing assets for login page - same as login
import desktopBannerPath from "@/assets/banners/bg-login-desktop.png";
import mobileBannerPath from "@/assets/backgrounds/gradient-bg.png";
import logoLightPath from "@/assets/logos/MetaSys-Logo-Light.png";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [_, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set mobile state based on screen size
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Normally would call an API here
      // For demo, we'll just simulate a successful request
      await new Promise(r => setTimeout(r, 1500));
      
      setIsSuccess(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (err) {
      setError("Failed to send password reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${isMobile ? 'flex-col' : 'lg:flex-row md:flex-col-reverse'}`}>
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
                <p className="text-lg">The complete AI-driven enterprise solution for your business</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Right side - Forgot Password Form */}
      <div 
        className={`lg:w-1/2 md:w-full flex flex-col justify-center items-center p-8
                    ${isMobile ? 'bg-no-repeat bg-cover bg-center' : 'bg-white/80 backdrop-blur'}`}
        style={isMobile ? { backgroundImage: `url(${mobileBannerPath})` } : {}}
      >
        {/* Logo at top */}
        <div className="w-full max-w-md mb-8">
          <Link to="/">
            <img 
              src={logoLightPath} 
              alt="MetaSys ERP" 
              className="h-14"
            />
          </Link>
        </div>
        
        {/* Forgot Password form card */}
        <Card 
          className="w-full max-w-md border-0 shadow-lg animate-[fadeUp_.4s_ease-out_both] 
                   bg-white/80 backdrop-blur dark:bg-gray-900/90"
        >
          <CardHeader className="space-y-1 pt-6">
            <CardTitle className="text-2xl font-bold text-[#011F26]">
              {isSuccess ? "Check Your Email" : "Forgot Password"}
            </CardTitle>
            <CardDescription className="text-[#411F26]/80">
              {isSuccess 
                ? "We've sent a password reset link to your email" 
                : "Enter your email and we'll send you a reset link"}
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

            {isSuccess ? (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Follow the instructions in the email to reset your password. The link will expire in 24 hours.
                </p>
                <Button 
                  className="w-full h-11 mt-2 bg-[#025E73] hover:bg-[#F2A71B] active:bg-[#C78A14] text-white 
                           transition-all duration-150 hover:scale-[1.03]" 
                  onClick={() => navigate("/login")}
                >
                  Return to Login
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#011F26]">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-11 border-gray-300 focus:ring-[#025E73] focus:border-[#025E73] dark:border-gray-600"
                            placeholder="Enter your email address"
                            type="email"
                            autoComplete="email"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 mt-2 bg-[#025E73] hover:bg-[#F2A71B] active:bg-[#C78A14] text-white 
                           transition-all duration-150 hover:scale-[1.03]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                  
                  <div className="pt-2">
                    <Button 
                      variant="ghost" 
                      type="button" 
                      className="p-0 h-auto flex items-center text-[#025E73] hover:text-[#412754] font-medium transition-colors"
                      onClick={() => navigate("/login")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      <span>Back to login</span>
                    </Button>
                  </div>
                </form>
              </Form>
            )}
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