import { useEffect, useState } from "react";
import { useSocketNotifications } from "@/hooks/use-socket-notifications";
import { ToastAlert } from "@/components/ui/toast-alert";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";

interface RecentAlert {
  id: string;
  color: 'Red' | 'Green';
  message: string;
  timestamp: Date;
  target: number;
  actual: number;
}

export function PerformanceAlertWidget() {
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const { performanceAlert } = useSocketNotifications();
  const { toast } = useToast();
  
  // Handle incoming performance alerts
  useEffect(() => {
    if (performanceAlert) {
      // Create a new alert object
      const newAlert: RecentAlert = {
        id: Date.now().toString(), // Use timestamp as ID
        color: performanceAlert.color,
        message: performanceAlert.message,
        timestamp: new Date(),
        target: performanceAlert.target,
        actual: performanceAlert.actual,
      };
      
      // Show toast notification 
      toast({
        description: (
          <ToastAlert color={performanceAlert.color.toLowerCase() as 'red' | 'green'}>
            {performanceAlert.message}
          </ToastAlert>
        ),
      });
      
      // Add to recent alerts (keep most recent 5)
      setRecentAlerts(prev => {
        const updated = [newAlert, ...prev];
        return updated.slice(0, 5);
      });
    }
  }, [performanceAlert, toast]);
  
  // Function to determine percentage for progress display
  const calculatePercentage = (actual: number, target: number) => {
    const percentage = Math.round((actual / target) * 100);
    return Math.min(100, Math.max(0, percentage)); // Clamp between 0-100
  };
  
  if (recentAlerts.length === 0) {
    return null; // Don't show the widget if there are no alerts
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5" />
          Recent Performance Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentAlerts.map(alert => (
            <div key={alert.id} className="border-b pb-3 mb-3 last:border-b-0 last:mb-0 last:pb-0">
              <div className="flex justify-between items-center mb-2">
                <Badge className={`${alert.color === 'Green' ? 'bg-[#2EC4B6]' : 'bg-[#C93131]'}`}>
                  {alert.color === 'Green' ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <AlertTriangle className="mr-1 h-3 w-3" />
                  )}
                  {alert.color} Alert
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
              </div>
              
              <p className="text-sm mb-2">{alert.message}</p>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                <div 
                  className={`h-2.5 rounded-full ${
                    alert.color === 'Green' ? 'bg-[#2EC4B6]' : 'bg-[#C93131]'
                  }`}
                  style={{ width: `${calculatePercentage(alert.actual, alert.target)}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs">
                <span>Target: {alert.target}</span>
                <span>Actual: {alert.actual}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}