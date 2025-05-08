import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CRMCommissionHighlights } from "@shared/schema";
import { TrendingUp, TrendingDown, Target } from "lucide-react";

interface CommissionHighlightsProps {
  data: CRMCommissionHighlights;
}

export function CommissionHighlights({ data }: CommissionHighlightsProps) {
  if (!data) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200 h-full">
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

  const progressPercentage = Math.min(Math.round((data.earned / data.target) * 100), 100);
  const isGrowing = data.growth > 0;

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Commission Highlights</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Team performance and commissions earned
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-baseline justify-between">
            <h4 className="text-sm font-medium text-gray-700">Monthly Target Progress</h4>
            <span className="text-xs text-gray-500">
              ${Math.round(data.earned).toLocaleString()} of ${Math.round(data.target).toLocaleString()}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2 mt-2" />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">{progressPercentage}% Complete</span>
            <span className="text-xs text-gray-500">
              {data.projected > data.target
                ? "On track to exceed"
                : `${Math.round((data.projected / data.target) * 100)}% projected`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-full ${isGrowing ? 'bg-green-100' : 'bg-red-100'}`}>
                {isGrowing ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Growth</p>
                <p className={`text-sm font-semibold ${isGrowing ? 'text-green-600' : 'text-red-600'}`}>
                  {isGrowing ? '+' : ''}{data.growth}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-full bg-blue-100">
                <Target className="h-4 w-4 text-[#025E73]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Average</p>
                <p className="text-sm font-semibold text-[#025E73]">
                  ${Math.round(data.average).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#F9FBFC] rounded-md border border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Projected EOY Revenue</h4>
          <p className="text-2xl font-bold text-[#025E73]">
            ${Math.round(data.projected).toLocaleString()}
          </p>
          {data.growth > 0 && (
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              On track for {data.growth}% YoY growth
            </p>
          )}
        </div>

        {data.insight && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Insight</h4>
            <p className="text-xs text-gray-500">{data.insight}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}