import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
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
import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [_, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div 
      className="min-h-screen flex items-center justify-center md:justify-start lg:justify-end bg-no-repeat bg-cover bg-center relative p-4 md:p-8" 
      style={{ 
        backgroundImage: "url('/src/assets/auth-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-blue-900/50" />
      <div className="w-full max-w-[500px] relative z-10 mx-auto md:ml-24 lg:mr-24">
        <div className="w-full flex flex-col items-center justify-center mb-8">
          <img src="/src/assets/logos/MetaSys Logo-Light.png" alt="MetaSys ERP" className="h-14 mb-3" />
          <h1 className="text-white text-2xl font-bold">Complete Enterprise Resource Planning</h1>
          <h2 className="text-white text-xl">Solution for Modern Businesses</h2>
        </div>
        <Card className="w-full bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm border-0 shadow-2xl">
          <div className="h-1 bg-gradient-to-r from-[#2170dd] to-[#4d9eff] rounded-t-lg"></div>
          <CardHeader className="space-y-1 pt-6">
            <CardTitle className="text-2xl font-bold text-center">
              {isSuccess ? "Check Your Email" : "Forgot Password"}
            </CardTitle>
            <CardDescription className="text-center">
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
                  className="w-full" 
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-11"
                            placeholder="Enter your email address"
                            type="email"
                            autoComplete="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 mt-2 bg-[#2170dd] hover:bg-[#3984ea] transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
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
                      className="p-0 h-auto flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
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
      </div>
    </div>
  );
}