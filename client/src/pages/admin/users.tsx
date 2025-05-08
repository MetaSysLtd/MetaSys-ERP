import { useState } from "react";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersPage() {
  const { toast } = useToast();
  
  // Fetch users data
  const { data: users, isLoading, error } = useQuery({
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

  return (
    <AdminPageLayout title="User Management" currentTab="users">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <Button className="bg-[#025E73] hover:bg-[#025E73]/90">
            <UserPlus className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
            <CardDescription>
              Manage user accounts, reset passwords, and adjust user permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : error ? (
              <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200">
                <p className="font-medium">Failed to load users</p>
                <p className="text-sm mt-2">Please try again or contact system administrator.</p>
              </div>
            ) : (
              <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                <p className="font-medium">User management interface</p>
                <p className="text-sm mt-2">This interface will allow you to manage user accounts, reset passwords, and adjust user permissions.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}