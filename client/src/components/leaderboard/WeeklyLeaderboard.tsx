import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface LeaderboardUser {
  id: number;
  name: string;
  profileImageUrl?: string | null;
  score: number;
  leadsCount?: number;
  loadsCount?: number;
  position?: number;
}

interface WeeklyLeaderboardProps {
  data: LeaderboardUser[] | undefined;
  departmentType: 'sales' | 'dispatch' | 'combined';
  period: 'current' | 'previous';
}

export function WeeklyLeaderboard({ data, departmentType, period }: WeeklyLeaderboardProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No leaderboard data available.</p>
      </div>
    );
  }

  // Find the highest score to calculate percentage for Progress component
  const highestScore = Math.max(...data.map(user => user.score));

  return (
    <div className="space-y-4">
      {data.map((user, index) => (
        <div key={user.id} className="flex items-center justify-between gap-4 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                <AvatarImage src={user.profileImageUrl || ''} alt={user.name} />
                <AvatarFallback className="bg-[#025E73] text-white">
                  {user.name.split(' ').map(part => part[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-[#F2A71B] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {index + 1}
              </div>
            </div>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">
                {departmentType === 'sales' && user.leadsCount !== undefined && (
                  <>{user.leadsCount} leads closed</>
                )}
                {departmentType === 'dispatch' && user.loadsCount !== undefined && (
                  <>{user.loadsCount} loads booked</>
                )}
                {departmentType === 'combined' && (
                  <>Score: {user.score.toFixed(0)}</>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 min-w-[100px]">
            <Progress
              value={(user.score / highestScore) * 100}
              className="h-2 w-full"
              indicatorClassName={
                index === 0 ? "bg-[#F2A71B]" : 
                index === 1 ? "bg-[#025E73]" : 
                "bg-[#412754]"
              }
            />
            <div className="text-sm text-right font-medium">
              {departmentType === 'sales' || departmentType === 'dispatch' ? (
                <>{Math.round(user.score)}%</>
              ) : (
                <>{user.score.toFixed(0)} pts</>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}