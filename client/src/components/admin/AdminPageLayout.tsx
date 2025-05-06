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
            <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Management</span>
                <span className="sm:hidden">Manage</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="commissions" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Commissions</span>
                <span className="sm:hidden">Comm.</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <BellRing className="h-4 w-4" />
                <span>Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                <span>Reports</span>
              </TabsTrigger>
              <TabsTrigger value="organizations" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Organizations</span>
                <span className="sm:hidden">Orgs</span>
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Roles</span>
              </TabsTrigger>
              <TabsTrigger value="bugs" className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                <span>Bugs</span>
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