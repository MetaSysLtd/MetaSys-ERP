import { useState } from "react";
import { useUserManagement } from "@/hooks/use-user-management";
import { User, Role, Organization } from "@shared/schema";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Plus, UserPlus, UserCog, Building, Users } from "lucide-react";
import { UserForm } from "@/components/admin/users/user-form";
import { UserOrganizationsForm } from "@/components/admin/users/user-organizations-form";
import { UserRolePermissionsForm } from "@/components/admin/users/user-role-permissions-form";

export default function UsersManagementPage() {
  const [selectedTab, setSelectedTab] = useState("all-users");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showOrgAccessDialog, setShowOrgAccessDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);

  const {
    users,
    roles,
    organizations,
    isLoadingUsers,
    isLoadingRoles,
    isLoadingOrganizations,
  } = useUserManagement();

  // Filter users based on search query
  const filteredUsers = users?.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const getUserRole = (user: User): Role | undefined => {
    return roles?.find((role) => role.id === user.roleId);
  };

  const getUserOrganization = (user: User): Organization | undefined => {
    return organizations?.find((org) => org.id === user.orgId);
  };

  if (isLoadingUsers || isLoadingRoles || isLoadingOrganizations) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-12 h-12 text-brandTeal animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-brandNavy">User Management</h1>
          <p className="text-slate-600">
            Manage users, roles, permissions, and organizational access
          </p>
        </div>
        <Button
          className="bg-brandTeal hover:bg-brandTeal/90 flex gap-2 items-center"
          onClick={() => setShowAddUserDialog(true)}
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </Button>
      </div>

      <Tabs defaultValue="all-users" className="w-full" onValueChange={setSelectedTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList className="bg-brandNavy/10">
            <TabsTrigger 
              value="all-users" 
              className="data-[state=active]:bg-brandYellow data-[state=active]:text-brandNavy"
            >
              All Users
            </TabsTrigger>
            <TabsTrigger 
              value="organizations" 
              className="data-[state=active]:bg-brandYellow data-[state=active]:text-brandNavy"
            >
              Organizations
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              className="data-[state=active]:bg-brandYellow data-[state=active]:text-brandNavy"
            >
              Roles & Permissions
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </div>

        <TabsContent value="all-users">
          <Card>
            <CardHeader>
              <CardTitle className="text-brandTeal">User Directory</CardTitle>
              <CardDescription>
                View and manage all users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username / Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>
                        <div>{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-brandNavy/5 border-brandNavy/20">
                          {getUserRole(user)?.name || "No Role"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getUserOrganization(user)?.name || "None"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.active
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {user.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setShowEditUserDialog(true);
                              }}
                            >
                              <UserCog className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setShowOrgAccessDialog(true);
                              }}
                            >
                              <Building className="w-4 h-4 mr-2" />
                              Manage Organization Access
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setShowPermissionsDialog(true);
                              }}
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Role & Permissions
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredUsers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                        No users found matching your search criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-gray-500">
                Total users: {filteredUsers?.length || 0}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle className="text-brandTeal">Organizations</CardTitle>
              <CardDescription>
                Manage organizations and user associations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organizations?.map((org) => (
                  <Card key={org.id} className="border-brandNavy/10 hover:border-brandTeal transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between items-center">
                        <span>{org.name}</span>
                        <Badge variant={org.active ? "default" : "destructive"} className="ml-2">
                          {org.active ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">{org.code}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      {org.address && (
                        <div className="mt-1 text-sm">
                          <strong>Address:</strong> {org.address}
                        </div>
                      )}
                      {org.contactName && (
                        <div className="mt-1 text-sm">
                          <strong>Contact:</strong> {org.contactName}
                        </div>
                      )}
                      {org.contactEmail && (
                        <div className="mt-1 text-sm">
                          <strong>Email:</strong> {org.contactEmail}
                        </div>
                      )}
                      {org.contactPhone && (
                        <div className="mt-1 text-sm">
                          <strong>Phone:</strong> {org.contactPhone}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        Manage Users
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="text-brandTeal">Roles & Permissions</CardTitle>
              <CardDescription>
                Manage system roles and their associated permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles?.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.department}</TableCell>
                      <TableCell>{role.level}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission, index) => (
                            <Badge key={index} variant="outline" className="bg-brandYellow/10 border-brandYellow/30 text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {users?.filter((user) => user.roleId === role.id).length || 0}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with role and organization assignment
            </DialogDescription>
          </DialogHeader>
          <UserForm 
            roles={roles || []}
            organizations={organizations || []}
            onClose={() => setShowAddUserDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and status
              </DialogDescription>
            </DialogHeader>
            <UserForm 
              user={selectedUser}
              roles={roles || []}
              organizations={organizations || []}
              onClose={() => setShowEditUserDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Organization Access Dialog */}
      {selectedUser && (
        <Dialog open={showOrgAccessDialog} onOpenChange={setShowOrgAccessDialog}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Manage Organization Access</DialogTitle>
              <DialogDescription>
                Control which organizations this user can access
              </DialogDescription>
            </DialogHeader>
            <UserOrganizationsForm 
              user={selectedUser}
              organizations={organizations || []}
              onClose={() => setShowOrgAccessDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Permissions Dialog */}
      {selectedUser && (
        <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Role & Permissions</DialogTitle>
              <DialogDescription>
                Manage user role and specific permissions
              </DialogDescription>
            </DialogHeader>
            <UserRolePermissionsForm 
              user={selectedUser}
              roles={roles || []}
              onClose={() => setShowPermissionsDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}