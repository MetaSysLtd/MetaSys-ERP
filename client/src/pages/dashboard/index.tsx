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
import CommissionBreakdown from "@/components/dashboard/CommissionBreakdown";
import CommissionPerformance from "@/components/dashboard/CommissionPerformance";
import { CommissionTracking } from "@/components/dashboard/CommissionTracking";
import { RevenueCard } from "@/components/dashboard/RevenueCard";
import { FinanceOverview } from "@/components/dashboard/FinanceOverview";
import { EmployeeSummary } from "@/components/dashboard/EmployeeSummary";
import { DispatchPerformance } from "@/components/dashboard/DispatchPerformance";
import { PerformanceAlertWidget } from "@/components/dispatch/performance-alert-widget";
import { DispatchReportAutomation } from "@/components/dashboard/DispatchReportAutomation";
import { MotionWrapper, MotionList } from "@/components/ui/motion-wrapper-fixed";
import { AnimationSettings } from "@/components/ui/animation-settings";
import { DashboardWidgetManager } from "@/components/dashboard/DashboardWidgetManager";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { QueryErrorHandler } from "@/hooks/use-query-error-handler";
import { handleApiError } from "@/lib/api-error-handler";
import { retryFetch } from "@/lib/api-error-handler";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const { user, role } = useAuth();
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [department, setDepartment] = useState("all");

  // Using proper error handling with the dashboard API
  const dashboardQuery = useQuery({
    queryKey: ["/api/dashboard", dateRange, department],
    queryFn: async () => {
      try {
        // Use retry fetch for resilience
        const response = await retryFetch("/api/dashboard");
        
        if (!response.ok) {
          throw new Error(
            response.status === 500
              ? "Dashboard data temporarily unavailable. Our team is working on it."
              : "Failed to load dashboard data."
          );
        }
        
        return response.json();
      } catch (error) {
        return handleApiError(error, "Dashboard", "dashboard metrics");
      }
    },
    // Reduce the frequency of refetches to avoid overwhelming the user with error messages
    refetchInterval: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    retry: 1, // Only retry once to avoid error message spam
  });

  return (
    <ErrorBoundary moduleName="dashboard">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <MotionWrapper animation="fade-right" delay={0.1}>
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </MotionWrapper>
  
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
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
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="accounting">Accounting</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </MotionWrapper>
            <div className="flex items-center gap-2">
              <MotionWrapper animation="fade-left" delay={0.3}>
                <AnimationSettings />
              </MotionWrapper>
              <MotionWrapper animation="fade-left" delay={0.35}>
                <DashboardWidgetManager />
              </MotionWrapper>
            </div>
          </div>
        </div>
  
        {/* Always show KPI section even if dashboard data isn't loaded */}
        <MotionWrapper animation="fade-in" delay={0.3}>
          <KPISection />
        </MotionWrapper>
  
        {/* Use QueryErrorHandler to handle dashboard data gracefully */}
        <QueryErrorHandler
          error={dashboardQuery.error}
          fallback={<div className="text-center py-8">Error loading dashboard data</div>}
        >
          <MotionWrapper animation="scale-up" delay={0.4}>
            <RevenueCard data={dashboardQuery.data?.revenueData} />
          </MotionWrapper>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MotionWrapper animation="fade-right" delay={0.5}>
              <OnboardingRatio data={dashboardQuery.data?.onboardingMetrics} />
            </MotionWrapper>
            <MotionWrapper animation="fade-left" delay={0.5}>
              <TeamPerformance data={dashboardQuery.data?.teamMetrics} />
            </MotionWrapper>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MotionWrapper animation="fade-up" delay={0.6} className="lg:col-span-2">
              <TeamPerformance 
                title="Sales Team Performance" 
                type="sales" 
                data={dashboardQuery.data?.salesPerformance} 
                className="border-blue-500 dark:border-blue-400"
              />
            </MotionWrapper>
            {(role?.department === "dispatch" || role?.department === "admin") && (
              <>
                <MotionWrapper animation="fade-up" delay={0.65}>
                  <PerformanceAlertWidget />
                </MotionWrapper>
                <MotionWrapper animation="fade-up" delay={0.7}>
                  <DispatchReportAutomation />
                </MotionWrapper>
              </>
            )}
            <MotionWrapper animation="fade-up" delay={0.7} className={role?.department === "dispatch" || role?.department === "admin" ? "lg:col-span-2" : "lg:col-span-1"}>
              <TeamPerformance 
                title="Dispatch Team Performance" 
                type="dispatch" 
                data={dashboardQuery.data?.dispatchPerformance}
                className="border-amber-500 dark:border-amber-400" 
              />
            </MotionWrapper>
          </div>

          <MotionList animation="fade-up" delay={0.8}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityFeed activities={dashboardQuery.data?.activities?.slice(0, 10)} />
              <RecentLeads leads={dashboardQuery.data?.leads} />
            </div>
          </MotionList>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MotionWrapper animation="fade-in" delay={0.9}>
              <CommissionBreakdown 
                isAdmin={role && role.level ? role.level >= 4 : false}
              />
            </MotionWrapper>
            
            <MotionWrapper animation="fade-in" delay={0.95}>
              <CommissionPerformance 
                type={user?.roleId === 5 || user?.roleId === 6 ? 'dispatch' : 'sales'}
              />
            </MotionWrapper>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MotionWrapper animation="fade-in" delay={1.0}>
              <DispatchPerformance 
                data={[
                  { name: 'Mike', activeLeads: 8, loadsBooked: 22, invoiceGenerated: 12500, invoiceCleared: 9800, highestLoad: 3200 },
                  { name: 'Lisa', activeLeads: 6, loadsBooked: 18, invoiceGenerated: 10200, invoiceCleared: 8100, highestLoad: 2700 },
                  { name: 'Carlos', activeLeads: 10, loadsBooked: 25, invoiceGenerated: 14800, invoiceCleared: 11200, highestLoad: 3700 },
                  { name: 'Priya', activeLeads: 7, loadsBooked: 20, invoiceGenerated: 13100, invoiceCleared: 10500, highestLoad: 3300 },
                  { name: 'Raj', activeLeads: 5, loadsBooked: 17, invoiceGenerated: 9400, invoiceCleared: 7800, highestLoad: 2500 }
                ]}
              />
            </MotionWrapper>
            
            <MotionWrapper animation="fade-in" delay={1.05}>
              <CommissionPerformance 
                type="dispatch"
              />
            </MotionWrapper>
          </div>
          
          <MotionWrapper animation="fade-in" delay={1.0}>
            <FinanceOverview data={dashboardQuery.data?.finance} />
          </MotionWrapper>
          
          <MotionWrapper animation="fade-in" delay={1.1}>
            <EmployeeSummary data={dashboardQuery.data?.employees} />
          </MotionWrapper>
        </QueryErrorHandler>
      </div>
    </ErrorBoundary>
  );
}