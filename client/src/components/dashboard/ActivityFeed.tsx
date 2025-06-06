import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "@shared/schema";
import { formatDate } from "@/lib/formatters";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Users, FileText, TrendingUp, Clipboard, ClipboardCheck, Truck, PenTool, DollarSign } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useSocket } from "@/hooks/use-socket";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// Extended Activity type to account for dashboard activity data which may include user info
interface ExtendedActivity extends Activity {
  user?: {
    firstName?: string;
    lastName?: string;
    name?: string;
  };
  createdAt?: string | Date;
}

interface ActivityFeedProps {
  activities?: ExtendedActivity[];
  title?: string;
  maxItems?: number;
  showHeader?: boolean;
  height?: string;
}

export function ActivityFeed({
  activities = [],
  title = "Recent Activities",
  maxItems = 10,
  showHeader = true,
  height = "400px",
}: ActivityFeedProps) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Real-time socket subscriptions for activity updates
  useEffect(() => {
    if (!socket) return;

    const handleActivityUpdate = () => {
      // Invalidate dashboard queries for fresh activity data
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/consolidated'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    };

    // Subscribe to all activity-generating events
    socket.on('lead:created', handleActivityUpdate);
    socket.on('lead:updated', handleActivityUpdate);
    socket.on('lead:deleted', handleActivityUpdate);
    socket.on('dispatch:created', handleActivityUpdate);
    socket.on('dispatch:updated', handleActivityUpdate);
    socket.on('dispatch:deleted', handleActivityUpdate);
    socket.on('invoice:created', handleActivityUpdate);
    socket.on('invoice:updated', handleActivityUpdate);
    socket.on('commission:calculated', handleActivityUpdate);
    socket.on('policy:created', handleActivityUpdate);
    socket.on('data:updated', handleActivityUpdate);

    return () => {
      socket.off('lead:created', handleActivityUpdate);
      socket.off('lead:updated', handleActivityUpdate);
      socket.off('lead:deleted', handleActivityUpdate);
      socket.off('dispatch:created', handleActivityUpdate);
      socket.off('dispatch:updated', handleActivityUpdate);
      socket.off('dispatch:deleted', handleActivityUpdate);
      socket.off('invoice:created', handleActivityUpdate);
      socket.off('invoice:updated', handleActivityUpdate);
      socket.off('commission:calculated', handleActivityUpdate);
      socket.off('policy:created', handleActivityUpdate);
      socket.off('data:updated', handleActivityUpdate);
    };
  }, [socket, queryClient]);
  const getActivityIcon = (entityType: string, action: string) => {
    switch (entityType) {
      case "lead":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "client":
        return <Users className="h-4 w-4 text-green-500" />;
      case "commission":
        return <DollarSign className="h-4 w-4 text-emerald-500" />;
      case "handoff":
        return <ClipboardCheck className="h-4 w-4 text-orange-500" />;
      case "invoice":
        return <FileText className="h-4 w-4 text-purple-500" />;
      case "load":
        return <Truck className="h-4 w-4 text-indigo-500" />;
      case "report":
        return <Clipboard className="h-4 w-4 text-amber-500" />;
      case "note":
        return <PenTool className="h-4 w-4 text-gray-500" />;
      case "performance":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "updated":
        return "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "deleted":
        return "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "completed":
        return "bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "assigned":
        return "bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "qualified":
        return "bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-300";
      case "handoff":
        return "bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
      case "earned":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300";
      default:
        return "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const renderActionText = (action: string) => {
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      {showHeader && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-[#025E73]">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ScrollArea className="h-[400px]">
          {activities.length === 0 ? (
            <EmptyState
              iconType="activity"
              iconSize={28}
              title="No Activities Yet"
              message="Activity updates will appear here once users start interacting with the system."
              description="You'll see a chronological feed of important actions across all modules."
              placeholderData={
                <div className="space-y-3 mt-2 max-w-md mx-auto">
                  <div className="flex items-start space-x-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-2 mt-0.5">
                      <Users className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-400">User Activity</div>
                      <div className="text-xs text-gray-500">Login, profile updates, permissions</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-2 mt-0.5">
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-400">Content Activity</div>
                      <div className="text-xs text-gray-500">Document creation, form submissions, notes</div>
                    </div>
                  </div>
                </div>
              }
            />
          ) : (
            <ul className="space-y-4">
              {activities.slice(0, maxItems).map((activity) => (
                <li key={activity.id} className="flex items-start space-x-3">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-2 mt-0.5">
                    {getActivityIcon(activity.entityType, activity.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">
                        {/* Display user name if available, otherwise show User ID */}
                        {activity.user?.firstName || activity.user?.name || `User ${activity.userId}`}
                        {activity.user?.lastName ? ` ${activity.user.lastName}` : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {/* Use timestamp which is always present in the Activity schema */}
                        {activity.timestamp && !isNaN(new Date(activity.timestamp).getTime())
                          ? formatDate(new Date(activity.timestamp), "MMM D, YYYY")
                          : "Unknown date"}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getActionColor(
                          activity.action
                        )}`}
                      >
                        {renderActionText(activity.action)}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{activity.details}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}