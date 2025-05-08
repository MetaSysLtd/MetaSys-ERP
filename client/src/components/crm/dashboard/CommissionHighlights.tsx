import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CRMCommissionHighlights } from "@shared/schema";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, DollarSign, LightbulbIcon, Target } from "lucide-react";

interface CommissionHighlightsProps {
  data: CRMCommissionHighlights;
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

  // Calculate progress percentage for the gauge chart
  const progressPercentage = Math.min(100, Math.round((data.earned / data.target) * 100));

  // Format values for display
  const earnedFormatted = formatCurrency(data.earned);
  const targetFormatted = formatCurrency(data.target);
  const projectedFormatted = formatCurrency(data.projected);
  const averageFormatted = formatCurrency(data.average);

  // Dummy data for radial bar chart
  const gaugeData = [
    {
      name: "Progress",
      value: progressPercentage,
      fill: progressPercentage >= 100 ? "#10b981" : "#025E73",
    },
  ];

  // Determine progress color and status text
  const getStatusColor = () => {
    if (progressPercentage >= 100) return "text-green-500";
    if (progressPercentage >= 75) return "text-blue-500";
    if (progressPercentage >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getStatusText = () => {
    if (progressPercentage >= 100) return "Target achieved!";
    if (progressPercentage >= 75) return "On track";
    if (progressPercentage >= 50) return "Making progress";
    return "Needs attention";
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Commission Highlights</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Sales team performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-50 rounded-full mr-3">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Total Commissions Earned</p>
                <p className="text-2xl font-bold text-[#025E73]">{earnedFormatted}</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className={`h-3 w-3 ${data.growth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-xs text-gray-500">
                    {data.growth >= 0 ? '+' : ''}{data.growth}% vs previous period
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 rounded-md p-2">
                <p className="text-xs text-gray-500">Target</p>
                <p className="text-lg font-medium text-[#F2A71B]">{targetFormatted}</p>
              </div>
              <div className="bg-gray-50 rounded-md p-2">
                <p className="text-xs text-gray-500">Average</p>
                <p className="text-lg font-medium text-[#412754]">{averageFormatted}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">Progress to target</span>
              <span className={`text-xs font-medium ${getStatusColor()}`}>{progressPercentage}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full mb-1">
              <div
                className={`h-2 rounded-full ${progressPercentage >= 100 ? 'bg-green-500' : 'bg-[#025E73]'}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className={`text-xs ${getStatusColor()} mb-4`}>{getStatusText()}</p>
            
            <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
              <Target className="h-4 w-4 text-[#F2A71B]" />
              <div>
                <p className="text-xs font-medium text-gray-700">Projected earnings</p>
                <p className="text-sm font-medium text-[#025E73]">{projectedFormatted}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Commission Progress</h4>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="70%" 
                  outerRadius="90%" 
                  barSize={15} 
                  data={gaugeData} 
                  startAngle={180} 
                  endAngle={0}
                >
                  <RadialBar
                    label={{ position: 'center', fill: '#025E73', fontSize: 20, formatter: () => `${progressPercentage}%` }}
                    background
                    clockWise={true}
                    dataKey="value"
                  />
                  <text 
                    x="50%" 
                    y="70%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="text-xs"
                    fill="#718096"
                  >
                    of target
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {data.insight && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-start space-x-2">
              <div className="p-1.5 bg-amber-50 rounded-full">
                <LightbulbIcon className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Insight</h4>
                <p className="text-xs text-gray-500">{data.insight}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}