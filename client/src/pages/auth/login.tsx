
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

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
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginFormSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function Login() {
  const { login, error } = useAuth();
  const [_, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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

  const handleForgotPassword = async (email: string) => {
    // TODO: Implement password reset logic
    console.log("Password reset requested for:", email);
    setShowForgotPassword(false);
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left side - Hero image */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-[#1a3968] to-[#2170dd]">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1574&auto=format&fit=crop"
            alt="Enterprise Management" 
            className="w-full h-full object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a3968]/90 to-[#2170dd]/90"></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center p-16">
            <div className="max-w-md text-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-16 h-16 mx-auto mb-8">
                <path d="M11.584 2.376a.75.75 0 0 1 .832 0l9 6a.75.75 0 1 1-.832 1.248L12 3.901 3.416 9.624a.75.75 0 0 1-.832-1.248l9-6Z" />
                <path fillRule="evenodd" d="M20.25 10.332v9.918H21a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5h.75v-9.918a.75.75 0 0 1 .634-.74A49.109 49.109 0 0 1 12 9c2.59 0 5.134.175 7.616.514a.75.75 0 0 1 .634.738ZM7.5 12.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm0 9a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9Z" clipRule="evenodd" />
              </svg>
              <h1 className="text-4xl font-bold mb-6 text-white">METIO ERP</h1>
              <p className="text-xl text-white/80 mb-8">Complete Enterprise Resource Planning Solution for Modern Businesses</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="max-w-md w-full">
          <div className="mb-10 text-center">
            <div className="flex justify-center mb-6 lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2170dd" className="w-12 h-12">
                <path d="M11.584 2.376a.75.75 0 0 1 .832 0l9 6a.75.75 0 1 1-.832 1.248L12 3.901 3.416 9.624a.75.75 0 0 1-.832-1.248l9-6Z" />
                <path fillRule="evenodd" d="M20.25 10.332v9.918H21a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5h.75v-9.918a.75.75 0 0 1 .634-.74A49.109 49.109 0 0 1 12 9c2.59 0 5.134.175 7.616.514a.75.75 0 0 1 .634.738ZM7.5 12.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm0 9a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9Z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#2170dd] to-[#4d9eff] lg:hidden">METIO ERP</h1>
            <p className="text-gray-500 lg:hidden">Complete Enterprise Resource Planning Solution</p>
          </div>
          
          <Card className="shadow-xl border-0 overflow-hidden bg-white dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="h-1 bg-gradient-to-r from-[#2170dd] to-[#4d9eff]"></div>
            <CardHeader className="space-y-1 pt-8">
              <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8 px-8">
              {error && (
                <Alert variant="destructive" className="mb-6 border border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Authentication Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {showForgotPassword ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <FormLabel className="text-gray-700 dark:text-gray-300 font-medium">Email Address</FormLabel>
                    <Input 
                      type="email" 
                      placeholder="your.email@company.com"
                      className="w-full h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">We'll send you a password reset link</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1 h-11 border-gray-200 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => handleForgotPassword(form.getValues("username"))}
                      className="flex-1 h-11 bg-[#2170dd] hover:bg-[#3984ea] transition-all"
                    >
                      Reset Password
                    </Button>
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-gray-700 dark:text-gray-300 font-medium">Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username" 
                              {...field} 
                              autoComplete="username"
                              className="h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md transition-all focus-visible:ring-[#2170dd] focus-visible:border-[#2170dd]"
                            />
                          </FormControl>
                          <FormMessage className="text-xs font-medium" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <div className="flex justify-between items-center">
                            <FormLabel className="text-gray-700 dark:text-gray-300 font-medium">Password</FormLabel>
                            <Button
                              type="button"
                              variant="link"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-xs text-[#2170dd] hover:text-[#3984ea] p-0 h-auto"
                            >
                              Forgot Password?
                            </Button>
                          </div>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field}
                              autoComplete="current-password"
                              className="h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md transition-all focus-visible:ring-[#2170dd] focus-visible:border-[#2170dd]"
                            />
                          </FormControl>
                          <FormMessage className="text-xs font-medium" />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-[#2170dd] hover:bg-[#3984ea] text-white font-medium rounded-md
                        transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(33,112,221,0.3)]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              )}
            </CardContent>
          </Card>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Metio ERP. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
