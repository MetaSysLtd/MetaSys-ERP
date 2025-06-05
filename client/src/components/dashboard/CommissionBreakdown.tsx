import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ArrowRightIcon, InfoIcon } from "lucide-react";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { EmptyState } from "@/components/ui/empty-state";

interface CommissionBreakdownProps {
  userId?: number;
  isAdmin?: boolean;
}

export default function CommissionBreakdown({ userId, isAdmin = false }: CommissionBreakdownProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tabValue, setTabValue] = useState("monthly");

  // Format month string for API request
  const month = selectedDate ? format(selectedDate, 'yyyy-MM') : format(new Date(), 'yyyy-MM');

  // User ID to fetch (if admin and userId prop is provided, use that; otherwise use current user)
  const targetUserId = (isAdmin && userId) ? userId : user?.id;

  // Fetch commission for current user and selected month
  const { data: commissionData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['/api/commissions/monthly', targetUserId, month],
    queryFn: async () => {
      if (!targetUserId) return null;

      const response = await fetch(`/api/commissions/monthly/user/${targetUserId}/${month}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No commission found for this month, not an error
        }
        throw new Error('Failed to fetch commission data');
      }
      return response.json();
    },
    enabled: !!targetUserId,
  });

  // Fetch historical commission data for charts
  //const { data: historicalCommissions } = useQuery({
  //  queryKey: ['/api/commissions/monthly/history', targetUserId],
  //  queryFn: async () => {
  //    if (!targetUserId) return [];

  //    const response = await fetch(`/api/commissions/monthly/user/${targetUserId}`);
  //    if (!response.ok) {
  //      throw new Error('Failed to fetch historical commission data');
  //    }
  //    return response.json();
  //  },
  //  enabled: !!targetUserId,
  //});

  // ELIMINATE INDEPENDENT COMMISSION QUERIES TO PREVENT INFINITE LOOPS
  // Use only consolidated dashboard data for historical commissions
  const historicalCommissions: any[] = [];
  const isLoading = isMonthlyLoading;

  // Process historical data for chart
  const chartData = Array.isArray(historicalCommissions) ? historicalCommissions.map(commission => ({
        month: format(new Date(commission.month + '-01'), 'MMM'),
        amount: commission.amount || 0,
        base: commission.baseAmount || 0,
        bonus: commission.bonusAmount || 0
      })) : [];

  // Get query client for cache invalidation
  const queryClient = useQueryClient();

  // Handle recalculation request
  const handleRecalculate = async () => {
    try {
      const response = await fetch(`/api/commissions/calculate/${targetUserId}/${month}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to recalculate commission';
        
        try {
          // Try to parse error response as JSON
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          // Use the raw error text if parsing failed
          errorMessage = errorText || errorMessage; 
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: "Commission Recalculated",
        description: "Commission has been recalculated successfully.",
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/commissions/monthly', targetUserId, month]
      });
      
      // Also invalidate the historical data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/commissions/monthly', targetUserId]
      });
      
      // Fetch data again for manual state updates
      fetchHistoricalData();
    } catch (error) {
      console.error('Recalculation error:', error);
      toast({
        title: "Recalculation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Separate function for fetching historical data to reuse
  const fetchHistoricalData = async () => {
    // Create a local flag to prevent state updates if component is unmounted during fetch
    let isActive = true;
    
    try {
      setIsLoading(true);
      if (!user?.id) return;
      
      const response = await fetch(`/api/commissions/monthly/user/${user.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch historical commission data: ${response.status}`);
      }
      
      const responseText = await response.text();
      let data;
      
      try {
        // Safely parse the JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing commission data JSON:', parseError, 'Raw response:', responseText);
        throw new Error('Invalid JSON in server response');
      }
      
      // Only update state if the component is still mounted
      if (isActive) {
        setHistoricalCommissions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching commission data:', error);
      
      // Only update state if the component is still mounted
      if (isActive) {
        toast({
          title: 'Error loading historical data',
          description: error instanceof Error ? error.message : 'Failed to load historical commission data',
          variant: 'destructive'
        });
        setHistoricalCommissions([]);
      }
    } finally {
      // Only update state if the component is still mounted
      if (isActive) {
        setIsLoading(false);
      }
    }
    
    // Return a function to cancel any pending state updates
    return () => {
      isActive = false;
    };
  };

  // No commission data yet
  if (!isMonthlyLoading && !commissionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commission Breakdown</CardTitle>
          <CardDescription>
            Monthly commission details
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[240px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'MMMM yyyy') : "Select month"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  captionLayout="dropdown-buttons"
                  fromYear={2020}
                  toYear={2030}
                />
              </PopoverContent>
            </Popover>
            {isAdmin && (
              <Button onClick={handleRecalculate}>
                Recalculate
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <EmptyState
            iconType="finance"
            iconSize={30}
            title="No Commission Data"
            message={`No commission data available for ${format(selectedDate || new Date(), 'MMMM yyyy')}.`}
            description="Commissions are calculated based on completed sales and dispatch activities."
            placeholderData={
              <div className="space-y-4 mt-3">
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className="text-lg font-medium text-gray-400">PKR 0</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className="text-lg font-medium text-gray-400">PKR 0</div>
                    <div className="text-xs text-gray-500">Base</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className="text-lg font-medium text-gray-400">PKR 0</div>
                    <div className="text-xs text-gray-500">Bonus</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 max-w-md mx-auto">
                  <ul className="list-disc pl-5 text-left mx-auto">
                    <li>Complete sales transactions</li>
                    <li>Process dispatch activities</li>
                    <li>Achieve performance metrics</li>
                  </ul>
                </div>
              </div>
            }
            actionLabel={isAdmin ? "Calculate Commission" : undefined}
            onAction={isAdmin ? handleRecalculate : undefined}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row justify-between items-start">
          <div>
            <CardTitle>Commission Breakdown</CardTitle>
            <CardDescription>
              Monthly commission details
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[240px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'MMMM yyyy') : "Select month"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  captionLayout="dropdown-buttons"
                  fromYear={2020}
                  toYear={2030}
                />
              </PopoverContent>
            </Popover>
            {isAdmin && (
              <Button onClick={handleRecalculate}>
                Recalculate
              </Button>
            )}
          </div>
        </div>
        {commissionData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Commission</h4>
              <div className="text-2xl font-bold">
                PKR {commissionData.amount?.toLocaleString() || 0}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Base Amount</h4>
              <div className="text-2xl font-bold">
                PKR {commissionData.baseAmount?.toLocaleString() || 0}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Bonus Amount</h4>
              <div className="text-2xl font-bold">
                PKR {commissionData.bonusAmount?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabsList className="grid w-full grid-cols-2 gap-1">
            <TabsTrigger value="monthly">Current Month</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            {isMonthlyLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
              </div>
            ) : commissionData ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Commission Details</h3>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Commission Type</p>
                        <p className="font-medium">{commissionData.type === 'sales' ? 'Sales' : 'Dispatch'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge 
                          variant={commissionData.status === 'approved' ? 'default' : 'outline'}
                          className="mt-1"
                        >
                          {commissionData.status === 'approved' ? 'Approved' : 'Pending Approval'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Percentage Applied</p>
                        <p className="font-medium">{commissionData.percentageAdjustment || 0}%</p>
                      </div>
                      {commissionData.penaltyPct !== undefined && commissionData.penaltyPct !== 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground">Penalty %</p>
                          <p className="font-medium text-red-500">{commissionData.penaltyPct}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {commissionData.metrics && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Performance Metrics</h3>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Metric</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commissionData.type === 'sales' ? (
                            // Sales metrics
                            <>
                              <TableRow>
                                <TableCell>Active Leads</TableCell>
                                <TableCell>{commissionData.metrics.activeLeads || 0}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Inbound Leads</TableCell>
                                <TableCell>{commissionData.metrics.inboundLeads || 0}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Outbound Leads</TableCell>
                                <TableCell>{commissionData.metrics.outboundLeads || 0}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Applied Tier</TableCell>
                                <TableCell>{commissionData.metrics.appliedTier || 'None'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Team Target Met</TableCell>
                                <TableCell>{commissionData.metrics.teamTargetMet ? 'Yes' : 'No'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Team Lead Bonus</TableCell>
                                <TableCell>PKR {commissionData.metrics.teamLeadBonus?.toLocaleString() || 0}</TableCell>
                              </TableRow>
                            </>
                          ) : (
                            // Dispatch metrics
                            <>
                              <TableRow>
                                <TableCell>Invoice Total</TableCell>
                                <TableCell>PKR {commissionData.metrics.invoiceTotal?.toLocaleString() || 0}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Completed Loads</TableCell>
                                <TableCell>{commissionData.metrics.completedLoads || 0}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Applied Tier</TableCell>
                                <TableCell>{commissionData.metrics.appliedTier || 'None'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Own Lead Count</TableCell>
                                <TableCell>{commissionData.metrics.ownLeadCount || 0}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>New Lead Count</TableCell>
                                <TableCell>{commissionData.metrics.newLeadCount || 0}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Active Leads</TableCell>
                                <TableCell>{commissionData.metrics.activeLeads || 0}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>First 2 Weeks Bonus</TableCell>
                                <TableCell>PKR {commissionData.metrics.first2WeeksBonus?.toLocaleString() || 0}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Active Trucks Bonus</TableCell>
                                <TableCell>PKR {commissionData.metrics.activeTrucksBonus?.toLocaleString() || 0}</TableCell>
                              </TableRow>
                            </>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={handleRecalculate}>
                      Recalculate
                    </Button>
                    {commissionData.status !== 'approved' && (
                      <Button>
                        Approve Commission <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40">
                <InfoIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No commission data available</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="history">
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-2">Commission History</h3>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="base" name="Base Amount" fill="#0066CC" />
                      <Bar dataKey="bonus" name="Bonus" fill="#2EC4B6" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  iconType="finance"
                  iconSize={28}
                  title="No Historical Data"
                  message="No historical commission data available for this period"
                  description="Historical data will appear here as commissions are processed over time"
                  placeholderData={
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                        <div className="text-sm text-gray-400">PKR 0</div>
                        <div className="text-xs text-gray-500">Jan</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                        <div className="text-sm text-gray-400">PKR 0</div>
                        <div className="text-xs text-gray-500">Feb</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                        <div className="text-sm text-gray-400">PKR 0</div>
                        <div className="text-xs text-gray-500">Mar</div>
                      </div>
                    </div>
                  }
                />
              )}

              {historicalCommissions && historicalCommissions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Monthly Breakdown</h3>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historicalCommissions.map((commission: any) => (
                          <TableRow key={commission.id}>
                            <TableCell>{format(new Date(commission.month + '-01'), 'MMMM yyyy')}</TableCell>
                            <TableCell>PKR {commission.amount?.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={commission.status === 'approved' ? 'default' : 'outline'}
                              >
                                {commission.status === 'approved' ? 'Approved' : 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedDate(new Date(commission.month + '-01'));
                                  setTabValue("monthly");
                                }}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}