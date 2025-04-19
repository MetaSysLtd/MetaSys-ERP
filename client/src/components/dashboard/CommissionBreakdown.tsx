import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const { data: commissionData, isLoading } = useQuery({
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
  const { data: historicalCommissions } = useQuery({
    queryKey: ['/api/commissions/monthly/history', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const response = await fetch(`/api/commissions/monthly/user/${targetUserId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch historical commission data');
      }
      return response.json();
    },
    enabled: !!targetUserId,
  });

  // Process historical data for chart
  const chartData = historicalCommissions?.map((commission: any) => ({
    month: format(new Date(commission.month + '-01'), 'MMM'),
    amount: commission.amount,
    base: commission.baseAmount,
    bonus: commission.bonusAmount
  })) || [];

  // Handle recalculation request
  const handleRecalculate = async () => {
    try {
      const response = await fetch(`/api/commissions/calculate/${targetUserId}/${month}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to recalculate commission');
      }
      
      toast({
        title: "Commission Recalculated",
        description: "Commission has been recalculated successfully.",
      });
      
      // Refresh the data
      await fetch(`/api/commissions/monthly/user/${targetUserId}/${month}`);
    } catch (error) {
      toast({
        title: "Recalculation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  // No commission data yet
  if (!isLoading && !commissionData) {
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
          <div className="flex flex-col items-center justify-center h-40">
            <InfoIcon className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No commission data available for {format(selectedDate || new Date(), 'MMMM yyyy')}</p>
            {isAdmin && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleRecalculate}
              >
                Calculate Commission
              </Button>
            )}
          </div>
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
      <CardContent>
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Current Month</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            {isLoading ? (
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
              {chartData.length > 0 ? (
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
                <div className="flex flex-col items-center justify-center h-40">
                  <InfoIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No historical commission data available</p>
                </div>
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