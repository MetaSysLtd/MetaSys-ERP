import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DatabaseIcon, 
  AlertCircleIcon, 
  SearchIcon, 
  FileXIcon, 
  InboxIcon, 
  ClipboardXIcon
} from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'database' | 'warning' | 'search' | 'empty' | 'inbox' | 'tasks';
  iconSize?: number;
  iconColor?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  children?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon = 'empty',
  iconSize = 40,
  iconColor = '#767676',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  children,
}: EmptyStateProps) {
  const renderIcon = () => {
    const iconProps = {
      size: iconSize,
      color: iconColor,
      strokeWidth: 1.5,
      className: 'mb-4 opacity-80'
    };

    switch (icon) {
      case 'database':
        return <DatabaseIcon {...iconProps} />;
      case 'warning':
        return <AlertCircleIcon {...iconProps} />;
      case 'search':
        return <SearchIcon {...iconProps} />;
      case 'empty':
        return <FileXIcon {...iconProps} />;
      case 'inbox':
        return <InboxIcon {...iconProps} />;
      case 'tasks':
        return <ClipboardXIcon {...iconProps} />;
      default:
        return <FileXIcon {...iconProps} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-muted rounded-lg bg-muted/20 min-h-[200px]">
      {renderIcon()}
      <h3 className="text-xl font-semibold mb-2 text-[#025E73]">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      )}
      {children}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex gap-3 mt-4">
          {actionLabel && (
            <Button onClick={onAction} className="bg-[#025E73] hover:bg-[#025E73]/90">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}