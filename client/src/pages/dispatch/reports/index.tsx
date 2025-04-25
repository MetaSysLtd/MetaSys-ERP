import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, Calendar, CheckCircle, Download, Loader2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DispatchReportsPage() {
  const [performanceRange, setPerformanceRange] = useState<"daily" | "weekly">("daily");
  const [selectedDispatcher, setSelectedDispatcher] = useState<string | null>(null);
  
  // Fetch all dispatchers
  const { data: dispatchers, isLoading: dispatchersLoading } = useQuery({
    queryKey: ["/api/team/dispatch"],
    queryFn: async () => {
      const response = await fetch("/api/team/dispatch");
      if (!response.ok) {
        throw new Error("Failed to fetch dispatch team");
      }
      return response.json();
    },
  });
  
  // Fetch performance metrics based on range and selected dispatcher
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ["/api/dispatch/performance", performanceRange, selectedDispatcher],
    queryFn: async () => {
      let url = `/api/dispatch/performance?range=${performanceRange}`;
      if (selectedDispatcher) {
        url += `&userId=${selectedDispatcher}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch performance metrics");
      }
      return response.json();
    },
  });
  
  // Fetch all reports
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/dispatch/reports", selectedDispatcher],
    queryFn: async () => {
      let url = "/api/dispatch/reports";
      if (selectedDispatcher) {
        url += `?dispatcherId=${selectedDispatcher}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }
      return response.json();
    },
  });
  
  // Format chart data from API response
  const getChartData = () => {
    if (!performanceData || !performanceData.dailyData) return [];
    
    return performanceData.dailyData.map((day: any) => ({
      date: format(new Date(day.date), 'MM/dd'),
      loads: day.loads,
      invoice: day.invoice,
      leads: day.leads,
      isAboveTarget: day.isAboveLoadTarget,
    }));
  };
  
  // Download CSV with performance data
  const downloadCSV = () => {
    if (!performanceData || !performanceData.dailyData) return;
    
    const headers = ["Date", "Loads Booked", "Invoice USD", "Active Leads", "Status"];
    const rows = performanceData.dailyData.map((day: any) => [
      format(new Date(day.date), 'yyyy-MM-dd'),
      day.loads,
      day.invoice,
      day.leads,
      day.status,
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dispatch_performance_${performanceRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dispatch Performance Reports</h1>
        <div className="flex gap-4">
          <Select value={performanceRange} onValueChange={(value) => setPerformanceRange(value as "daily" | "weekly")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedDispatcher || ""} onValueChange={(value) => setSelectedDispatcher(value || null)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Dispatchers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Dispatchers</SelectItem>
              {dispatchers && dispatchers.map((dispatcher: any) => (
                <SelectItem key={dispatcher.id} value={dispatcher.id.toString()}>
                  {dispatcher.firstName} {dispatcher.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={downloadCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={!performanceData}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="performance">
        <TabsList className="mb-4">
          <TabsTrigger value="performance">Performance Dashboard</TabsTrigger>
          <TabsTrigger value="reports">Daily Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance">
          {performanceLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : performanceData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Average Loads/Day</CardTitle>
                  <CardDescription>
                    {performanceData.metrics.averageLoadsPerDay.toFixed(1)} loads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {performanceData.metrics.totalLoads}
                  </div>
                  <p className="text-xs text-muted-foreground">Total loads in period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Average Invoice/Day</CardTitle>
                  <CardDescription>
                    ${performanceData.metrics.averageInvoicePerDay.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${performanceData.metrics.totalInvoice.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total invoice in period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Target Performance</CardTitle>
                  <CardDescription>
                    {performanceData.metrics.daysAboveTarget} days above target
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {performanceData.metrics.daysAboveTarget > 0 && performanceData.dailyData.length > 0
                      ? Math.round((performanceData.metrics.daysAboveTarget / performanceData.dailyData.length) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Days meeting performance targets</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              No performance data available
            </div>
          )}
          
          {performanceData && performanceData.dailyData && performanceData.dailyData.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Visualization of dispatcher performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" stroke="#82ca9d" />
                      <YAxis yAxisId="right" orientation="right" stroke="#8884d8" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="loads"
                        name="Loads Booked"
                        fill="#82ca9d"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="invoice"
                        name="Invoice USD"
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {performanceData && performanceData.targets && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Targets</CardTitle>
                <CardDescription>
                  Current targets for {performanceRange} dispatcher performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Minimum Loads Target</span>
                    <span className="text-2xl font-bold">{performanceData.targets.minPct}</span>
                    <span className="text-xs text-muted-foreground">Loads per {performanceRange}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Target Invoice USD</span>
                    <span className="text-2xl font-bold">${performanceData.targets.maxPct}</span>
                    <span className="text-xs text-muted-foreground">Invoice per {performanceRange}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Dispatch Reports
              </CardTitle>
              <CardDescription>
                Detailed daily reports from dispatchers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : reports && reports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Dispatcher</TableHead>
                      <TableHead>Loads Booked</TableHead>
                      <TableHead>Invoice USD</TableHead>
                      <TableHead>Active Leads</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report: any) => (
                      <TableRow key={report.id}>
                        <TableCell>{format(new Date(report.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          {report.dispatcherName || `ID: ${report.dispatcherId}`}
                        </TableCell>
                        <TableCell>{report.loadsBooked}</TableCell>
                        <TableCell>${report.invoiceUsd.toFixed(2)}</TableCell>
                        <TableCell>{report.activeLeads}</TableCell>
                        <TableCell>
                          {report.status === "Submitted" ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-500 border-amber-500">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No reports found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}