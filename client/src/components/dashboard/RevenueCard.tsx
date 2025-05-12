import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RevenueData {
  total: number;
  byMonth: {
    month: string;
    revenue: number;
    target: number;
  }[];
}

interface RevenueCardProps {
  data?: RevenueData;
}

export function RevenueCard({ data }: RevenueCardProps) {
  // Return placeholder UI if no data is provided
  if (!data) {
    return (
      <Card className="shadow rounded-lg">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex justify-center items-center h-72">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-1">No Revenue Data Yet</h3>
              <p className="text-muted-foreground">
                Revenue data will appear here once sales activities begin
              </p>
              <div className="mt-4 text-2xl font-semibold">
                {formatCurrency(0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { total, byMonth } = data;

  return (
    <Card className="shadow rounded-lg">
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          Revenue Overview
        </CardTitle>
        <div className="text-lg font-semibold">
          {formatCurrency(total)}
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={byMonth}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => `$${value/1000}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2EC4B6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Actual Revenue"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#1D3557"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                name="Target Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}