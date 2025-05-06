import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  BarChart2, 
  Users,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

// Commission summary item component
const CommissionSummaryItem = ({ title, amount, growth, period }: { 
  title: string;
  amount: number;
  growth?: number;
  period: string;
}) => {
  const growthColor = growth === undefined ? 'text-gray-500' : 
                      growth >= 0 ? 'text-green-600' : 'text-red-600';
  const growthIcon = growth === undefined ? null : 
                     growth >= 0 ? <TrendingUp className="h-3 w-3" /> : 
                     <TrendingUp className="h-3 w-3 transform rotate-180" />;
  
  return (
    <div className="p-4 border rounded-md bg-white shadow-sm">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-1 flex justify-between items-baseline">
        <p className="text-2xl font-semibold text-[#025E73]">
          {formatCurrency(amount)}
        </p>
        {growth !== undefined && (
          <div className={`flex items-center text-xs font-medium ${growthColor}`}>
            {growthIcon}
            <span className="ml-1">{Math.abs(growth)}%</span>
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">{period}</p>
    </div>
  );
};

export default function CommissionsPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  
  // Get all commission data for the user
  const { data: userCommissions, isLoading: isLoadingUserCommissions, error: userCommissionsError } = useQuery({
    queryKey: ["/api/commissions/monthly/user", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const response = await fetch(`/api/commissions/monthly/user/${user.id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user commissions: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching commissions data:', error);
        throw error;
      }
    },
    enabled: !!user?.id
  });
  
  // Get commission data for the specific month
  const { data: monthlyCommission, isLoading: isLoadingMonthly, error: monthlyError } = useQuery({
    queryKey: ["/api/commissions/monthly/user", user?.id, selectedMonth],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const response = await fetch(`/api/commissions/monthly/user/${user.id}/${selectedMonth}`);
        if (response.status === 404) {
          return { total: 0, leads: 0, clients: 0, items: [] }; // Return empty data structure
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch monthly commission: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching monthly commission data:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !!selectedMonth
  });
  
  // Get commission data for the previous month (for comparison)
  const previousMonth = getPreviousMonth(selectedMonth);
  const { data: prevMonthCommission } = useQuery({
    queryKey: ["/api/commissions/monthly/user", user?.id, previousMonth],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const response = await fetch(`/api/commissions/monthly/user/${user.id}/${previousMonth}`);
        if (response.status === 404) {
          return { total: 0, leads: 0, clients: 0, items: [] }; // Return empty data structure
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch previous month commission: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching previous month commission data:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !!previousMonth
  });
  
  // Calculate growth percentage
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };
  
  // Helper to get the previous month string in YYYY-MM format
  function getPreviousMonth(dateString: string): string {
    const [year, month] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, 1); // Month is 0-indexed in JS Date
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  
  // Format month for display
  const formatMonth = (monthString: string): string => {
    const [year, month] = monthString.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Determine if user can export commissions
  const canExportCommissions = 
    role?.department === "admin" || 
    role?.level >= 3 ||
    (role?.permissions && role.permissions.canExportCommissions);
  
  // Handle loading state for all queries
  const isLoading = isLoadingUserCommissions || isLoadingMonthly;
  
  // Handle error state
  const error = userCommissionsError || monthlyError;
  const isError = Boolean(error);
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  // Render error state with a clean fallback view
  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Commission Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              {error instanceof Error ? error.message : "Failed to load commission data"}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/commissions/monthly/user", user?.id] });
                queryClient.invalidateQueries({ queryKey: ["/api/commissions/monthly/user", user?.id, selectedMonth] });
              }}
            >
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If no commission data found, show empty state
  if (!userCommissions || userCommissions.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            CRM Commissions
          </h1>
        </div>
        
        <Card className="border-blue-200 bg-blue-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-blue-700">No Commission Data Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-600">
              There is no commission data available yet. Commissions are calculated based on successfully closed deals and clients onboarded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Process the data for display
  const currentMonthData = monthlyCommission || { total: 0, leads: 0, clients: 0, items: [] };
  const prevMonthData = prevMonthCommission || { total: 0, leads: 0, clients: 0, items: [] };
  
  // Calculate growth rates
  const totalGrowth = calculateGrowth(currentMonthData.total, prevMonthData.total);
  const leadsGrowth = calculateGrowth(currentMonthData.leads, prevMonthData.leads);
  const clientsGrowth = calculateGrowth(currentMonthData.clients, prevMonthData.clients);

  return (
    <div className="container mx-auto">
      {/* Page header */}
      <MotionWrapper animation="fade-down" delay={0.1}>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                CRM Commissions
              </h1>
              <p className="text-gray-500">
                Track your sales performance and commission earnings
              </p>
            </div>
            {canExportCommissions && (
              <Button
                variant="outline"
                className="mt-4 sm:mt-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            )}
          </div>
        </div>
      </MotionWrapper>
      
      {/* Month selector */}
      <MotionWrapper animation="fade-up" delay={0.2}>
        <Card className="shadow mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="flex items-center mb-4 sm:mb-0">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <span className="font-medium">Select Month: </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {userCommissions.map((commission: any) => (
                  <Button
                    key={commission.month}
                    variant={selectedMonth === commission.month ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMonth(commission.month)}
                  >
                    {formatMonth(commission.month)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </MotionWrapper>
      
      {/* Summary cards */}
      <MotionWrapper animation="fade-up" delay={0.3}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <CommissionSummaryItem
            title="Total Commission"
            amount={currentMonthData.total}
            growth={totalGrowth}
            period={formatMonth(selectedMonth)}
          />
          <CommissionSummaryItem
            title="New Leads Converted"
            amount={currentMonthData.leads}
            growth={leadsGrowth}
            period={formatMonth(selectedMonth)}
          />
          <CommissionSummaryItem
            title="New Clients Onboarded"
            amount={currentMonthData.clients}
            growth={clientsGrowth}
            period={formatMonth(selectedMonth)}
          />
        </div>
      </MotionWrapper>
      
      {/* Commission details */}
      <MotionWrapper animation="fade-up" delay={0.4}>
        <Card className="shadow">
          <CardHeader>
            <CardTitle className="text-lg">Commission Details</CardTitle>
            <CardDescription>
              Breakdown of your commission for {formatMonth(selectedMonth)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMonthData.items && currentMonthData.items.length > 0 ? (
                  currentMonthData.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell className="font-medium">{item.clientName}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.type === 'Lead' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                          'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {item.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                      No commission entries for this month
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </MotionWrapper>
    </div>
  );
}