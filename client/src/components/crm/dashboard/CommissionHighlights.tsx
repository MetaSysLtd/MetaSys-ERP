import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CRMCommissionHighlights } from "@shared/schema";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, DollarSign, Award, AlertCircle, Info } from "lucide-react";

interface CommissionHighlightsProps {
  data?: CRMCommissionHighlights;
}

export function CommissionHighlights({ data }: CommissionHighlightsProps) {
  if (!data) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle>Commission Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentage of target achieved
  const targetPercentage = data.target > 0 ? Math.min((data.earned / data.target) * 100, 100) : 0;
  const projectedPercentage = data.target > 0 ? Math.min((data.projected / data.target) * 100, 100) : 0;

  // Colors for visualization
  const COLORS = ["#025E73", "#F2A71B", "#412754"];

  // Data for radial chart
  const progressData = [
    {
      name: "Earned",
      value: targetPercentage,
      fill: "#025E73",
    },
    {
      name: "Projected",
      value: projectedPercentage > targetPercentage ? projectedPercentage : 0,
      fill: "#F2A71B",
    },
  ];

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">
          Commission Highlights
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Sales commission performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Commission indicators */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <DollarSign className="h-3 w-3 mr-1" /> Earned
              </div>
              <div className="text-xl font-bold text-[#025E73]">
                {formatCurrency(data.earned)}
              </div>
              <div
                className={`text-xs flex items-center mt-1 ${
                  data.growth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {data.growth >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {data.growth >= 0 ? "+" : ""}
                {data.growth}% from last period
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <Award className="h-3 w-3 mr-1" /> Target
              </div>
              <div className="text-xl font-bold text-[#025E73]">
                {formatCurrency(data.target)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {targetPercentage.toFixed(0)}% achieved
              </div>
            </div>
          </div>

          {/* Radial progress visualization */}
          <div className="h-44 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                barSize={10}
                data={progressData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  label={{ position: "center", fill: "#888", fontSize: 14, formatter: () => `${targetPercentage.toFixed(0)}%` }}
                  background
                  clockWise
                  dataKey="value"
                />
                <Tooltip
                  formatter={(value) => [`${value.toFixed(0)}%`, ""]}
                  labelFormatter={(name) => `${name} of Target`}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* Additional metrics */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <TrendingUp className="h-3 w-3 mr-1" /> Projected
              </div>
              <div className="text-xl font-bold text-[#F2A71B]">
                {formatCurrency(data.projected)}
              </div>
              <div
                className={`text-xs ${
                  data.projected > data.target ? "text-green-600" : "text-gray-500"
                }`}
              >
                {data.projected > data.target
                  ? `${((data.projected / data.target - 1) * 100).toFixed(0)}% above target`
                  : `${((1 - data.projected / data.target) * 100).toFixed(0)}% below target`}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <DollarSign className="h-3 w-3 mr-1" /> Average
              </div>
              <div className="text-xl font-bold text-[#025E73]">
                {formatCurrency(data.average)}
              </div>
              <div className="text-xs text-gray-500">per sales rep</div>
            </div>
          </div>

          {/* Insight */}
          {data.insight && (
            <div className="mt-2 border-t border-gray-100 pt-3">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-[#025E73] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600">{data.insight}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}