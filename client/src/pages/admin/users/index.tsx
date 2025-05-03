import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { getInitials } from '@/lib/utils';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  LockIcon, 
  ShieldCheck,
  Building2,
  LogIn
} from 'lucide-react';

// Define the User interface
interface User {
  id: number;
  active: boolean;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  role: {
    id: number;
    name: string;
    department: string;
    level: number;
    permissions?: string[];
  };
  isTeamLead?: boolean;
  lastLogin?: string;
  createdAt: string;
  profileImage?: string;
}

// Define the Role interface
interface Role {
  id: number;
  name: string;
  department: string;
  level: number;
  permissions?: string[];
}

interface Organization {
  id: number;
  name: string;
  code: string;
  contactName?: string;
}

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: 0,
    orgId: 1, // Default to the first organization
    isTeamLead: false,
    active: true
  });

  const { toast } = useToast();

  // Fetch users data
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/users');
      return await res.json();
    }
  });

  // Fetch roles data
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['/api/roles'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/roles');
      return await res.json();
    }
  });

  // Fetch organizations data
  const { data: organizations = [], isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/organizations');
      return await res.json();
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest('POST', '/api/users', userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsAddUserDialogOpen(false);
      setNewUser({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        roleId: 0,
        orgId: 1,
        isTeamLead: false,
        active: true
      });
      toast({
        title: 'User Created',
        description: 'The user has been created successfully.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user.',
        variant: 'destructive',
      });
    }
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number, isActive: boolean }) => {
      const res = await apiRequest('PATCH', `/api/users/${userId}`, { active: isActive });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'User Status Updated',
        description: 'User status has been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status.',
        variant: 'destructive',
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'User Deleted',
        description: 'User has been deleted successfully.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user.',
        variant: 'destructive',
      });
    }
  });

  // Filter users based on search term, role, and department
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role.id.toString() === filterRole;
    const matchesDepartment = filterDepartment === 'all' || user.role.department === filterDepartment;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  // Extract unique departments from roles
  const departmentsSet = new Set<string>();
  roles.forEach((role: Role) => {
    if (role.department) {
      departmentsSet.add(role.department);
    }
  });
  const departments = Array.from(departmentsSet);

  // Handle input changes for new user form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  // Handle select changes for new user form
  const handleSelectChange = (name: string, value: string) => {
    setNewUser({ ...newUser, [name]: value });
  };

  // Handle switch changes for new user form
  const handleSwitchChange = (name: string, checked: boolean) => {
    setNewUser({ ...newUser, [name]: checked });
  };

  // Handle form submission for creating a new user
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUser);
  };

  // Handle toggling user status
  const handleToggleUserStatus = (userId: number, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  // Handle deleting a user
  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <PageHeader
        title="User Management"
        subtitle="Manage users, roles, and permissions across your organization"
        icon={<Users className="h-6 w-6 text-[#F2A71B]" />}
      />

      <div className="mt-6 flex flex-col-reverse lg:flex-row gap-6">
        <div className="lg:w-3/4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>All Users</CardTitle>
                <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#025E73] hover:bg-[#025E73]/90 text-white">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account with specific role and permissions.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser}>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={newUser.firstName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={newUser.lastName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            name="username"
                            value={newUser.username}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={newUser.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            value={newUser.password}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="roleId">Role</Label>
                          <Select 
                            onValueChange={(value) => handleSelectChange('roleId', value)}
                            value={newUser.roleId.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role: Role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.name} ({role.department})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="orgId">Organization</Label>
                          <Select 
                            onValueChange={(value) => handleSelectChange('orgId', value)}
                            value={newUser.orgId.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization" />
                            </SelectTrigger>
                            <SelectContent>
                              {organizations.map((org: Organization) => (
                                <SelectItem key={org.id} value={org.id.toString()}>
                                  {org.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2 col-span-2">
                          <Switch
                            id="teamLead"
                            checked={newUser.isTeamLead}
                            onCheckedChange={(checked) => handleSwitchChange('isTeamLead', checked)}
                          />
                          <Label htmlFor="teamLead">Assign as Team Lead</Label>
                        </div>
                        <div className="flex items-center space-x-2 col-span-2">
                          <Switch
                            id="active"
                            checked={newUser.active}
                            onCheckedChange={(checked) => handleSwitchChange('active', checked)}
                          />
                          <Label htmlFor="active">Active Account</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddUserDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createUserMutation.isPending}
                          className="bg-[#025E73] hover:bg-[#025E73]/90 text-white"
                        >
                          {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filterDepartment}
                    onValueChange={setFilterDepartment}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterRole}
                    onValueChange={setFilterRole}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map((role: Role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoadingUsers ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#025E73]"></div>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                              No users found matching your criteria
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user: User) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={user.profileImage} />
                                    <AvatarFallback className="bg-[#025E73] text-white">
                                      {getInitials(user.firstName, user.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {user.isTeamLead && (
                                    <ShieldCheck className="h-4 w-4 text-[#F2A71B]" />
                                  )}
                                  <span>{user.role.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={`
                                    ${user.role.department === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-300' : ''}
                                    ${user.role.department === 'sales' ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}
                                    ${user.role.department === 'dispatch' ? 'bg-green-100 text-green-800 border-green-300' : ''}
                                    ${user.role.department === 'finance' ? 'bg-amber-100 text-amber-800 border-amber-300' : ''}
                                    ${user.role.department === 'hr' ? 'bg-red-100 text-red-800 border-red-300' : ''}
                                    ${user.role.department === 'marketing' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : ''}
                                  `}
                                >
                                  {user.role.department}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.active ? 'default' : 'secondary'}>
                                  {user.active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(user.createdAt)}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => console.log('Edit user:', user.id)}
                                      className="cursor-pointer"
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit user
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => console.log('Reset password:', user.id)}
                                      className="cursor-pointer"
                                    >
                                      <LockIcon className="h-4 w-4 mr-2" />
                                      Reset password
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleToggleUserStatus(user.id, user.active)}
                                      className="cursor-pointer"
                                    >
                                      <LogIn className="h-4 w-4 mr-2" />
                                      {user.active ? 'Deactivate' : 'Activate'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="text-red-600 cursor-pointer"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete user
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    Showing {filteredUsers.length} of {users.length} users
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:w-1/4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-[#F2A71B]" />
                  <span className="font-medium">Organizations</span>
                </div>
                <div>
                  {organizations.length === 0 ? (
                    <div className="text-sm text-gray-500">No organizations found</div>
                  ) : (
                    <ul className="space-y-2 ml-8">
                      {organizations.map((org: Organization) => (
                        <li key={org.id} className="text-sm">
                          {org.name} 
                          {org.contactName && <span className="text-xs text-gray-500 ml-2">({org.contactName})</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[#F2A71B]" />
                  <span className="font-medium">Roles by Department</span>
                </div>
                <div>
                  {departments.map((department) => (
                    <div key={department} className="mb-3">
                      <Badge 
                        variant="outline" 
                        className={`
                          ${department === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-300' : ''}
                          ${department === 'sales' ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}
                          ${department === 'dispatch' ? 'bg-green-100 text-green-800 border-green-300' : ''}
                          ${department === 'finance' ? 'bg-amber-100 text-amber-800 border-amber-300' : ''}
                          ${department === 'hr' ? 'bg-red-100 text-red-800 border-red-300' : ''}
                          ${department === 'marketing' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : ''}
                          mb-2
                        `}
                      >
                        {department}
                      </Badge>
                      <ul className="space-y-1 ml-6 text-sm">
                        {roles
                          .filter((role: Role) => role.department === department)
                          .sort((a: Role, b: Role) => b.level - a.level)
                          .map((role: Role) => (
                            <li key={role.id} className="flex items-center gap-2">
                              <span>{role.name}</span>
                              <span className="text-xs text-gray-500">(Level {role.level})</span>
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>User Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Users</span>
                  <span className="font-medium">{users.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="font-medium">{users.filter((user: User) => user.active).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Team Leads</span>
                  <span className="font-medium">{users.filter((user: User) => user.isTeamLead).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Departments</span>
                  <span className="font-medium">{departments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Roles</span>
                  <span className="font-medium">{roles.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}