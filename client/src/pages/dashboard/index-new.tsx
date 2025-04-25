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
import { MotionWrapper, MotionList } from "@/components/ui/motion-wrapper-fixed";
import { AnimationSettings } from "@/components/ui/animation-settings";

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
        <MotionWrapper animation="fade-right" delay={0.1}>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </MotionWrapper>

        <div className="flex items-center gap-4">
          <MotionWrapper animation="fade-left" delay={0.2}>
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onSelect={setDateRange}
            />
          </MotionWrapper>
          <MotionWrapper animation="fade-left" delay={0.25}>
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
          </MotionWrapper>
          <MotionWrapper animation="fade-left" delay={0.3}>
            <AnimationSettings />
          </MotionWrapper>
        </div>
      </div>

      <MotionWrapper animation="fade-in" delay={0.3}>
        <KPISection />
      </MotionWrapper>

      <MotionWrapper animation="scale-up" delay={0.4}>
        <RevenueCard data={dashboardData?.revenueData} />
      </MotionWrapper>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MotionWrapper animation="fade-right" delay={0.5}>
          <OnboardingRatio data={dashboardData?.onboardingMetrics} />
        </MotionWrapper>
        <MotionWrapper animation="fade-left" delay={0.5}>
          <TeamPerformance data={dashboardData?.teamMetrics} />
        </MotionWrapper>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MotionWrapper animation="fade-up" delay={0.6}>
          <TeamPerformance 
            title="Sales Team Performance" 
            type="sales" 
            data={dashboardData?.salesPerformance} 
            className="border-blue-500 dark:border-blue-400"
          />
        </MotionWrapper>
        <MotionWrapper animation="fade-up" delay={0.7}>
          <TeamPerformance 
            title="Dispatch Team Performance" 
            type="dispatch" 
            data={dashboardData?.dispatchPerformance}
            className="border-amber-500 dark:border-amber-400" 
          />
        </MotionWrapper>
      </div>

      <MotionList animation="fade-up" delay={0.8}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed activities={dashboardData?.activities?.slice(0, 10)} />
          <RecentLeads leads={dashboardData?.leads} />
        </div>
      </MotionList>

      <MotionWrapper animation="fade-in" delay={0.9}>
        <CommissionBreakdown data={dashboardData?.commissions} />
      </MotionWrapper>
      
      <MotionWrapper animation="fade-in" delay={1.0}>
        <FinanceOverview data={dashboardData?.finance} />
      </MotionWrapper>
      
      <MotionWrapper animation="fade-in" delay={1.1}>
        <EmployeeSummary data={dashboardData?.employees} />
      </MotionWrapper>
    </div>
  );
}