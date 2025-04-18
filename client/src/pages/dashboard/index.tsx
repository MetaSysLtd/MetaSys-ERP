import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TeamPerformance } from "@/components/dashboard/TeamPerformance";
import { ActivityFeed, Activity } from "@/components/dashboard/ActivityFeed";
import { LeadsTable, Lead } from "@/components/dashboard/LeadsTable";
import { CommissionTracking } from "@/components/dashboard/CommissionTracking";
import { NewLeadModal } from "@/components/modals/NewLeadModal";
import { getPrevMonthsData, formatCurrency } from "@/lib/utils";
import { Users, CheckCircle, UserCheck, DollarSign, Truck, FileText, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard"],
    refetchInterval: 300000, // Refetch every 5 minutes
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Loading dashboard...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch your data.</p>
        </div>
      </div>
    );
  }
  
  if (!dashboardData || !user || !role) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">No data available</h3>
          <p className="mt-1 text-sm text-gray-500">We couldn't load your dashboard data.</p>
        </div>
      </div>
    );
  }
  
  // Format activities for the activity feed
  const activities: Activity[] = dashboardData.activities?.map((activity: any) => ({
    id: activity.id,
    userId: activity.userId,
    userName: "Team Member", // In a real app, we would get the user's name
    entityType: activity.entityType,
    entityId: activity.entityId,
    entityName: activity.details.includes(":") ? activity.details.split(":")[0] : undefined,
    action: activity.action,
    details: activity.details,
    timestamp: activity.timestamp,
  })) || [];
  
  // Format leads for the leads table
  const leads: Lead[] = dashboardData.leads?.map((lead: any) => ({
    id: lead.id,
    companyName: lead.companyName,
    mcNumber: lead.mcNumber,
    contactInfo: {
      email: lead.email || "",
      phone: lead.phoneNumber,
    },
    status: lead.status,
    assignedTo: {
      id: lead.assignedTo,
      name: "Sales Rep", // In a real app, we would get the user's name
    },
    createdAt: lead.createdAt,
  })) || [];
  
  // Sample performance data for the chart
  const performanceData = getPrevMonthsData(6).map((month, index) => ({
    name: month.name,
    leads: 15 + Math.floor(Math.random() * 20),
    conversions: 5 + Math.floor(Math.random() * 10),
  }));
  
  // Sample commission data
  const monthlyCommissionData = getPrevMonthsData(12).map((month, index) => ({
    name: month.name,
    amount: 2000 + Math.floor(Math.random() * 5000),
  }));
  
  const commissionBreakdown = [
    { category: "Qualified Leads", amount: 2870 },
    { category: "Factoring", amount: 1400 },
    { category: "Direct Contracts", amount: 1572 },
  ];
  
  // Determine which metrics to show based on user role
  const renderMetrics = () => {
    if (role.department === "sales") {
      return (
        <>
          <MetricCard
            title="Total Leads"
            value={dashboardData.metrics.totalLeads || 0}
            icon={<Users />}
            link={{ text: "View all leads", href: "/leads" }}
          />
          <MetricCard
            title="Qualified Leads"
            value={dashboardData.metrics.qualifiedLeads || 0}
            icon={<CheckCircle />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            link={{ text: "View qualified leads", href: "/leads?status=qualified" }}
          />
          <MetricCard
            title="Active Clients"
            value={dashboardData.metrics.activeClients || 0}
            icon={<UserCheck />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            link={{ text: "View active clients", href: "/leads?status=active" }}
          />
          <MetricCard
            title="Monthly Commission"
            value={formatCurrency(dashboardData.metrics.monthlyCommission || 0)}
            icon={<DollarSign />}
            iconBgColor="bg-accent-100"
            iconColor="text-accent-600"
            link={{ text: "View commission details", href: "#commission-tracking" }}
          />
        </>
      );
    } else if (role.department === "dispatch") {
      return (
        <>
          <MetricCard
            title="Total Loads"
            value={dashboardData.metrics.totalLoads || 0}
            icon={<Truck />}
            link={{ text: "View all loads", href: "/dispatch" }}
          />
          <MetricCard
            title="In Transit"
            value={dashboardData.metrics.inTransitLoads || 0}
            icon={<Truck />}
            iconBgColor="bg-indigo-100"
            iconColor="text-indigo-600"
            link={{ text: "View in-transit loads", href: "/dispatch?status=in_transit" }}
          />
          <MetricCard
            title="Delivered Loads"
            value={dashboardData.metrics.deliveredLoads || 0}
            icon={<FileText />}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
            link={{ text: "View delivered loads", href: "/dispatch?status=delivered" }}
          />
          <MetricCard
            title="Monthly Commission"
            value={formatCurrency(dashboardData.metrics.monthlyCommission || 0)}
            icon={<DollarSign />}
            iconBgColor="bg-accent-100"
            iconColor="text-accent-600"
            link={{ text: "View commission details", href: "#commission-tracking" }}
          />
        </>
      );
    } else {
      // Admin view
      return (
        <>
          <MetricCard
            title="Total Leads"
            value={dashboardData.metrics.totalLeads || 0}
            icon={<Users />}
            link={{ text: "View all leads", href: "/leads" }}
          />
          <MetricCard
            title="Active Clients"
            value={dashboardData.metrics.activeClients || 0}
            icon={<UserCheck />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            link={{ text: "View active clients", href: "/leads?status=active" }}
          />
          <MetricCard
            title="Total Loads"
            value={dashboardData.metrics.totalLoads || 0}
            icon={<Truck />}
            iconBgColor="bg-indigo-100"
            iconColor="text-indigo-600"
            link={{ text: "View all loads", href: "/dispatch" }}
          />
          <MetricCard
            title="Invoices"
            value={dashboardData.metrics.invoicedLoads || 0}
            icon={<FileText />}
            iconBgColor="bg-cyan-100"
            iconColor="text-cyan-600"
            link={{ text: "View invoices", href: "/invoices" }}
          />
        </>
      );
    }
  };
  
  return (
    <div>
      {/* Page header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              {role.department.charAt(0).toUpperCase() + role.department.slice(1)} Dashboard
            </h1>
            <div className="flex space-x-2">
              {role.department === "sales" && (
                <Button
                  onClick={() => setNewLeadModalOpen(true)}
                  size="sm"
                  className="h-9"
                >
                  <Users className="h-4 w-4 mr-1" />
                  New Lead
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  toast({
                    title: "Export Triggered",
                    description: "Your data export has been initiated.",
                  });
                }}
              >
                <BarChart2 className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dashboard content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Performance metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {renderMetrics()}
        </div>
        
        {/* Team performance and activity feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <TeamPerformance
            data={{
              performanceData,
              avgCallsPerDay: 42,
              callsChangePercentage: 7,
              conversionRate: 28.4,
              conversionChangePercentage: 3.1,
              teamTarget: 74,
            }}
          />
          
          <ActivityFeed activities={activities} />
        </div>
        
        {/* Leads table - show only for sales and admin */}
        {(role.department === "sales" || role.department === "admin") && (
          <LeadsTable leads={leads} />
        )}
        
        {/* Commission tracking */}
        <div id="commission-tracking">
          <CommissionTracking
            data={{
              currentMonth: "May 2023",
              earned: dashboardData.metrics.monthlyCommission || 5842,
              target: 8000,
              progress: Math.round(((dashboardData.metrics.monthlyCommission || 5842) / 8000) * 100),
              status: ((dashboardData.metrics.monthlyCommission || 5842) / 8000) > 0.7 ? "On Track" : "Behind Target",
              breakdown: commissionBreakdown,
              monthlyData: monthlyCommissionData,
              comparison: {
                lastMonth: 7124,
                lastMonthChange: 12,
                ytd: 32756,
                ytdChange: 18,
                forecast: 87500,
              },
            }}
          />
        </div>
      </div>
      
      {/* New Lead Modal */}
      <NewLeadModal 
        open={newLeadModalOpen} 
        onOpenChange={setNewLeadModalOpen}
      />
    </div>
  );
}
