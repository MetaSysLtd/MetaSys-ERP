import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CRMTopPerformers } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface TopPerformersProps {
  data: CRMTopPerformers;
}

export function TopPerformers({ data }: TopPerformersProps) {
  if (!data || !data.salesReps.length) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200 h-full">
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Top Performers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.salesReps.map((performer, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Avatar className="h-10 w-10 border border-gray-200">
                  {performer.avatarUrl ? (
                    <AvatarImage src={performer.avatarUrl} alt={performer.name} />
                  ) : (
                    <AvatarFallback className="bg-[#025E73] text-white">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {performer.name}
                </p>
                <div className="flex items-center">
                  <Badge 
                    variant="outline"
                    className={`mr-2 ${getBadgeColor(performer.metric)}`}
                  >
                    {performer.metric === "conversions" 
                      ? `${performer.count || 0} conversions` 
                      : performer.metric === "revenue" 
                        ? `$${Math.round(performer.value || 0).toLocaleString()}` 
                        : `${performer.percentage || 0}% growth`}
                  </Badge>
                  <p className="truncate text-xs text-gray-500">
                    {performer.achievement}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500">
            Performance is calculated based on lead conversions, revenue generated, and growth metrics.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function getBadgeColor(metric: "conversions" | "revenue" | "growth"): string {
  switch (metric) {
    case "conversions":
      return "bg-[#E6F1F3] text-[#025E73] border-[#025E73]";
    case "revenue":
      return "bg-[#FEF5E7] text-[#F2A71B] border-[#F2A71B]";
    case "growth":
      return "bg-[#EEEAF0] text-[#412754] border-[#412754]";
    default:
      return "bg-gray-100 text-gray-800";
  }
}