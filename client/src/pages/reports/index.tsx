import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDate, getPrevMonthsData } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Download, FileText, BarChart2 } from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

export default function ReportsPage() {
  const { toast } = useToast();
  const { role } = useAuth();
  const [reportPeriod, setReportPeriod] = useState("this-month");
  const [reportType, setReportType] = useState("sales");

  // Sample data for reports
  // In a real application, this would come from the backend API
  const salesData = getPrevMonthsData(6).map((month, index) => ({
    name: month.name,
    leads: 20 + Math.floor(Math.random() * 30),
    qualified: 12 + Math.floor(Math.random() * 20),
    converted: 5 + Math.floor(Math.random() * 10),
  }));

  const dispatchData = getPrevMonthsData(6).map((month, index) => ({
    name: month.name,
    booked: 15 + Math.floor(Math.random() * 15),
    delivered: 12 + Math.floor(Math.random() * 12),
    invoiced: 10 + Math.floor(Math.random() * 10),
  }));

  const invoiceData = getPrevMonthsData(6).map((month, index) => ({
    name: month.name,
    amount: 25000 + Math.floor(Math.random() * 15000),
    paid: 20000 + Math.floor(Math.random() * 12000),
  }));

  const commissionData = getPrevMonthsData(6).map((month, index) => ({
    name: month.name,
    sales: 5000 + Math.floor(Math.random() * 3000),
    dispatch: 7000 + Math.floor(Math.random() * 4000),
  }));

  // Status distribution for pie chart
  const statusData = [
    { name: "Qualified", value: 42, color: "#4CAF50" },
    { name: "Unqualified", value: 18, color: "#F44336" },
    { name: "Active", value: 24, color: "#2196F3" },
    { name: "Follow-up", value: 16, color: "#FFC107" },
    { name: "Lost", value: 8, color: "#9E9E9E" },
  ];

  // Department performance comparison
  const departmentData = [
    { name: "Sales", leads: 120, conversions: 45, revenue: 85000 },
    { name: "Dispatch", leads: 0, conversions: 0, revenue: 95000 },
  ];

  const handleDownloadReport = () => {
    toast({
      title: "Report Download Started",
      description: `The ${reportType} report for ${reportPeriod} is being generated.`,
    });
  };

  return (
    <div>
      {/* Page header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2 sm:mb-0">
              Reports & Analytics
            </h1>
            <div className="flex flex-wrap space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={handleDownloadReport}
              >
                <Download className="h-4 w-4 mr-1" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Report filters */}
        <Card className="shadow mb-6">
          <CardHeader className="px-5 py-4 border-b border-gray-200">
            <CardTitle className="text-lg leading-6 font-medium text-gray-900">
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/3">
                <label
                  htmlFor="report-type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Report Type
                </label>
                <Select
                  value={reportType}
                  onValueChange={setReportType}
                >
                  <SelectTrigger id="report-type" className="w-full">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Reports</SelectItem>
                    <SelectItem value="dispatch">Dispatch Reports</SelectItem>
                    <SelectItem value="invoices">Invoice Reports</SelectItem>
                    <SelectItem value="commissions">Commission Reports</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-1/3">
                <label
                  htmlFor="report-period"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Time Period
                </label>
                <Select
                  value={reportPeriod}
                  onValueChange={setReportPeriod}
                >
                  <SelectTrigger id="report-period" className="w-full">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="last-quarter">Last Quarter</SelectItem>
                    <SelectItem value="year-to-date">Year To Date</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-1/3">
                <label
                  htmlFor="report-format"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Export Format
                </label>
                <Select defaultValue="pdf">
                  <SelectTrigger id="report-format" className="w-full">
                    <SelectValue placeholder="Select export format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    <SelectItem value="csv">CSV File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report tabs based on selected report type */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Metrics</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main performance chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {reportType === "sales"
                      ? "Sales Performance"
                      : reportType === "dispatch"
                      ? "Dispatch Activity"
                      : reportType === "invoices"
                      ? "Invoice Summary"
                      : "Commission Earnings"}
                  </CardTitle>
                  <CardDescription>
                    {reportPeriod === "this-month"
                      ? "Data for the current month"
                      : reportPeriod === "last-month"
                      ? "Data for the previous month"
                      : reportPeriod === "last-quarter"
                      ? "Data for the last 3 months"
                      : "Data for the selected period"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {reportType === "sales" ? (
                        <AreaChart data={salesData}>
                          <defs>
                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1976D2" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#1976D2" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FF5722" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#FF5722" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="leads"
                            stroke="#1976D2"
                            fillOpacity={1}
                            fill="url(#colorLeads)"
                            name="Total Leads"
                          />
                          <Area
                            type="monotone"
                            dataKey="qualified"
                            stroke="#4CAF50"
                            fillOpacity={1}
                            fill="url(#colorQualified)"
                            name="Qualified Leads"
                          />
                          <Area
                            type="monotone"
                            dataKey="converted"
                            stroke="#FF5722"
                            fillOpacity={1}
                            fill="url(#colorConverted)"
                            name="Converted to Client"
                          />
                        </AreaChart>
                      ) : reportType === "dispatch" ? (
                        <BarChart data={dispatchData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="booked" fill="#2196F3" name="Booked Loads" />
                          <Bar dataKey="delivered" fill="#4CAF50" name="Delivered" />
                          <Bar dataKey="invoiced" fill="#FF9800" name="Invoiced" />
                        </BarChart>
                      ) : reportType === "invoices" ? (
                        <LineChart data={invoiceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${value}`, ""]} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="#1976D2"
                            strokeWidth={2}
                            name="Total Amount"
                          />
                          <Line
                            type="monotone"
                            dataKey="paid"
                            stroke="#4CAF50"
                            strokeWidth={2}
                            name="Paid Amount"
                          />
                        </LineChart>
                      ) : (
                        <BarChart data={commissionData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${value}`, ""]} />
                          <Legend />
                          <Bar dataKey="sales" fill="#1976D2" name="Sales Commissions" />
                          <Bar dataKey="dispatch" fill="#FF5722" name="Dispatch Commissions" />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Key metrics summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportType === "sales" ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span>Total Leads</span>
                          <span className="font-medium">248</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-primary-500 h-full rounded-full" style={{ width: "80%" }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Qualified Leads</span>
                          <span className="font-medium">142</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full" style={{ width: "57%" }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Conversion Rate</span>
                          <span className="font-medium">28.4%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-accent-500 h-full rounded-full" style={{ width: "28.4%" }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Active Clients</span>
                          <span className="font-medium">84</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: "33.8%" }}></div>
                        </div>
                      </>
                    ) : reportType === "dispatch" ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span>Total Loads</span>
                          <span className="font-medium">156</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-primary-500 h-full rounded-full" style={{ width: "78%" }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>In Transit</span>
                          <span className="font-medium">32</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: "20.5%" }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Delivered</span>
                          <span className="font-medium">89</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full" style={{ width: "57%" }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Invoiced</span>
                          <span className="font-medium">35</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-yellow-500 h-full rounded-full" style={{ width: "22.4%" }}></div>
                        </div>
                      </>
                    ) : reportType === "invoices" ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span>Total Invoiced</span>
                          <span className="font-medium">{formatCurrency(135750)}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-primary-500 h-full rounded-full" style={{ width: "100%" }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Paid</span>
                          <span className="font-medium">{formatCurrency(98240)}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full" style={{ width: "72.4%" }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Pending</span>
                          <span className="font-medium">{formatCurrency(27350)}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-yellow-500 h-full rounded-full" style={{ width: "20.1%" }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Overdue</span>
                          <span className="font-medium">{formatCurrency(10160)}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-red-500 h-full rounded-full" style={{ width: "7.5%" }}></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span>Total Commissions</span>
                          <span className="font-medium">{formatCurrency(32756)}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-primary-500 h-full rounded-full" style={{ width: "100%" }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Sales Commissions</span>
                          <span className="font-medium">{formatCurrency(14520)}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: "44.3%" }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Dispatch Commissions</span>
                          <span className="font-medium">{formatCurrency(18236)}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-accent-500 h-full rounded-full" style={{ width: "55.7%" }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Annual Forecast</span>
                          <span className="font-medium">{formatCurrency(87500)}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full" style={{ width: "37.5%" }}></div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pie chart */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {reportType === "sales"
                      ? "Lead Status Distribution"
                      : reportType === "dispatch"
                      ? "Load Status Distribution"
                      : reportType === "invoices"
                      ? "Invoice Status Distribution"
                      : "Commission Source Distribution"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} (${((value / 108) * 100).toFixed(0)}%)`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Detailed metrics tab */}
          <TabsContent value="detailed">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {reportType === "sales"
                      ? "Detailed Sales Metrics"
                      : reportType === "dispatch"
                      ? "Detailed Dispatch Metrics"
                      : reportType === "invoices"
                      ? "Detailed Invoice Metrics"
                      : "Detailed Commission Metrics"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {reportType === "sales" ? "Representative" : reportType === "dispatch" ? "Dispatcher" : "Period"}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {reportType === "sales" ? "Total Leads" : reportType === "dispatch" ? "Total Loads" : "Total Amount"}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {reportType === "sales" ? "Qualified" : reportType === "dispatch" ? "Delivered" : "Paid"}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {reportType === "sales" ? "Conversion Rate" : reportType === "dispatch" ? "Service Charge" : "Outstanding"}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {reportType === "sales" ? "Commission" : reportType === "dispatch" ? "Commission" : "Avg. Days to Pay"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[1, 2, 3, 4, 5].map((_, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {reportType === "sales" || reportType === "dispatch"
                                ? `Team Member ${index + 1}`
                                : getPrevMonthsData(5)[index].name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reportType === "sales"
                                ? 20 + Math.floor(Math.random() * 30)
                                : reportType === "dispatch"
                                ? 15 + Math.floor(Math.random() * 20)
                                : formatCurrency(20000 + Math.floor(Math.random() * 15000))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reportType === "sales"
                                ? 10 + Math.floor(Math.random() * 20)
                                : reportType === "dispatch"
                                ? 10 + Math.floor(Math.random() * 15)
                                : formatCurrency(15000 + Math.floor(Math.random() * 12000))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reportType === "sales"
                                ? `${20 + Math.floor(Math.random() * 40)}%`
                                : reportType === "dispatch"
                                ? formatCurrency(800 + Math.floor(Math.random() * 1200))
                                : formatCurrency(5000 + Math.floor(Math.random() * 3000))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reportType === "sales" || reportType === "dispatch"
                                ? formatCurrency(1500 + Math.floor(Math.random() * 5000))
                                : `${10 + Math.floor(Math.random() * 20)} days`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Comparison tab */}
          <TabsContent value="comparison">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Department Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={departmentData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#1976D2" />
                        <YAxis yAxisId="right" orientation="right" stroke="#FF5722" />
                        <Tooltip formatter={(value, name) => [name === "revenue" ? formatCurrency(value) : value, name]} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="leads" name="Leads" fill="#1976D2" />
                        <Bar yAxisId="left" dataKey="conversions" name="Conversions" fill="#4CAF50" />
                        <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#FF5722" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends - Year to Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[...getPrevMonthsData(12)].map((month, index) => ({
                          name: month.name,
                          sales: 50000 + Math.floor(Math.random() * 30000) + (index * 2000),
                          dispatch: 55000 + Math.floor(Math.random() * 35000) + (index * 2500),
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip formatter={(value) => [formatCurrency(value), ""]} />
                        <Legend />
                        <Line type="monotone" dataKey="sales" name="Sales Revenue" stroke="#1976D2" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="dispatch" name="Dispatch Revenue" stroke="#FF5722" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
