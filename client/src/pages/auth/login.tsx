
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
        <div className="w-full flex flex-row items-center justify-start mb-8">
          <img src="/src/assets/logos/MetaSys Logo-Light.png" alt="MetaSys ERP" className="h-14" />
        </div>
        <Card className="w-full bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm border-0 shadow-2xl">
          <div className="h-1 bg-gradient-to-r from-[#2170dd] to-[#4d9eff] rounded-t-lg"></div>
          <CardHeader className="space-y-1 pt-6">
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
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
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-11"
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          className="h-11"
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
                    className="p-0 h-auto text-[#2170dd] hover:text-[#3984ea] font-medium"
                    onClick={() => navigate("/auth/forgot-password")}
                    type="button"
                  >
                    Forgot password?
                  </Button>
                </div>
                
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
      </div>
    </div>
  );
}
