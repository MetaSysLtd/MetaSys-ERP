import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CRMTopPerformer } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, TrendingUp, ArrowUpRight } from "lucide-react";

interface TopPerformersProps {
  data: CRMTopPerformer[];
  metric?: 'leads' | 'conversions' | 'handoffs' | 'commissions';
}

export function TopPerformers({ data, metric = 'leads' }: TopPerformersProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200 h-full">
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine metric label
  let metricLabel = 'Leads';
  switch (metric) {
    case 'conversions':
      metricLabel = 'Conversions';
      break;
    case 'handoffs':
      metricLabel = 'Handoffs';
      break;
    case 'commissions':
      metricLabel = 'Commissions';
      break;
  }

  // Sort by value, highest first
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  // Find maximum value for percentage calculations
  const maxValue = Math.max(...sortedData.map(item => item.value));

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Top Performers</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Sales team performance by {metricLabel.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedData.length > 0 && (
          <div className="flex items-center mb-6">
            <div className="p-2 bg-amber-50 rounded-full mr-3">
              <Award className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium">{sortedData[0].name}</p>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-1">Top Performer with</span>
                <span className="text-xs font-semibold text-amber-500">
                  {metric === 'commissions' ? `$${sortedData[0].value.toLocaleString()}` : sortedData[0].value}
                </span>
              </div>
            </div>
          </div>
        )}

        <ul className="space-y-3">
          {sortedData.map((performer, index) => {
            // Calculate percentage of max value for progress bar
            const percentage = Math.round((performer.value / maxValue) * 100);
            
            // Determine rank color based on position
            let rankColor = "bg-gray-200 text-gray-700";
            if (index === 0) rankColor = "bg-amber-100 text-amber-700";
            else if (index === 1) rankColor = "bg-gray-100 text-gray-700";
            else if (index === 2) rankColor = "bg-amber-50 text-amber-600";

            return (
              <li key={index} className="flex items-center">
                <div className={`w-6 h-6 rounded-full ${rankColor} flex items-center justify-center text-xs font-bold mr-3`}>
                  {index + 1}
                </div>
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={performer.avatarUrl || ''} alt={performer.name} />
                  <AvatarFallback>{performer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{performer.name}</p>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-1">
                        {metric === 'commissions' ? `$${performer.value.toLocaleString()}` : performer.value}
                      </span>
                      {performer.growth > 0 && (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-[#025E73] h-1.5 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <button className="text-xs text-[#025E73] font-medium flex items-center hover:underline">
            View full leaderboard
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}