import { useState } from "react";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCommissionsPage() {
  const { toast } = useToast();
  
  // Fetch commissions data
  const { data: commissions, isLoading, error } = useQuery({
    queryKey: ["/api/admin/commissions"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/commissions");
        if (!response.ok) throw new Error("Failed to fetch commissions");
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch commissions:", error);
        toast({
          title: "Error",
          description: "Failed to load commissions. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  return (
    <AdminPageLayout title="Commission Management" currentTab="commissions">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Commission Policies</h1>
          <Button className="bg-[#025E73] hover:bg-[#025E73]/90">
            <Plus className="h-4 w-4 mr-2" />
            Create New Policy
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Global Commission Policies</CardTitle>
            <CardDescription>
              Manage commission structures and payout policies
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
                <p className="font-medium">Failed to load commission policies</p>
                <p className="text-sm mt-2">Please try again or contact system administrator.</p>
              </div>
            ) : (
              <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                <p className="font-medium">Commission policy management interface</p>
                <p className="text-sm mt-2">This interface will allow you to create, edit and manage commission policies and view historical payouts.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}