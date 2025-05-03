import React from 'react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { cn } from '@/lib/utils';
import { Trophy, Check, Lock, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type AchievementType = 'daily' | 'weekly' | 'monthly' | 'special';

interface AchievementProps {
  title: string;
  description: string;
  type: AchievementType;
  category: string;
  tier: string;
  progress: number;
  unlocked: boolean;
  date?: string;
  points: number;
  className?: string;
}

const tierColors = {
  'bronze': 'from-amber-700 to-amber-500',
  'silver': 'from-slate-400 to-slate-300',
  'gold': 'from-yellow-500 to-yellow-300',
  'platinum': 'from-cyan-300 to-cyan-100',
  'diamond': 'from-purple-500 to-blue-300',
};

export function Achievement({
  title,
  description,
  type,
  category,
  tier,
  progress,
  unlocked,
  date,
  points,
  className
}: AchievementProps) {
  const tierColor = tierColors[tier as keyof typeof tierColors] || 'from-gray-500 to-gray-300';
  
  return (
    <MotionWrapper animation="scale" delay={0.05} className="w-full">
      <div className={cn(
        "bg-white/80 backdrop-blur-sm border rounded-lg p-4 relative overflow-hidden h-full transition-all duration-200",
        unlocked 
          ? "border-[#025E73]/30 hover:border-[#025E73]/70 shadow-sm hover:shadow-md" 
          : "border-gray-200 opacity-80 hover:opacity-100",
        className
      )}>
        {/* Status icon */}
        <div className="absolute top-3 right-3">
          {unlocked ? (
            <div className="bg-green-100 text-green-600 rounded-full p-1">
              <Check className="h-4 w-4" />
            </div>
          ) : (
            <div className="bg-gray-100 text-gray-500 rounded-full p-1">
              <Lock className="h-4 w-4" />
            </div>
          )}
        </div>
        
        {/* Achievement icon with tier color */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center mb-3 text-white",
          `bg-gradient-to-br ${tierColor}`
        )}>
          <Trophy className="h-5 w-5" />
        </div>
        
        {/* Title and description */}
        <h3 className="text-base font-semibold mb-1 text-gray-900 pr-8">{title}</h3>
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{description}</p>
        
        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 font-medium">{`Progress: ${Math.round(progress)}%`}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[#025E73] font-semibold flex items-center">
                    {points} pts
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Points awarded when achievement is unlocked</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        
        {/* Footer info */}
        <div className="flex justify-between text-xs text-gray-500 mt-3">
          <span className="uppercase tracking-wide">{category}</span>
          {date && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {date}
            </span>
          )}
        </div>
      </div>
    </MotionWrapper>
  );
}