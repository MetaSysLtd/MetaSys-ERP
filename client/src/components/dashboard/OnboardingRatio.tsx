import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
        <CardContent className="p-5">
          <EmptyState
            iconType="users"
            iconSize={28}
            title="No Onboarding Data Yet"
            message="Client onboarding statistics will appear here once client onboarding processes begin."
            description="This chart will track completed, in-progress, and stalled onboardings."
            placeholderData={
              <div className="space-y-4 mt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                  <div className="flex justify-center">
                    <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <div className="text-sm text-gray-400">Onboarding chart</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Clients</p>
                      <p className="text-2xl font-semibold text-gray-400">0</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Conversion Rate</p>
                      <p className="text-2xl font-semibold text-gray-400">0%</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm font-medium text-blue-400">0</div>
                        <div className="text-xs text-gray-500">Completed</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-yellow-400">0</div>
                        <div className="text-xs text-gray-500">In Progress</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-red-400">0</div>
                        <div className="text-xs text-gray-500">Stalled</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
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