import { useState } from "react";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Save, Settings2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminSettingsPage() {
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");
  const { toast } = useToast();
  
  // Fetch settings data
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/settings");
        if (!response.ok) throw new Error("Failed to fetch settings");
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive",
        });
        return {};
      }
    },
  });

  return (
    <AdminPageLayout title="System Settings" currentTab="settings">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
          <Button className="bg-[#025E73] hover:bg-[#025E73]/90">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Global System Configuration</CardTitle>
            <CardDescription>
              Configure global system settings and feature toggles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
              <TabsList className="mb-6 bg-white/50 p-1 rounded-md">
                <TabsTrigger value="general" className="text-md">
                  General
                </TabsTrigger>
                <TabsTrigger value="integrations" className="text-md">
                  Integrations
                </TabsTrigger>
                <TabsTrigger value="notifications" className="text-md">
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="branding" className="text-md">
                  Branding
                </TabsTrigger>
                <TabsTrigger value="feature-flags" className="text-md">
                  Feature Flags
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-0">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : error ? (
                  <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200">
                    <p className="font-medium">Failed to load settings</p>
                    <p className="text-sm mt-2">Please try again or contact system administrator.</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <p className="font-medium">General settings interface</p>
                    <p className="text-sm mt-2">This interface will allow you to configure global system settings and defaults.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="integrations" className="mt-0">
                <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <p className="font-medium">Integration settings interface</p>
                  <p className="text-sm mt-2">This interface will allow you to configure third-party integration settings.</p>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="mt-0">
                <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <p className="font-medium">Notification settings interface</p>
                  <p className="text-sm mt-2">This interface will allow you to configure notification templates and delivery settings.</p>
                </div>
              </TabsContent>

              <TabsContent value="branding" className="mt-0">
                <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <p className="font-medium">Branding settings interface</p>
                  <p className="text-sm mt-2">This interface will allow you to configure organization logo, colors, and other branding elements.</p>
                </div>
              </TabsContent>

              <TabsContent value="feature-flags" className="mt-0">
                <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <p className="font-medium">Feature flags interface</p>
                  <p className="text-sm mt-2">This interface will allow you to toggle specific features on or off across the system.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}