import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Medal, 
  Trophy, 
  Award, 
  TrendingUp, 
  DollarSign, 
  Users 
} from "lucide-react";

type TopPerformersProps = {
  data: any;
};

export function TopPerformers({ data }: TopPerformersProps) {
  // List of icons to use for the top performers
  const icons = [
    <Trophy className="h-6 w-6 text-yellow-500" />,
    <Medal className="h-6 w-6 text-gray-400" />,
    <Award className="h-6 w-6 text-amber-700" />,
  ];
  
  const performers = data?.salesReps || [];
  
  return (
    <Card className="shadow hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#025E73] font-medium">
          Top Performing Sales Representatives
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {performers.slice(0, 5).map((performer: any, index: number) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {index < 3 ? (
                  icons[index]
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium text-xs">
                    {index + 1}
                  </div>
                )}
              </div>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={performer.avatarUrl} alt={performer.name} />
                <AvatarFallback>
                  {performer.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {performer.name}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {performer.metric === "conversions" && (
                    <span className="inline-flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {performer.count} conversions
                    </span>
                  )}
                  {performer.metric === "revenue" && (
                    <span className="inline-flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      ${performer.value.toLocaleString()} revenue
                    </span>
                  )}
                  {performer.metric === "growth" && (
                    <span className="inline-flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {performer.percentage}% growth
                    </span>
                  )}
                </p>
              </div>
              
              <div className={`flex-shrink-0 text-sm font-medium ${
                index === 0 
                  ? "text-yellow-500" 
                  : index === 1 
                    ? "text-gray-500" 
                    : index === 2 
                      ? "text-amber-700" 
                      : "text-gray-900"
              }`}>
                {performer.achievement}
              </div>
            </div>
          ))}
          
          {performers.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No performance data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}