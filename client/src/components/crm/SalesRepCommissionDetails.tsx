import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowUp, ArrowDown, HelpCircle, Medal, DollarSign, Target, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface SalesRepCommissionDetailsProps {
  userId: number;
  month: string;
}

export default function SalesRepCommissionDetails({ 
  userId, 
  month 
}: SalesRepCommissionDetailsProps) {
  // Fetch commission metrics data
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['/api/commissions/metrics', userId, month],
    queryFn: () => fetch(`/api/commissions/metrics/${userId}?month=${month}`).then(res => res.json())
  });
  
  // Fetch commission data for the month
  const { data: commissionData, isLoading: commissionLoading, error: commissionError } = useQuery({
    queryKey: ['/api/commissions/monthly/user', userId, month],
    queryFn: () => fetch(`/api/commissions/monthly/user/${userId}/${month}`).then(res => res.json())
  });
  
  // Loading state
  if (metricsLoading || commissionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Error state
  if (metricsError || commissionError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load commission data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Format month for display
  const formatMonth = (monthStr: string): string => {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Function to get the tier based on commission total
  function getTier(total: number): string {
    if (total >= 20000) return "Diamond";
    if (total >= 15000) return "Platinum";
    if (total >= 10000) return "Gold";
    if (total >= 5000) return "Silver";
    return "Bronze";
  }
  
  // Function to get next tier threshold
  function getNextTierThreshold(currentTier: string): number {
    switch (currentTier) {
      case "Diamond": return 25000; // Just for visualization
      case "Platinum": return 20000;
      case "Gold": return 15000;
      case "Silver": return 10000;
      case "Bronze": return 5000;
      default: return 5000;
    }
  }
  
  // Function to get next tier name
  function getNextTier(currentTier: string): string {
    switch (currentTier) {
      case "Diamond": return "Diamond+";
      case "Platinum": return "Diamond";
      case "Gold": return "Platinum";
      case "Silver": return "Gold";
      case "Bronze": return "Silver";
      default: return "Bronze";
    }
  }
  
  // Calculate progress to next tier
  const currentTier = getTier(commissionData?.total || 0);
  const nextTierThreshold = getNextTierThreshold(currentTier);
  const nextTier = getNextTier(currentTier);
  const progressToNextTier = Math.min(100, Math.round((commissionData?.total / nextTierThreshold) * 100));
  
  // Get color for tier badge
  const getTierColor = (tier: string): string => {
    switch (tier) {
      case "Diamond": return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "Platinum": return "bg-slate-100 text-slate-800 border-slate-300";
      case "Gold": return "bg-amber-100 text-amber-800 border-amber-300";
      case "Silver": return "bg-gray-100 text-gray-800 border-gray-300";
      case "Bronze": return "bg-orange-100 text-orange-800 border-orange-300";
      default: return "";
    }
  };
  
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with performance overview */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Commission Details: {commissionData?.firstName} {commissionData?.lastName}
            </h2>
            <p className="text-muted-foreground">
              Performance for {formatMonth(month)}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={getTierColor(currentTier)}>
              {currentTier} Tier
            </Badge>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Commission tiers are based on monthly performance:
                  <br />
                  Bronze: Up to $5,000
                  <br />
                  Silver: $5,000 - $10,000
                  <br />
                  Gold: $10,000 - $15,000
                  <br />
                  Platinum: $15,000 - $20,000
                  <br />
                  Diamond: $20,000+
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* Main performance metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Commission
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(commissionData?.total || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Base: {formatCurrency(commissionData?.baseCommission || 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Leads Handled
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.activeLeads || 0}</div>
              <p className="text-xs text-muted-foreground">
                {metrics?.performance?.leadProgress || 0}% of target
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Clients
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{commissionData?.clients || 0}</div>
              <p className="text-xs text-muted-foreground">
                From {metrics?.leadsConverted || 0} converted leads
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Call Activity
              </CardTitle>
              <Medal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.callsMade || 0}</div>
              <p className="text-xs text-muted-foreground">
                {metrics?.performance?.callProgress || 0}% of target
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tier progress section */}
        <Card>
          <CardHeader>
            <CardTitle>Tier Progress</CardTitle>
            <CardDescription>
              {formatCurrency(commissionData?.total || 0)} of {formatCurrency(nextTierThreshold)} to reach {nextTier} tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress
                value={progressToNextTier}
                className="h-2"
                indicatorClassName={
                  currentTier === "Diamond" 
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500" 
                    : undefined
                }
              />
              
              <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Current Tier</span>
                  <span className="font-medium">{currentTier}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-muted-foreground">Next Tier</span>
                  <span className="font-medium">{nextTier}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs section for detailed breakdown */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="bonuses">Bonuses & Adjustments</TabsTrigger>
            <TabsTrigger value="targets">Performance Targets</TabsTrigger>
          </TabsList>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commission Transactions</CardTitle>
                <CardDescription>
                  All commission-eligible transactions for {formatMonth(month)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {commissionData?.items && commissionData.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionData.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {new Date(item.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{item.clientName}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.leadSource}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                item.status === "Paid"
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-300"
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No transactions recorded for this period.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Bonuses Tab */}
          <TabsContent value="bonuses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bonuses & Adjustments</CardTitle>
                <CardDescription>
                  Additional incentives and performance bonuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Base and adjusted commission */}
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="p-4 rounded-lg border bg-background">
                      <div className="font-medium mb-1">Base Commission</div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(commissionData?.baseCommission || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Standard rate on eligible transactions
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-background">
                      <div className="font-medium mb-1">Adjusted Commission</div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(commissionData?.adjustedCommission || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        After all adjustments and bonuses
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Bonus breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Bonus Breakdown</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Medal className="h-4 w-4 text-amber-600" />
                          <span>Rep of Month Bonus</span>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(commissionData?.bonuses?.repOfMonth || 0)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span>Active Trucks Bonus</span>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(commissionData?.bonuses?.activeTrucks || 0)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <span>Team Lead Bonus</span>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(commissionData?.bonuses?.teamLead || 0)}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-bold">Total Bonuses</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(
                            (commissionData?.bonuses?.repOfMonth || 0) +
                            (commissionData?.bonuses?.activeTrucks || 0) +
                            (commissionData?.bonuses?.teamLead || 0)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Targets Tab */}
          <TabsContent value="targets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Targets</CardTitle>
                <CardDescription>
                  Progress toward monthly performance goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Lead targets */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <div className="font-medium">Leads</div>
                      <div>
                        {metrics?.activeLeads || 0} / {metrics?.targets?.leadTarget || 0}
                      </div>
                    </div>
                    <Progress value={metrics?.performance?.leadProgress || 0} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics?.performance?.leadProgress || 0}% of monthly target
                    </p>
                  </div>
                  
                  {/* Client targets */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <div className="font-medium">New Clients</div>
                      <div>
                        {commissionData?.clients || 0} / {metrics?.targets?.clientTarget || 0}
                      </div>
                    </div>
                    <Progress 
                      value={
                        metrics?.targets?.clientTarget 
                          ? Math.min(100, Math.round(((commissionData?.clients || 0) / metrics.targets.clientTarget) * 100))
                          : 0
                      } 
                      className="h-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics?.targets?.clientTarget 
                        ? Math.min(100, Math.round(((commissionData?.clients || 0) / metrics.targets.clientTarget) * 100))
                        : 0}% of monthly target
                    </p>
                  </div>
                  
                  {/* Revenue targets */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <div className="font-medium">Revenue Generated</div>
                      <div>
                        {formatCurrency(commissionData?.total || 0)} / {formatCurrency(metrics?.targets?.revenueTarget || 0)}
                      </div>
                    </div>
                    <Progress 
                      value={
                        metrics?.targets?.revenueTarget 
                          ? Math.min(100, Math.round(((commissionData?.total || 0) / metrics.targets.revenueTarget) * 100))
                          : 0
                      } 
                      className="h-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics?.targets?.revenueTarget 
                        ? Math.min(100, Math.round(((commissionData?.total || 0) / metrics.targets.revenueTarget) * 100))
                        : 0}% of monthly target
                    </p>
                  </div>
                  
                  {/* Call activity targets */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <div className="font-medium">Call Activity</div>
                      <div>
                        {metrics?.callsMade || 0} / {metrics?.targets?.callTarget || 0}
                      </div>
                    </div>
                    <Progress value={metrics?.performance?.callProgress || 0} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics?.performance?.callProgress || 0}% of monthly target
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Alert className="w-full">
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>Incentive Tracking</AlertTitle>
                  <AlertDescription>
                    Meeting or exceeding targets directly impacts your commission tier and bonus eligibility.
                  </AlertDescription>
                </Alert>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}