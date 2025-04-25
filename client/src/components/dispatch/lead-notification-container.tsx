import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useLeadNotifications } from "@/hooks/use-lead-notifications";
import { LeadAlertBanner } from "@/components/crm/lead-alert-banner";
import { MotionWrapper } from "@/components/ui/motion-wrapper-fixed";
import { Briefcase, Bell, X, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function LeadNotificationContainer() {
  const { notifications, dismissNotification, clearAllNotifications } = useLeadNotifications();
  const [expanded, setExpanded] = useState(false);
  
  // Auto-collapse notifications panel if no notifications
  useEffect(() => {
    if (notifications.length === 0 && expanded) {
      setExpanded(false);
    }
  }, [notifications, expanded]);

  // Group notifications by type for more organized display
  const groupedNotifications = {
    assignments: notifications.filter(n => n.type === "assignment"),
    followUps: notifications.filter(n => n.type === "followUp"),
    weeklyReminders: notifications.filter(n => n.type === "weeklyReminder"),
    statusChanges: notifications.filter(n => n.type === "statusChange")
  };
  
  // No notifications to display
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-20 z-50 w-96 max-w-[calc(100vw-2rem)]">
      {/* Notification count indicator */}
      {!expanded && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setExpanded(true)}
                className="ml-auto flex items-center gap-2 rounded-full bg-amber-500 px-3 py-1.5 text-white hover:bg-amber-600 transition-colors"
              >
                <Bell className="h-4 w-4" />
                <span className="font-medium">{notifications.length} Lead {notifications.length === 1 ? 'Alert' : 'Alerts'}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to view lead notifications</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Expanded notifications panel */}
      <AnimatePresence>
        {expanded && (
          <MotionWrapper
            animation="fade-down"
            className="mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-slate-700" />
                <h3 className="font-semibold text-slate-800">Lead Notifications</h3>
                <Badge variant="outline" className="ml-2">
                  {notifications.length}
                </Badge>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={clearAllNotifications}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="rounded-full p-1 hover:bg-gray-100"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-4">
              {/* Render assignment notifications */}
              {groupedNotifications.assignments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium uppercase text-slate-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    New Assignments
                  </h4>
                  <AnimatePresence>
                    {groupedNotifications.assignments.map(notification => (
                      <MotionWrapper 
                        key={notification.id}
                        animation="fade-left"
                        className="w-full"
                      >
                        <LeadAlertBanner
                          type="assignment"
                          message={notification.message}
                          onDismiss={() => dismissNotification(notification.id)}
                          className="w-full"
                        />
                      </MotionWrapper>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Render follow-up notifications */}
              {groupedNotifications.followUps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium uppercase text-slate-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Follow-up Required
                  </h4>
                  <AnimatePresence>
                    {groupedNotifications.followUps.map(notification => (
                      <MotionWrapper 
                        key={notification.id}
                        animation="fade-left"
                        className="w-full"
                      >
                        <LeadAlertBanner
                          type="followUp"
                          message={notification.message}
                          status="HandToDispatch"
                          onDismiss={() => dismissNotification(notification.id)}
                          className="w-full"
                        />
                      </MotionWrapper>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Render weekly inactive leads notifications */}
              {groupedNotifications.weeklyReminders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium uppercase text-slate-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Weekly Reminders
                  </h4>
                  <AnimatePresence>
                    {groupedNotifications.weeklyReminders.map(notification => (
                      <MotionWrapper 
                        key={notification.id}
                        animation="fade-left"
                        className="w-full"
                      >
                        <LeadAlertBanner
                          type="weeklyReminder"
                          message={notification.message}
                          onDismiss={() => dismissNotification(notification.id)}
                          className="w-full"
                        />
                      </MotionWrapper>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Render status change notifications */}
              {groupedNotifications.statusChanges.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium uppercase text-slate-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Status Changes
                  </h4>
                  <AnimatePresence>
                    {groupedNotifications.statusChanges.map(notification => (
                      <MotionWrapper 
                        key={notification.id}
                        animation="fade-left"
                        className="w-full"
                      >
                        <LeadAlertBanner
                          type="statusChange"
                          status={notification.status}
                          message={notification.message}
                          onDismiss={() => dismissNotification(notification.id)}
                          className="w-full"
                        />
                      </MotionWrapper>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </MotionWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}