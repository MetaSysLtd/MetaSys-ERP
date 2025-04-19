import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getMonthName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { KPISection } from "@/components/dashboard/KPISection";
import { TeamPerformance } from "@/components/dashboard/TeamPerformance";
import { OnboardingRatio } from "@/components/dashboard/OnboardingRatio";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { CommissionBreakdown } from "@/components/dashboard/CommissionBreakdown";
import { RevenueCard } from "@/components/dashboard/RevenueCard";
import { FinanceOverview } from "@/components/dashboard/FinanceOverview";
import { EmployeeSummary } from "@/components/dashboard/EmployeeSummary";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select } from "@/components/ui/select";

export default function Dashboard() {
  const { user, role } = useAuth();
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [department, setDepartment] = useState("all");

  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard", dateRange, department],
    queryFn: () => fetch("/api/dashboard").then(res => res.json())
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
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
            { value: "dispatch", label: "Dispatch" }
          ]}
        />
      </div>

      <KPISection />
      
      <RevenueCard data={dashboardData?.revenueData} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OnboardingRatio data={dashboardData?.onboardingMetrics} />
        <TeamPerformance data={dashboardData?.teamMetrics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamPerformance type="sales" data={dashboardData?.salesPerformance} />
        <TeamPerformance type="dispatch" data={dashboardData?.dispatchPerformance} />
      </div>

      {/* Onboarding Ratio */}
      <OnboardingRatio data={dashboardData?.onboardingMetrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <ActivityFeed activities={dashboardData?.activities?.slice(0, 10)} />

        {/* Recent Leads */}
        <RecentLeads leads={dashboardData?.leads} />
      </div>

      {/* Commission Section */}
      <CommissionBreakdown data={dashboardData?.commissions} />

      {/* Revenue Card */}
      <RevenueCard data={dashboardData?.revenue} />

      {/* Finance Overview */}
      <FinanceOverview data={dashboardData?.finance} />

      {/* Employee Summary */}
      <EmployeeSummary data={dashboardData?.employees} />
    </div>
  );
}