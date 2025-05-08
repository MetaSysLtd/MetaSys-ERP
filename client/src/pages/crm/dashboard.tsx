import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { PageHeader } from "@/components/page-header";
import { Container } from "@/components/ui/container";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Grid } from "@/components/ui/grid";
import { ErrorBoundary } from "react-error-boundary";
import { ReportFilters, FilterValues } from "@/components/crm/dashboard/ReportFilters";
import { LeadsOverview } from "@/components/crm/dashboard/LeadsOverview";
import { ConversionRatios } from "@/components/crm/dashboard/ConversionRatios";
import { TopPerformers } from "@/components/crm/dashboard/TopPerformers";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { HandoffRates } from "@/components/crm/dashboard/HandoffRates";
import { CommissionHighlights } from "@/components/crm/dashboard/CommissionHighlights";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Sample data for the filter dropdowns
const SAMPLE_SALES_REPS = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Alex Johnson" },
  { id: 4, name: "Emily Brown" },
  { id: 5, name: "Michael Wilson" }
];

const SAMPLE_STATUSES = [
  { id: "New", name: "New" },
  { id: "InProgress", name: "In Progress" },
  { id: "FollowUp", name: "Follow Up" },
  { id: "HandToDispatch", name: "Hand to Dispatch" },
  { id: "Active", name: "Active" },
  { id: "Lost", name: "Lost" }
];

export default function CrmDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterValues>({
    timeframe: "month"
  });
  
  // Build query string from filters
  const getQueryString = (filters: FilterValues) => {
    const params = new URLSearchParams();
    
    if (filters.timeframe) params.append("timeframe", filters.timeframe);
    if (filters.salesRep) params.append("salesRep", filters.salesRep);
    if (filters.status) params.append("status", filters.status);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom.toISOString());
    if (filters.dateTo) params.append("dateTo", filters.dateTo.toISOString());
    
    return params.toString();
  };
  
  // Fetch dashboard data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/crm/dashboard", filters],
    queryFn: async () => {
      const queryString = getQueryString(filters);
      const res = await apiRequest("GET", `/api/crm/dashboard?${queryString}`);
      return await res.json();
    }
  });
  
  // Handle filter changes
  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };
  
  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Dashboard Refreshed",
      description: "The dashboard data has been updated.",
    });
  };
  
  // Fallback UI for error states
  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
    <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg border border-red-200 text-center gap-4">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <h3 className="text-xl font-semibold text-red-700">Something went wrong</h3>
      <p className="text-red-600">{error.message}</p>
      <Button onClick={resetErrorBoundary} variant="outline">
        Try again
      </Button>
    </div>
  );
  
  // Loading skeleton
  const DashboardSkeleton = () => (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-[350px] w-full rounded-lg" />
        <Skeleton className="h-[350px] w-full rounded-lg" />
      </div>
    </div>
  );
  
  // Activities for the activity feed
  const recentActivities = [
    {
      id: 1,
      user: { firstName: "John", lastName: "Doe" },
      entityType: "lead",
      action: "created",
      details: "New lead for ABC Trucking",
      createdAt: "2025-05-07T15:20:10Z",
    },
    {
      id: 2,
      user: { firstName: "Jane", lastName: "Smith" },
      entityType: "lead",
      action: "converted",
      details: "XYZ Logistics converted to client",
      createdAt: "2025-05-07T14:05:33Z",
    },
    {
      id: 3,
      user: { firstName: "Alex", lastName: "Johnson" },
      entityType: "client",
      action: "updated",
      details: "Updated contact information for FastFreight Inc",
      createdAt: "2025-05-07T12:45:19Z",
    },
    {
      id: 4,
      user: { firstName: "Emily", lastName: "Brown" },
      entityType: "dispatch",
      action: "assigned",
      details: "Load #1245 assigned to carrier",
      createdAt: "2025-05-07T11:30:07Z",
    },
    {
      id: 5,
      user: { firstName: "Michael", lastName: "Wilson" },
      entityType: "lead",
      action: "qualified",
      details: "Qualified lead for Regional Transport Co",
      createdAt: "2025-05-07T10:15:42Z",
    },
  ];
  
  return (
    <>
      <Helmet>
        <title>CRM Dashboard | MetaSys ERP</title>
      </Helmet>
      
      <Container>
        <PageHeader
          title="CRM Dashboard"
          description="Performance metrics and analytics for the sales team"
          actions={
            <Button onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          }
        />
        
        <div className="space-y-6">
          <Grid cols={{ xs: 1, lg: 4 }}>
            <div className="lg:col-span-1">
              <ReportFilters
                onFilterChange={handleFilterChange}
                salesReps={SAMPLE_SALES_REPS}
                statuses={SAMPLE_STATUSES}
              />
            </div>
            
            <div className="lg:col-span-3">
              <QueryErrorResetBoundary>
                {({ reset }) => (
                  <ErrorBoundary FallbackComponent={ErrorFallback} onReset={reset}>
                    {isLoading ? (
                      <DashboardSkeleton />
                    ) : (
                      <div className="space-y-6">
                        <Grid cols={{ xs: 1, md: 1, lg: 1 }}>
                          <LeadsOverview data={data?.leadsOverview} />
                        </Grid>
                        
                        <Grid cols={{ xs: 1, md: 3 }}>
                          <ConversionRatios data={data?.conversionRatios} />
                          <HandoffRates data={data?.handoffRates} />
                          <CommissionHighlights data={data?.commissionHighlights} />
                        </Grid>
                        
                        <Grid cols={{ xs: 1, md: 2 }}>
                          <TopPerformers data={data?.topPerformers} />
                          <ActivityFeed activities={recentActivities} title="Recent CRM Activities" />
                        </Grid>
                      </div>
                    )}
                  </ErrorBoundary>
                )}
              </QueryErrorResetBoundary>
            </div>
          </Grid>
        </div>
      </Container>
    </>
  );
}