import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export function NotificationBadge({ 
  count, 
  max = 99, 
  className 
}: NotificationBadgeProps) {
  // Handle count display
  const displayCount = count > max ? `${max}+` : count.toString();

  // Don't render anything if count is 0
  if (count <= 0) return null;

  return (
    <Badge 
      className={cn(
        "rounded-full bg-red-500 text-white border-0 px-1.5 min-w-5 h-5 flex items-center justify-center text-xs",
        className
      )}
    >
      {displayCount}
    </Badge>
  );
}