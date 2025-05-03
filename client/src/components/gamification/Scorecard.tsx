import React from 'react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { cn } from '@/lib/utils';
import { 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Star, 
  BarChart, 
  Flame,
  Target
} from 'lucide-react';
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

interface ScoreCardProps {
  score: number;
  rank: string;
  level: number;
  nextLevel: number;
  progress: number;
  streak: number;
  position: number;
  totalUsers: number;
  achievements: {
    total: number;
    unlocked: number;
  };
  className?: string;
}

const rankColors = {
  'Beginner': 'from-gray-500 to-gray-400',
  'Rookie': 'from-green-500 to-green-400',
  'Advanced': 'from-blue-500 to-blue-400',
  'Pro': 'from-purple-500 to-purple-400',
  'Expert': 'from-amber-500 to-amber-400',
  'Master': 'from-red-500 to-red-400',
  'Legendary': 'from-yellow-500 to-yellow-300',
};

export function Scorecard({
  score,
  rank,
  level,
  nextLevel,
  progress,
  streak,
  position,
  totalUsers,
  achievements,
  className
}: ScoreCardProps) {
  const rankColor = rankColors[rank as keyof typeof rankColors] || 'from-gray-500 to-gray-400';
  const percentile = Math.max(0, Math.min(100, Math.round((1 - (position / totalUsers)) * 100)));
  
  return (
    <MotionWrapper animation="slideUp" delay={0.1}>
      <Card className={cn("border-[#025E73]/20", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex justify-between items-center">
            <span>Your Performance</span>
            <span className="text-[#025E73]">{score.toLocaleString()} pts</span>
          </CardTitle>
          <CardDescription>
            Performance metrics and gamification score
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Rank */}
            <div className="bg-white/70 border border-[#025E73]/10 rounded-lg p-3 flex flex-col">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-[#F2A71B]" />
                <span>Rank</span>
              </div>
              <div className={cn(
                "font-semibold text-sm",
                "bg-gradient-to-r bg-clip-text text-transparent",
                rankColor
              )}>
                {rank}
              </div>
            </div>
            
            {/* Level */}
            <div className="bg-white/70 border border-[#025E73]/10 rounded-lg p-3 flex flex-col">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-[#F2A71B]" />
                <span>Level</span>
              </div>
              <div className="font-semibold text-sm flex items-center gap-2">
                <span className="text-gray-900">{level}</span>
                <span className="text-xs text-gray-400">→ {nextLevel}</span>
                <span className="text-xs text-[#025E73]">({progress}%)</span>
              </div>
            </div>
            
            {/* Position */}
            <div className="bg-white/70 border border-[#025E73]/10 rounded-lg p-3 flex flex-col">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                <BarChart className="h-3.5 w-3.5 text-[#F2A71B]" />
                <span>Position</span>
              </div>
              <div className="font-semibold text-sm flex items-center gap-2">
                <span className="text-gray-900">#{position}</span>
                <span className="text-xs text-[#025E73]">
                  Top {percentile}%
                </span>
              </div>
            </div>
            
            {/* Streak */}
            <div className="bg-white/70 border border-[#025E73]/10 rounded-lg p-3 flex flex-col">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-[#F2A71B]" />
                <span>Streak</span>
              </div>
              <div className="font-semibold text-sm flex items-center gap-1">
                <span className="text-gray-900">{streak}</span>
                <span className="text-xs text-gray-500">days</span>
              </div>
            </div>
            
            {/* Achievements */}
            <div className="bg-white/70 border border-[#025E73]/10 rounded-lg p-3 flex flex-col">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-[#F2A71B]" />
                <span>Achievements</span>
              </div>
              <div className="font-semibold text-sm flex items-center gap-1">
                <span className="text-gray-900">{achievements.unlocked}</span>
                <span className="text-xs text-gray-500">/ {achievements.total}</span>
                <span className="text-xs text-[#025E73]">
                  ({Math.round((achievements.unlocked / achievements.total) * 100)}%)
                </span>
              </div>
            </div>
            
            {/* Weekly Trend */}
            <div className="bg-white/70 border border-[#025E73]/10 rounded-lg p-3 flex flex-col">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[#F2A71B]" />
                <span>Weekly Trend</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="font-semibold text-sm flex items-center gap-1 text-green-500">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>+12%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>12% increase in points compared to last week</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Updated daily</span>
          </div>
        </CardFooter>
      </Card>
    </MotionWrapper>
  );
}