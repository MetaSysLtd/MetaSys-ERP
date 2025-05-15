import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, TrendingUpIcon, TrendingDownIcon, WifiIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/use-socket";
import { useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";

interface CommissionPerformanceProps {
  userId?: number;
  type?: 'sales' | 'dispatch';
}

export default function CommissionPerformance({ userId, type = 'sales' }: CommissionPerformanceProps) {
  const { user } = useAuth();
  
  // Get current month and previous month
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const prevMonthDate = new Date(today);
  prevMonthDate.setMonth(today.getMonth() - 1);
  const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  
  // User ID to fetch (if userId prop is provided, use that; otherwise use current user)
  const targetUserId = userId || user?.id;
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();
  
  // Set up socket listeners for real-time commission updates
  useEffect(() => {
    if (!targetUserId || !socket) return;
    
    // Subscribe to commission update events
    const eventName = `commission_update_${targetUserId}`;
    
    const handleCommissionUpdate = (data: any) => {
      console.log('Received commission update:', data);
      
      // Invalidate the queries to trigger a refetch
      queryClient.invalidateQueries({ 
        queryKey: ['/api/commissions/monthly', targetUserId, currentMonth]
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['/api/commissions/monthly', targetUserId, prevMonth]
      });
    };
    
    // Set up the event listener
    socket.on(eventName, handleCommissionUpdate);
    
    // Clean up subscription when component unmounts
    return () => {
      socket.off(eventName, handleCommissionUpdate);
    };
  }, [targetUserId, socket, queryClient, currentMonth, prevMonth]);
  
  // Fetch current month's commission
  const { data: currentCommission, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['/api/commissions/monthly', targetUserId, currentMonth],
    queryFn: async () => {
      if (!targetUserId) return null;
      
      try {
        const response = await fetch(`/api/commissions/monthly/user/${targetUserId}/${currentMonth}`);
        if (response.status === 404) {
          return null; // No commission found for this month
        }
        if (!response.ok) {
          throw new Error('Failed to fetch commission data');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching current month commission:', error);
        return null;
      }
    },
    enabled: !!targetUserId,
  });

  // Fetch previous month's commission for comparison
  const { data: prevCommission, isLoading: isLoadingPrev } = useQuery({
    queryKey: ['/api/commissions/monthly', targetUserId, prevMonth],
    queryFn: async () => {
      if (!targetUserId) return null;
      
      try {
        const response = await fetch(`/api/commissions/monthly/user/${targetUserId}/${prevMonth}`);
        if (response.status === 404) {
          return null; // No commission found for this month
        }
        if (!response.ok) {
          throw new Error('Failed to fetch commission data');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching previous month commission:', error);
        return null;
      }
    },
    enabled: !!targetUserId,
  });

  // Calculate performance metrics
  const performance = {
    current: currentCommission?.amount || 0,
    previous: prevCommission?.amount || 0,
    percentChange: 0,
    isPositive: false,
    progressPercentage: 0,
    targetAmount: type === 'sales' ? 50000 : 75000, // Example target amounts
  };

  if (performance.previous > 0) {
    performance.percentChange = Math.round(((performance.current - performance.previous) / performance.previous) * 100);
    performance.isPositive = performance.percentChange >= 0;
  }

  performance.progressPercentage = Math.min(Math.round((performance.current / performance.targetAmount) * 100), 100);

  const isLoading = isLoadingCurrent || isLoadingPrev;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commission Performance</CardTitle>
          <CardDescription>
            Monthly commission progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!currentCommission && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commission Performance</CardTitle>
          <CardDescription>
            {type === 'sales' ? 'Sales' : 'Dispatch'} commission progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            iconType="finance"
            iconSize={28}
            title="No Commission Data"
            message={`No ${type} commission data is available for the current period.`}
            description="Performance metrics will appear once commission data is generated."
            placeholderData={
              <div className="space-y-4 mt-3">
                <div className="flex flex-col items-center space-y-2 max-w-md mx-auto">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg w-full">
                    <p className="text-sm text-gray-500">Current Month</p>
                    <p className="text-2xl font-bold text-gray-400">PKR 0</p>
                    <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-2"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    {type === 'sales' ? (
                      <>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm text-gray-500">Active Leads</p>
                          <p className="font-medium text-gray-400">0</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm text-gray-500">Inbound Status</p>
                          <p className="font-medium text-gray-400">0 leads</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm text-gray-500">Team Target</p>
                          <Badge variant="outline" className="bg-transparent text-gray-400">Not Met</Badge>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm text-gray-500">Invoice Total</p>
                          <p className="font-medium text-gray-400">PKR 0</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm text-gray-500">Completed Loads</p>
                          <p className="font-medium text-gray-400">0</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-sm text-gray-500">Active Leads</p>
                          <p className="font-medium text-gray-400">0</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    );
  }

  // Get the right metrics based on commission type
  interface MetricItem {
    label: string;
    value: any;
    target?: number;
    progressPercentage?: number;
    description?: string;
    badgeVariant?: 'default' | 'outline';
  }
  
  let specificMetrics: MetricItem[];
  
  if (type === 'sales') {
    specificMetrics = [
      { 
        label: 'Active Leads', 
        value: currentCommission?.metrics?.activeLeads || 0,
        target: 10,
        progressPercentage: Math.min(((currentCommission?.metrics?.activeLeads || 0) / 10) * 100, 100)
      },
      { 
        label: 'Inbound Status', 
        value: `${(currentCommission?.metrics?.inboundLeads || 0)} leads`,
        description: 'Inbound leads qualify for special bonus'
      },
      { 
        label: 'Team Target', 
        value: currentCommission?.metrics?.teamTargetMet ? 'Met' : 'Not Met',
        badgeVariant: currentCommission?.metrics?.teamTargetMet ? 'default' : 'outline'
      }
    ];
  } else {
    specificMetrics = [
      { 
        label: 'Invoice Total', 
        value: `PKR ${currentCommission?.metrics?.invoiceTotal?.toLocaleString() || 0}`,
        target: 3700,
        progressPercentage: Math.min(((currentCommission?.metrics?.invoiceTotal || 0) / 3700) * 100, 100)
      },
      { 
        label: 'Completed Loads', 
        value: currentCommission?.metrics?.completedLoads || 0
      },
      { 
        label: 'Active Leads', 
        value: currentCommission?.metrics?.activeLeads || 0,
        description: '≥3 active leads earns bonus'
      }
    ];
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Commission Performance</CardTitle>
            <CardDescription>
              {type === 'sales' ? 'Sales' : 'Dispatch'} commission progress
            </CardDescription>
          </div>
          {connected && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center">
                    <WifiIcon className="h-4 w-4 text-green-500 mr-1" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Real-time updates active</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm text-muted-foreground">Current Month</p>
                <p className="text-2xl font-bold">PKR {performance.current.toLocaleString()}</p>
              </div>
              {performance.previous > 0 && (
                <div className="flex items-center">
                  {performance.isPositive ? (
                    <TrendingUpIcon className="h-5 w-5 text-green-500 mr-1" />
                  ) : (
                    <TrendingDownIcon className="h-5 w-5 text-red-500 mr-1" />
                  )}
                  <span className={performance.isPositive ? "text-green-500" : "text-red-500"}>
                    {performance.isPositive ? '+' : ''}{performance.percentChange}%
                  </span>
                </div>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Progress value={performance.progressPercentage} className="h-2" />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>0</span>
                      <span>Target: PKR {performance.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{performance.progressPercentage}% of monthly target</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {specificMetrics.map((metric, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    {metric.description && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{metric.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className="mt-1">
                    {metric.badgeVariant ? (
                      <Badge variant={metric.badgeVariant}>
                        {metric.value}
                      </Badge>
                    ) : (
                      <p className="font-medium">{metric.value}</p>
                    )}
                  </div>
                  {metric.progressPercentage !== undefined && (
                    <div className="mt-2">
                      <Progress value={metric.progressPercentage} className="h-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {(type === 'sales' && currentCommission?.metrics?.teamLeadBonus) ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium">Team Lead Bonus</p>
                <p className="text-lg font-bold">PKR {currentCommission.metrics.teamLeadBonus.toLocaleString()}</p>
              </div>
            ) : (type === 'dispatch' && (
              currentCommission?.metrics?.ownLeadBonus || 
              currentCommission?.metrics?.newLeadBonus ||
              currentCommission?.metrics?.first2WeeksBonus
            )) ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium">Bonus Breakdown</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {currentCommission?.metrics?.ownLeadBonus > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Own Lead Bonus</p>
                      <p className="font-medium">PKR {currentCommission.metrics.ownLeadBonus.toLocaleString()}</p>
                    </div>
                  )}
                  {currentCommission?.metrics?.newLeadBonus > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">New Lead Bonus</p>
                      <p className="font-medium">PKR {currentCommission.metrics.newLeadBonus.toLocaleString()}</p>
                    </div>
                  )}
                  {currentCommission?.metrics?.first2WeeksBonus > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">First 2 Weeks Bonus</p>
                      <p className="font-medium">PKR {currentCommission.metrics.first2WeeksBonus.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}