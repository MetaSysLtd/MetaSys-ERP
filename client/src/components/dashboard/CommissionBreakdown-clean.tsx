import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface CommissionBreakdownProps {
  userId?: number;
  isAdmin?: boolean;
}

export default function CommissionBreakdown({ userId, isAdmin = false }: CommissionBreakdownProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tabValue, setTabValue] = useState("monthly");

  // Format month string for API request
  const month = selectedDate ? format(selectedDate, 'yyyy-MM') : format(new Date(), 'yyyy-MM');
  
  // Determine target user ID (admin can view other users, regular users see only their own)
  const targetUserId = isAdmin && userId ? userId : user?.id;

  // Get monthly commission data
  const { data: monthlyData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['/api/commissions/monthly/user', targetUserId, month],
    queryFn: async () => {
      if (!targetUserId) return null;
      
      const response = await fetch(`/api/commissions/monthly/user/${targetUserId}/${month}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No commission data for this month
        }
        throw new Error('Failed to fetch commission data');
      }
      return response.json();
    },
    enabled: !!targetUserId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Get historical commission data (last 6 months)
  const { data: historicalData, isLoading: isHistoricalLoading } = useQuery({
    queryKey: ['/api/commissions/monthly/user', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const response = await fetch(`/api/commissions/monthly/user/${targetUserId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return []; // No historical data found
        }
        throw new Error('Failed to fetch historical commission data');
      }
      return response.json();
    },
    enabled: !!targetUserId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const isLoading = isMonthlyLoading || isHistoricalLoading;
  const historicalCommissions = historicalData || [];

  // Process historical data for chart
  const chartData = Array.isArray(historicalCommissions) ? historicalCommissions.map(commission => ({
    month: format(new Date(commission.month + '-01'), 'MMM'),
    amount: commission.totalAmount || 0,
    count: commission.count || 0,
  })) : [];

  // Calculate current month stats
  const currentMonthTotal = monthlyData?.totalAmount || 0;
  const currentMonthCount = monthlyData?.count || 0;

  // Calculate previous month for comparison
  const previousMonth = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1) : new Date();
  const previousMonthData = historicalCommissions.find(
    comm => comm.month === format(previousMonth, 'yyyy-MM')
  );
  const previousMonthTotal = previousMonthData?.totalAmount || 0;
  
  // Calculate percentage change
  const percentageChange = previousMonthTotal > 0 
    ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
    : 0;

  // Pie chart data for commission breakdown
  const pieData = monthlyData?.breakdown ? Object.entries(monthlyData.breakdown).map(([key, value]) => ({
    name: key,
    value: Number(value) || 0,
  })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commission Breakdown</CardTitle>
          <CardDescription>Loading commission data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Breakdown</CardTitle>
        <CardDescription>
          {isAdmin && userId ? `Commission data for user ${userId}` : 'Your commission performance'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Date Picker */}
          <div className="flex justify-between items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "MMMM yyyy") : <span>Pick a month</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Current Month Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">${currentMonthTotal.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total Commission</p>
                <div className="flex items-center mt-1">
                  {percentageChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={cn(
                    "text-xs ml-1",
                    percentageChange > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {Math.abs(percentageChange).toFixed(1)}% vs last month
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{currentMonthCount}</div>
                <p className="text-xs text-muted-foreground">Commission Count</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  ${currentMonthCount > 0 ? (currentMonthTotal / currentMonthCount).toFixed(0) : '0'}
                </div>
                <p className="text-xs text-muted-foreground">Average per Commission</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="monthly">Monthly Trend</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>6-Month Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Commission']} />
                      <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Commission Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-muted-foreground h-64 flex items-center justify-center">
                      No commission breakdown data available for this month
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Commission Count Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, 'Count']} />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}