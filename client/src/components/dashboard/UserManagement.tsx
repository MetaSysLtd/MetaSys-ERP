import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, Edit, Lock, Search, UserPlus, X, Users, ShieldAlert,
  UserCog, Mail, Phone
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type SystemUser = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  phoneNumber?: string;
  active: boolean;
  role: string;
  department: string;
  userLevel: number;
  profileImageUrl?: string;
}

export type UserRole = {
  id: number;
  name: string;
  department: string;
  level: number;
  permissions: string[];
}

const allPermissions = [
  { id: "create:lead", label: "Create Leads" },
  { id: "read:lead", label: "View Leads" },
  { id: "update:lead", label: "Edit Leads" },
  { id: "delete:lead", label: "Delete Leads" },
  { id: "create:load", label: "Create Loads" },
  { id: "read:load", label: "View Loads" },
  { id: "update:load", label: "Edit Loads" },
  { id: "delete:load", label: "Delete Loads" },
  { id: "create:invoice", label: "Create Invoices" },
  { id: "read:invoice", label: "View Invoices" },
  { id: "update:invoice", label: "Edit Invoices" },
  { id: "delete:invoice", label: "Delete Invoices" },
  { id: "read:commission", label: "View Commissions" },
  { id: "update:commission", label: "Edit Commissions" },
  { id: "read:reports", label: "View Reports" },
  { id: "create:user", label: "Create Users" },
  { id: "read:user", label: "View Users" },
  { id: "update:user", label: "Edit Users" },
  { id: "delete:user", label: "Delete Users" },
  { id: "admin:all", label: "Full Admin Access" }
];

type UserManagementProps = {
  currentUserLevel?: number;
}

const userFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(4, "Username must be at least 4 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(),
  roleId: z.number().min(1, "Please select a role"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  active: z.boolean().default(true),
});

const roleFormSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  department: z.string().min(2, "Department is required"),
  level: z.number().min(1).max(5),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
});

