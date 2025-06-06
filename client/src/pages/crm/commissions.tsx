import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Loader2,
  Filter,
  ChevronDown,
  Search
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { formatCurrency, formatDate } from "@/lib/utils";
import SalesRepLeaderboard from "@/components/crm/SalesRepLeaderboard";
import SalesRepCommissionDetails from "@/components/crm/SalesRepCommissionDetails";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Animation variants
const animations = {
  "fade": {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  "fade-in": {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  "fade-up": {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  "fade-down": {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  "fade-left": {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  "fade-right": {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  "zoom": {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  }
};

// MotionWrapper component
interface MotionWrapperProps {
  children: React.ReactNode;
  animation?: keyof typeof animations;
  delay?: number;
  duration?: number;
  className?: string;
}

function MotionWrapper({
  children,
  animation = "fade",
  delay = 0,
  duration = 0.3,
  className = ""
}: MotionWrapperProps) {
  const animationProps = animations[animation];

  return (
    <motion.div 
      initial={animationProps.initial}
      animate={animationProps.animate}
      exit={animationProps.exit}
      transition={{ 
        duration, 
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
  const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
  const [selectedUserId, setSelectedUserId] = useState<number>(user?.id || 1);
  
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
        const data = await response.json();
        // Handle possible responses formats and ensure we always return an array
        if (Array.isArray(data)) {
          return data;
        } else if (data && typeof data === 'object') {
          // If it's a single object, wrap it in an array
          // Use last 6 months as available commission months
          const months = [];
          const currentDate = new Date();
          for (let i = 0; i < 6; i++) {
            const date = new Date(currentDate);
            date.setMonth(date.getMonth() - i);
            months.push({
              month: date.toISOString().slice(0, 7),
            });
          }
          return months;
        }
        return [];
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

  // Query for all sales reps
  const { data: salesReps, isLoading: isLoadingSalesReps } = useQuery({
    queryKey: ["/api/commissions/sales-reps", selectedMonth],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/commissions/sales-reps?month=${selectedMonth}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch sales representatives: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching sales representatives:', error);
        throw error;
      }
    },
    enabled: viewMode === 'team' && role && (role.level >= 3 || role.isAdmin)
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
    (role?.level ?? 0) >= 3 ||
    (role?.permissions && typeof role.permissions === 'object' && 'canExportCommissions' in role.permissions && role.permissions.canExportCommissions);
  
  // Check if user can view team data
  const canViewTeamData = 
    role?.isAdmin || 
    (role?.level ?? 0) >= 3 || 
    (role?.permissions && typeof role.permissions === 'object' && 'canViewTeamCommissions' in role.permissions && role.permissions.canViewTeamCommissions);
  
  // Handle loading state for all queries
  const isLoading = isLoadingUserCommissions || isLoadingMonthly || (viewMode === 'team' && isLoadingSalesReps);
  
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
  
  // Handle error state only for actual network/server errors
  if (isError && error instanceof Error && !error.message.includes('404')) {
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
              {error.message}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/commissions/monthly/user", user?.id] });
                queryClient.invalidateQueries({ queryKey: ["/api/commissions/monthly/user", user?.id, selectedMonth] });
                if (viewMode === 'team') {
                  queryClient.invalidateQueries({ queryKey: ["/api/commissions/sales-reps", selectedMonth] });
                }
              }}
            >
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Calculate growth rates for personal view
  const currentMonthData = monthlyCommission || { total: 0, leads: 0, clients: 0, items: [] };
  const prevMonthData = prevMonthCommission || { total: 0, leads: 0, clients: 0, items: [] };
  const totalGrowth = calculateGrowth(currentMonthData.total, prevMonthData.total);
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold mb-2 md:mb-0">
          Commission Details: {formatMonth(selectedMonth)}
        </h1>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative">
            <Input
              type="month"
              value={selectedMonth}
              max={currentMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-40"
            />
            <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
          
          {/* View toggle - only show if user has permission */}
          {canViewTeamData && (
            <Select
              value={viewMode}
              onValueChange={(value) => setViewMode(value as 'personal' | 'team')}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="View Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">My Commissions</SelectItem>
                <SelectItem value="team">Team Overview</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {canExportCommissions && (
            <Button variant="outline" onClick={() => {
              toast({
                title: "Export Initiated",
                description: "Your commission data is being prepared for download.",
              });
            }}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>
      
      {/* Personal view shows current user's commission data */}
      {viewMode === 'personal' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <MotionWrapper animation="fade-up" delay={0.1}>
              <CommissionSummaryItem
                title="Current Month"
                amount={currentMonthData.total}
                period={formatMonth(selectedMonth)}
              />
            </MotionWrapper>
            
            <MotionWrapper animation="fade-up" delay={0.2}>
              <CommissionSummaryItem
                title="Previous Month"
                amount={prevMonthData.total}
                period={formatMonth(previousMonth)}
              />
            </MotionWrapper>
            
            <MotionWrapper animation="fade-up" delay={0.3}>
              <CommissionSummaryItem
                title="Monthly Growth"
                amount={Math.abs(currentMonthData.total - prevMonthData.total)}
                growth={totalGrowth}
                period="Month-over-Month"
              />
            </MotionWrapper>
          </div>
          
          <MotionWrapper animation="fade-up" delay={0.4}>
            {user && (
              <SalesRepCommissionDetails userId={user.id} month={selectedMonth} />
            )}
          </MotionWrapper>
        </>
      )}
      
      {/* Team view shows leaderboard and individual details */}
      {viewMode === 'team' && (
        <>
          <Tabs defaultValue="leaderboard" className="mt-6">
            <TabsList className="mb-4">
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="individual">Individual Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="leaderboard">
              <MotionWrapper animation="fade-up" delay={0.1}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Sales Team Leaderboard
                    </CardTitle>
                    <CardDescription>
                      Performance ranking for {formatMonth(selectedMonth)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSalesReps ? (
                      <div className="py-10">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary/70" />
                      </div>
                    ) : salesReps && salesReps.length > 0 ? (
                      <SalesRepLeaderboard 
                        salesReps={salesReps} 
                        month={selectedMonth}
                        onSelectRep={(userId) => {
                          setSelectedUserId(userId);
                          // Switch to individual tab
                          const individualTab = document.querySelector('[data-value="individual"]') as HTMLElement;
                          if (individualTab) individualTab.click();
                        }}
                      />
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        <BarChart2 className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-lg font-medium">No Sales Representatives</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          No active sales representatives found.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </MotionWrapper>
            </TabsContent>
            
            <TabsContent value="individual">
              {salesReps && salesReps.length > 0 && (
                <div className="mb-4">
                  <Select
                    value={selectedUserId.toString()}
                    onValueChange={(value) => setSelectedUserId(Number(value))}
                  >
                    <SelectTrigger className="w-full md:w-72">
                      <SelectValue placeholder="Select Sales Representative" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesReps.map(rep => (
                        <SelectItem key={rep.userId} value={rep.userId.toString()}>
                          {rep.firstName} {rep.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <MotionWrapper animation="fade-up" delay={0.2}>
                {selectedUserId && (
                  <SalesRepCommissionDetails userId={selectedUserId} month={selectedMonth} />
                )}
              </MotionWrapper>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}