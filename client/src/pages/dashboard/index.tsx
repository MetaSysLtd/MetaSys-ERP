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
import { CommissionTracking } from "@/components/dashboard/CommissionTracking";
import { RevenueCard } from "@/components/dashboard/RevenueCard";
import { FinanceOverview } from "@/components/dashboard/FinanceOverview";
import { EmployeeSummary } from "@/components/dashboard/EmployeeSummary";

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={dashboardData?.activities?.slice(0, 10)} />
        <RecentLeads leads={dashboardData?.leads} />
      </div>

      <CommissionBreakdown data={dashboardData?.commissions} />
      <FinanceOverview data={dashboardData?.finance} />
      <EmployeeSummary data={dashboardData?.employees} />
    </div>
  );
}