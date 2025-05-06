import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Award, 
  AlertTriangle, 
  BarChart2, 
  FileText, 
  Users, 
  Filter 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/utils";

// Types
interface CommissionItem {
  id: number;
  date: string;
  clientName: string;
  type: string;
  amount: number;
  leadSource?: string;
  status?: string;
}

interface CommissionMetrics {
  targetAmount: number;
  currentAmount: number;
  previousAmount: number;
  leads: number;
  clients: number;
  growth: number;
  targetPercentage: number;
  deptRank: number;
  deptTotal: number;
  badges: string[];
  allTimeLeads?: number;
  allTimeClients?: number;
  consecutiveGrowth?: number;
}

interface SalesRepCommissionDetailsProps {
  userId: number;
  month: string;
}

const SalesRepCommissionDetails = ({ userId, month }: SalesRepCommissionDetailsProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user details
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/users", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user details: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch commission details for this user and month
  const { data: commission, isLoading: isLoadingCommission, error } = useQuery({
    queryKey: ["/api/commissions/monthly/user", userId, month],
    queryFn: async () => {
      const response = await fetch(`/api/commissions/monthly/user/${userId}/${month}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch commission details: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!userId && !!month,
  });

  // Fetch user metrics
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["/api/commissions/metrics", userId, month],
    queryFn: async () => {
      const response = await fetch(`/api/commissions/metrics/${userId}?month=${month}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch commission metrics: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!userId && !!month,
  });

  // Handle loading state
  const isLoading = isLoadingUser || isLoadingCommission || isLoadingMetrics;

  // Get initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get badge component based on badge type
  const getBadgeComponent = (badge: string) => {
    switch (badge) {
      case "top-performer":
        return (
          <Badge className="bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-100">
            <Award className="h-3 w-3 mr-1" /> Top Performer
          </Badge>
        );
      case "target-achieved":
        return (
          <Badge className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100">
            <Award className="h-3 w-3 mr-1" /> Target Achieved
          </Badge>
        );
      case "consistent-growth":
        return (
          <Badge className="bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-100">
            <TrendingUp className="h-3 w-3 mr-1" /> Consistent Growth
          </Badge>
        );
      case "at-risk":
        return (
          <Badge className="bg-red-100 text-red-800 border border-red-200 hover:bg-red-100">
            <AlertTriangle className="h-3 w-3 mr-1" /> Target Missed
          </Badge>
        );
      default:
        return null;
    }
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
          <Skeleton className="h-48 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Commission Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Failed to load commission details"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // If user or commission data is not available
  if (!user || !commission || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Commission Data</CardTitle>
          <CardDescription>No commission data available for this user and month.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Format month for display
  const formatMonth = (monthString: string): string => {
    const [year, month] = monthString.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* User header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center">
          <Avatar className="h-16 w-16 mr-4">
            <AvatarImage src={user.profileImageUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback className="text-lg">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
            <p className="text-gray-500">{user.role || 'Sales Representative'}</p>
            <div className="flex mt-2 space-x-2">
              {metrics.badges.map(badge => (
                <div key={badge}>{getBadgeComponent(badge)}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="mr-2">
            <Calendar className="h-4 w-4 mr-2" />
            {formatMonth(month)}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Commission Earned</p>
                <h3 className="text-2xl font-bold text-[#025E73]">{formatCurrency(metrics.currentAmount)}</h3>
                {metrics.growth !== undefined && (
                  <p className={`text-xs flex items-center mt-1 ${metrics.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.growth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />}
                    {Math.abs(metrics.growth)}% vs last month
                  </p>
                )}
              </div>
              <div className="bg-blue-50 p-2 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Target Progress</p>
                <h3 className="text-2xl font-bold text-[#025E73]">{metrics.targetPercentage}%</h3>
                <p className="text-xs text-gray-500 mt-1">Target: {formatCurrency(metrics.targetAmount)}</p>
              </div>
              <div className="bg-green-50 p-2 rounded-full">
                <BarChart2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <Progress 
              value={metrics.targetPercentage} 
              className="mt-4"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Rank</p>
                <h3 className="text-2xl font-bold text-[#025E73]">#{metrics.deptRank}</h3>
                <p className="text-xs text-gray-500 mt-1">of {metrics.deptTotal} sales reps</p>
              </div>
              <div className="bg-amber-50 p-2 rounded-full">
                <Award className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Transaction Details</TabsTrigger>
          <TabsTrigger value="stats">Performance Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
              <CardDescription>
                Summary of performance for {formatMonth(month)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-4">Performance Metrics</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Leads Converted</span>
                        <span className="font-medium">{metrics.leads}</span>
                      </div>
                      <Progress value={(metrics.leads / 20) * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Clients Onboarded</span>
                        <span className="font-medium">{metrics.clients}</span>
                      </div>
                      <Progress value={(metrics.clients / 10) * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Commission Progress</span>
                        <span className="font-medium">{metrics.targetPercentage}%</span>
                      </div>
                      <Progress value={metrics.targetPercentage} />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-4">Recent Activity</h4>
                  <div className="space-y-3">
                    {commission.items && commission.items.length > 0 ? (
                      commission.items.slice(0, 5).map((item: CommissionItem) => (
                        <div key={item.id} className="border-b pb-3 last:border-b-0">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{item.clientName}</p>
                              <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(item.amount)}</p>
                              <Badge variant="outline" className="text-xs">
                                {item.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Details</CardTitle>
              <CardDescription>
                Breakdown of commission transactions for {formatMonth(month)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commission.items && commission.items.length > 0 ? (
                    commission.items.map((item: CommissionItem) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.leadSource || 'Direct'}</TableCell>
                        <TableCell>
                          <Badge className={
                            item.status === 'Paid' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : item.status === 'Pending' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }>
                            {item.status || 'Completed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        No commission entries for this month
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="text-sm">
                <span className="font-medium">Total:</span> {commission.items?.length || 0} transactions
              </div>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Export Details
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Statistics</CardTitle>
              <CardDescription>
                Detailed performance metrics and comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-4">All-Time Stats</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-blue-50 p-2 rounded-full mr-3">
                          <Users className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Leads Converted</p>
                          <p className="font-medium">{metrics.allTimeLeads || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-green-50 p-2 rounded-full mr-3">
                          <Users className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Clients Onboarded</p>
                          <p className="font-medium">{metrics.allTimeClients || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-amber-50 p-2 rounded-full mr-3">
                          <TrendingUp className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Consecutive Growth Months</p>
                          <p className="font-medium">{metrics.consecutiveGrowth || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-4">Comparison vs Target</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Monthly Commission</span>
                        <span className="font-medium">{formatCurrency(metrics.currentAmount)} / {formatCurrency(metrics.targetAmount)}</span>
                      </div>
                      <Progress value={metrics.targetPercentage} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Month-over-Month Growth</span>
                        <span className={metrics.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {metrics.growth >= 0 ? '+' : ''}{metrics.growth}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(Math.max(metrics.growth + 20, 0), 100)} 
                        className={metrics.growth >= 0 ? 'bg-green-100' : 'bg-red-100'}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Department Rank</span>
                        <span className="font-medium">#{metrics.deptRank} of {metrics.deptTotal}</span>
                      </div>
                      <Progress 
                        value={Math.max(100 - ((metrics.deptRank / metrics.deptTotal) * 100), 0)} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesRepCommissionDetails;