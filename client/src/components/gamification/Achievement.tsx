import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Crown, Medal, Star, Trophy, Award, Zap, Flame } from 'lucide-react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';

export interface AchievementProps {
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  category: 'sales' | 'dispatch' | 'personal' | 'company';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  progress: number; // 0-100
  unlocked: boolean;
  date?: string;
  points: number;
  className?: string;
}

// Map achievement tier to icon and color
const tierConfig = {
  bronze: { 
    icon: Medal, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200'
  },
  silver: { 
    icon: Award, 
    color: 'text-slate-500', 
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200'
  },
  gold: { 
    icon: Trophy, 
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  platinum: { 
    icon: Crown, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200'
  }
};

// Map achievement category to color scheme
const categoryConfig = {
  sales: { 
    icon: Flame,
    badge: 'bg-[#412754] text-white',
    labelText: 'Sales Achievement'
  },
  dispatch: { 
    icon: Zap,
    badge: 'bg-[#025E73] text-white',
    labelText: 'Dispatch Achievement'
  },
  personal: { 
    icon: Star,
    badge: 'bg-[#F2A71B] text-white',
    labelText: 'Personal Achievement'
  },
  company: { 
    icon: Medal,
    badge: 'bg-[#011F26] text-white',
    labelText: 'Company Achievement'
  }
};

export const Achievement: React.FC<AchievementProps> = ({ 
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
}) => {
  const { icon: TierIcon, color: tierColor, bgColor, borderColor } = tierConfig[tier];
  const { badge: categoryBadge, labelText, icon: CategoryIcon } = categoryConfig[category];
  
  return (
    <MotionWrapper animation="fade" delay={0.1}>
      <Card className={`overflow-hidden border ${unlocked ? borderColor : 'border-gray-200'} ${className}`}>
        <div className={`h-2 ${unlocked ? bgColor : 'bg-gray-100'}`}></div>
        <CardHeader className="py-4 px-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${unlocked ? bgColor : 'bg-gray-100'}`}>
                <TierIcon className={`h-5 w-5 ${unlocked ? tierColor : 'text-gray-400'}`} />
              </div>
              <div>
                <CardTitle className={`text-base font-medium ${unlocked ? '' : 'text-gray-500'}`}>
                  {title}
                </CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={unlocked ? categoryBadge : 'bg-gray-200 text-gray-600'}>
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    <span className="text-xs">{labelText}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{type.charAt(0).toUpperCase() + type.slice(1)} achievement</p>
                  {date && <p className="text-xs">Unlocked: {date}</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className={unlocked ? 'font-medium text-green-600' : 'text-muted-foreground'}>
                {progress}%
              </span>
            </div>
            <Progress 
              value={progress} 
              className="h-2" 
              indicatorClassName={
                unlocked ? "bg-green-500" : 
                progress >= 75 ? "bg-blue-500" : 
                progress >= 50 ? "bg-amber-500" : 
                "bg-gray-300"
              } 
            />
          </div>
        </CardContent>
        <CardFooter className="px-4 py-3 bg-slate-50 flex justify-between">
          <span className="text-xs text-muted-foreground">
            {unlocked ? 'Completed' : 'In Progress'}
          </span>
          <Badge variant={unlocked ? 'default' : 'outline'} className="gap-1">
            <Star className="h-3 w-3" />
            <span>{points}</span>
          </Badge>
        </CardFooter>
      </Card>
    </MotionWrapper>
  );
};