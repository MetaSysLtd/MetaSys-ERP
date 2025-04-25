import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format, startOfMonth, endOfMonth } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Check, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/layout/PageHeader';
import UserAvatar from '@/components/ui/user-avatar';

interface DispatchReport {
  id: number;
  dispatcherId: number;
  date: string;
  orgId: number;
  status: 'Pending' | 'Submitted';
  loadsBooked: number;
  invoiceUsd: number;
  newLeads: number;
  notes: string | null;
  createdAt: string;
}

interface PerformanceTarget {
  id: number;
  orgId: number;
  type: 'daily' | 'weekly';
  minPct: number;
  maxPct: number;
  createdAt: string;
  updatedAt: string;
}

export default function DispatchReportsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // New report form state
  const [newReport, setNewReport] = useState({
    loadsBooked: 0,
    invoiceUsd: 0,
    newLeads: 0,
    notes: '',
  });
  
  // Fetch reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ['/api/dispatch/reports'],
    queryFn: () => 
      apiRequest('GET', '/api/dispatch/reports')
        .then(res => res.json()),
  });
  
  // Fetch performance targets
  const { data: performanceTargets } = useQuery({
    queryKey: ['/api/performance-targets'],
    queryFn: () => 
      apiRequest('GET', '/api/performance-targets')
        .then(res => res.json()),
  });
  
  const dailyTarget = performanceTargets?.daily;
  
  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: (reportData: any) => 
      apiRequest('POST', '/api/dispatch/reports', reportData)
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dispatch/reports'] });
      setIsCreateDialogOpen(false);
      resetNewReportForm();
      toast({
        title: 'Report created',
        description: 'Your report has been created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create report',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
  
  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/dispatch/reports/${id}`, data)
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dispatch/reports'] });
      toast({
        title: 'Report updated',
        description: 'Your report has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update report',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
    field: string
  ) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setNewReport({ ...newReport, [field]: value });
  };
  
  const handleStatusChange = (reportId: number, status: string) => {
    updateReportMutation.mutate({ 
      id: reportId, 
      data: { status } 
    });
  };
  
  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    createReportMutation.mutate({
      ...newReport,
      date: selectedDate,
    });
  };
  
  const resetNewReportForm = () => {
    setNewReport({
      loadsBooked: 0,
      invoiceUsd: 0,
      newLeads: 0,
      notes: '',
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'Submitted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Submitted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPerformanceIndicator = (value: number, target: number | undefined) => {
    if (!target) return null;
    
    return value >= target ? (
      <span className="text-green-500 flex items-center text-sm font-medium">
        <TrendingUp className="h-3 w-3 mr-1" /> 
        {Math.round((value / target) * 100)}% of target
      </span>
    ) : (
      <span className="text-red-500 flex items-center text-sm font-medium">
        <TrendingUp className="h-3 w-3 mr-1 rotate-180" /> 
        {Math.round((value / target) * 100)}% of target
      </span>
    );
  };
  
  const reportsByDate = reports ? 
    Object.entries(
      reports.reduce((acc: Record<string, DispatchReport[]>, report: DispatchReport) => {
        const date = report.date.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(report);
        return acc;
      }, {})
    ).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    : [];
  
  // Prepare chart data
  const chartData = reports ? 
    reports
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(report => ({
        date: format(new Date(report.date), 'MMM d'),
        loads: report.loadsBooked,
        revenue: report.invoiceUsd,
        leads: report.newLeads,
      }))
    : [];
  
  // Calculate monthly totals
  const today = new Date();
  const firstDayOfMonth = startOfMonth(today);
  const lastDayOfMonth = endOfMonth(today);
  
  const monthlyReports = reports ? 
    reports.filter(report => {
      const reportDate = new Date(report.date);
      return reportDate >= firstDayOfMonth && reportDate <= lastDayOfMonth;
    })
    : [];
  
  const monthlyTotals = {
    loads: monthlyReports.reduce((sum, report) => sum + report.loadsBooked, 0),
    revenue: monthlyReports.reduce((sum, report) => sum + report.invoiceUsd, 0),
    leads: monthlyReports.reduce((sum, report) => sum + report.newLeads, 0),
  };
  
  return (
    <div className="container mx-auto p-4">
      <PageHeader 
        title="Dispatch Reports" 
        description="Track and manage dispatch performance metrics"
        actionButton={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Daily Report</DialogTitle>
                <DialogDescription>
                  Submit your daily dispatch performance metrics.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateReport}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="loadsBooked">
                      Loads Booked
                      {dailyTarget && (
                        <span className="text-sm text-muted-foreground ml-2">
                          (Target: {dailyTarget.minPct})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="loadsBooked"
                      type="number"
                      min="0"
                      value={newReport.loadsBooked}
                      onChange={(e) => handleInputChange(e, 'loadsBooked')}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="invoiceUsd">
                      Invoice Total (USD)
                      {dailyTarget && (
                        <span className="text-sm text-muted-foreground ml-2">
                          (Target: ${dailyTarget.maxPct})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="invoiceUsd"
                      type="number"
                      min="0"
                      value={newReport.invoiceUsd}
                      onChange={(e) => handleInputChange(e, 'invoiceUsd')}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="newLeads">New Leads Generated</Label>
                    <Input
                      id="newLeads"
                      type="number"
                      min="0"
                      value={newReport.newLeads}
                      onChange={(e) => handleInputChange(e, 'newLeads')}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any additional notes here..."
                      value={newReport.notes}
                      onChange={(e) => handleInputChange(e, 'notes')}
                      rows={4}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createReportMutation.isPending}
                  >
                    {createReportMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Report
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reports?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No reports found</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            You haven't created any dispatch reports yet. Click the "New Report" button to get started.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Monthly Loads Booked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyTotals.loads}</div>
                {dailyTarget && (
                  <p className="text-xs text-muted-foreground">
                    Monthly target: {dailyTarget.minPct * 20} 
                    <span className="ml-2">
                      ({Math.round((monthlyTotals.loads / (dailyTarget.minPct * 20)) * 100)}%)
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Monthly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${monthlyTotals.revenue.toLocaleString()}</div>
                {dailyTarget && (
                  <p className="text-xs text-muted-foreground">
                    Monthly target: ${(dailyTarget.maxPct * 20).toLocaleString()} 
                    <span className="ml-2">
                      ({Math.round((monthlyTotals.revenue / (dailyTarget.maxPct * 20)) * 100)}%)
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Monthly New Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyTotals.leads}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Track your dispatch performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="loads"
                      name="Loads Booked"
                      stroke="#2EC4B6"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (USD)"
                      stroke="#457B9D"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="leads"
                      name="New Leads"
                      stroke="#E63946"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Report List */}
          <div className="grid gap-6">
            {reportsByDate.map(([date, dateReports]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{format(new Date(date), 'MMMM d, yyyy')}</span>
                    {dateReports.some(report => report.status === 'Submitted') ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="mr-1 h-3 w-3" /> Submitted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Pending
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Dispatch reports for {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dispatcher</TableHead>
                        <TableHead className="text-right">Loads Booked</TableHead>
                        <TableHead className="text-right">Revenue (USD)</TableHead>
                        <TableHead className="text-right">New Leads</TableHead>
                        <TableHead className="w-[100px] text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dateReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <UserAvatar 
                                user={{ 
                                  id: report.dispatcherId,
                                  firstName: user?.firstName || '',
                                  lastName: user?.lastName || '',
                                  profileImageUrl: user?.profileImageUrl || null
                                }} 
                                className="h-8 w-8 mr-2" 
                              />
                              <div>
                                <p className="font-medium">
                                  {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Created on {format(new Date(report.createdAt), 'MMM d, h:mm a')}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium">{report.loadsBooked}</div>
                            {dailyTarget && getPerformanceIndicator(report.loadsBooked, dailyTarget.minPct)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium">${report.invoiceUsd}</div>
                            {dailyTarget && getPerformanceIndicator(report.invoiceUsd, dailyTarget.maxPct)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {report.newLeads}
                          </TableCell>
                          <TableCell className="text-center">
                            <Select
                              value={report.status}
                              onValueChange={(value) => handleStatusChange(report.id, value)}
                              disabled={updateReportMutation.isPending}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Submitted">Submit</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {dateReports[0]?.notes && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-1">Notes:</p>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {dateReports[0].notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}