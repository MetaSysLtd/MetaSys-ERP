import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PencilIcon, PlusCircle, Building, User, ShieldCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form validation schema for user editing
const userEditSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phoneNumber: z.string().nullable().optional(),
  orgId: z.number().nullable().optional(),
  active: z.boolean().default(true)
});

// Form validation schema for user organization assignment
const userOrgAssignmentSchema = z.object({
  userId: z.number(),
  organizationIds: z.array(z.number())
});

export default function UsersPage() {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isOrgAssignmentDialogOpen, setIsOrgAssignmentDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedOrgs, setSelectedOrgs] = useState<number[]>([]);

  // Form for edit user
  const userForm = useForm({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: null,
      orgId: null,
      active: true
    },
  });

  // Form for organization assignments
  const orgAssignmentForm = useForm({
    resolver: zodResolver(userOrgAssignmentSchema),
    defaultValues: {
      userId: 0,
      organizationIds: []
    }
  });

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return await response.json();
    },
  });

  // Fetch roles
  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/roles");
      return await response.json();
    },
  });

  // Fetch organizations
  const { data: organizations, isLoading: isLoadingOrganizations } = useQuery({
    queryKey: ["/api/organizations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/organizations");
      return await response.json();
    },
  });

  // Fetch user organizations
  const { data: userOrganizations, isLoading: isLoadingUserOrgs, refetch: refetchUserOrgs } = useQuery({
    queryKey: ["/api/users/organizations", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const response = await apiRequest("GET", `/api/users/${currentUser.id}/organizations`);
      return await response.json();
    },
    enabled: !!currentUser?.id
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof userEditSchema> }) => {
      const response = await apiRequest("PUT", `/api/users/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated successfully",
        description: "User details have been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      userForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user organizations mutation
  const updateUserOrgsMutation = useMutation({
    mutationFn: async ({ userId, organizationIds }: { userId: number, organizationIds: number[] }) => {
      const response = await apiRequest("POST", `/api/users/${userId}/organizations`, { organizationIds });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Organizations updated",
        description: "User's organization memberships have been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/organizations", currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsOrgAssignmentDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update organizations",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle edit button click
  const handleEditUser = (user: any) => {
    setCurrentUser(user);
    userForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      orgId: user.orgId,
      active: user.active,
    });
    setIsEditDialogOpen(true);
  };

  // Handle organization assignment button click
  const handleManageOrgs = (user: any) => {
    setCurrentUser(user);
    setIsOrgAssignmentDialogOpen(true);
    
    // Will be populated once userOrganizations data is loaded
    setSelectedOrgs([]);
  };

  // Handle edit form submission
  const onEditSubmit = (data: z.infer<typeof userEditSchema>) => {
    if (currentUser) {
      updateUserMutation.mutate({ id: currentUser.id, data });
    }
  };

  // Handle organization assignment form submission
  const onOrgAssignmentSubmit = () => {
    if (currentUser) {
      updateUserOrgsMutation.mutate({ 
        userId: currentUser.id, 
        organizationIds: selectedOrgs 
      });
    }
  };

  // Handle checkbox change for organization assignment
  const handleOrgCheckboxChange = (orgId: number, checked: boolean) => {
    if (checked) {
      setSelectedOrgs(prev => [...prev, orgId]);
    } else {
      setSelectedOrgs(prev => prev.filter(id => id !== orgId));
    }
  };

  // Effect to update selected orgs when userOrganizations data loads
  useEffect(() => {
    if (userOrganizations && userOrganizations.length > 0) {
      setSelectedOrgs(userOrganizations.map((org: any) => org.id));
    }
  }, [userOrganizations]);

  // Function to get role name by ID
  const getRoleName = (roleId: number) => {
    if (!roles) return "Unknown";
    const role = roles.find((r: any) => r.id === roleId);
    return role ? role.name : "Unknown";
  };

  // Function to get organization name by ID
  const getOrgName = (orgId: number | null) => {
    if (!orgId || !organizations) return "None";
    const org = organizations.find((o: any) => o.id === orgId);
    return org ? org.name : "Unknown";
  };

  return (
    <>
      <Helmet>
        <title>User Management | MetaSys ERP</title>
      </Helmet>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage all users and their organization memberships in your MetaSys ERP system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers || isLoadingRoles || isLoadingOrganizations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Primary Organization</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.orgId ? (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {getOrgName(user.orgId)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center w-fit gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          {getRoleName(user.roleId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span 
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditUser(user)}
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleManageOrgs(user)}
                        >
                          <Building className="h-4 w-4 mr-1" />
                          Orgs
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={userForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
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
                      <FormLabel>Last Name *</FormLabel>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="orgId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Organization</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                      value={field.value ? String(field.value) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select primary organization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizations?.map((org: any) => (
                          <SelectItem key={org.id} value={String(org.id)}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>The user's default organization</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Inactive users cannot log in to the system
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="reset"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending || !userForm.formState.isValid}
                >
                  {updateUserMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Organization Assignment Dialog */}
      <Dialog open={isOrgAssignmentDialogOpen} onOpenChange={setIsOrgAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Organizations</DialogTitle>
            <DialogDescription>
              {currentUser ? `Assign ${currentUser.firstName} ${currentUser.lastName} to multiple organizations` : 'Assign user to multiple organizations'}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingUserOrgs ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="border rounded-md">
                  <div className="p-3 border-b bg-muted/50">
                    <h3 className="text-sm font-medium">Organization Memberships</h3>
                    <p className="text-sm text-muted-foreground">Select all organizations this user should belong to</p>
                  </div>
                  <ScrollArea className="h-72 p-4">
                    <div className="space-y-3">
                      {organizations?.map((org: any) => (
                        <div key={org.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`org-${org.id}`} 
                            checked={selectedOrgs.includes(org.id)}
                            onCheckedChange={(checked) => handleOrgCheckboxChange(org.id, checked === true)}
                            disabled={!org.active}
                          />
                          <label
                            htmlFor={`org-${org.id}`}
                            className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center ${!org.active ? 'text-muted-foreground' : ''}`}
                          >
                            {org.name}
                            {org.id === currentUser?.orgId && (
                              <Badge variant="outline" className="ml-2 text-xs">Primary</Badge>
                            )}
                            {!org.active && (
                              <Badge variant="outline" className="ml-2 text-xs bg-red-50">Inactive</Badge>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsOrgAssignmentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={onOrgAssignmentSubmit}
                  disabled={updateUserOrgsMutation.isPending}
                >
                  {updateUserOrgsMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}