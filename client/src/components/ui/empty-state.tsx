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
  Bell,
  LineChart,
  LayoutDashboard,
  AreaChart
} from "lucide-react";
import { typography, placeholderChartStyles } from "@/lib/style-utils";

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
  | "cart"
  | "dashboard"
  | "leads"
  | "dispatch"
  | "revenue"
  | "clients"
  | "commission";

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
      case "chart": return <AreaChart {...iconProps} />;
      case "calendar": return <Calendar {...iconProps} />;
      case "clock": return <Clock {...iconProps} />;
      case "invoice": return <FileText {...iconProps} />;
      case "activity": return <Bell {...iconProps} />;
      case "settings": return <Settings {...iconProps} />;
      case "ticket": return <Ticket {...iconProps} />;
      case "notification": return <Bell {...iconProps} />;
      case "search": return <Search {...iconProps} />;
      case "cart": return <ShoppingCart {...iconProps} />;
      case "dashboard": return <LayoutDashboard {...iconProps} />;
      case "leads": return <ShoppingCart {...iconProps} />;
      case "dispatch": return <BarChart2 {...iconProps} />;
      case "revenue": return <DollarSign {...iconProps} />;
      case "clients": return <Users {...iconProps} />;
      case "commission": return <DollarSign {...iconProps} />;
      default: return <AlertCircle {...iconProps} />;
    }
  };
  
  // Generate placeholder chart for data visualizations
  const getPlaceholderChart = () => {
    if (iconType === 'chart' || iconType === 'finance') {
      return (
        <div className={`${placeholderChartStyles.base} ${placeholderChartStyles.height} mb-4`}>
          {iconType === 'finance' 
            ? <AreaChart className="h-12 w-12 text-gray-300 mb-2" />
            : <LineChart className="h-12 w-12 text-gray-300 mb-2" />
          }
          <div className={placeholderChartStyles.text}>
            {iconType === 'finance' ? 'No financial data yet' : 'No performance data yet'}
          </div>
          <div className={placeholderChartStyles.subtext}>
            {iconType === 'finance' 
              ? 'Financial charts will appear once revenue is recorded' 
              : 'Add loads to generate this metric'
            }
          </div>
        </div>
      );
    }
    return null;
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
      {/* Placeholder chart if appropriate for this empty state */}
      {!minimal && !icon && !placeholderData && (iconType === 'chart' || iconType === 'finance') && getPlaceholderChart()}
      
      {/* Standard icon display */}
      {(icon || iconType) && !minimal && (
        <div className={cn(
          "mb-4",
          iconBackground ? 
            "w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center" : 
            "text-muted-foreground"
        )}>
          {getIcon()}
        </div>
      )}
      
      {/* Small icon for minimal mode */}
      {(icon || iconType) && minimal && (
        <div className="mb-2 text-gray-400">
          {getIcon()}
        </div>
      )}
      
      <h3 className={cn(
        minimal ? typography.h5 : typography.h4
      )}>
        {title}
      </h3>
      
      <p className={cn(
        "mt-1", 
        minimal ? typography.small : typography.body,
        "text-muted-foreground",
        align === 'center' ? "max-w-md mx-auto" : ""
      )}>
        {message}
      </p>
      
      {description && (
        <p className={typography.tiny + " mt-2"}>
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
              className={minimal ? "" : "px-4 py-2"}
            >
              {actionLabel}
            </Button>
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <Button 
              variant="outline" 
              onClick={onSecondaryAction}
              size={minimal ? "sm" : "default"}
              className={minimal ? "" : "px-4 py-2"}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}