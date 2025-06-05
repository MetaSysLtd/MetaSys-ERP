
import { useState, useEffect } from 'react';
import { MetricCard } from './MetricCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { metricCardStyles } from '@/lib/style-utils';
import { KPICardSkeleton } from '@/components/ui/skeleton';
import { useSocket } from '@/hooks/use-socket';

// Define the metrics interface
interface DashboardMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  leadsConverted: number;
  totalLoads: number;
  activeLoads: number;
  completedLoads: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  invoicesPending: number;
  activeDispatchClients?: number;
  monthlyLeads?: number;
  activeClients?: number;
  monthlyLoads?: number;
  leadsChange?: number;
  clientsChange?: number;
  loadsChange?: number;
  dispatchClientsChange?: number;
  leadsTrend?: 'up' | 'down' | 'neutral';
  clientsTrend?: 'up' | 'down' | 'neutral';
  loadsTrend?: 'up' | 'down' | 'neutral';
  dispatchClientsTrend?: 'up' | 'down' | 'neutral';
}

interface KPISectionProps {
  metrics?: DashboardMetrics;
}

export function KPISection({ metrics: propMetrics }: KPISectionProps) {
  const [filter, setFilter] = useState('all');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  
  // NO QUERY - Use only provided metrics to prevent duplicate fetching
  const fetchedMetrics = undefined;
  const isLoading = false;
  const error = null;

  // Real-time socket event subscriptions for dashboard updates
  useEffect(() => {
    if (!socket) return;

    const handleDataUpdate = () => {
      // Invalidate dashboard queries for fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/consolidated'] });
    };

    // Subscribe to real-time events
    socket.on('lead:created', handleDataUpdate);
    socket.on('lead:updated', handleDataUpdate);
    socket.on('dispatch:created', handleDataUpdate);
    socket.on('dispatch:updated', handleDataUpdate);
    socket.on('invoice:created', handleDataUpdate);
    socket.on('invoice:updated', handleDataUpdate);
    socket.on('data:updated', handleDataUpdate);

    return () => {
      socket.off('lead:created', handleDataUpdate);
      socket.off('lead:updated', handleDataUpdate);
      socket.off('dispatch:created', handleDataUpdate);
      socket.off('dispatch:updated', handleDataUpdate);
      socket.off('invoice:created', handleDataUpdate);
      socket.off('invoice:updated', handleDataUpdate);
      socket.off('data:updated', handleDataUpdate);
    };
  }, [socket, queryClient]);

  // Handle loading state with timeout for perceived performance
  useEffect(() => {
    // Show skeleton for at least 300ms to prevent flicker
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // If we're still loading and the timeout hasn't elapsed, show skeleton
  if ((isLoading && !propMetrics) && showSkeleton) {
    return (
      <div className={metricCardStyles.grid}>
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
    );
  }

  // Use provided metrics or fetched metrics with empty state handling
  const metrics = propMetrics || fetchedMetrics || {
    totalLeads: 0,
    qualifiedLeads: 0,
    leadsConverted: 0,
    totalLoads: 0,
    activeLoads: 0,
    completedLoads: 0,
    totalRevenue: 0,
    totalProfit: 0,
    profitMargin: 0,
    invoicesPending: 0,
    activeDispatchClients: 0,
    monthlyLeads: 0,
    activeClients: 0,
    monthlyLoads: 0,
    leadsChange: 0,
    clientsChange: 0,
    loadsChange: 0,
    dispatchClientsChange: 0,
    leadsTrend: 'neutral',
    clientsTrend: 'neutral',
    loadsTrend: 'neutral',
    dispatchClientsTrend: 'neutral'
  };
  
  // Add empty state messages based on metrics values
  const emptyStateMessages = {
    leads: metrics.totalLeads === 0 ? "No leads yet - will populate as new leads are added" : null,
    loads: metrics.activeLoads === 0 ? "No active loads - will update as dispatch activities begin" : null,
    clients: metrics.activeDispatchClients === 0 ? "No active clients yet - will populate as clients are added" : null,
    revenue: metrics.totalRevenue === 0 ? "No revenue data yet - will update as invoices are processed" : null,
    invoices: metrics.invoicesPending === 0 ? "No pending invoices - will appear when invoices are created" : null,
  };
  
  // Determine trend based on change percentage
  const getTrend = (change: number = 0) => change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  return (
    <div className={metricCardStyles.grid}>
      <MetricCard
        title="Total Leads"
        value={metrics.totalLeads?.toString() || '0'}
        description={`${metrics.qualifiedLeads || 0} qualified`}
        trend={getTrend(metrics.leadsChange)}
        href="/crm/leads"
        emptyStateMessage={emptyStateMessages.leads}
        isEmptyState={metrics.totalLeads === 0}
        iconBgColor="bg-blue-50"
        iconColor="text-blue-600"
      />
      <MetricCard
        title="Active Loads"
        value={metrics.activeLoads?.toString() || '0'}
        description={`${metrics.completedLoads || 0} completed this month`}
        trend={getTrend(metrics.loadsChange)}
        href="/dispatch/loads"
        emptyStateMessage={emptyStateMessages.loads}
        isEmptyState={metrics.activeLoads === 0}
        iconBgColor="bg-amber-50"
        iconColor="text-amber-600"
      />
      <MetricCard
        title="Active Clients"
        value={metrics.activeDispatchClients?.toString() || '0'}
        description="Active this month"
        trend={getTrend(metrics.dispatchClientsChange)}
        href="/dispatch/clients"
        iconBgColor="bg-green-50"
        iconColor="text-green-600"
        emptyStateMessage={emptyStateMessages.clients}
        isEmptyState={metrics.activeDispatchClients === 0}
      />
      <MetricCard
        title="Total Revenue"
        value={formatCurrency(metrics.totalRevenue || 0)}
        description={`${formatCurrency(metrics.totalProfit || 0)} profit earned`}
        trend={metrics.profitMargin > 20 ? 'up' : metrics.profitMargin > 10 ? 'neutral' : 'down'}
        href="/finance"
        emptyStateMessage={emptyStateMessages.revenue}
        isEmptyState={metrics.totalRevenue === 0}
        iconBgColor="bg-purple-50" 
        iconColor="text-purple-600"
      />
      <MetricCard
        title="Pending Invoices"
        value={metrics.invoicesPending?.toString() || '0'}
        description="Awaiting payment"
        trend={getTrend(metrics.profitMargin)}
        href="/invoices"
        className="lg:col-span-2 xl:col-span-1"
        emptyStateMessage={emptyStateMessages.invoices}
        isEmptyState={metrics.invoicesPending === 0}
        iconBgColor="bg-indigo-50"
        iconColor="text-indigo-600"
      />
    </div>
  );
}
