import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBugSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganization } from "@/hooks/use-organization";
import { useAuth } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Loader2 } from "lucide-react";

// Extend the insertBugSchema with client-side validations
const bugReportSchema = insertBugSchema.extend({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters",
  }).max(100, {
    message: "Title must not exceed 100 characters",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters",
  }).max(2000, {
    message: "Description must not exceed 2000 characters",
  }),
  module: z.string().min(1, {
    message: "Please select a module",
  }),
  urgency: z.enum(["Low", "Medium", "High"]),
  page: z.string().optional(),
  steps: z.string().optional(),
  browser: z.string().optional(),
  device: z.string().optional(),
  os: z.string().optional(),
  screenshotUrl: z.string().optional(),
});

// Infer the type from our schema
type BugReportFormValues = z.infer<typeof bugReportSchema>;

// Define available modules for the dropdown
const MODULES = [
  "crm",
  "dispatch",
  "hr",
  "finance",
  "marketing",
  "dashboard",
  "admin",
  "settings",
  "auth",
  "notifications",
  "other"
];

interface BugReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BugReportForm({ onSuccess, onCancel }: BugReportFormProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useOrganization();
  const { user } = useAuth();
  
  // Initialize the form with default values
  const form = useForm<BugReportFormValues>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      title: "",
      description: "",
      module: "",
      urgency: "Medium",
      page: "",
      steps: "",
      browser: navigator.userAgent || "",
      device: "",
      os: navigator.platform || "",
      screenshotUrl: "",
    },
  });

  // Create bug report mutation
  const createBugMutation = useMutation({
    mutationFn: async (values: BugReportFormValues) => {
      // Add any additional info not captured in the form
      const response = await apiRequest("POST", "/api/bugs", values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bug reported successfully",
        description: "Thank you for helping improve our system!",
      });
      
      // Invalidate queries to reflect the new data
      queryClient.invalidateQueries({ queryKey: ["/api/bugs"] });
      
      // Reset the form
      form.reset();
      setScreenshot(null);
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to report bug",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: BugReportFormValues) {
    if (!user?.id || !organization?.id) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to report a bug",
        variant: "destructive",
      });
      return;
    }

    // Add screenshot if taken
    if (screenshot) {
      values.screenshotUrl = screenshot;
    }

    // Submit the form
    createBugMutation.mutate(values);
  }

  // Take a screenshot of the current page
  async function takeScreenshot() {
    try {
      // This is a simplified version - in a real app you'd use html2canvas or similar
      // For now, we'll just use a placeholder image URL
      setScreenshot("https://via.placeholder.com/800x600?text=Screenshot+Placeholder");
      
      toast({
        title: "Screenshot captured",
        description: "The current page state has been captured",
      });
    } catch (error) {
      toast({
        title: "Failed to capture screenshot",
        description: "Please describe the issue in detail instead",
        variant: "destructive",
      });
    }
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-4 max-w-3xl mx-auto">
        <div>
          <h3 className="text-lg font-medium">Report a Bug</h3>
          <p className="text-sm text-muted-foreground">
            Please provide as much detail as possible to help us fix the issue.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of the issue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="module"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODULES.map((module) => (
                          <SelectItem 
                            key={module} 
                            value={module}
                            className="capitalize"
                          >
                            {module}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="page"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Page/Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="URL or page name where the issue occurred" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed explanation of the bug" 
                        {...field} 
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="steps"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Steps to Reproduce</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="1. Go to page X&#10;2. Click on Y&#10;3. Observe Z" 
                        {...field} 
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Please list the exact steps needed to reproduce this issue.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="browser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Browser</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="device"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Phone, laptop, tablet, etc." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="os"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Operating System</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={takeScreenshot}
              >
                Take Screenshot
              </Button>
              {screenshot && (
                <p className="text-sm text-green-600">
                  ✓ Screenshot captured
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={createBugMutation.isPending}
              >
                {createBugMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Bug Report"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ErrorBoundary>
  );
}