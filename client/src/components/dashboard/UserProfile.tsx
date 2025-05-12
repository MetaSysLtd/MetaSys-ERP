Adding username display and editing capabilities to the profile component.
```

```replit_final_file
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Building, Calendar, Edit, FileEdit, Lock, Mail, Phone, User, UserCog, 
  MapPin, Briefcase, Shield, LogOut, ArrowUpRight
} from 'lucide-react';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type UserProfileData = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  roleId: number;
  role: string;
  department: string;
  level: number;
  permissions: string[];
  active: boolean;
  profileImageUrl?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  bio?: string;
  joinDate?: string;
  lastActivity?: string;
};

const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password confirmation must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UserProfileProps = {
  user: UserProfileData;
  isCurrentUser: boolean;
  canEdit: boolean;
};

export function UserProfile({ user, isCurrentUser, canEdit }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Profile edit form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      street: user.address?.street || "",
      city: user.address?.city || "",
      state: user.address?.state || "",
      zipCode: user.address?.zipCode || "",
      country: user.address?.country || "",
      bio: user.bio || "",
    }
  });

  // Password change form
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: z.infer<typeof profileFormSchema>) => {
      const res = await apiRequest('PATCH', `/api/users/${user.id}`, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber,
        address: {
          street: profileData.street,
          city: profileData.city,
          state: profileData.state,
          zipCode: profileData.zipCode,
          country: profileData.country,
        },
        bio: profileData.bio,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user.id] });

      if (isCurrentUser) {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      }

      setIsEditingProfile(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: z.infer<typeof securityFormSchema>) => {
      const res = await apiRequest('POST', `/api/accounts/${user.id}/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      return await res.json();
    },
    onSuccess: () => {
      setIsChangingPassword(false);
      securityForm.reset();
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error changing password",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmitProfile = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPasswordChange = (data: z.infer<typeof securityFormSchema>) => {
    changePasswordMutation.mutate(data);
  };

  const getDepartmentColor = (department: string) => {
    switch (department.toLowerCase()) {
      case 'sales': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'dispatch': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'hr': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'finance': 
      case 'accounting': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getRoleLevelName = (level: number) => {
    switch (level) {
      case 1: return 'Representative';
      case 2: return 'Team Lead';
      case 3: return 'Manager';
      case 4: return 'Department Head';
      case 5: return 'Administrator';
      default: return 'Unknown';
    }
  };

  const getPermissionName = (permission: string) => {
    const [action, resource] = permission.split(':');
    const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);
    const formattedResource = resource ? resource.charAt(0).toUpperCase() + resource.slice(1) + 's' : 'All';

    return `${formattedAction} ${formattedResource}`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="md:flex md:items-start md:gap-6">
            <div className="mb-4 md:mb-0 flex-shrink-0">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                {user.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                ) : (
                  <AvatarFallback className="text-xl">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                )}
              </Avatar>
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>

                {canEdit && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                      className="h-8"
                    >
                      <Lock className="mr-1 h-4 w-4" /> Change Password
                    </Button>
                    <Button
                      onClick={() => setIsEditingProfile(true)}
                      size="sm"
                      className="h-8"
                    >
                      <Edit className="mr-1 h-4 w-4" /> Edit Profile
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={cn("text-xs", getDepartmentColor(user.department))}>
                      {user.department}
                    </Badge>
                    <span>Department</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline">
                      {user.role} (Level {user.level})
                    </Badge>
                  </div>
                </div>
                {user.joinDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
                  </div>
                )}
                {user.lastActivity && (
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    <span>Last active {new Date(user.lastActivity).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {user.bio && (
                <div className="mt-4">
                  <Label className="text-sm text-muted-foreground">Bio</Label>
                  <p className="mt-1">{user.bio}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="overview">
            <User className="h-4 w-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" /> Security
          </TabsTrigger>
          <TabsTrigger value="address">
            <MapPin className="h-4 w-4 mr-2" /> Address
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Briefcase className="h-4 w-4 mr-2" /> Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Overview</CardTitle>
              <CardDescription>Basic information about the user's role and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Role Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Unique ID</Label>
                    <p className="font-medium">{user.id}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Username</Label>
                    <p className="font-medium">@{user.username}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Role</Label>
                    <p className="font-medium">{user.role}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Department</Label>
                    <p className="font-medium">{user.department}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Level</Label>
                    <p className="font-medium">
                      {user.level} - {getRoleLevelName(user.level)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <p className="font-medium">
                      {user.active ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          Inactive
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2">Permissions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {user.permissions.map(permission => (
                    <Badge key={permission} variant="outline" className="justify-start">
                      {getPermissionName(permission)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Password</h3>
                    <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
                  </div>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsChangingPassword(true)}
                    >
                      <Lock className="h-4 w-4 mr-2" /> Change Password
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Two-factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                    Coming Soon
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Session Management</h3>
                    <p className="text-sm text-muted-foreground">Manage your active sessions and devices</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Log Out All Devices
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>Your contact and address details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.address ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.address.street && (
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Street Address</Label>
                      <p className="font-medium">{user.address.street}</p>
                    </div>
                  )}
                  {user.address.city && (
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">City</Label>
                      <p className="font-medium">{user.address.city}</p>
                    </div>
                  )}
                  {user.address.state && (
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">State/Province</Label>
                      <p className="font-medium">{user.address.state}</p>
                    </div>
                  )}
                  {user.address.zipCode && (
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">ZIP/Postal Code</Label>
                      <p className="font-medium">{user.address.zipCode}</p>
                    </div>
                  )}
                  {user.address.country && (
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Country</Label>
                      <p className="font-medium">{user.address.country}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No address information available</p>
                  {canEdit && (
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => {
                        setIsEditingProfile(true);
                        setActiveTab("overview");
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Add Address
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-muted-foreground">Activity tracking coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and profile details
            </DialogDescription>
          </DialogHeader>

          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" {...field} />
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
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a little about yourself"
                        className="h-24 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <h3 className="text-base font-semibold pt-2">Address Information</h3>

              <FormField
                control={profileForm.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP/Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password
            </DialogDescription>
          </DialogHeader>

          <Form {...securityForm}>
            <form onSubmit={securityForm.handleSubmit(onSubmitPasswordChange)} className="space-y-4">
              <FormField
                control={securityForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={securityForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>
                      Password must be at least 6 characters long
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={securityForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsChangingPassword(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? "Updating..." : "Change Password"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```Adding username and unique id display to the user profile and edit form.
```

```replit_final_file
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Building, Calendar, Edit, FileEdit, Lock, Mail, Phone, User, UserCog, 
  MapPin, Briefcase, Shield, LogOut, ArrowUpRight
} from 'lucide-react';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type UserProfileData = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  roleId: number;
  role: string;
  department: string;
  level: number;
  permissions: string[];
  active: boolean;
  profileImageUrl?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  bio?: string;
  joinDate?: string;
  lastActivity?: string;
};

