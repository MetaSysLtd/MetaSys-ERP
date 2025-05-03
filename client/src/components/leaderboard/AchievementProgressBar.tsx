import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Trophy, Award, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Achievement {
  value: number;
  label: string;
  icon: 'crown' | 'star' | 'trophy' | 'award' | 'target';
  description?: string;
}

export interface AchievementProgressBarProps {
  currentValue: number;
  maxValue: number;
  className?: string;
  achievements: Achievement[];
  color?: string;
  animated?: boolean;
}

export function AchievementProgressBar({
  currentValue,
  maxValue,
  className,
  achievements,
  color = '#025E73',
  animated = true,
}: AchievementProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const percentage = Math.min(100, Math.max(0, (currentValue / maxValue) * 100));

  // Sort achievements by value (ascending)
  const sortedAchievements = [...achievements].sort((a, b) => a.value - b.value);

  // Animate the progress when component mounts or when percentage changes
  useEffect(() => {
    if (animated) {
      // Start at 0
      setProgress(0);
      
      // Animate to the actual percentage
      const timer = setTimeout(() => {
        setProgress(percentage);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setProgress(percentage);
    }
  }, [percentage, animated]);

  // Get the icon component based on the achievement's icon
  const getIcon = (iconName: Achievement['icon']) => {
    switch (iconName) {
      case 'crown':
        return <Crown className="w-4 h-4" />;
      case 'star':
        return <Star className="w-4 h-4" />;
      case 'trophy':
        return <Trophy className="w-4 h-4" />;
      case 'award':
        return <Award className="w-4 h-4" />;
      case 'target':
        return <Target className="w-4 h-4" />;
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("relative mt-6 mb-8", className)}>
        {/* Base progress bar track */}
        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          {/* Animated progress indicator */}
          <motion.div
            className="h-full rounded-full"
            style={{ 
              backgroundColor: color,
              width: `${progress}%`,
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ 
              duration: animated ? 1.5 : 0,
              ease: "easeOut"
            }}
          />
        </div>
        
        {/* Current value indicator */}
        {currentValue > 0 && (
          <motion.div
            className="absolute top-0 w-3 h-3 bg-white dark:bg-slate-800 rounded-full border-2 border-amber-500 shadow-md"
            style={{ 
              left: `${percentage}%`,
              transform: 'translateX(-50%) translateY(-25%)'
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: 1 
            }}
            transition={{ 
              delay: animated ? 1.5 : 0,
              duration: animated ? 0.8 : 0,
              repeat: animated ? Infinity : 0,
              repeatDelay: 3
            }}
          />
        )}
        
        {/* Achievement markers */}
        {sortedAchievements.map((achievement, index) => {
          const achievementPosition = (achievement.value / maxValue) * 100;
          const isAchieved = currentValue >= achievement.value;
          
          return (
            <div 
              key={index}
              className="absolute top-0 transform -translate-y-full"
              style={{ 
                left: `${achievementPosition}%`, 
                transform: `translateX(-50%) translateY(-100%)`,
              }}
            >
              {/* Achievement marker with tooltip */}
              <Tooltip open={activeTooltip === index}>
                <TooltipTrigger asChild>
                  <motion.div 
                    className={cn(
                      "flex items-center justify-center rounded-full p-1 cursor-pointer",
                      isAchieved 
                        ? "bg-white text-amber-500 border-2 border-amber-500 dark:bg-slate-800" 
                        : "bg-white text-slate-400 border-2 border-slate-300 dark:bg-slate-800 dark:border-slate-600"
                    )}
                    onClick={() => setActiveTooltip(activeTooltip === index ? null : index)}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ 
                      delay: animated ? 0.5 + (index * 0.2) : 0,
                      duration: animated ? 0.5 : 0
                    }}
                  >
                    {getIcon(achievement.icon)}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="p-3 max-w-[200px] bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700">
                  <div className="space-y-1">
                    <div className="font-semibold text-sm">{achievement.label}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {achievement.description || 'Achievement milestone'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                      Target: {achievement.value} {achievement.value === maxValue ? '(max)' : ''}
                    </div>
                    {isAchieved && (
                      <div className="text-xs font-medium text-amber-500 pt-1 flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Achieved!
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
              
              {/* Label below the marker */}
              <motion.div 
                className={cn(
                  "text-xs font-medium mt-1 text-center whitespace-nowrap",
                  isAchieved ? "text-amber-500" : "text-slate-500"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ 
                  delay: animated ? 0.7 + (index * 0.2) : 0,
                  duration: animated ? 0.3 : 0
                }}
              >
                {achievement.label}
              </motion.div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}