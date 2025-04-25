import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Inbox, Search, AlertCircle, FileX, ShieldAlert, BarChart, RefreshCw } from 'lucide-react';

export type EmptyStateType = 
  | 'no-data' 
  | 'no-results' 
  | 'error' 
  | 'no-access' 
  | 'empty-file' 
  | 'loading-error' 
  | 'no-activity';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
  compact?: boolean;
  iconClassName?: string;
}

/**
 * Default titles and descriptions for each empty state type
 */
const defaultEmptyStates: Record<EmptyStateType, { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
}> = {
  'no-data': {
    title: 'No data available',
    description: 'There is no data to display at this time.',
    icon: <Inbox />
  },
  'no-results': {
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
    icon: <Search />
  },
  'error': {
    title: 'Error loading data',
    description: 'There was a problem loading this data. Please try again later.',
    icon: <AlertCircle />
  },
  'no-access': {
    title: 'Access restricted',
    description: 'You don\'t have permission to view this content.',
    icon: <ShieldAlert />
  },
  'empty-file': {
    title: 'No files uploaded',
    description: 'Upload files to get started.',
    icon: <FileX />
  },
  'loading-error': {
    title: 'Failed to load',
    description: 'There was a problem loading this content. Please try again.',
    icon: <RefreshCw />
  },
  'no-activity': {
    title: 'No recent activity',
    description: 'There has been no recent activity to display.',
    icon: <BarChart />
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
  compact = false,
  iconClassName
}) => {
  // Get default values based on type
  const defaultState = defaultEmptyStates[type];
  
  const finalTitle = title || defaultState.title;
  const finalDescription = description || defaultState.description;
  const finalIcon = icon || defaultState.icon;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-6",
      compact ? "space-y-3 py-4" : "space-y-4 p-8",
      className
    )}>
      <div className={cn(
        "text-muted-foreground/70 flex items-center justify-center", 
        compact ? "w-12 h-12" : "w-16 h-16",
        type === 'error' ? "text-destructive/80" : "",
        iconClassName
      )}>
        {React.isValidElement(finalIcon) 
          ? React.cloneElement(finalIcon as React.ReactElement, { 
              className: cn(
                compact ? "h-10 w-10" : "h-14 w-14",
                (finalIcon as React.ReactElement).props.className
              )
            }) 
          : finalIcon}
      </div>
      
      <div className="space-y-2 max-w-xs">
        <h3 className={cn(
          "font-semibold text-foreground",
          compact ? "text-base" : "text-lg"
        )}>
          {finalTitle}
        </h3>
        <p className={cn(
          "text-muted-foreground",
          compact ? "text-sm" : "text-base"
        )}>
          {finalDescription}
        </p>
      </div>
      
      {(action || secondaryAction) && (
        <div className={cn(
          "flex",
          secondaryAction ? "space-x-3" : ""
        )}>
          {action && (
            <Button 
              onClick={action.onClick}
              size={compact ? "sm" : "default"}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button 
              variant="outline" 
              onClick={secondaryAction.onClick}
              size={compact ? "sm" : "default"}
            >
              {secondaryAction.icon && <span className="mr-2">{secondaryAction.icon}</span>}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;