import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
// Import the MetaSys logo directly
import metaSysLogo from "@/assets/logos/MetaSys.png";

// Form validation schema
const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Type for the form values
type FormValues = z.infer<typeof formSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  
  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.href = "/";
    }
  }, [user]);

  // Submit handler
  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      // Error already handled in the mutation
      console.error("Login error in form submit", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we're not loading and have no user, show the login form
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Login Form Side */}
      <div className="flex flex-col justify-center p-4 md:p-8 md:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <img src={metaSysLogo} alt="MetaSys Logo" className="h-16" />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Welcome to MetaSys ERP</CardTitle>
              <CardDescription>
                Please sign in with your account credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} />
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
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitting || loginMutation.isPending}
                  >
                    {(submitting || loginMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground text-center w-full">
                Default login: username "admin", password "admin123"
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Hero Section Side */}
      <div className="hidden md:flex flex-col justify-center items-center p-8 bg-gradient-to-br from-primary to-primary/70 text-white md:w-1/2">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-4">Enterprise Resource Planning</h1>
          <p className="text-xl mb-6">
            Discover the power of synergy between innovation and technology. 
            MetaSys equips you with purpose-driven consulting and robust agile 
            development to turn vision into digital success.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <h3 className="font-semibold mb-2">CRM Management</h3>
              <p>Manage your customer relationships efficiently with our advanced lead qualification system.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Dispatch System</h3>
              <p>Streamline your dispatch operations with real-time tracking and automated reporting.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <h3 className="font-semibold mb-2">HR & Finance</h3>
              <p>Comprehensive HR and financial management tools to optimize your business processes.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Reporting & Analytics</h3>
              <p>Make data-driven decisions with detailed reports and analytics dashboards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}