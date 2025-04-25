import { X } from "lucide-react";
import { motion } from "framer-motion";

type LeadAlertBannerProps = {
  type: "assignment" | "followUp" | "weeklyReminder" | "statusChange";
  status?: "Active" | "Unqualified" | "HandToDispatch";
  message: string;
  onDismiss?: () => void;
  className?: string;
};

export function LeadAlertBanner({
  type,
  status,
  message,
  onDismiss,
  className = "",
}: LeadAlertBannerProps) {
  // Determine background color based on type and status
  let bgColor = "bg-amber-100 border-amber-400 text-amber-800"; // Default yellow for assignments
  
  // Critical action needed (red)
  if (type === "followUp" || 
      type === "weeklyReminder" || 
      status === "Unqualified") {
    bgColor = "bg-red-100 border-red-400 text-red-800";
  }
  
  // Positive notification (green)
  if (status === "Active") {
    bgColor = "bg-green-100 border-green-400 text-green-800";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative px-4 py-3 rounded-md border ${bgColor} ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-3">
          <p className="text-sm font-medium">
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}