import * as React from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadAlertBannerProps {
  type: "assignment" | "followUp" | "weeklyReminder" | "statusChange";
  status?: "Active" | "Unqualified" | "HandToDispatch";
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function LeadAlertBanner({ 
  type, 
  status, 
  message, 
  onDismiss,
  className 
}: LeadAlertBannerProps) {
  const [visible, setVisible] = React.useState(true);
  
  // Determine banner color based on type and status
  const getBannerStyles = () => {
    if (type === "assignment") {
      return "bg-[#F2A71B] border-[#F2A71B]/70 text-white"; // Yellow for assignments
    } else if (type === "statusChange") {
      if (status === "Active") {
        return "bg-[#2EC4B6] border-[#2EC4B6]/70 text-white"; // Green for active status
      } else if (status === "Unqualified") {
        return "bg-[#C93131] border-[#C93131]/70 text-white"; // Red for unqualified status
      }
    } else if (type === "followUp" || type === "weeklyReminder") {
      return "bg-[#C93131] border-[#C93131]/70 text-white"; // Red for reminders
    }
    
    // Default
    return "bg-[#F2A71B] border-[#F2A71B]/70 text-white";
  };
  
  // Get icon based on type and status
  const getIcon = () => {
    if (type === "statusChange" && status === "Active") {
      return <CheckCircle className="h-5 w-5" />;
    }
    return <AlertTriangle className="h-5 w-5" />;
  };
  
  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  if (!visible) return null;
  
  return (
    <div 
      className={cn(
        "flex items-center justify-between px-4 py-3 border rounded-md",
        getBannerStyles(),
        className
      )}
      role="alert"
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className="ml-auto rounded-full p-1 hover:bg-black/10 focus:outline-none"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}