import { useState, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Server,
  Users,
  Settings,
  DollarSign,
  BellRing,
  Shield,
  LineChart,
  Building,
  ListChecks
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";

interface AdminPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  currentTab?: string;
}

export default function AdminPageLayout({
  children,
  title,
  subtitle = "System administration and configuration",
  currentTab
}: AdminPageLayoutProps) {
  const [, navigate] = useLocation();
  
  // Get the path from the URL to determine active tab
  const [location] = useLocation();
  const activeTab = currentTab || location.split("/").pop() || "dashboard";

  const handleTabChange = (value: string) => {
    const tabRoutes: Record<string, string> = {
      dashboard: "/admin",
      management: "/admin/management",
      users: "/admin/users",
      roles: "/admin/roles",
      organizations: "/admin/organizations",
      commissions: "/admin/commissions",
      settings: "/admin/settings",
      tasks: "/admin/tasks",
      reports: "/admin/reports",
      bugs: "/admin/bugs"
    };
    
    navigate(tabRoutes[value] || "/admin");
  };

  return (
    <PageLayout title={title} description={subtitle}>
      <Card className="mb-6 border-[#025E73]/20">
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-2">
              <TabsTrigger value="dashboard" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
                <Server className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-xs md:text-sm">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-xs md:text-sm">Management</span>
                <span className="sm:hidden text-xs">Manage</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs md:text-sm">Users</span>
              </TabsTrigger>
              <TabsTrigger value="commissions" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-xs md:text-sm">Commissions</span>
                <span className="sm:hidden text-xs">Comm.</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs md:text-sm">Settings</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsList className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2">
              <TabsTrigger value="tasks" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
                <BellRing className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs md:text-sm">Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
                <LineChart className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs md:text-sm">Reports</span>
              </TabsTrigger>
              <TabsTrigger value="organizations" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
                <Building className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-xs md:text-sm">Organizations</span>
                <span className="sm:hidden text-xs">Orgs</span>
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs md:text-sm">Roles</span>
              </TabsTrigger>
              <TabsTrigger value="bugs" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
                <ListChecks className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs md:text-sm">Bugs</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mb-8">
        {children}
      </div>
    </PageLayout>
  );
}