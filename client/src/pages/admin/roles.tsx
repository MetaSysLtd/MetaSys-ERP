import { useState } from "react";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRolesPage() {
  const { toast } = useToast();
  
  // Fetch roles data
  const { data: roles, isLoading, error } = useQuery({
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

  return (
    <AdminPageLayout title="Role Management" currentTab="roles">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Role Management</h1>
          <Button className="bg-[#025E73] hover:bg-[#025E73]/90">
            <Plus className="h-4 w-4 mr-2" />
            Create New Role
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>System Roles</CardTitle>
            <CardDescription>
              Create and manage roles with specific permission sets
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
                <p className="font-medium">Failed to load roles</p>
                <p className="text-sm mt-2">Please try again or contact system administrator.</p>
              </div>
            ) : (
              <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                <p className="font-medium">Role management interface</p>
                <p className="text-sm mt-2">This interface will allow you to create, edit and delete roles with specific permission sets.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}