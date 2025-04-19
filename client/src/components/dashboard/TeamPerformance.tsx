import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Area, 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

interface TeamMetricProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    positive: boolean;
  };
  chart?: boolean;
  chartData?: { value: number; }[];
}

function TeamMetric({ title, value, change, chart, chartData }: TeamMetricProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className="text-xl font-medium dark:text-white">{value}</div>
      {change && (
        <div 
          className={`text-xs flex items-center ${
            change.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-3 w-3" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d={change.positive ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
            />
          </svg>
          <span className="ml-1">{change.value} from last week</span>
        </div>
      )}
      {chart && chartData && (
        <div className="mt-1.5 h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 dark:bg-primary-400 rounded-full" 
            style={{ width: `${Math.min(100, Number(value) || 0)}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}

interface PerformanceData {
  performanceData: any[];
  avgCallsPerDay: number;
  callsChangePercentage: number;
  conversionRate: number;
  conversionChangePercentage: number;
  teamTarget: number;
}

interface TeamPerformanceProps {
  data?: PerformanceData;
  type?: 'sales' | 'dispatch';
  title?: string;
  className?: string;
}

export function TeamPerformance({ data, type, title, className }: TeamPerformanceProps) {
  if (!data) {
    return (
      <Card className={`shadow rounded-lg lg:col-span-2 ${className || ''}`}>
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            {title || (type ? `${type.charAt(0).toUpperCase() + type.slice(1)} Performance` : 'Team Performance')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex justify-center items-center h-64">
          <p className="text-gray-500">No performance data available.</p>
        </CardContent>
      </Card>
    );
  }

  const { 
    performanceData = [], 
    avgCallsPerDay = 0, 
    callsChangePercentage = 0, 
    conversionRate = 0, 
    conversionChangePercentage = 0, 
    teamTarget = 0 
  } = data;

  // Get appropriate colors based on type
  const primaryColor = type === 'dispatch' ? '#F59E0B' : '#2563EB';
  const secondaryColor = type === 'dispatch' ? '#D97706' : '#1D4ED8';
  
  return (
    <Card className={`shadow rounded-lg lg:col-span-2 ${className || ''}`}>
      <CardHeader className={`px-5 py-4 border-b ${className ? '' : 'border-gray-200'}`}>
        <CardTitle className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
          {title || (type ? `${type.charAt(0).toUpperCase() + type.slice(1)} Performance` : 'Team Performance')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {/* Chart */}
        <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={performanceData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`colorLeads${type || ''}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={type === 'dispatch' ? '#F59E0B' : '#1976D2'} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={type === 'dispatch' ? '#F59E0B' : '#1976D2'} stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`colorConversions${type || ''}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={type === 'dispatch' ? '#15803D' : '#43A047'} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={type === 'dispatch' ? '#15803D' : '#43A047'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6B7280', stroke: 'none' }} 
                tickLine={false}
                stroke="#9CA3AF"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6B7280', stroke: 'none' }} 
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-600" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  color: '#111827',
                  fontSize: '12px',
                }} 
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '10px',
                  fontSize: '12px',
                  color: '#6B7280',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="leads" 
                stroke={type === 'dispatch' ? '#F59E0B' : '#1976D2'} 
                fillOpacity={1}
                fill={`url(#colorLeads${type || ''})`}
                name="Leads"
              />
              <Area 
                type="monotone" 
                dataKey="conversions" 
                stroke={type === 'dispatch' ? '#15803D' : '#43A047'}
                fillOpacity={1}
                fill={`url(#colorConversions${type || ''})`}
                name="Conversions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Team metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TeamMetric 
            title="Average Calls/Day" 
            value={avgCallsPerDay}
            change={{
              value: `${callsChangePercentage}%`,
              positive: callsChangePercentage > 0
            }}
          />
          
          <TeamMetric 
            title="Conversion Rate" 
            value={`${conversionRate}%`}
            change={{
              value: `${conversionChangePercentage}%`,
              positive: conversionChangePercentage > 0
            }}
          />
          
          <TeamMetric 
            title="Team Target" 
            value={`${teamTarget}%`}
            chart={true}
            chartData={[{ value: teamTarget }]}
          />
        </div>
      </CardContent>
    </Card>
  );
}
