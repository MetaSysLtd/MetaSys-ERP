import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { MotionWrapper } from "@/components/ui/motion-wrapper-fixed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportFilters } from "@/components/crm/dashboard/ReportFilters";
import { LeadsOverview } from "@/components/crm/dashboard/LeadsOverview";
import { ConversionRatios } from "@/components/crm/dashboard/ConversionRatios";
import { TopPerformers } from "@/components/crm/dashboard/TopPerformers";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { HandoffRates } from "@/components/crm/dashboard/HandoffRates";
import { CommissionHighlights } from "@/components/crm/dashboard/CommissionHighlights";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

export default function CRMDashboard() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [, setLocation] = useLocation();
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week");
  
  // Fetch CRM Dashboard data
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["/api/crm/dashboard", timeframe],
    enabled: !!user,
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load CRM dashboard data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  const handleRefresh = () => {
    refetch();
  };
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#025E73]" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Loading dashboard data...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the latest CRM metrics.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Page header */}
      <MotionWrapper animation="fade-in" delay={0.1}>
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-between">
              <MotionWrapper animation="fade-right" delay={0.2}>
                <h1 className="text-2xl font-semibold text-[#025E73] mb-2 sm:mb-0">
                  CRM Dashboard
                </h1>
              </MotionWrapper>
              <MotionWrapper animation="fade-left" delay={0.3}>
                <div className="flex space-x-3 items-center">
                  <Select
                    value={timeframe}
                    onValueChange={(value) => setTimeframe(value as "day" | "week" | "month")}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="ml-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </MotionWrapper>
            </div>
          </div>
        </div>
      </MotionWrapper>
      
      {/* Dashboard content */}
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <MotionWrapper animation="fade-up" delay={0.4}>
          {/* KPI summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Leads created */}
            <Card className="shadow hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-500 font-medium">
                  Leads Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-bold text-[#025E73]">
                      {dashboardData?.metrics.createdLeads || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {timeframe === "day" ? "Today" : timeframe === "week" ? "This Week" : "This Month"}
                    </p>
                  </div>
                  <div className={`text-sm font-medium ${dashboardData?.metrics.createdLeadsChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {dashboardData?.metrics.createdLeadsChange >= 0 ? "+" : ""}{dashboardData?.metrics.createdLeadsChange || 0}%
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Qualified Leads */}
            <Card className="shadow hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-500 font-medium">
                  Qualified Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-bold text-[#025E73]">
                      {dashboardData?.metrics.qualifiedLeads || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {dashboardData?.metrics.qualificationRate || 0}% of Total
                    </p>
                  </div>
                  <div className={`text-sm font-medium ${dashboardData?.metrics.qualifiedLeadsChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {dashboardData?.metrics.qualifiedLeadsChange >= 0 ? "+" : ""}{dashboardData?.metrics.qualifiedLeadsChange || 0}%
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Hand-offs to Dispatch */}
            <Card className="shadow hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-500 font-medium">
                  Dispatch Hand-offs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-bold text-[#025E73]">
                      {dashboardData?.metrics.handoffCount || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {dashboardData?.metrics.handoffRate || 0}% Success Rate
                    </p>
                  </div>
                  <div className={`text-sm font-medium ${dashboardData?.metrics.handoffChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {dashboardData?.metrics.handoffChange >= 0 ? "+" : ""}{dashboardData?.metrics.handoffChange || 0}%
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Commissions Earned */}
            <Card className="shadow hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-500 font-medium">
                  Commissions Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-bold text-[#025E73]">
                      ${Math.round(dashboardData?.metrics.commissionsEarned || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {timeframe === "day" ? "Today" : timeframe === "week" ? "This Week" : "This Month"}
                    </p>
                  </div>
                  <div className={`text-sm font-medium ${dashboardData?.metrics.commissionsChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {dashboardData?.metrics.commissionsChange >= 0 ? "+" : ""}{dashboardData?.metrics.commissionsChange || 0}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </MotionWrapper>
        
        {/* Main dashboard panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Leads Overview */}
          <MotionWrapper animation="fade-up" delay={0.5} className="lg:col-span-2">
            <LeadsOverview data={dashboardData?.leadsOverview} timeframe={timeframe} />
          </MotionWrapper>
          
          {/* Top Performers */}
          <MotionWrapper animation="fade-up" delay={0.6}>
            <TopPerformers data={dashboardData?.topPerformers} />
          </MotionWrapper>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Conversion Ratios */}
          <MotionWrapper animation="fade-up" delay={0.7}>
            <ConversionRatios data={dashboardData?.conversionRatios} />
          </MotionWrapper>
          
          {/* Handoff Success Rates */}
          <MotionWrapper animation="fade-up" delay={0.8}>
            <HandoffRates data={dashboardData?.handoffRates} />
          </MotionWrapper>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Activity Feed */}
          <MotionWrapper animation="fade-up" delay={0.9} className="lg:col-span-2">
            <ActivityFeed activities={dashboardData?.recentActivities?.slice(0, 8)} />
          </MotionWrapper>
          
          {/* Commission Highlights */}
          <MotionWrapper animation="fade-up" delay={1.0}>
            <CommissionHighlights data={dashboardData?.commissionHighlights} />
          </MotionWrapper>
        </div>
      </div>
    </div>
  );
}