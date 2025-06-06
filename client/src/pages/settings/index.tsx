import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation, useSearch } from "wouter";
import { useAnimationContext } from "@/contexts/AnimationContext";
import { API_ROUTES } from "@shared/constants";
import { AnimationSettings } from "@/components/ui/animation-settings";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  User,
  Settings,
  Bell,
  Lock,
  Shield,
  Users,
  Key,
  UserCheck,
  AlertTriangle,
  Check,
  Sparkles,
  DollarSign,
  Palette,
} from "lucide-react";
import ThemeCustomizer from "@/components/ui/theme-customizer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDepartmentColor } from "@/lib/utils";

// Profile update form schema
const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Password update form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// Notification settings form schema
const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  slackNotifications: z.boolean(),
  leadUpdates: z.boolean(),
  loadUpdates: z.boolean(),
  invoiceUpdates: z.boolean(),
  dailySummary: z.boolean(),
  weeklySummary: z.boolean(),
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const activeTab = searchParams.get("tab") || "profile";
  
  // Mock role data for now - this should come from user auth context
  const role = {
    level: user?.roleId || 3, // Default to admin level for testing
    name: "Administrator",
    permissions: ["all"] // Mock permissions
  };
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    },
  });
  
  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Notification settings form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      slackNotifications: true,
      leadUpdates: true,
      loadUpdates: true,
      invoiceUpdates: true,
      dailySummary: false,
      weeklySummary: true,
    },
  });
  
  // Query to fetch notification settings
  const { data: notificationSettings, isLoading: isLoadingNotifications } = useQuery({
    queryKey: [`/api/users/${user?.id}/notifications`],
    queryFn: async () => {
      if (!user) return null;
      const response = await fetch(`/api/users/${user.id}/notifications`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        console.error('Error fetching notification settings:', response.status);
        return null;
      }
      return await response.json();
    },
    enabled: !!user?.id,
  });
  
  // Set default values for profile form when user data is loaded
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user, profileForm]);
  
  // Set default values for notification form when settings data is loaded
  useEffect(() => {
    if (notificationSettings) {
      notificationForm.reset({
        emailNotifications: notificationSettings.emailNotifications ?? true,
        slackNotifications: notificationSettings.slackNotifications ?? true,
        leadUpdates: notificationSettings.leadUpdates ?? true,
        loadUpdates: notificationSettings.loadUpdates ?? true,
        invoiceUpdates: notificationSettings.invoiceUpdates ?? true,
        dailySummary: notificationSettings.dailySummary ?? false,
        weeklySummary: notificationSettings.weeklySummary ?? true,
      });
    }
  }, [notificationSettings, notificationForm]);
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      // Use a more direct approach to avoid any method/URL confusion
      const url = `/api/users/${user.id}`;
      console.log('Updating profile:', { url, values });
      
      try {
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(values),
          credentials: 'include'
        });
        
        if (!response.ok) {
          // Try to parse error as text first
          const errorText = await response.text();
          
          try {
            // See if the error text can be parsed as JSON
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || errorJson.message || `Profile update failed: ${response.status}`);
          } catch (e) {
            // If not JSON, use as plain text
            throw new Error(`Profile update failed: ${response.status} ${errorText.substring(0, 100)}`);
          }
        }
        
        // Try to parse the response as JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        } else {
          // Handle non-JSON response
          const text = await response.text();
          console.log("Non-JSON response:", text);
          return { success: true };
        }
      } catch (error) {
        console.error("Profile update error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      
      // Invalidate all relevant user data queries to update UI components
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations/current"] });
      
      // Try to refresh socket connection if it exists
      try {
        // Access socket via global namespace if available
        const socketService = (window as any).socketService;
        if (socketService && typeof socketService.reconnect === 'function') {
          socketService.reconnect();
        }
      } catch (e) {
        console.log("Socket reconnection failed, will rely on query cache updates");
      }
      
      // Update the user data in the auth context if possible
      if (data && typeof data === 'object') {
        queryClient.setQueryData(["/api/auth/me"], (oldData: any) => {
          if (oldData && oldData.user) {
            return {
              ...oldData,
              user: {
                ...oldData.user,
                ...data
              }
            };
          }
          return oldData;
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (values: PasswordFormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      // Use standard fetch for better control over error handling
      const response = await fetch(`/api/users/${user.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Password update failed: ${response.status} ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please check your current password.",
        variant: "destructive",
      });
    },
  });
  
  // Update notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (values: NotificationFormValues) => {
      if (!user) throw new Error("User not authenticated");
      return apiRequest("PATCH", `/api/users/${user.id}/notifications`, values);
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };
  
  const onNotificationSubmit = (data: NotificationFormValues) => {
    updateNotificationsMutation.mutate(data);
  };
  
  const handleTabChange = (value: string) => {
    // Update URL without triggering a navigation
    const params = new URLSearchParams(search);
    params.set("tab", value);
    navigate(`?${params.toString()}`, { replace: true });
  };
  
  if (!user) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Authentication required</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please log in to access your settings.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => navigate("/login")}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Page header */}
      <div className="bg-white shadow flex-shrink-0">
        <div className="px-3 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex flex-wrap items-center justify-between">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1 sm:mb-0">
              Settings
            </h1>
          </div>
        </div>
      </div>
      
      {/* Page content */}
      <div className="px-3 sm:px-6 lg:px-8 py-4 md:py-6 flex-grow overflow-y-auto overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Sidebar */}
          <Card className="lg:col-span-3 h-fit lg:sticky lg:top-4 w-full overflow-visible">
            <CardHeader className="lg:block flex items-center justify-between pb-2">
              <div className="flex items-center space-x-4">
                <div className="bg-[#025E73] rounded-full h-10 w-10 flex items-center justify-center text-base font-medium text-white shrink-0">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
                <div className="overflow-hidden text-ellipsis">
                  <h3 className="font-medium truncate">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm truncate text-muted-foreground">
                    {user.username}
                  </p>
                </div>
              </div>
              
              {/* Mobile menu button - visible on smaller screens */}
              <div className="block lg:hidden">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="lg:hidden shrink-0"
                  onClick={() => {
                    // Toggle mobile menu visibility
                    const sidebar = document.getElementById('settings-sidebar');
                    if (sidebar) {
                      sidebar.classList.toggle('hidden');
                      sidebar.classList.toggle('block');
                      
                      // Add fixed overlay to prevent page scrolling when menu is open
                      const overlay = document.getElementById('mobile-menu-overlay');
                      if (overlay) {
                        overlay.classList.toggle('hidden');
                      }
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            
            {/* Mobile overlay */}
            <div id="mobile-menu-overlay" className="fixed inset-0 bg-black/30 z-40 hidden lg:hidden" onClick={() => {
              const sidebar = document.getElementById('settings-sidebar');
              const overlay = document.getElementById('mobile-menu-overlay');
              if (sidebar) sidebar.classList.add('hidden');
              if (overlay) overlay.classList.add('hidden');
            }}></div>
            
            <CardContent className="p-0 relative">
              <div id="settings-sidebar" className="hidden lg:block lg:static fixed top-[4.5rem] left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg lg:shadow-none lg:border-t-0 max-h-[calc(100vh-4.5rem)] overflow-y-auto lg:max-h-none">
                <Tabs 
                  defaultValue={activeTab} 
                  orientation="vertical" 
                  onValueChange={(value) => {
                    handleTabChange(value);
                    // Hide mobile menu after selection on small screens
                    const sidebar = document.getElementById('settings-sidebar');
                    const overlay = document.getElementById('mobile-menu-overlay');
                    if (window.innerWidth < 1024) {
                      if (sidebar) sidebar.classList.add('hidden');
                      if (overlay) overlay.classList.add('hidden');
                    }
                  }}
                  className="flex flex-col"
                >
                  <TabsList className="flex flex-col h-auto w-full bg-transparent justify-start border-r border-gray-200 p-0 transition-all duration-200">
                    <TabsTrigger 
                      value="profile" 
                      className="justify-start px-4 py-3 w-full font-normal data-[state=active]:bg-gray-50 data-[state=active]:border-l-2 data-[state=active]:border-[#025E73] rounded-none text-sm"
                      onClick={() => {
                        // Close mobile menu
                        const sidebar = document.getElementById('settings-sidebar');
                        const overlay = document.getElementById('mobile-menu-overlay');
                        if (window.innerWidth < 1024) {
                          if (sidebar) sidebar.classList.add('hidden');
                          if (overlay) overlay.classList.add('hidden');
                        }
                      }}
                    >
                      <User className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Profile</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="account" 
                      className="justify-start px-4 py-3 w-full font-normal data-[state=active]:bg-gray-50 data-[state=active]:border-l-2 data-[state=active]:border-[#025E73] rounded-none text-sm"
                      onClick={() => {
                        // Close mobile menu
                        const sidebar = document.getElementById('settings-sidebar');
                        const overlay = document.getElementById('mobile-menu-overlay');
                        if (window.innerWidth < 1024) {
                          if (sidebar) sidebar.classList.add('hidden');
                          if (overlay) overlay.classList.add('hidden');
                        }
                      }}
                    >
                      <Lock className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Account & Security</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="notifications" 
                      className="justify-start px-4 py-3 w-full font-normal data-[state=active]:bg-gray-50 data-[state=active]:border-l-2 data-[state=active]:border-[#025E73] rounded-none text-sm"
                      onClick={() => {
                        // Close mobile menu
                        const sidebar = document.getElementById('settings-sidebar');
                        const overlay = document.getElementById('mobile-menu-overlay');
                        if (window.innerWidth < 1024) {
                          if (sidebar) sidebar.classList.add('hidden');
                          if (overlay) overlay.classList.add('hidden');
                        }
                      }}
                    >
                      <Bell className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="animations" 
                      className="justify-start px-4 py-3 w-full font-normal data-[state=active]:bg-gray-50 data-[state=active]:border-l-2 data-[state=active]:border-[#025E73] rounded-none text-sm"
                      onClick={() => {
                        // Close mobile menu
                        const sidebar = document.getElementById('settings-sidebar');
                        const overlay = document.getElementById('mobile-menu-overlay');
                        if (window.innerWidth < 1024) {
                          if (sidebar) sidebar.classList.add('hidden');
                          if (overlay) overlay.classList.add('hidden');
                        }
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Animations</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="teams" 
                      className="justify-start px-4 py-3 w-full font-normal data-[state=active]:bg-gray-50 data-[state=active]:border-l-2 data-[state=active]:border-[#025E73] rounded-none text-sm"
                      onClick={() => {
                        // Close mobile menu
                        const sidebar = document.getElementById('settings-sidebar');
                        const overlay = document.getElementById('mobile-menu-overlay');
                        if (window.innerWidth < 1024) {
                          if (sidebar) sidebar.classList.add('hidden');
                          if (overlay) overlay.classList.add('hidden');
                        }
                      }}
                    >
                      <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Teams</span>
                    </TabsTrigger>
                    {role.level >= 3 && (
                      <TabsTrigger 
                        value="commission-policies" 
                        className="justify-start px-4 py-3 w-full font-normal data-[state=active]:bg-gray-50 data-[state=active]:border-l-2 data-[state=active]:border-[#025E73] rounded-none text-sm"
                        onClick={() => {
                          // Close mobile menu
                          const sidebar = document.getElementById('settings-sidebar');
                          const overlay = document.getElementById('mobile-menu-overlay');
                          if (window.innerWidth < 1024) {
                            if (sidebar) sidebar.classList.add('hidden');
                            if (overlay) overlay.classList.add('hidden');
                          }
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Commission Policies</span>
                      </TabsTrigger>
                    )}
                    {role.level >= 5 && (
                      <TabsTrigger 
                        value="admin" 
                        className="justify-start px-4 py-3 w-full font-normal data-[state=active]:bg-gray-50 data-[state=active]:border-l-2 data-[state=active]:border-[#025E73] rounded-none text-sm"
                        onClick={() => {
                          // Close mobile menu
                          const sidebar = document.getElementById('settings-sidebar');
                          const overlay = document.getElementById('mobile-menu-overlay');
                          if (window.innerWidth < 1024) {
                            if (sidebar) sidebar.classList.add('hidden');
                            if (overlay) overlay.classList.add('hidden');
                          }
                        }}
                      >
                        <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Admin Settings</span>
                      </TabsTrigger>
                    )}
                    {/* Design System Tab - for all users */}
                    <TabsTrigger 
                      value="design-system" 
                      className="justify-start px-4 py-3 w-full font-normal data-[state=active]:bg-gray-50 data-[state=active]:border-l-2 data-[state=active]:border-[#025E73] rounded-none text-sm"
                      onClick={() => {
                        // Close mobile menu
                        const sidebar = document.getElementById('settings-sidebar');
                        const overlay = document.getElementById('mobile-menu-overlay');
                        if (window.innerWidth < 1024) {
                          if (sidebar) sidebar.classList.add('hidden');
                          if (overlay) overlay.classList.add('hidden');
                        }
                      }}
                    >
                      <Palette className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Design System</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>
          
          {/* Settings content */}
          <div className="lg:col-span-9 w-full">
            <Tabs 
              defaultValue={activeTab} 
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsContent value="profile" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and contact details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email address</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone number</FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save changes"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="account" className="m-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormDescription>
                                Password must be at least 8 characters long
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm new password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          disabled={updatePasswordMutation.isPending}
                        >
                          {updatePasswordMutation.isPending ? "Updating..." : "Update password"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>
                      Information about your account and permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Username</Label>
                      <div className="mt-1 flex items-center space-x-2">
                        <p className="text-sm">{user.username}</p>
                        <Badge variant="outline" className="text-xs">Cannot change</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Role</Label>
                      <div className="mt-1 flex items-center space-x-2">
                        <p className="text-sm">{role.name}</p>
                        <Badge variant="outline" className={`text-xs ${getDepartmentColor(role?.department)}`}>
                          {role?.department ? role.department.charAt(0).toUpperCase() + role.department.slice(1) : 'N/A'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Account Status</Label>
                      <div className="mt-1 flex items-center space-x-2">
                        <Badge variant={user.active ? "default" : "destructive"} className="text-xs">
                          {user.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Permissions</Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {role.permissions.map((permission, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="teams" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Management</CardTitle>
                    <CardDescription>
                      Manage your team structure and members
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center py-8">
                      <Button onClick={() => navigate("/settings/teams")}>
                        Go to Team Management
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="design-system" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Design System</CardTitle>
                    <CardDescription>
                      Customize your platform appearance and explore design guidelines
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="theme">
                      <TabsList className="mb-4">
                        <TabsTrigger value="theme">Theme</TabsTrigger>
                        <TabsTrigger value="typography">Typography</TabsTrigger>
                        <TabsTrigger value="colors">Colors</TabsTrigger>
                        <TabsTrigger value="components">Components</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="theme">
                        <ThemeCustomizer 
                          currentTheme={{
                            variant: "professional",
                            primary: "#1D3557",
                            secondary: "#457B9D",
                            appearance: "light",
                            radius: 0.5,
                            colors: {
                              "brand-navy": "#1D3557",
                              "brand-accent": "#457B9D",
                              "brand-highlight": "#2EC4B6",
                              "brand-contrast": "#FFDD57",
                              "brand-background": "#F1FAFB",
                              "brand-border": "#D6D6D6",
                              "brand-text": "#333333"
                            }
                          }}
                          isAdmin={role.level >= 5}
                        />
                      </TabsContent>
                      
                      <TabsContent value="typography">
                        <Card>
                          <CardHeader>
                            <CardTitle>Typography Guidelines</CardTitle>
                            <CardDescription>
                              Consistent typography creates a clear hierarchy and improves readability
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-6">
                              <div>
                                <h1 className="text-4xl font-bold mb-2">Heading 1 (32px/40px)</h1>
                                <p className="text-gray-500">Font weight: 700 (Bold)</p>
                              </div>
                              
                              <div>
                                <h2 className="text-3xl font-bold mb-2">Heading 2 (28px/36px)</h2>
                                <p className="text-gray-500">Font weight: 700 (Bold)</p>
                              </div>
                              
                              <div>
                                <h3 className="text-2xl font-semibold mb-2">Heading 3 (24px/32px)</h3>
                                <p className="text-gray-500">Font weight: 600 (Semibold)</p>
                              </div>
                              
                              <div>
                                <h4 className="text-xl font-semibold mb-2">Heading 4 (20px/28px)</h4>
                                <p className="text-gray-500">Font weight: 600 (Semibold)</p>
                              </div>
                              
                              <div>
                                <h5 className="text-lg font-medium mb-2">Heading 5 (18px/24px)</h5>
                                <p className="text-gray-500">Font weight: 500 (Medium)</p>
                              </div>
                              
                              <div>
                                <p className="text-base mb-2">Body text (16px/24px)</p>
                                <p className="text-gray-500">Font weight: 400 (Regular)</p>
                              </div>
                              
                              <div>
                                <p className="text-sm mb-2">Small text (14px/20px)</p>
                                <p className="text-gray-500">Font weight: 400 (Regular)</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="colors">
                        <Card>
                          <CardHeader>
                            <CardTitle>Color System</CardTitle>
                            <CardDescription>
                              Our color palette is designed for clarity, consistency, and accessibility
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <h3 className="text-lg font-medium">Primary Colors</h3>
                                
                                <div className="space-y-3">
                                  <div>
                                    <div className="h-12 rounded-md bg-[#1D3557]"></div>
                                    <div className="mt-1">
                                      <p className="font-medium">Primary Dark Blue</p>
                                      <p className="text-sm text-gray-500">#1D3557</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="h-12 rounded-md bg-[#457B9D]"></div>
                                    <div className="mt-1">
                                      <p className="font-medium">Accent Bright Blue</p>
                                      <p className="text-sm text-gray-500">#457B9D</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <h3 className="text-lg font-medium">Accent Colors</h3>
                                
                                <div className="space-y-3">
                                  <div>
                                    <div className="h-12 rounded-md bg-[#2EC4B6]"></div>
                                    <div className="mt-1">
                                      <p className="font-medium">Highlight Aqua</p>
                                      <p className="text-sm text-gray-500">#2EC4B6</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="h-12 rounded-md bg-[#FFDD57]"></div>
                                    <div className="mt-1">
                                      <p className="font-medium">Contrast Yellow</p>
                                      <p className="text-sm text-gray-500">#FFDD57</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                <h3 className="text-lg font-medium mb-3">Background</h3>
                                <div className="h-12 rounded-md bg-[#F1FAFB] border"></div>
                                <div className="mt-1">
                                  <p className="font-medium">Light Background</p>
                                  <p className="text-sm text-gray-500">#F1FAFB</p>
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="text-lg font-medium mb-3">Border</h3>
                                <div className="h-12 rounded-md border-4 border-[#D6D6D6]"></div>
                                <div className="mt-1">
                                  <p className="font-medium">Border Gray</p>
                                  <p className="text-sm text-gray-500">#D6D6D6</p>
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="text-lg font-medium mb-3">Text</h3>
                                <div className="h-12 rounded-md bg-[#333333]"></div>
                                <div className="mt-1">
                                  <p className="font-medium">Text Dark</p>
                                  <p className="text-sm text-gray-500">#333333</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="components">
                        <Card>
                          <CardHeader>
                            <CardTitle>Component Library</CardTitle>
                            <CardDescription>
                              Examples of core UI components used throughout the platform
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-8">
                              <div>
                                <h3 className="text-lg font-medium mb-4">Buttons</h3>
                                <div className="flex flex-wrap gap-3">
                                  <Button>Default</Button>
                                  <Button variant="secondary">Secondary</Button>
                                  <Button variant="outline">Outline</Button>
                                  <Button variant="ghost">Ghost</Button>
                                  <Button variant="link">Link</Button>
                                  <Button disabled>Disabled</Button>
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="text-lg font-medium mb-4">Inputs</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="example-input">Text Input</Label>
                                    <Input id="example-input" placeholder="Enter text..." className="mt-1" />
                                  </div>
                                  <div>
                                    <Label htmlFor="example-select">Select Input</Label>
                                    <Select>
                                      <SelectTrigger id="example-select" className="mt-1">
                                        <SelectValue placeholder="Select an option" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="option1">Option 1</SelectItem>
                                        <SelectItem value="option2">Option 2</SelectItem>
                                        <SelectItem value="option3">Option 3</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="text-lg font-medium mb-4">Cards</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Simple Card</CardTitle>
                                      <CardDescription>Card with minimal content</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <p>This is a basic card component used for displaying content in a contained format.</p>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Interactive Card</CardTitle>
                                      <CardDescription>Card with actions</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <p>Cards can contain various interactive elements like buttons.</p>
                                    </CardContent>
                                    <CardFooter className="flex justify-between">
                                      <Button variant="outline">Cancel</Button>
                                      <Button>Save</Button>
                                    </CardFooter>
                                  </Card>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Configure how and when you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationForm}>
                      <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Notification Channels</h3>
                          
                          <FormField
                            control={notificationForm.control}
                            name="emailNotifications"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="font-normal">Email Notifications</FormLabel>
                                  <FormDescription>
                                    Receive notifications via email
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="slackNotifications"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="font-normal">Slack Notifications</FormLabel>
                                  <FormDescription>
                                    Receive notifications via Slack
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Notification Types</h3>
                          
                          <FormField
                            control={notificationForm.control}
                            name="leadUpdates"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="font-normal">Lead Updates</FormLabel>
                                  <FormDescription>
                                    Status changes and new information for your leads
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="loadUpdates"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="font-normal">Load Updates</FormLabel>
                                  <FormDescription>
                                    Status changes and new information for your loads
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="invoiceUpdates"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="font-normal">Invoice Updates</FormLabel>
                                  <FormDescription>
                                    Status changes and payment notifications for invoices
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Summary Reports</h3>
                          
                          <FormField
                            control={notificationForm.control}
                            name="dailySummary"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="font-normal">Daily Summary</FormLabel>
                                  <FormDescription>
                                    Receive a daily summary of all activity
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="weeklySummary"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="font-normal">Weekly Summary</FormLabel>
                                  <FormDescription>
                                    Receive a weekly summary of all activity
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          disabled={updateNotificationsMutation.isPending}
                        >
                          {updateNotificationsMutation.isPending ? "Saving..." : "Save preferences"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="animations" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#F2A71B]" />
                      Animation Settings
                    </CardTitle>
                    <CardDescription>
                      Customize animation effects and transitions across the MetaSys ERP platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AnimationSettings />
                  </CardContent>
                </Card>
              </TabsContent>
              
              {role.level >= 3 && (
                <TabsContent value="commission-policies" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-[#F2A71B]" />
                        Commission Policies
                      </CardTitle>
                      <CardDescription>
                        Manage sales and dispatch commission policies
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Go to the Commission Policies Page
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                Commission policies configuration has been moved to a dedicated page for better management.
                              </p>
                            </div>
                            <div className="mt-4">
                              <Button
                                onClick={() => navigate("/settings/commission-policies")}
                                size="sm"
                              >
                                Go to Commission Policies
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
              
              {role.level >= 4 && (
                <TabsContent value="teams" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Management</CardTitle>
                      <CardDescription>
                        Manage your team members and their permissions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Feature in development
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                Team management functionality is currently being developed. This feature will allow you to add, edit, and remove team members, as well as manage their roles and permissions.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center text-sm font-medium text-gray-700">
                              JD
                            </div>
                            <div>
                              <h3 className="font-medium">John Doe</h3>
                              <p className="text-sm text-gray-500">Sales Team Lead</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                            Active
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center text-sm font-medium text-gray-700">
                              SR
                            </div>
                            <div>
                              <h3 className="font-medium">Sarah Roberts</h3>
                              <p className="text-sm text-gray-500">Sales Representative</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                            Active
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center text-sm font-medium text-gray-700">
                              AW
                            </div>
                            <div>
                              <h3 className="font-medium">Alex Wong</h3>
                              <p className="text-sm text-gray-500">Sales Representative</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                            Active
                          </Badge>
                        </div>
                      </div>
                      
                      <Button className="mt-6" disabled>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Add Team Member
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
              
              {role.level >= 5 && (
                <TabsContent value="admin" className="m-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Settings</CardTitle>
                      <CardDescription>
                        Configure global system settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Administration in development
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                Advanced administration features are currently being developed. These features will allow you to configure global system settings, manage user roles, and customize workflows.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-2">
                          <Label htmlFor="company-name">Company Name</Label>
                          <Input id="company-name" defaultValue="MetaSys Limited" />
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <Label htmlFor="system-email">System Email</Label>
                          <Input id="system-email" defaultValue="system@metasys.com" />
                        </div>
                        
                        <div className="flex items-center justify-between space-x-2">
                          <div className="space-y-0.5">
                            <Label>Maintenance Mode</Label>
                            <p className="text-sm text-gray-500">
                              When enabled, only administrators can access the system
                            </p>
                          </div>
                          <Switch disabled />
                        </div>
                        
                        <div className="flex items-center justify-between space-x-2">
                          <div className="space-y-0.5">
                            <Label>Debug Mode</Label>
                            <p className="text-sm text-gray-500">
                              Enable detailed error logging and debugging
                            </p>
                          </div>
                          <Switch disabled />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button disabled>
                        <Check className="h-4 w-4 mr-2" />
                        Save System Settings
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>API Keys & Integrations</CardTitle>
                      <CardDescription>
                        Manage API keys and third-party integrations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">Slack Integration</h3>
                              <p className="text-sm text-gray-500">
                                Send notifications and updates to Slack channels
                              </p>
                            </div>
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              Active
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center">
                            <Key className="h-4 w-4 text-gray-400 mr-2" />
                            <Input 
                              value="••••••••••••••••••••••••••" 
                              disabled
                              className="font-mono bg-gray-50"
                            />
                            <Button size="sm" variant="ghost" className="ml-2" disabled>
                              Regenerate
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">Email Service Integration</h3>
                              <p className="text-sm text-gray-500">
                                Send automated emails for invoices and notifications
                              </p>
                            </div>
                            <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50">
                              Not Configured
                            </Badge>
                          </div>
                          <Button size="sm" className="mt-2" disabled>
                            Configure
                          </Button>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">Google Calendar Integration</h3>
                              <p className="text-sm text-gray-500">
                                Sync tasks and reminders with Google Calendar
                              </p>
                            </div>
                            <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50">
                              Not Configured
                            </Badge>
                          </div>
                          <Button size="sm" className="mt-2" disabled>
                            Configure
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
