import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import { PageLayout } from "@/components/layout/PageLayout";

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
    <PageLayout title="Reports">
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Reports Dashboard</h2>
        {/*Original Report Content Starts Here */}
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
                {/* ... rest of the report filter components ... */}
              </div>
            </CardContent>
          </Card>
          {/* ... rest of the original report components ... */}
        </div>
        {/*Original Report Content Ends Here */}
      </Card>
    </PageLayout>
  );
}