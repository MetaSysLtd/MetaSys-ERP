import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { formatCurrency } from "@/lib/utils";

interface CommissionData {
  name: string;
  amount: number;
  department: string;
}

interface CommissionBreakdownProps {
  data?: CommissionData[];
  lastMonthTopEarner?: {
    name: string;
    amount: number;
  };
  title?: string;
  className?: string;
}

export function CommissionBreakdown({ 
  data = [], 
  lastMonthTopEarner,
  title = "Commission Breakdown", 
  className = ""
}: CommissionBreakdownProps) {
  
  // If no data, show a placeholder/loading state
  if (!data || data.length === 0) {
    return (
      <Card className={`shadow rounded-lg ${className}`}>
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex flex-col justify-center items-center h-64">
          <p className="text-gray-500 mb-4">Loading sample data...</p>
          <div className="w-full h-32 bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  // Custom colors for departments
  const getBarColor = (entry: any) => {
    const department = entry.department?.toLowerCase() || '';
    if (department.includes('sales')) return '#4299E1';
    if (department.includes('dispatch')) return '#F6AD55';
    if (department.includes('finance')) return '#68D391';
    if (department.includes('admin')) return '#FC8181';
    return '#A0AEC0';
  };

  return (
    <Card className={`shadow rounded-lg ${className}`}>
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="mb-4">
          <h3 className="text-md font-medium">Top Earners This Month</h3>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 40
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                formatter={(value) => [formatCurrency(value as number), "Commission"]}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              <Bar dataKey="amount" name="Commission Amount" fill="#8884d8">
                <LabelList dataKey="department" position="top" />
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {lastMonthTopEarner && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium">Last Month Top Earner</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-700">{lastMonthTopEarner.name}</span>
              <span className="font-bold text-green-600">{formatCurrency(lastMonthTopEarner.amount)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}