
import { useState } from 'react';
import { MetricCard } from './MetricCard';
import { useQuery } from '@tanstack/react-query';

export function KPISection() {
  const [filter, setFilter] = useState('all');
  
  const { data: metrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => fetch('/api/dashboard/metrics').then(res => res.json())
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Total Leads (This Month)"
        value={metrics?.monthlyLeads || '0'}
        description={`${metrics?.leadsChange || 0}% from last month`}
        trend={metrics?.leadsTrend || 'neutral'}
      />
      <MetricCard
        title="Active Clients"
        value={metrics?.activeClients || '0'}
        description={`${metrics?.clientsChange || 0}% from last month`}
        trend={metrics?.clientsTrend || 'neutral'}
      />
      <MetricCard
        title="Total Loads (This Month)"
        value={metrics?.monthlyLoads || '0'}
        description={`${metrics?.loadsChange || 0}% from last month`}
        trend={metrics?.loadsTrend || 'neutral'}
      />
    </div>
  );
}
