import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  FileQuestion, 
  Search, 
  ShoppingCart,
  Users, 
  BarChart2, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  Inbox, 
  Settings, 
  Ticket,
  Bell
} from "lucide-react";

type IconType = 
  | "data" 
  | "users" 
  | "finance" 
  | "chart" 
  | "calendar" 
  | "clock" 
  | "invoice" 
  | "activity" 
  | "settings" 
  | "ticket" 
  | "notification" 
  | "search" 
  | "cart";

interface EmptyStateProps {
  icon?: React.ReactNode;
  iconType?: IconType;
  iconSize?: number;
  iconBackground?: boolean;
  title: string;
  message: string;
  description?: string;
  actionLabel?: string;
  secondaryActionLabel?: string;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  className?: string;
  minimal?: boolean;
  align?: 'center' | 'left';
  placeholderData?: React.ReactNode;
}

export function EmptyState({
  icon,
  iconType,
  iconSize = 24,
  iconBackground = true,
  title,
  message,
  description,
  actionLabel,
  secondaryActionLabel,
  onAction,
  onSecondaryAction,
  className,
  minimal = false,
  align = 'center',
  placeholderData
}: EmptyStateProps) {
  
  const getIcon = () => {
    if (icon) return icon;
    
    const iconProps = { 
      size: iconSize, 
      className: "text-gray-400"
    };
    
    switch (iconType) {
      case "data": return <FileQuestion {...iconProps} />;
      case "users": return <Users {...iconProps} />;
      case "finance": return <DollarSign {...iconProps} />;
      case "chart": return <BarChart2 {...iconProps} />;
      case "calendar": return <Calendar {...iconProps} />;
      case "clock": return <Clock {...iconProps} />;
      case "invoice": return <FileText {...iconProps} />;
      case "activity": return <Bell {...iconProps} />;
      case "settings": return <Settings {...iconProps} />;
      case "ticket": return <Ticket {...iconProps} />;
      case "notification": return <Bell {...iconProps} />;
      case "search": return <Search {...iconProps} />;
      case "cart": return <ShoppingCart {...iconProps} />;
      default: return <AlertCircle {...iconProps} />;
    }
  };
  
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-6",
        minimal ? "h-auto py-6" : "min-h-[240px]",
        align === 'left' ? "items-start text-left" : "items-center text-center",
        className
      )}
    >
      {(icon || iconType) && (
        <div className={cn(
          "mb-4",
          iconBackground ? 
            "w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center" : 
            "text-muted-foreground"
        )}>
          {getIcon()}
        </div>
      )}
      
      <h3 className={cn(
        "font-medium", 
        minimal ? "text-base" : "text-lg"
      )}>
        {title}
      </h3>
      
      <p className={cn(
        "text-muted-foreground mt-1", 
        minimal ? "text-sm" : "text-base",
        align === 'center' ? "max-w-md mx-auto" : ""
      )}>
        {message}
      </p>
      
      {description && (
        <p className="text-sm text-gray-500 mt-2">
          {description}
        </p>
      )}
      
      {placeholderData && (
        <div className="mt-4 w-full">
          {placeholderData}
        </div>
      )}
      
      {(actionLabel || secondaryActionLabel) && (
        <div className={cn(
          "mt-4 flex",
          align === 'center' ? "justify-center" : "",
          secondaryActionLabel ? "space-x-2" : ""
        )}>
          {actionLabel && onAction && (
            <Button 
              variant="default" 
              onClick={onAction}
              size={minimal ? "sm" : "default"}
            >
              {actionLabel}
            </Button>
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <Button 
              variant="outline" 
              onClick={onSecondaryAction}
              size={minimal ? "sm" : "default"}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}