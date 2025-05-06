import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserManagement } from "@/components/dashboard/UserManagement";
import { OrgHierarchy } from "@/components/dashboard/OrgHierarchy";
import { OrganizationModules } from "@/components/dashboard/OrganizationModules";
import { SystemHealth } from "@/components/dashboard/SystemHealth";
import { ScheduledTasks } from "@/components/dashboard/ScheduledTasks";
import TopCommissionEarners from "@/components/dashboard/TopCommissionEarners";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Loader2, Settings, User, UserPlus, Shield, RefreshCw, Server, BellRing, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import AdminPageLayout from "@/components/admin/AdminPageLayout";

export default function AdminDashboard() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch admin dashboard data
  const { data: adminData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/dashboard', dateRange],
    queryFn: async () => {
      try {
        console.log('Fetching admin dashboard data');
        const response = await fetch('/api/admin/dashboard', {
          credentials: 'include', // Important for auth cookies
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        console.log('Admin dashboard API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Admin dashboard API error:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const responseData = await response.json();
        console.log('Admin dashboard data received:', responseData);
        return responseData;
      } catch (err) {
        console.error('Admin dashboard fetch error:', err);
        throw new Error('Failed to load admin dashboard data.');
      }
    },
    // Don't refetch on window focus for admin data
    refetchOnWindowFocus: false,
  });

  // Mock data for scheduled tasks
  const scheduledTasks = [
    {
      id: 'task-1',
      name: 'Daily Database Backup',
      description: 'Automated backup of all production databases',
      status: 'completed' as const,
      schedule: '0 0 * * *', // Cron expression for midnight every day
      lastRun: 'Today at 12:00 AM',
      nextRun: 'Tomorrow at 12:00 AM',
      frequency: 'daily' as const,
      duration: '15m 42s',
      type: 'backup' as const
    },
    {
      id: 'task-2',
      name: 'Data Synchronization',
      description: 'Sync data between primary and replica databases',
      status: 'running' as const,
      schedule: '*/30 * * * *', // Every 30 minutes
      lastRun: 'Today at 1:30 PM',
      nextRun: 'Today at 2:00 PM',
      frequency: 'hourly' as const,
      progress: 78,
      type: 'data-sync' as const
    },
    {
      id: 'task-3',
      name: 'Weekly Analytics Report',
      description: 'Generate and email weekly analytics report to management',
      status: 'scheduled' as const,
      schedule: '0 8 * * 1', // 8 AM on Mondays
      lastRun: 'April 15, 2025',
      nextRun: 'April 22, 2025',
      frequency: 'weekly' as const,
      type: 'report' as const
    },
    {
      id: 'task-4',
      name: 'Monthly Invoice Cleanup',
      description: 'Archive old invoices and optimize invoice tables',
      status: 'paused' as const,
      schedule: '0 0 1 * *', // Midnight on the 1st of each month
      lastRun: 'April 1, 2025',
      nextRun: 'May 1, 2025',
      frequency: 'monthly' as const,
      type: 'maintenance' as const
    },
    {
      id: 'task-5',
      name: 'Lead Notification Dispatcher',
      description: 'Send notifications for unassigned leads',
      status: 'failed' as const,
      schedule: '0 9-17 * * 1-5', // Every hour from 9 AM to 5 PM, Monday to Friday
      lastRun: 'Today at 12:00 PM',
      nextRun: 'Today at 1:00 PM',
      frequency: 'hourly' as const,
      type: 'notification' as const
    }
  ];

  // Mock data for users
  const users = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@metasys.com',
      role: 'Sales Manager',
      department: 'Sales',
      status: 'active' as const
    },
    {
      id: 2,
      name: 'Emma Wilson',
      email: 'emma.wilson@metasys.com',
      role: 'Dispatcher',
      department: 'Dispatch',
      status: 'active' as const
    },
    {
      id: 3,
      name: 'Michael Brown',
      email: 'michael.brown@metasys.com',
      role: 'Sales Representative',
      department: 'Sales',
      status: 'active' as const
    },
    {
      id: 4,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@metasys.com',
      role: 'HR Manager',
      department: 'HR',
      status: 'inactive' as const
    },
    {
      id: 5,
      name: 'Robert Davis',
      email: 'robert.davis@metasys.com',
      role: 'Finance Manager',
      department: 'Finance',
      status: 'active' as const
    }
  ];

  // Handle actions
  const handleRefreshSystemHealth = () => {
    toast({
      title: "Refreshing system health data",
      description: "Fetching latest metrics from system...",
    });

    // Simulate refetch
    setTimeout(() => {
      refetch();
      toast({
        title: "System health refreshed",
        description: "Latest system metrics have been loaded",
      });
    }, 1500);
  };

  const handleTaskAction = (action: string, taskId: string) => {
    const taskName = scheduledTasks.find(t => t.id === taskId)?.name || 'Unknown task';

    toast({
      title: `Task ${action}`,
      description: `${action} task: ${taskName}`,
    });
  };

  const handleUserAction = (action: string, userId: number) => {
    const userName = users.find(u => u.id === userId)?.name || 'Unknown user';

    toast({
      title: `User ${action}`,
      description: `${action} user: ${userName}`,
    });
  };

  // Check if user has admin permissions
  if (role && role.level < 4) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              You don't have permission to access the Admin Dashboard. 
              This area is restricted to administrators only.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/')}
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg text-primary">Loading admin dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              {error instanceof Error ? error.message : "Failed to load admin dashboard data. Please try again later."}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminPageLayout 
      title="Admin Dashboard" 
      subtitle="Manage system settings and monitor performance"
      currentTab="dashboard"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0 w-full md:w-auto">
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onSelect={setDateRange}
            className="w-full md:w-auto"
          />
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 mb-6 gap-2">
          <TabsTrigger value="overview" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
            <Server className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline text-xs md:text-sm">System Overview</span>
            <span className="sm:hidden text-xs">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline text-xs md:text-sm">User Management</span>
            <span className="sm:hidden text-xs">Users</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline text-xs md:text-sm">Organization</span>
            <span className="sm:hidden text-xs">Org</span>
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline text-xs md:text-sm">Commissions</span>
            <span className="sm:hidden text-xs">Comm.</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3">
            <BellRing className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline text-xs md:text-sm">Scheduled Tasks</span>
            <span className="sm:hidden text-xs">Tasks</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SystemHealth 
              onRefresh={handleRefreshSystemHealth}
            />

            <Card className="shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Security Overview</CardTitle>
                <CardDescription>System security status and recent events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-md">
                    <div className="flex items-center gap-3">
                      <Shield className="h-6 w-6 text-green-500" />
                      <div>
                        <div className="font-medium">System Security Status</div>
                        <div className="text-sm text-green-700">All systems secure</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs px-3 py-1 h-8 md:h-9 md:text-sm md:px-4">
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3">Recent Security Events</h3>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 border-l-2 border-yellow-500">
                        <div className="font-medium">Failed Login Attempts</div>
                        <div className="text-muted-foreground">3 attempts for user: sarah.johnson</div>
                        <div className="text-xs text-muted-foreground">Today at 10:23 AM</div>
                      </div>
                      <div className="p-2 border-l-2 border-blue-500">
                        <div className="font-medium">Password Changed</div>
                        <div className="text-muted-foreground">User: john.smith</div>
                        <div className="text-xs text-muted-foreground">Yesterday at 3:45 PM</div>
                      </div>
                      <div className="p-2 border-l-2 border-green-500">
                        <div className="font-medium">Security Scan Completed</div>
                        <div className="text-muted-foreground">No vulnerabilities detected</div>
                        <div className="text-xs text-muted-foreground">April 17, 2025</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <ScheduledTasks 
            tasks={scheduledTasks}
            onStartTask={(id) => handleTaskAction('started', id)}
            onPauseTask={(id) => handleTaskAction('paused', id)}
            onRestartTask={(id) => handleTaskAction('restarted', id)}
            onViewTaskDetails={(id) => handleTaskAction('viewed', id)}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement 
            users={users}
            onAddUser={() => handleUserAction('added', 0)}
            onEditUser={(id) => handleUserAction('edited', id)}
            onLockUser={(id) => handleUserAction('locked', id)}
            onUnlockUser={(id) => handleUserAction('unlocked', id)}
            onResetPassword={(id) => handleUserAction('reset password for', id)}
          />
        </TabsContent>

        <TabsContent value="organization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OrganizationModules />

            <OrgHierarchy 
              onAddNode={(id, type) => {
                toast({
                  title: "Add Organization Node",
                  description: `Adding new ${type} under ${id}`,
                });
              }}
              onViewDetails={(id) => {
                toast({
                  title: "View Organization Details",
                  description: `Viewing details for ${id}`,
                });
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create a dynamically-generated set of commission widgets for all departments */}
            {['sales', 'dispatch', 'hr', 'finance', 'marketing'].map((dept) => (
              <TopCommissionEarners 
                key={dept}
                limit={5} 
                type={dept as any}
                className="col-span-1" 
              />
            ))}

            <TopCommissionEarners 
              limit={5} 
              type="all" 
              className="col-span-1 md:col-span-2 lg:col-span-3" 
            />
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Commission Rules Management</CardTitle>
              <CardDescription>Configure and manage commission calculation rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button 
                  onClick={() => navigate('/admin/commissions')}
                  className="flex items-center gap-1 sm:gap-2 text-xs md:text-sm px-3 py-1 h-8 md:h-9 md:px-4"
                >
                  <Settings className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Configure Commission Rules</span>
                  <span className="sm:hidden">Config Rules</span>
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  The commission calculation rules determine how commissions are calculated for 
                  all departments including sales, dispatch, HR, finance, and marketing personnel. 
                  Click the button above to configure these rules and set tiers based on performance 
                  metrics for each department.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Scheduled Tasks Management</CardTitle>
              <CardDescription>Manage system maintenance and automated tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduledTasks 
                tasks={scheduledTasks}
                onStartTask={(id) => handleTaskAction('started', id)}
                onPauseTask={(id) => handleTaskAction('paused', id)}
                onRestartTask={(id) => handleTaskAction('restarted', id)}
                onViewTaskDetails={(id) => handleTaskAction('viewed', id)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}