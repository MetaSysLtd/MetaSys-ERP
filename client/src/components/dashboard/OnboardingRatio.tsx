import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";

interface OnboardingMetrics {
  total: number;
  completed: number;
  inProgress: number;
  stalled: number;
  conversion: number;
}

interface OnboardingRatioProps {
  data?: OnboardingMetrics;
}

export function OnboardingRatio({ data }: OnboardingRatioProps) {
  if (!data) {
    return (
      <Card className="shadow rounded-lg">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Client Onboarding Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex justify-center items-center h-64">
          <p className="text-gray-500">No onboarding data available</p>
        </CardContent>
      </Card>
    );
  }

  const { total, completed, inProgress, stalled, conversion } = data;

  const chartData = [
    { name: "Completed", value: completed },
    { name: "In Progress", value: inProgress },
    { name: "Stalled", value: stalled }
  ];

  const COLORS = ["#2EC4B6", "#1D3557", "#E76F51"];

  return (
    <Card className="shadow rounded-lg">
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          Client Onboarding Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} clients`, undefined]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500">Total Clients</p>
                <p className="text-3xl font-semibold">{total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Conversion Rate</p>
                <div className="flex items-center">
                  <p className="text-3xl font-semibold">{conversion}%</p>
                  <div className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    +5% from last month
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Onboarding Time</p>
                <p className="text-3xl font-semibold">3.5 days</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}