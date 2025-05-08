import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CRMTopPerformers } from "@shared/schema";
import { BadgeCheck, TrendingUp, Trophy, Award } from "lucide-react";

interface TopPerformersProps {
  data: CRMTopPerformers;
}

export function TopPerformers({ data }: TopPerformersProps) {
  if (!data || !data.salesReps || data.salesReps.length === 0) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
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

  // Ensure data is sorted by performance score descending
  const sortedReps = [...data.salesReps].sort((a, b) => b.score - a.score);
  
  // Get the top 5 reps
  const topReps = sortedReps.slice(0, 5);

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Top Performers</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Sales team leaderboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topReps.map((rep, index) => (
            <div key={rep.id} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  {index === 0 ? (
                    <div className="p-1.5 bg-yellow-50 rounded-full">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 font-medium">
                      {index + 1}
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={rep.profileImageUrl || undefined} alt={rep.name} />
                    <AvatarFallback className="bg-[#025E73] text-white">
                      {rep.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{rep.name}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{rep.leads} leads</span>
                      <span className="mx-1">•</span>
                      <span>{rep.conversions} conversions</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-[#025E73]">${rep.revenue.toLocaleString()}</div>
                <div className="flex items-center justify-end text-xs">
                  <span className={`font-medium ${rep.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {rep.change >= 0 ? '+' : ''}{rep.change}%
                  </span>
                  <TrendingUp 
                    className={`h-3 w-3 ml-1 ${rep.change >= 0 ? 'text-green-600' : 'text-red-600'}`} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {topReps.length > 0 && (
          <div className="mt-4 bg-gray-50 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <Award className="h-4 w-4 text-[#F2A71B] mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-700">Top Rep This Month</p>
                <p className="text-sm font-medium text-[#025E73]">{topReps[0].name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {topReps[0].conversions} conversions • ${topReps[0].revenue.toLocaleString()} revenue
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}