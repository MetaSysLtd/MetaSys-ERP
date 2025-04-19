
import { useState } from 'react';
import { MetricCard } from './MetricCard';

export function KPISection({ data }: { data?: any }) {
  const [filter, setFilter] = useState('all');

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Revenue"
        value={data?.revenue || '$0'}
        description={`${data?.revenueChange || 0}% from last month`}
        trend={data?.revenueTrend || 'neutral'}
      />
      <MetricCard
        title="Active Leads"
        value={data?.activeLeads || '0'}
        description={`${data?.leadsChange || 0}% conversion rate`}
        trend={data?.leadsTrend || 'neutral'}
      />
      <MetricCard
        title="Team Performance"
        value={data?.performance || '0%'}
        description={`${data?.performanceChange || 0}% efficiency`}
        trend={data?.performanceTrend || 'neutral'}
      />
      <MetricCard
        title="Customer Satisfaction"
        value={data?.satisfaction || '0%'}
        description={`${data?.satisfactionChange || 0}% from last month`}
        trend={data?.satisfactionTrend || 'neutral'}
      />
    </div>
  );
}
