import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "@shared/schema";
import { formatDate } from "@/lib/formatters";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Users, FileText, TrendingUp, Clipboard, ClipboardCheck, Truck, PenTool, DollarSign } from "lucide-react";

interface ActivityFeedProps {
  activities?: Activity[];
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
            <div className="flex flex-col items-center justify-center py-10 h-full text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-base font-medium">No Activities Yet</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-md">
                Activity updates will appear here once users start interacting with the system.
                You'll see a chronological feed of important actions across all modules.
              </p>
            </div>
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
                        {/* Access user data safely using optional chaining */}
                        {activity.user?.firstName || activity.user?.name || 'User'} {activity.user?.lastName || ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {/* Use timestamp or createdAt safely with optional chaining */}
                        {(activity.createdAt || activity.timestamp) && 
                         !isNaN(new Date(activity.createdAt || activity.timestamp).getTime()) 
                          ? formatDate(new Date(activity.createdAt || activity.timestamp), "MMM D, YYYY") 
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