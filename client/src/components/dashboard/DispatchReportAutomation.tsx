import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
// We're defining our own DispatchReport interface to handle additional fields used in the UI
import { PerformanceTarget } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, Share2Icon, RefreshCwIcon, TrendingUpIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Define the DispatchReport interface outside the component to avoid recreation
interface DispatchReport {
  id: number;
  date: Date;
  createdAt: Date;
  orgId: number;
  dispatcherId: number;
  loadsBooked: number;
  invoiceUsd: number;
  activeLeads: number;
  pendingInvoiceUsd: number;
  highestInvoiceUsd: number;
  paidInvoiceUsd: number;
  status: "Pending" | "Submitted";
  // Add these properties even though they're not in the schema since the component uses them
  newLeads?: number;
  notes?: string;
}

// Create a memoized progress component to optimize rendering
const ProgressItem = memo(({ 
  label, 
  value, 
  max, 
  colorClass 
}: { 
  label: string; 
  value: number; 
  max: number; 
  colorClass: string;
}) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-sm font-medium">{label}</span>
      <span className={`text-sm font-bold ${colorClass}`}>
        {typeof value === 'number' && label === 'Invoice Amount' 
          ? `$${value.toLocaleString()} / $${max.toLocaleString()}`
          : `${value} / ${max}`
        }
      </span>
    </div>
    <Progress value={Math.min(100, Math.round((value / max) * 100))} className="h-2" />
  </div>
));

const ReportCardContent = memo(({ 
  todayReport, 
  dailyTarget, 
  getLoadColor, 
  getInvoiceColor 
}: { 
  todayReport: DispatchReport; 
  dailyTarget: any; 
  getLoadColor: () => string; 
  getInvoiceColor: () => string;
}) => (
  <div className="space-y-4">
    <ProgressItem
      label="Loads Booked"
      value={todayReport?.loadsBooked || 0}
      max={dailyTarget?.maxPct || 100}
      colorClass={getLoadColor()}
    />
    
    <ProgressItem
      label="Invoice Amount"
      value={todayReport?.invoiceUsd || 0}
      max={dailyTarget?.maxPct || 100}
      colorClass={getInvoiceColor()}
    />
    
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">New Leads</span>
        <span className="text-sm font-bold">
          {todayReport?.newLeads || 0}
        </span>
      </div>
    </div>
    
    {todayReport?.notes && (
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-sm text-muted-foreground">{todayReport.notes}</p>
      </div>
    )}
  </div>
));

// Create a memoized CardFooter button component
const CardActions = memo(({ 
  todayReport, 
  generateReportMutation, 
  sendToSlackMutation, 
  sendSummaryMutation, 
  isSlackSending, 
  user 
}: { 
  todayReport: DispatchReport | undefined; 
  generateReportMutation: any; 
  sendToSlackMutation: any; 
  sendSummaryMutation: any; 
  isSlackSending: boolean;
  user: any;
}) => (
  <CardFooter className="flex flex-col space-y-2">
    <div className="flex flex-col space-y-1">
      <div className="text-xs text-muted-foreground italic">
        {todayReport ? (
          <>
            <CheckCircleIcon className="h-3 w-3 inline mr-1 text-brandTeal" />
            Automated reports run daily at 18:00
          </>
        ) : (
          <>
            <RefreshCwIcon className="h-3 w-3 inline mr-1" />
            Next automated report at 18:00
          </>
        )}
      </div>
      <div className="text-xs text-muted-foreground italic">
        <CalendarIcon className="h-3 w-3 inline mr-1 text-brandTeal" />
        Monthly summary reports generated on the 1st of each month at 01:00
      </div>
    </div>
    
    <div className="flex gap-2 w-full">
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => generateReportMutation.mutate()}
        disabled={generateReportMutation.isPending}
      >
        {generateReportMutation.isPending ? (
          <RefreshCwIcon className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <TrendingUpIcon className="h-4 w-4 mr-1" />
        )}
        Update Metrics
      </Button>
      
      <Button
        variant="default"
        size="sm"
        className="flex-1 bg-gradient-to-r from-brandTeal to-brandNavy hover:opacity-90"
        onClick={() => sendToSlackMutation.mutate()}
        disabled={sendToSlackMutation.isPending || isSlackSending}
      >
        {sendToSlackMutation.isPending || isSlackSending ? (
          <RefreshCwIcon className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Share2Icon className="h-4 w-4 mr-1" />
        )}
        Send to Slack
      </Button>
    </div>
    
    {/* Admin-only summary button */}
    {user?.roleId && [1, 2, 3, 8].includes(user.roleId) && (
      <div className="pt-2 border-t border-border mt-1">
        <Button
          variant="secondary"
          size="sm"
          className="w-full text-xs"
          onClick={() => sendSummaryMutation.mutate()}
          disabled={sendSummaryMutation.isPending}
        >
          {sendSummaryMutation.isPending ? (
            <RefreshCwIcon className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Share2Icon className="h-3 w-3 mr-1" />
          )}
          Generate Team Summary Report
        </Button>
      </div>
    )}
  </CardFooter>
));

// Create a memoized empty state component
const EmptyReportState = memo(() => (
  <div className="py-4 text-center">
    <AlertTriangleIcon className="h-10 w-10 text-amber-500 mx-auto mb-2" />
    <p className="text-sm text-muted-foreground">No report found for today. Generate one to track your metrics.</p>
  </div>
));

// Create a memoized loading state component
const LoadingState = memo(() => (
  <div className="flex justify-center py-6">
    <RefreshCwIcon className="h-8 w-8 animate-spin text-brandTeal" />
  </div>
));

