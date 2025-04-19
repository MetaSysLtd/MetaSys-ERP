
import { useState } from 'react';
import { MetricCard } from './MetricCard';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';

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
  monthlyLeads?: number;
  activeClients?: number;
  monthlyLoads?: number;
  leadsChange?: number;
  clientsChange?: number;
  loadsChange?: number;
  leadsTrend?: 'up' | 'down' | 'neutral';
  clientsTrend?: 'up' | 'down' | 'neutral';
  loadsTrend?: 'up' | 'down' | 'neutral';
}

interface KPISectionProps {
  metrics?: DashboardMetrics;
}

export function KPISection({ metrics: propMetrics }: KPISectionProps) {
  const [filter, setFilter] = useState('all');
  
  // Only fetch metrics if not provided as props
  const { data: fetchedMetrics } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
    queryFn: () => fetch('/api/dashboard/metrics').then(res => res.json()),
    enabled: !propMetrics
  });

  // Use provided metrics or fetched metrics
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
    monthlyLeads: 0,
    activeClients: 0,
    monthlyLoads: 0,
    leadsChange: 0,
    clientsChange: 0,
    loadsChange: 0,
    leadsTrend: 'neutral',
    clientsTrend: 'neutral',
    loadsTrend: 'neutral'
  };
  
  // Determine trend based on change percentage
  const getTrend = (change: number = 0) => change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Leads"
        value={metrics.totalLeads?.toString() || '0'}
        description={`${metrics.qualifiedLeads || 0} qualified`}
        trend={getTrend(metrics.leadsChange)}
        href="/leads"
      />
      <MetricCard
        title="Active Loads"
        value={metrics.activeLoads?.toString() || '0'}
        description={`${metrics.completedLoads || 0} completed this month`}
        trend={getTrend(metrics.loadsChange)}
        href="/dispatch"
      />
      <MetricCard
        title="Total Revenue"
        value={formatCurrency(metrics.totalRevenue || 0)}
        description={`${metrics.profitMargin || 0}% profit margin`}
        trend={metrics.profitMargin > 20 ? 'up' : metrics.profitMargin > 10 ? 'neutral' : 'down'}
        href="/finance"
      />
      <MetricCard
        title="Pending Invoices"
        value={metrics.invoicesPending?.toString() || '0'}
        description={`${formatCurrency(metrics.totalProfit || 0)} profit`}
        trend={getTrend(metrics.profitMargin)}
        href="/invoices"
      />
    </div>
  );
}
