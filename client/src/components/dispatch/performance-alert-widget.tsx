import { useEffect, useState } from "react";
import { useSocketNotifications } from "@/hooks/use-socket-notifications";
import { ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export function PerformanceAlertWidget() {
  const { performanceAlertData, resetPerformanceAlert } = useSocketNotifications();
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<{
    color: "Red" | "Green"; 
    message: string;
    percentOfGoal: number;
    target: number;
    actual: number;
  } | null>(null);

  // Update state when data changes
  useEffect(() => {
    if (performanceAlertData) {
      setData(performanceAlertData);
      setVisible(true);
    }
  }, [performanceAlertData]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!visible) return;
    
    const timer = setTimeout(() => {
      setVisible(false);
      resetPerformanceAlert();
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [visible, resetPerformanceAlert]);

  if (!visible || !data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`rounded-lg p-4 ${
        data.color === "Red" 
          ? "bg-red-50 border border-red-200" 
          : "bg-green-50 border border-green-200"
      }`}
    >
      <div className="flex items-center">
        <div className={`p-2 rounded-full mr-3 ${
          data.color === "Red" 
            ? "bg-red-100" 
            : "bg-green-100"
        }`}>
          {data.color === "Red" ? (
            <ArrowDown className="h-5 w-5 text-red-500" />
          ) : (
            <ArrowUp className="h-5 w-5 text-green-500" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className={`font-medium text-sm ${
            data.color === "Red" 
              ? "text-red-800" 
              : "text-green-800"
          }`}>
            {data.message}
          </h3>
          
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-600">Target: ${data.target.toLocaleString()}</p>
            <p className="text-xs text-gray-600">Actual: ${data.actual.toLocaleString()}</p>
            <p className={`text-xs font-semibold ${
              data.color === "Red" 
                ? "text-red-600" 
                : "text-green-600"
            }`}>
              {data.percentOfGoal}% of target
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}