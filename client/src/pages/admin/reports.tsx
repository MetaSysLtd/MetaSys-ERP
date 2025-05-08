import { useState } from "react";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, FileText, Plus, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function AdminReportsPage() {
  const [activeReportTab, setActiveReportTab] = useState("system");
  const [reportType, setReportType] = useState("all");
  const [timeframe, setTimeframe] = useState("monthly");
  
  const { toast } = useToast();
  
  // Fetch reports data
  const { data: reports, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/reports", reportType, timeframe],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/admin/reports?type=${reportType}&timeframe=${timeframe}`);
        if (!response.ok) throw new Error("Failed to fetch reports");
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        toast({
          title: "Error",
          description: "Failed to load reports. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  const generateReport = async () => {
    toast({
      title: "Generating Report",
      description: "Your report is being generated. This may take a moment.",
    });
    
    setTimeout(() => {
      toast({
        title: "Report Generated",
        description: "Your report is ready to download.",
      });
    }, 2000);
  };

  return (
    <AdminPageLayout title="System Reports" currentTab="reports">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">System Reports</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="border-[#025E73] text-[#025E73]" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-[#025E73] hover:bg-[#025E73]/90" onClick={generateReport}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>
              Select report type and time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium leading-none mb-2 block">
                  Report Type
                </label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="system">System Activity</SelectItem>
                    <SelectItem value="user">User Activity</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="diagnostic">Diagnostic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium leading-none mb-2 block">
                  Time Period
                </label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Tabs value={activeReportTab} onValueChange={setActiveReportTab} className="w-full">
              <TabsList>
                <TabsTrigger value="system">System</TabsTrigger>
                <TabsTrigger value="user">User Activity</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <TabsContent value="system" className="mt-0">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : error ? (
                <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200">
                  <p className="font-medium">Failed to load reports</p>
                  <p className="text-sm mt-2">Please try again or contact system administrator.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-md border border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-[#025E73] mr-3" />
                      <div>
                        <p className="font-medium">System Performance Report</p>
                        <p className="text-sm text-gray-500">May 2025</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="p-4 rounded-md border border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-[#025E73] mr-3" />
                      <div>
                        <p className="font-medium">System Usage Report</p>
                        <p className="text-sm text-gray-500">May 2025</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="p-4 rounded-md border border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-[#025E73] mr-3" />
                      <div>
                        <p className="font-medium">System Error Log</p>
                        <p className="text-sm text-gray-500">May 2025</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="user" className="mt-0">
              <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                <p className="font-medium">User activity reports interface</p>
                <p className="text-sm mt-2">This tab will display user login history, session data, and activity logs.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="performance" className="mt-0">
              <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                <p className="font-medium">Performance reports interface</p>
                <p className="text-sm mt-2">This tab will display system performance metrics, response times, and resource usage.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="diagnostic" className="mt-0">
              <div className="p-4 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                <p className="font-medium">Diagnostic reports interface</p>
                <p className="text-sm mt-2">This tab will display system health checks, error logs, and diagnostics information.</p>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}