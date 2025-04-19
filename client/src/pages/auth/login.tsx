
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
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0">
          <img 
            src="/ai-enterprise.png"
            alt="AI Enterprise Suite" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12 bg-gradient-to-b from-transparent via-transparent to-[#1D3557]/80">
            <h1 className="text-4xl font-bold mb-4 text-center drop-shadow-md">A Complete AI-Driven Enterprise Suite for Next Gen Businesses</h1>
          </div>
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F1FAFB]">
        <div className="max-w-md w-full">
          <div className="mb-10 text-center lg:hidden">
            <h1 className="text-2xl font-bold mb-2 gradient-text">Metio</h1>
          </div>
          
          <Card className="shadow-lg border-0 hover-lift">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {showForgotPassword ? (
                <div className="space-y-4">
                  <Input 
                    type="email" 
                    placeholder="Enter your email"
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => handleForgotPassword(form.getValues("username"))}
                      className="flex-1"
                    >
                      Reset Password
                    </Button>
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#1D3557] font-medium">Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username" 
                              {...field} 
                              autoComplete="username"
                              className="border-[#D6D6D6] focus:border-[#457B9D] transition-all duration-200"
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
                          <FormLabel className="text-[#1D3557] font-medium">Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field}
                              autoComplete="current-password"
                              className="border-[#D6D6D6] focus:border-[#457B9D] transition-all duration-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-[#1D3557] hover:bg-[#457B9D] text-white font-medium py-2 rounded-md
                        transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowForgotPassword(true)}
                      className="w-full text-[#457B9D] hover:text-[#1D3557]"
                    >
                      Forgot Password?
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
