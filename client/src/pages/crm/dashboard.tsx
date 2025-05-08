import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Container } from "@/components/ui/container";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QueryErrorHandler } from "@/hooks/use-query-error-handler";
import { Grid } from "@/components/ui/grid";

import { ReportFilters } from "@/components/crm/dashboard/ReportFilters";
import { LeadsOverview } from "@/components/crm/dashboard/LeadsOverview";
import { ConversionRatios } from "@/components/crm/dashboard/ConversionRatios";
import { TopPerformers } from "@/components/crm/dashboard/TopPerformers";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { HandoffRates } from "@/components/crm/dashboard/HandoffRates";
import { CommissionHighlights } from "@/components/crm/dashboard/CommissionHighlights";

export default function CRMDashboard() {
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("month");
  const [filters, setFilters] = useState({});

  const { data: dashboardData, refetch } = useQuery({
    queryKey: ["/api/crm/dashboard", timeframe, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeframe,
        ...filters,
      });
      const res = await apiRequest("GET", `/api/crm/dashboard?${params}`);
      return res.json();
    },
  });

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Dashboard refreshed",
      description: "The data has been updated.",
    });
  };

  // Simulate data for components that would be missing in the API response
  // In a real scenario, these would come from the backend
  const mockRecentActivities = Array(10)
    .fill(0)
    .map((_, i) => ({
      id: i + 1,
      user: { firstName: "John", lastName: "Doe" },
      entityType: ["lead", "client", "commission", "handoff", "invoice"][
        Math.floor(Math.random() * 5)
      ],
      action: ["created", "updated", "qualified", "completed", "handoff", "earned"][
        Math.floor(Math.random() * 6)
      ],
      details: `Activity ${i + 1} details`,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString(),
    }));

  return (
    <QueryErrorHandler>
      <PageHeader
        title="CRM Dashboard"
        description="Monitor your sales team performance and lead conversions."
      />
      
      <Container>
        <ReportFilters onFilterChange={handleFilterChange} onRefresh={handleRefresh} />
        
        <Grid className="grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Lead Overview */}
          <div className="col-span-1 lg:col-span-2">
            <LeadsOverview 
              data={dashboardData?.leadsOverview} 
              timeframe={timeframe} 
            />
          </div>
          
          {/* Conversion Ratios */}
          <div className="col-span-1">
            {dashboardData?.conversionRatios && (
              <ConversionRatios data={dashboardData.conversionRatios} />
            )}
          </div>
          
          {/* Handoff Rates */}
          <div className="col-span-1">
            {dashboardData?.handoffRates && (
              <HandoffRates data={dashboardData.handoffRates} />
            )}
          </div>
          
          {/* Commission Highlights */}
          <div className="col-span-1">
            {dashboardData?.commissionHighlights && (
              <CommissionHighlights data={dashboardData.commissionHighlights} />
            )}
          </div>
          
          {/* Top Performers */}
          <div className="col-span-1">
            {dashboardData?.topPerformers && (
              <TopPerformers data={dashboardData.topPerformers} />
            )}
          </div>
          
          {/* Recent Activities */}
          <div className="col-span-1 lg:col-span-2">
            <ActivityFeed
              activities={mockRecentActivities}
              title="Recent CRM Activities"
              height="400px"
            />
          </div>
        </Grid>
      </Container>
    </QueryErrorHandler>
  );
}