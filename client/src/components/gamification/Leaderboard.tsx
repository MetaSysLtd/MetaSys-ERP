import React from 'react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Award, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';

interface LeaderboardUser {
  id: number;
  name: string;
  score: number;
  position: number;
  previousPosition: number;
  department: string;
  rank: string;
  level: number;
  avatarUrl?: string;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  users: LeaderboardUser[];
  period: LeaderboardPeriod;
  title?: string;
  showMore?: () => void;
  className?: string;
  limit?: number;
}

export function Leaderboard({
  users,
  period,
  title = "Leaderboard",
  showMore,
  className,
  limit = 10
}: LeaderboardProps) {
  const sortedUsers = [...users].sort((a, b) => a.position - b.position).slice(0, limit);
  
  // Find the current user for highlighting
  const currentUserIndex = sortedUsers.findIndex(user => user.isCurrentUser);
  
  const getPositionLabel = (period: LeaderboardPeriod) => {
    switch (period) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      case 'allTime': return 'All Time';
      default: return 'Current';
    }
  };
  
  const getPositionChange = (user: LeaderboardUser) => {
    if (user.previousPosition === user.position) {
      return <Minus className="h-3 w-3 text-gray-400" />;
    }
    
    const change = user.previousPosition - user.position;
    
    if (change > 0) {
      return (
        <div className="flex items-center text-green-500">
          <ArrowUp className="h-3 w-3" />
          <span className="text-xs ml-0.5">{change}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-red-500">
        <ArrowDown className="h-3 w-3" />
        <span className="text-xs ml-0.5">{Math.abs(change)}</span>
      </div>
    );
  };
  
  const getTopRankIcon = (position: number) => {
    if (position === 1) {
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    }
    if (position === 2) {
      return <Medal className="h-4 w-4 text-gray-400" />;
    }
    if (position === 3) {
      return <Award className="h-4 w-4 text-amber-700" />;
    }
    return null;
  };
  
  return (
    <MotionWrapper animation="slideUp" delay={0.15}>
      <Card className={cn("border-[#025E73]/20", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex justify-between items-center">
            <span>{title}</span>
            <Badge variant="outline" className="px-2 py-0 text-xs font-normal">
              {getPositionLabel(period)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Top performers based on gamification points
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-1">
          <div className="space-y-1">
            {sortedUsers.map((user, index) => (
              <div 
                key={user.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md border",
                  user.isCurrentUser
                    ? "bg-blue-50 border-blue-200"
                    : "border-transparent hover:bg-gray-50"
                )}
              >
                {/* Position */}
                <div className="w-7 flex justify-center">
                  {getTopRankIcon(user.position) || (
                    <span className="text-sm font-medium text-gray-600">
                      {user.position}
                    </span>
                  )}
                </div>
                
                {/* User avatar */}
                <Avatar className="h-8 w-8">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  ) : (
                    <AvatarFallback className="bg-[#025E73] text-white text-xs">
                      {user.name.split(' ').map(part => part[0]).join('')}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium truncate text-gray-900">{user.name}</h4>
                    <div className="text-xs font-medium text-[#025E73]">
                      {user.score.toLocaleString()} pts
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="truncate">{user.department}</span>
                    <span className="mx-1">•</span>
                    <span>Level {user.level}</span>
                  </div>
                </div>
                
                {/* Position change indicator */}
                <div className="flex items-center justify-center w-6">
                  {getPositionChange(user)}
                </div>
              </div>
            ))}
            
            {/* If current user is not in the displayed list */}
            {currentUserIndex === -1 && users.some(u => u.isCurrentUser) && (
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                <div className="flex items-center gap-3 p-2 rounded-md bg-blue-50 border border-blue-200">
                  {/* Position */}
                  <div className="w-7 flex justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {users.find(u => u.isCurrentUser)?.position}
                    </span>
                  </div>
                  
                  {/* User avatar */}
                  <Avatar className="h-8 w-8">
                    {users.find(u => u.isCurrentUser)?.avatarUrl ? (
                      <AvatarImage 
                        src={users.find(u => u.isCurrentUser)?.avatarUrl} 
                        alt={users.find(u => u.isCurrentUser)?.name || 'User'} 
                      />
                    ) : (
                      <AvatarFallback className="bg-[#025E73] text-white text-xs">
                        {users.find(u => u.isCurrentUser)?.name.split(' ').map(part => part[0]).join('') || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium truncate text-gray-900">{users.find(u => u.isCurrentUser)?.name} (You)</h4>
                      <div className="text-xs font-medium text-[#025E73]">
                        {users.find(u => u.isCurrentUser)?.score.toLocaleString()} pts
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="truncate">{users.find(u => u.isCurrentUser)?.department}</span>
                      <span className="mx-1">•</span>
                      <span>Level {users.find(u => u.isCurrentUser)?.level}</span>
                    </div>
                  </div>
                  
                  {/* Position change indicator */}
                  <div className="flex items-center justify-center w-6">
                    {getPositionChange(users.find(u => u.isCurrentUser) as LeaderboardUser)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        {showMore && (
          <CardFooter className="pt-2 flex justify-center">
            <button 
              onClick={showMore}
              className="text-sm text-[#025E73] hover:text-[#025E73]/80 underline-offset-4 hover:underline"
            >
              View Full Leaderboard
            </button>
          </CardFooter>
        )}
      </Card>
    </MotionWrapper>
  );
}