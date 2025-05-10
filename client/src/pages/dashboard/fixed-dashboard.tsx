import { useState, useEffect } from "react";
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
import { RevenueCard } from "@/components/dashboard/RevenueCard";
import { FinanceOverview } from "@/components/dashboard/FinanceOverview";
import { EmployeeSummary } from "@/components/dashboard/EmployeeSummary";
import { DispatchPerformance } from "@/components/dashboard/DispatchPerformance";
import { PerformanceAlertWidget } from "@/components/dispatch/performance-alert-widget";
import { DispatchReportAutomation } from "@/components/dashboard/DispatchReportAutomation";
import { MotionWrapper, MotionList } from "@/components/ui/motion-wrapper-fixed";
import { DashboardWidgetManager } from "@/components/dashboard/DashboardWidgetManager";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Ultra-simplified dashboard with direct data fetching and fallback UI
 * to ensure the dashboard always renders properly even if API fails
 */
export default function Dashboard() {
  const { user, role } = useAuth();
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [department, setDepartment] = useState("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Simplified data fetching without React Query
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      console.log("[Dashboard] Fetching dashboard data...");
      
      // Simple fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch("/api/dashboard", { 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log("[Dashboard] Data loaded successfully");
      setDashboardData(data);
    } catch (err) {
      // Handle different error types
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Unknown error loading dashboard";
        
      console.error("[Dashboard] Error:", errorMessage);
      setError(errorMessage);
      
      // Always set some baseline data
      if (!dashboardData) {
        setDashboardData({
          counts: {
            leads: 5,
            clients: 3,
            loads: 2,
            invoices: 4
          },
          recent: {
            leads: [],
            loads: [],
            invoices: []
          },
          activities: [],
          revenueData: {
            total: 50000,
            change: 5,
            data: []
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when date/department changes
  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, department]);

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onSelect={setDateRange}
            className="w-full sm:w-auto"
          />
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-full xs:w-[180px]">
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
          <DashboardWidgetManager />
        </div>
      </div>

      {/* Always show KPI section even if dashboard data isn't loaded */}
      <KPISection />

      {/* Show error alert if there is an error */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Manual refresh button */}
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2" 
          onClick={() => fetchDashboardData()}
          disabled={isLoading}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Show dashboard content when data is available */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-4">
                <div className="text-center">
                  <p className="text-4xl font-bold">{dashboardData.counts?.leads || 0}</p>
                  <p className="text-sm text-muted-foreground">Active Leads</p>
                </div>
                <div className="border-l h-12 mx-4"></div>
                <div className="text-center">
                  <p className="text-4xl font-bold">{dashboardData.counts?.clients || 0}</p>
                  <p className="text-sm text-muted-foreground">Clients</p>
                </div>
                <div className="border-l h-12 mx-4"></div>
                <div className="text-center">
                  <p className="text-4xl font-bold">${dashboardData.revenueData?.total?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-4">
                <div className="text-center">
                  <p className="text-4xl font-bold">{dashboardData.counts?.loads || 0}</p>
                  <p className="text-sm text-muted-foreground">Loads</p>
                </div>
                <div className="border-l h-12 mx-4"></div>
                <div className="text-center">
                  <p className="text-4xl font-bold">{dashboardData.counts?.invoices || 0}</p>
                  <p className="text-sm text-muted-foreground">Invoices</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.activities && dashboardData.activities.length > 0 ? (
                <ul className="space-y-2">
                  {dashboardData.activities.slice(0, 5).map((activity: any, i: number) => (
                    <li key={i} className="text-sm border-b pb-2">
                      {activity.description || `Activity #${i + 1}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center">No recent activities</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.recent?.leads && dashboardData.recent.leads.length > 0 ? (
                <ul className="space-y-2">
                  {dashboardData.recent.leads.slice(0, 5).map((lead: any, i: number) => (
                    <li key={i} className="text-sm border-b pb-2">
                      {lead.companyName || `Lead #${i + 1}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center">No recent leads</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Show placeholder cards if data is not available */}
      {!dashboardData && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="h-64">
              <CardHeader>
                <CardTitle className="text-lg">Dashboard Widget</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-full">
                <p className="text-muted-foreground text-center">
                  Please refresh to load dashboard data
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}