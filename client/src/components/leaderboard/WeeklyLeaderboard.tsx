import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AchievementProgressBar, Achievement } from "./AchievementProgressBar";
import { Star, Trophy, Crown, Award, Target } from "lucide-react";
import { motion } from "framer-motion";

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
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No leaderboard data available.</p>
      </div>
    );
  }

  // Find the highest score to calculate percentage for Progress component
  const highestScore = Math.max(...data.map(user => user.score));
  
  // Define achievements based on department type
  const getAchievements = (score: number, maxScore: number, department: string): Achievement[] => {
    if (department === 'sales') {
      return [
        { value: 20, label: 'Rookie', icon: 'star', description: 'Getting started with sales' },
        { value: 50, label: 'Dealmaker', icon: 'target', description: 'Building momentum' },
        { value: 80, label: 'Closer', icon: 'award', description: 'Exceptional closing skills' },
        { value: 100, label: 'MVP', icon: 'crown', description: 'Top sales performer' }
      ];
    } else if (department === 'dispatch') {
      return [
        { value: 20, label: 'Starter', icon: 'star', description: 'Getting started with dispatch' },
        { value: 50, label: 'Scheduler', icon: 'target', description: 'Efficient load booking' },
        { value: 80, label: 'Controller', icon: 'trophy', description: 'Volume dispatch pro' },
        { value: 100, label: 'Master', icon: 'crown', description: 'Top dispatch performer' }
      ];
    } else { // Combined
      return [
        { value: maxScore * 0.25, label: 'Contributor', icon: 'star', description: 'Valuable team member' },
        { value: maxScore * 0.5, label: 'Performer', icon: 'target', description: 'Consistent performer' },
        { value: maxScore * 0.75, label: 'Leader', icon: 'trophy', description: 'Department leader' },
        { value: maxScore, label: 'Champion', icon: 'crown', description: 'Top overall performer' }
      ];
    }
  };

  return (
    <div className="space-y-4">
      {data.map((user, index) => {
        const isExpanded = expandedUser === user.id;
        const userColor = index === 0 ? "#F2A71B" : index === 1 ? "#025E73" : "#412754";
        const achievements = getAchievements(user.score, highestScore, departmentType);
        
        return (
          <motion.div 
            key={user.id} 
            layout
            className="rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors overflow-hidden"
          >
            <div 
              className="flex items-center justify-between gap-4 p-3 cursor-pointer"
              onClick={() => setExpandedUser(isExpanded ? null : user.id)}
            >
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
                  className={`h-2 w-full ${
                    index === 0 ? "bg-[#F2A71B]/20" : 
                    index === 1 ? "bg-[#025E73]/20" : 
                    "bg-[#412754]/20"
                  }`}
                  // Apply color to the indicator via direct className
                  style={{
                    "--progress-indicator-color": userColor
                  } as React.CSSProperties}
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
            
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="px-3 pb-3"
              >
                <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                  <h4 className="text-sm font-medium mb-2">Achievement Progress</h4>
                  
                  <AchievementProgressBar
                    currentValue={user.score}
                    maxValue={departmentType === 'combined' ? highestScore : 100}
                    achievements={achievements}
                    color={userColor}
                    animated={true}
                  />
                  
                  <div className="mt-4 text-xs text-muted-foreground">
                    <p>Click milestone icons to see achievement details</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}