import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the format of each performer's data
interface Performer {
  id: number;
  name: string;
  avatar?: string;
  value: number;
  unit: string;
  rank: number;
  department: string;
}

interface TopPerformersProps {
  data: Performer[];
  title?: string;
  metric?: "leads" | "conversions" | "commissions";
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Trophy className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-700" />;
    default:
      return <span className="text-xs font-bold">{rank}</span>;
  }
};

const getMetricLabel = (metric: string = "leads") => {
  switch (metric) {
    case "leads":
      return "Top Lead Generators";
    case "conversions":
      return "Top Converters";
    case "commissions":
      return "Top Earners";
    default:
      return "Top Performers";
  }
};

export function TopPerformers({ data, title, metric = "leads" }: TopPerformersProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-[#025E73] flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {title || getMetricLabel(metric)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">No performance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73] flex items-center">
          <Users className="mr-2 h-5 w-5" />
          {title || getMetricLabel(metric)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((performer) => (
            <div key={performer.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div 
                  className={cn(
                    "flex items-center justify-center rounded-full w-8 h-8",
                    performer.rank <= 3 ? "bg-gray-100" : "bg-transparent"
                  )}
                >
                  {getRankIcon(performer.rank)}
                </div>
                <Avatar className="h-10 w-10 border-2 border-[#025E73]/10">
                  <AvatarImage src={performer.avatar} alt={performer.name} />
                  <AvatarFallback className="bg-[#025E73]/10 text-[#025E73]">
                    {performer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{performer.name}</p>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {performer.department}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{performer.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{performer.unit}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}