export function UserManagement({
  currentUserLevel = 5
}: UserManagementProps) {
  const [search, setSearch] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form for user creation/editing
  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phoneNumber: "",
      active: true,
    }
  });
  
  // Form for role creation/editing
  const roleForm = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      department: "sales",
      level: 1,
      permissions: [],
    }
  });
  
  // Fetch users data
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/users');
      const data: SystemUser[] = await res.json();
      return data;
    }
  });
  
  // Fetch roles data
  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['/api/roles'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/roles');
      const data: UserRole[] = await res.json();
      return data;
    }
  });
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof userFormSchema>) => {
      const res = await apiRequest('POST', '/api/users', userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setUserDialogOpen(false);
      userForm.reset();
      toast({
        title: "User created",
        description: "The user has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number, userData: Partial<z.infer<typeof userFormSchema>> }) => {
      const res = await apiRequest('PUT', `/api/users/${id}`, userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setUserDialogOpen(false);
      userForm.reset();
      toast({
        title: "User updated",
        description: "The user has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: z.infer<typeof roleFormSchema>) => {
      const res = await apiRequest('POST', '/api/roles', roleData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create role');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setRoleDialogOpen(false);
      roleForm.reset();
      toast({
        title: "Role created",
        description: "The role has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating role",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('POST', `/api/users/${userId}/reset-password`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password reset",
        description: `The password has been reset. Temporary password: ${data.tempPassword}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error resetting password",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const filteredUsers = users.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase()) || 
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.role.toLowerCase().includes(search.toLowerCase()) ||
    user.department.toLowerCase().includes(search.toLowerCase()) ||
    user.username.toLowerCase().includes(search.toLowerCase())
  );
  
  const handleResetPassword = (id: number) => {
    setSelectedUserId(id);
    setResetDialogOpen(true);
  };
  
  const confirmResetPassword = () => {
    if (selectedUserId !== null) {
      resetPasswordMutation.mutate(selectedUserId);
    }
    setResetDialogOpen(false);
  };
  
  const handleAddUser = () => {
    setIsEditing(false);
    userForm.reset({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phoneNumber: "",
      active: true,
    });
    setUserDialogOpen(true);
  };
  
  const handleEditUser = (id: number) => {
    const user = users.find(user => user.id === id);
    if (user) {
      setIsEditing(true);
      userForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber || "",
        roleId: user.roleId,
        active: user.active,
      });
      setSelectedUserId(id);
      setUserDialogOpen(true);
    }
  };
  
  const handleToggleUserStatus = (id: number, currentStatus: boolean) => {
    updateUserMutation.mutate({
      id,
      userData: { active: !currentStatus }
    });
  };
  
  const handleAddRole = () => {
    roleForm.reset({
      name: "",
      department: "sales",
      level: 1,
      permissions: [],
    });
    setRoleDialogOpen(true);
  };
  
  const onSubmitUser = (data: z.infer<typeof userFormSchema>) => {
    if (isEditing && selectedUserId) {
      // Handle password specially - only include it if it's being changed
      const userData = { ...data };
      if (!userData.password) {
        delete userData.password;
      }
      
      updateUserMutation.mutate({
        id: selectedUserId,
        userData
      });
    } else {
      // Require password for new users
      if (!data.password) {
        userForm.setError("password", {
          type: "manual",
          message: "Password is required for new users"
        });
        return;
      }
      createUserMutation.mutate(data);
    }
  };
  
  const onSubmitRole = (data: z.infer<typeof roleFormSchema>) => {
    createRoleMutation.mutate(data);
  };
  
  const getStatusColor = (active: boolean) => {
    return active 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
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
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  // Show loading indicator while data is being fetched
  if (loadingUsers || loadingRoles) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl font-bold">User Management</CardTitle>
            <CardDescription>Manage system users and permissions</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Tabs defaultValue="users" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-1">
              <ShieldAlert className="h-4 w-4" />
              <span>Roles</span>
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button onClick={handleAddRole} variant="outline" size="sm" className="h-8">
              <ShieldAlert className="h-4 w-4 mr-1" /> Add Role
            </Button>
            <Button onClick={handleAddUser} variant="default" size="sm" className="h-8">
              <UserPlus className="h-4 w-4 mr-1" /> Add User
            </Button>
          </div>
        </div>
        
        <TabsContent value="users" className="mt-0">
          <Card className="shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold">User Management</CardTitle>
              <CardDescription>Manage system users and their access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {user.profileImageUrl ? (
                            <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                          ) : (
                            <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {user.email}
                            </span>
                            {user.phoneNumber && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {user.phoneNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", getDepartmentColor(user.department))}>
                          {user.department}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(user.active))}>
                          {user.active ? 'Active' : 'Inactive'}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <UserCog className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                              <Lock className="mr-2 h-4 w-4" /> Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.active ? (
                              <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, user.active)}>
                                <X className="mr-2 h-4 w-4" /> Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, user.active)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No users found. Try a different search term.
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
              </div>
              <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                Clear Filters
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles" className="mt-0">
          <Card className="shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold">Role Management</CardTitle>
              <CardDescription>Manage system roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {roles.map(role => (
                  <div key={role.id} className="border rounded-md overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", getDepartmentColor(role.department))}>
                          {role.department}
                        </Badge>
                        <h3 className="font-semibold">{role.name}</h3>
                      </div>
                      <Badge variant="outline">
                        Level {role.level} - {getRoleLevelName(role.level)}
                      </Badge>
                    </div>
                    <Accordion type="single" collapsible>
                      <AccordionItem value={`role-${role.id}`}>
                        <AccordionTrigger className="px-4">Permissions</AccordionTrigger>
                        <AccordionContent className="p-4">
                          <div className="grid grid-cols-2 gap-2">
                            {allPermissions.map(permission => (
                              <div key={permission.id} className="flex items-center gap-2">
                                <Checkbox 
                                  id={`permission-${role.id}-${permission.id}`} 
                                  checked={role.permissions.includes(permission.id)}
                                  disabled={true}
                                />
                                <label 
                                  htmlFor={`permission-${role.id}-${permission.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update user information and permissions.' : 'Create a new user with appropriate role and permissions.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={userForm.control}
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
                  control={userForm.control}
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
                control={userForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" disabled={isEditing} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
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
                control={userForm.control}
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
                control={userForm.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem 
                            key={role.id} 
                            value={role.id.toString()}
                            disabled={role.level > currentUserLevel} // Can't create users with higher level
                          >
                            {role.name} ({role.department})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!isEditing && (
                <FormField
                  control={userForm.control}
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
              )}
              
              {isEditing && (
                <FormField
                  control={userForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password (leave blank to keep current)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={userForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active Account</FormLabel>
                      <FormDescription>
                        If unchecked, the user will not be able to log in
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? 'Update User' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions
            </DialogDescription>
          </DialogHeader>
          
          <Form {...roleForm}>
            <form onSubmit={roleForm.handleSubmit(onSubmitRole)} className="space-y-4">
              <FormField
                control={roleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Sales Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={roleForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="dispatch">Dispatch</SelectItem>
                          <SelectItem value="admin">Administration</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="accounting">Accounting</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={roleForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Level</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 - Representative</SelectItem>
                          <SelectItem value="2">2 - Team Lead</SelectItem>
                          <SelectItem value="3">3 - Manager</SelectItem>
                          <SelectItem value="4">4 - Department Head</SelectItem>
                          <SelectItem value="5">5 - Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={roleForm.control}
                name="permissions"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Permissions</FormLabel>
                      <FormDescription>
                        Select the permissions for this role
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {allPermissions.map((permission) => (
                        <FormField
                          key={permission.id}
                          control={roleForm.control}
                          name="permissions"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={permission.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(permission.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, permission.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== permission.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {permission.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRoleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Role
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset User Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the user's password. They will need to create a new password on their next login.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPassword}>Reset Password</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}