import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select } from "@/components/ui/select";
import { KPISection } from "@/components/dashboard/KPISection";
import { TeamPerformance } from "@/components/dashboard/TeamPerformance";
import { OnboardingRatio } from "@/components/dashboard/OnboardingRatio";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { CommissionBreakdown } from "@/components/dashboard/CommissionBreakdown";
import { RevenueCard } from "@/components/dashboard/RevenueCard";
import { FinanceOverview } from "@/components/dashboard/FinanceOverview";
import { EmployeeSummary } from "@/components/dashboard/EmployeeSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Default placeholder data structure to prevent component errors
const defaultDashboardData = {
  revenueData: null,
  onboardingMetrics: null,
  teamMetrics: {
    performanceData: [],
    avgCallsPerDay: 0,
    callsChangePercentage: 0,
    conversionRate: 0,
    conversionChangePercentage: 0,
    teamTarget: 0
  },
  salesPerformance: {
    performanceData: [],
    avgCallsPerDay: 0,
    callsChangePercentage: 0,
    conversionRate: 0,
    conversionChangePercentage: 0,
    teamTarget: 0
  },
  dispatchPerformance: {
    performanceData: [],
    avgCallsPerDay: 0,
    callsChangePercentage: 0,
    conversionRate: 0,
    conversionChangePercentage: 0,
    teamTarget: 0
  },
  activities: [],
  leads: [],
  commissions: null,
  finance: null,
  employees: null,
  metrics: {
    totalLeads: 0,
    qualifiedLeads: 0,
    leadsConverted: 0,
    totalLoads: 0,
    activeLoads: 0,
    completedLoads: 0,
    totalRevenue: 0,
    totalProfit: 0,
    profitMargin: 0,
    invoicesPending: 0
  }
};

export default function Dashboard() {
  const { user, role } = useAuth();
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [department, setDepartment] = useState("all");

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard", dateRange, department],
    queryFn: () => fetch("/api/dashboard").then(res => res.json())
  });

  // Create safe data object that merges defaults with any received data
  const safeData = dashboardData ? { ...defaultDashboardData, ...dashboardData } : defaultDashboardData;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg text-primary">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              {error instanceof Error ? error.message : "Failed to load dashboard data. Please try again later."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-4">
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onSelect={setDateRange}
          />
          <Select
            value={department}
            onValueChange={setDepartment}
            options={[
              { value: "all", label: "All Departments" },
              { value: "sales", label: "Sales" },
              { value: "dispatch", label: "Dispatch" },
              { value: "hr", label: "HR" },
              { value: "finance", label: "Finance" }
            ]}
          />
        </div>
      </div>

      <KPISection metrics={safeData.metrics} />

      <RevenueCard data={safeData.revenueData} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OnboardingRatio data={safeData.onboardingMetrics} />
        <TeamPerformance data={safeData.teamMetrics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamPerformance type="sales" data={safeData.salesPerformance} />
        <TeamPerformance type="dispatch" data={safeData.dispatchPerformance} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={safeData.activities?.slice(0, 10) || []} />
        <RecentLeads leads={safeData.leads || []} />
      </div>

      <CommissionBreakdown data={safeData.commissions} />
      <FinanceOverview data={safeData.finance} />
      <EmployeeSummary data={safeData.employees} />
    </div>
  );
}