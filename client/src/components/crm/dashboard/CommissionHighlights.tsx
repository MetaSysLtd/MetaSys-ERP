import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, Target, Calendar } from "lucide-react";

type CommissionHighlightsProps = {
  data: any;
};

export function CommissionHighlights({ data }: CommissionHighlightsProps) {
  const earned = data?.earned || 0;
  const target = data?.target || 0;
  const progress = target > 0 ? Math.min(100, (earned / target) * 100) : 0;
  
  return (
    <Card className="shadow hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#025E73] font-medium">
          Commission Highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-500">Monthly Progress</span>
              <span className="text-sm font-medium text-gray-900">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center text-sm text-gray-500">
                <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                <span>${earned.toLocaleString()} earned</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Target className="h-4 w-4 mr-1 text-blue-600" />
                <span>${target.toLocaleString()} target</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Key Metrics</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-[#025E73]" />
                  <span className="text-sm font-medium">Growth vs. Last Month</span>
                </div>
                <span className={`text-sm font-medium ${data?.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data?.growth >= 0 ? '+' : ''}{data?.growth || 0}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-[#025E73]" />
                  <span className="text-sm font-medium">Projected This Month</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${(data?.projected || 0).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-[#025E73]" />
                  <span className="text-sm font-medium">Average Per Sale</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${(data?.average || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          {data?.insight && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Insight</h4>
              <p className="text-sm text-gray-600 italic">
                {data.insight}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}