function DispatchReportAutomationComponent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSlackSending, setIsSlackSending] = useState(false);
  
  // Memoize the date string to prevent recalculations
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const formattedDate = useMemo(() => format(new Date(), 'EEEE, MMMM d, yyyy'), []);
  
  // Fetch today's report
  const { data: todayReport, isLoading: reportLoading } = useQuery<DispatchReport>({
    queryKey: ['/api/dispatch-reports', todayStr],
    queryFn: async () => {
      const res = await fetch(`/api/dispatch-reports?dispatcherId=${user?.id}&date=${todayStr}`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`Error fetching dispatch reports: ${res.status}`);
      }
      const reports = await res.json();
      // If it's an array, return the first item, otherwise return the data directly
      const report = Array.isArray(reports) ? reports[0] : reports;
      
      // Ensure the report has the expected properties with defaults
      if (report) {
        report.newLeads = report.newLeads ?? 0;
        report.notes = report.notes ?? '';
      }
      
      return report;
    },
    enabled: !!user?.id,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
  
  // Fetch performance targets
  const { data: targets } = useQuery<{ sales: any; dispatch: any; }>({
    queryKey: ['/api/performance-targets', 'daily'],
    queryFn: async () => {
      const res = await fetch('/api/performance-targets?type=daily', {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`Error fetching performance targets: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!user?.id,
  });
  
  // Get the appropriate target for the user's organization
  // Use the targets data directly since it's now an object, not an array
  const dailyTarget = useMemo(() => 
    targets?.dispatch?.daily || { maxPct: 100 }, 
    [targets]
  );
  
  // Manual report generation mutation
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/dispatch-reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          dispatcherId: user?.id,
          date: todayStr,
        })
      });
      if (!res.ok) {
        throw new Error(`Error generating report: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Generated",
        description: "Your daily dispatch report has been updated with the latest metrics.",
        variant: "default",
      });
      // Use the specific query key to invalidate the right query
      queryClient.invalidateQueries({ queryKey: ['/api/dispatch-reports', todayStr] });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Send to Slack mutation
  const sendToSlackMutation = useMutation({
    mutationFn: async () => {
      setIsSlackSending(true);
      const res = await fetch('/api/dispatch-reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          dispatcherId: user?.id,
          date: todayStr,
          sendToSlack: true
        })
      });
      if (!res.ok) {
        throw new Error(`Error sending to Slack: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Sent to Slack",
        description: "Your daily dispatch report has been sent to the Slack channel.",
        variant: "default",
      });
      setIsSlackSending(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Sending Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSlackSending(false);
    }
  });
  
  // Send summary report to Slack mutation (admin only)
  const sendSummaryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/dispatch-reports/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          date: todayStr,
        })
      });
      if (!res.ok) {
        throw new Error(`Error generating summary: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Summary Sent to Slack",
        description: `Team summary report with ${data.reportCount} dispatchers sent to Slack.`,
        variant: "default",
      });
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/dispatch-reports'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Summary Sending Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Use useCallback for these functions to prevent recreating on each render
  const getLoadProgress = useCallback(() => {
    if (!todayReport || !dailyTarget) return 0;
    return Math.min(100, Math.round((todayReport.loadsBooked / dailyTarget.maxPct) * 100));
  }, [todayReport, dailyTarget]);
  
  const getInvoiceProgress = useCallback(() => {
    if (!todayReport || !dailyTarget) return 0;
    return Math.min(100, Math.round((todayReport.invoiceUsd / dailyTarget.maxPct) * 100));
  }, [todayReport, dailyTarget]);
  
  // Memoize these functions to prevent recreating on each render
  const getBadgeVariant = useMemo(() => {
    if (!todayReport?.status) return 'outline';
    switch (todayReport.status) {
      case 'Pending':
        return 'secondary';
      case 'Submitted':
        return 'default';
      default:
        return 'outline';
    }
  }, [todayReport?.status]);
  
  const getLoadColor = useCallback(() => {
    const progress = getLoadProgress();
    if (progress < 40) return 'text-red-500';
    if (progress < 100) return 'text-amber-500';
    return 'text-emerald-500';
  }, [getLoadProgress]);
  
  const getInvoiceColor = useCallback(() => {
    const progress = getInvoiceProgress();
    if (progress < 40) return 'text-red-500';
    if (progress < 100) return 'text-amber-500';
    return 'text-emerald-500';
  }, [getInvoiceProgress]);

  return (
    <Card className="shadow-md border-l-4 border-l-brandTeal">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            Daily Dispatch Report
          </CardTitle>
          <Badge variant={getBadgeVariant}>
            {todayReport?.status || 'Not Started'}
          </Badge>
        </div>
        <CardDescription className="flex items-center text-sm">
          <CalendarIcon className="h-3.5 w-3.5 mr-1" />
          {formattedDate}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {reportLoading ? (
          <LoadingState />
        ) : todayReport ? (
          <ReportCardContent 
            todayReport={todayReport} 
            dailyTarget={dailyTarget} 
            getLoadColor={getLoadColor} 
            getInvoiceColor={getInvoiceColor} 
          />
        ) : (
          <EmptyReportState />
        )}
      </CardContent>
      
      <CardActions 
        todayReport={todayReport}
        generateReportMutation={generateReportMutation}
        sendToSlackMutation={sendToSlackMutation}
        sendSummaryMutation={sendSummaryMutation}
        isSlackSending={isSlackSending}
        user={user}
      />
    </Card>
  );
}

// Export a memoized version of the component to prevent unnecessary re-renders
export const DispatchReportAutomation = memo(DispatchReportAutomationComponent);