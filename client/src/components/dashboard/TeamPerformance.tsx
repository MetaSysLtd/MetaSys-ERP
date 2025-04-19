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
    <div className="bg-gray-50 p-3 rounded-md">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-medium">{value}</div>
      {change && (
        <div 
          className={`text-xs flex items-center ${
            change.positive ? "text-green-600" : "text-red-600"
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
        <div className="mt-1.5 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 rounded-full" 
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
}

export function TeamPerformance({ data, type }: TeamPerformanceProps) {
  if (!data) {
    return (
      <Card className="shadow rounded-lg lg:col-span-2">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            {type ? `${type.charAt(0).toUpperCase() + type.slice(1)} Performance` : 'Team Performance'}
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

  return (
    <Card className="shadow rounded-lg lg:col-span-2">
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          Team Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {/* Chart */}
        <div className="h-64 bg-gray-50 rounded-lg mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={performanceData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1976D2" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1976D2" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#43A047" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#43A047" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="leads" 
                stroke="#1976D2" 
                fillOpacity={1}
                fill="url(#colorLeads)"
                name="Leads"
              />
              <Area 
                type="monotone" 
                dataKey="conversions" 
                stroke="#43A047" 
                fillOpacity={1}
                fill="url(#colorConversions)"
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
