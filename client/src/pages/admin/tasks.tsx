import { useState } from "react";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Clock, CheckCircle2, PlayCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminTasksPage() {
  const { toast } = useToast();
  
  // Fetch scheduled tasks data
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["/api/admin/tasks"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/tasks");
        if (!response.ok) throw new Error("Failed to fetch tasks");
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        toast({
          title: "Error",
          description: "Failed to load scheduled tasks. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  return (
    <AdminPageLayout title="Scheduled Tasks" currentTab="tasks">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Scheduled Tasks</h1>
          <div className="flex space-x-2">
            <Button variant="outline" className="border-[#025E73] text-[#025E73]">
              <PlayCircle className="h-4 w-4 mr-2" />
              Run Selected
            </Button>
            <Button className="bg-[#025E73] hover:bg-[#025E73]/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>System Scheduled Tasks</CardTitle>
            <CardDescription>
              Manage and monitor automation tasks
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
                <p className="font-medium">Failed to load scheduled tasks</p>
                <p className="text-sm mt-2">Please try again or contact system administrator.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-md border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-[#025E73] mr-3" />
                    <div>
                      <p className="font-medium">Daily Report Generation</p>
                      <p className="text-sm text-gray-500">Runs at 18:00 daily</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500">Active</Badge>
                </div>
                
                <div className="p-4 rounded-md border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-[#025E73] mr-3" />
                    <div>
                      <p className="font-medium">Weekly Invoice Target Check</p>
                      <p className="text-sm text-gray-500">Runs at 23:00 on Fridays</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500">Active</Badge>
                </div>
                
                <div className="p-4 rounded-md border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-[#025E73] mr-3" />
                    <div>
                      <p className="font-medium">Monthly Report Generation</p>
                      <p className="text-sm text-gray-500">Runs at 01:00 on the 1st of each month</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500">Active</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}