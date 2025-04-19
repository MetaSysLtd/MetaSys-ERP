import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
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
import { 
  AnimatedContainer,
  AnimatedList,
  AnimatedListItem,
  AnimatedWrapper
} from "@/components/ui/animated-container";

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
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="dispatch">Dispatch</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AnimatedContainer animation="fadeIn" delay={0.1}>
        <KPISection />
      </AnimatedContainer>

      <AnimatedContainer animation="scaleIn" delay={0.2}>
        <RevenueCard data={dashboardData?.revenueData} />
      </AnimatedContainer>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatedContainer animation="slideRight" delay={0.3}>
          <OnboardingRatio data={dashboardData?.onboardingMetrics} />
        </AnimatedContainer>
        <AnimatedContainer animation="slideLeft" delay={0.3}>
          <TeamPerformance data={dashboardData?.teamMetrics} />
        </AnimatedContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedContainer animation="slideUp" delay={0.4}>
          <TeamPerformance 
            title="Sales Team Performance" 
            type="sales" 
            data={dashboardData?.salesPerformance} 
            className="border-blue-500 dark:border-blue-400"
          />
        </AnimatedContainer>
        <AnimatedContainer animation="slideUp" delay={0.5}>
          <TeamPerformance 
            title="Dispatch Team Performance" 
            type="dispatch" 
            data={dashboardData?.dispatchPerformance}
            className="border-amber-500 dark:border-amber-400" 
          />
        </AnimatedContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedContainer animation="slideRight" delay={0.6}>
          <ActivityFeed activities={dashboardData?.activities?.slice(0, 10)} />
        </AnimatedContainer>
        <AnimatedContainer animation="slideLeft" delay={0.6}>
          <RecentLeads leads={dashboardData?.leads} />
        </AnimatedContainer>
      </div>

      <AnimatedContainer animation="fadeIn" delay={0.7}>
        <CommissionBreakdown data={dashboardData?.commissions} />
      </AnimatedContainer>
      
      <AnimatedContainer animation="fadeIn" delay={0.8}>
        <FinanceOverview data={dashboardData?.finance} />
      </AnimatedContainer>
      
      <AnimatedContainer animation="fadeIn" delay={0.9}>
        <EmployeeSummary data={dashboardData?.employees} />
      </AnimatedContainer>
    </div>
  );
}