import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  minimal?: boolean;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  className,
  minimal = false
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center p-6",
        minimal ? "h-auto py-6" : "h-[240px]",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className={cn("font-medium", minimal ? "text-base" : "text-lg")}>{title}</h3>
      <p className={cn("text-muted-foreground mt-1", minimal ? "text-sm" : "text-base")}>{message}</p>
      
      {actionLabel && onAction && (
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onAction}
          size={minimal ? "sm" : "default"}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}