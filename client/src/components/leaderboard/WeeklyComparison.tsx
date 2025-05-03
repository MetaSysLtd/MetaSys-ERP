import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, Minus, Loader2 } from "lucide-react";
import { getWeekComparison, WeeklyComparisonData } from "@/services/leaderboard-service";

// Component to show a single metric comparison
const ComparisonItem = ({ 
  title, 
  current, 
  previous, 
  change,
  isPercentage = false
}: { 
  title: string; 
  current: number; 
  previous: number; 
  change: number;
  isPercentage?: boolean;
}) => {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-xs text-muted-foreground">{title}</span>
      <span className="text-xl font-semibold">{current}</span>
      <div className="flex items-center text-xs">
        <span className="text-muted-foreground mr-1">vs {previous}</span>
        {change === 0 ? (
          <span className="flex items-center text-muted-foreground">
            <Minus className="h-3 w-3 mr-1" />
            No change
          </span>
        ) : change > 0 ? (
          <span className="flex items-center text-green-500">
            <ArrowUpIcon className="h-3 w-3 mr-1" />
            {isPercentage ? `${change.toFixed(1)}%` : change}
          </span>
        ) : (
          <span className="flex items-center text-red-500">
            <ArrowDownIcon className="h-3 w-3 mr-1" />
            {isPercentage ? `${Math.abs(change).toFixed(1)}%` : Math.abs(change)}
          </span>
        )}
      </div>
    </div>
  );
};

export default function WeeklyComparison() {
  // Fetch the week-over-week comparison data
  const { 
    data, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['/api/leaderboard/week-comparison'],
    queryFn: getWeekComparison,
  });
  
  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold">Week-over-Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isError || !data) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold">Week-over-Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Unable to load comparison data
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Destructure the data for easier access
  const { thisWeek, lastWeek, changes } = data;
  
  // Calculate percentage changes for key metrics
  const getPercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Calculate percentage changes for leads and loads
  const leadClosureRateChange = getPercentageChange(
    thisWeek.closedLeads / thisWeek.totalLeads,
    lastWeek.closedLeads / lastWeek.totalLeads
  );
  
  const loadCompletionRateChange = getPercentageChange(
    thisWeek.completedLoads / thisWeek.totalLoads,
    lastWeek.completedLoads / lastWeek.totalLoads
  );
  
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Week-over-Week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sales Metrics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Sales Performance</h3>
            <ComparisonItem
              title="Total Leads"
              current={thisWeek.totalLeads}
              previous={lastWeek.totalLeads}
              change={changes.totalLeads}
            />
            <ComparisonItem
              title="Closed Leads"
              current={thisWeek.closedLeads}
              previous={lastWeek.closedLeads}
              change={changes.closedLeads}
            />
            <ComparisonItem
              title="Lead Closure Rate"
              current={thisWeek.totalLeads > 0 ? Math.round((thisWeek.closedLeads / thisWeek.totalLeads) * 100) : 0}
              previous={lastWeek.totalLeads > 0 ? Math.round((lastWeek.closedLeads / lastWeek.totalLeads) * 100) : 0}
              change={leadClosureRateChange}
              isPercentage={true}
            />
          </div>
          
          {/* Dispatch Metrics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Dispatch Performance</h3>
            <ComparisonItem
              title="Total Loads"
              current={thisWeek.totalLoads}
              previous={lastWeek.totalLoads}
              change={changes.totalLoads}
            />
            <ComparisonItem
              title="Completed Loads"
              current={thisWeek.completedLoads}
              previous={lastWeek.completedLoads}
              change={changes.completedLoads}
            />
            <ComparisonItem
              title="Load Completion Rate"
              current={thisWeek.totalLoads > 0 ? Math.round((thisWeek.completedLoads / thisWeek.totalLoads) * 100) : 0}
              previous={lastWeek.totalLoads > 0 ? Math.round((lastWeek.completedLoads / lastWeek.totalLoads) * 100) : 0}
              change={loadCompletionRateChange}
              isPercentage={true}
            />
          </div>
          
          {/* Other Metrics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Additional Metrics</h3>
            <ComparisonItem
              title="New Leads"
              current={thisWeek.newLeads}
              previous={lastWeek.newLeads}
              change={changes.newLeads}
            />
            <ComparisonItem
              title="Cancelled Loads"
              current={thisWeek.cancelledLoads}
              previous={lastWeek.cancelledLoads}
              change={changes.cancelledLoads}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}