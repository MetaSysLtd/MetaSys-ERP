import { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserMinus, UserPlus, Settings2, Lock, Database, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const { toast } = useToast();

  // Fetch users data
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/users");
        if (!response.ok) throw new Error("Failed to fetch users");
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // Fetch roles data
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/admin/roles"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/roles");
        if (!response.ok) throw new Error("Failed to fetch roles");
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        toast({
          title: "Error",
          description: "Failed to load roles. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // Fetch organizations data
  const { data: organizations, isLoading: organizationsLoading } = useQuery({
    queryKey: ["/api/admin/organizations"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/organizations");
        if (!response.ok) throw new Error("Failed to fetch organizations");
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
        toast({
          title: "Error",
          description: "Failed to load organizations. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // Count active users
  const activeUsers = users?.filter((user: any) => user.active)?.length || 0;
  const totalUsers = users?.length || 0;
  
  // Count roles by level
  const adminRoles = roles?.filter((role: any) => role.level >= 4)?.length || 0;
  const managerRoles = roles?.filter((role: any) => role.level === 3)?.length || 0;
  const userRoles = roles?.filter((role: any) => role.level <= 2)?.length || 0;

  // Count active organizations
  const activeOrgs = organizations?.filter((org: any) => org.active)?.length || 0;
  const totalOrgs = organizations?.length || 0;

  return (
    <PageLayout title="Admin Management">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* User Stats Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-[#025E73]" />
                User Management
              </CardTitle>
              <CardDescription>Manage system users</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{activeUsers} / {totalUsers}</div>
                  <p className="text-sm text-gray-500">Active Users / Total Users</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Roles Stats Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Lock className="h-5 w-5 mr-2 text-[#025E73]" />
                Role Management
              </CardTitle>
              <CardDescription>Manage access roles</CardDescription>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-sm">Admin Roles:</span>
                    <span className="font-medium">{adminRoles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Manager Roles:</span>
                    <span className="font-medium">{managerRoles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">User Roles:</span>
                    <span className="font-medium">{userRoles}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Stats Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Database className="h-5 w-5 mr-2 text-[#025E73]" />
                Organization Management
              </CardTitle>
              <CardDescription>Manage organizations</CardDescription>
            </CardHeader>
            <CardContent>
              {organizationsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{activeOrgs} / {totalOrgs}</div>
                  <p className="text-sm text-gray-500">Active Orgs / Total Orgs</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 bg-white/50 p-1 rounded-md">
            <TabsTrigger value="users" className="text-md">
              <UserPlus className="h-4 w-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="text-md">
              <Lock className="h-4 w-4 mr-2" /> Roles
            </TabsTrigger>
            <TabsTrigger value="organizations" className="text-md">
              <Database className="h-4 w-4 mr-2" /> Organizations
            </TabsTrigger>
            <TabsTrigger value="permissions" className="text-md">
              <Shield className="h-4 w-4 mr-2" /> Permissions
            </TabsTrigger>
            <TabsTrigger value="system" className="text-md">
              <Settings2 className="h-4 w-4 mr-2" /> System Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, reset passwords, and adjust user permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <p className="font-medium">User management interface will be loaded here</p>
                    <p className="text-sm mt-2">This will include user listing, role assignment, activation controls, and password management.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Role Management</CardTitle>
                <CardDescription>
                  Create and manage roles with specific permission sets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rolesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <p className="font-medium">Role management interface will be loaded here</p>
                    <p className="text-sm mt-2">This will include role creation, permission assignment, and role hierarchy management.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizations" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Organization Management</CardTitle>
                <CardDescription>
                  Manage organizations and their module access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {organizationsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <p className="font-medium">Organization management interface will be loaded here</p>
                    <p className="text-sm mt-2">This will include organization creation, module activation, and organization settings.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Permission Management</CardTitle>
                <CardDescription>
                  Configure detailed permissions across the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <p className="font-medium">Permission management interface will be loaded here</p>
                  <p className="text-sm mt-2">This will include fine-grained permission settings for features, actions, and data access across modules.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure global system settings and defaults
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <p className="font-medium">System settings interface will be loaded here</p>
                  <p className="text-sm mt-2">This will include global configurations, default values, system maintenance options, and metadata management.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}