const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password confirmation must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UserProfileProps = {
  user: UserProfileData;
  isCurrentUser: boolean;
  canEdit: boolean;
};

export function UserProfile({ user, isCurrentUser, canEdit }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Profile edit form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      street: user.address?.street || "",
      city: user.address?.city || "",
      state: user.address?.state || "",
      zipCode: user.address?.zipCode || "",
      country: user.address?.country || "",
      bio: user.bio || "",
    }
  });

  // Password change form
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: z.infer<typeof profileFormSchema>) => {
      const res = await apiRequest('PATCH', `/api/users/${user.id}`, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber,
        address: {
          street: profileData.street,
          city: profileData.city,
          state: profileData.state,
          zipCode: profileData.zipCode,
          country: profileData.country,
        },
        bio: profileData.bio,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user.id] });

      if (isCurrentUser) {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      }

      setIsEditingProfile(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: z.infer<typeof securityFormSchema>) => {
      const res = await apiRequest('POST', `/api/accounts/${user.id}/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      return await res.json();
    },
    onSuccess: () => {
      setIsChangingPassword(false);
      securityForm.reset();
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error changing password",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmitProfile = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPasswordChange = (data: z.infer<typeof securityFormSchema>) => {
    changePasswordMutation.mutate(data);
  };

  const getDepartmentColor = (department: string) => {
    switch (department.toLowerCase()) {
      case 'sales': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'dispatch': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'hr': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'finance': 
      case 'accounting': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getRoleLevelName = (level: number) => {
    switch (level) {
      case 1: return 'Representative';
      case 2: return 'Team Lead';
      case 3: return 'Manager';
      case 4: return 'Department Head';
      case 5: return 'Administrator';
      default: return 'Unknown';
    }
  };

  const getPermissionName = (permission: string) => {
    const [action, resource] = permission.split(':');
    const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);
    const formattedResource = resource ? resource.charAt(0).toUpperCase() + resource.slice(1) + 's' : 'All';

    return `${formattedAction} ${formattedResource}`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="md:flex md:items-start md:gap-6">
            <div className="mb-4 md:mb-0 flex-shrink-0">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                {user.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                ) : (
                  <AvatarFallback className="text-xl">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                )}
              </Avatar>
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>

                {canEdit && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                      className="h-8"
                    >
                      <Lock className="mr-1 h-4 w-4" /> Change Password
                    </Button>
                    <Button
                      onClick={() => setIsEditingProfile(true)}
                      size="sm"
                      className="h-8"
                    >
                      <Edit className="mr-1 h-4 w-4" /> Edit Profile
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={cn("text-xs", getDepartmentColor(user.department))}>
                      {user.department}
                    </Badge>
                    <span>Department</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline">
                      {user.role} (Level {user.level})
                    </Badge>
                  </div>
                </div>
                {user.joinDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
                  </div>
                )}
                {user.lastActivity && (
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    <span>Last active {new Date(user.lastActivity).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {user.bio && (
                <div className="mt-4">
                  <Label className="text-sm text-muted-foreground">Bio</Label>
                  <p className="mt-1">{user.bio}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="overview">
            <User className="h-4 w-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" /> Security
          </TabsTrigger>
          <TabsTrigger value="address">
            <MapPin className="h-4 w-4 mr-2" /> Address
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Briefcase className="h-4 w-4 mr-2" /> Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Overview</CardTitle>
              <CardDescription>Basic information about the user's role and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Role Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Unique ID</Label>
                    <p className="font-medium">{user.id}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Username</Label>
                    <p className="font-medium">@{user.username}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Role</Label>
                    <p className="font-medium">{user.role}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Department</Label>
                    <p className="font-medium">{user.department}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Level</Label>
                    <p className="font-medium">
                      {user.level} - {getRoleLevelName(user.level)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <p className="font-medium">
                      {user.active ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          Inactive
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2">Permissions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {user.permissions.map(permission => (
                    <Badge key={permission} variant="outline" className="justify-start">
                      {getPermissionName(permission)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Password</h3>
                    <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
                  </div>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsChangingPassword(true)}
                    >
                      <Lock className="h-4 w-4 mr-2" /> Change Password
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Two-factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                    Coming Soon
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Session Management</h3>
                    <p className="text-sm text-muted-foreground">Manage your active sessions and devices</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Log Out All Devices
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>Your contact and address details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.address ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.address.street && (
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Street Address</Label>
                      <p className="font-medium">{user.address.street}</p>
                    </div>
                  )}
                  {user.address.city && (
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">City</Label>
                      <p className="font-medium">{user.address.city}</p>
                    </div>
                  )}
                  {user.address.state && (
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">State/Province</Label>
                      <p className="font-medium">{user.address.state}</p>
                    </div>
                  )}
                  {user.address.zipCode && (
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">ZIP/Postal Code</Label>
                      <p className="font-medium">{user.address.zipCode}</p>
                    </div>
                  )}
                  {user.address.country && (
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Country</Label>
                      <p className="font-medium">{user.address.country}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No address information available</p>
                  {canEdit && (
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => {
                        setIsEditingProfile(true);
                        setActiveTab("overview");
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Add Address
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-muted-foreground">Activity tracking coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and profile details
            </DialogDescription>
          </DialogHeader>

          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" {...field} />
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
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a little about yourself"
                        className="h-24 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <h3 className="text-base font-semibold pt-2">Address Information</h3>

              <FormField
                control={profileForm.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP/Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password
            </DialogDescription>
          </DialogHeader>

          <Form {...securityForm}>
            <form onSubmit={securityForm.handleSubmit(onSubmitPasswordChange)} className="space-y-4">
              <FormField
                control={securityForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={securityForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>
                      Password must be at least 6 characters long
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={securityForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsChangingPassword(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? "Updating..." : "Change Password"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}