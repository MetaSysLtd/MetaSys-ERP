import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Activity, MessageCircle, Users, Package } from "lucide-react";

// Original activity interface (from database)
export interface Activity {
  id: number;
  userId: number;
  userName: string;
  entityType: string;
  entityId: number;
  entityName?: string;
  action: string;
  details: string;
  timestamp: string;
}

// New activity interface from API (dummy data)
export interface DashboardActivity {
  type: string;
  user: string;
  timestamp: string;
  details: string;
}

// Combined type that accepts either format
type CombinedActivity = Activity | DashboardActivity;

interface ActivityItemProps {
  activity: CombinedActivity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  // Determine color and icon based on activity type
  let dotColor = "bg-blue-500";
  let activityType = "";
  let userName = "";
  let details = "";
  let timestamp = "";
  let iconComponent = <Activity className="h-4 w-4 text-blue-500" />;
  
  try {
    // Check which type of activity we're dealing with
    if ('type' in activity) {
      // It's a dashboard activity (from dummy data)
      activityType = activity.type || "";
      userName = activity.user || "System";
      details = activity.details || "";
      timestamp = activity.timestamp || new Date().toISOString();
      
      // Set dot color and icon based on activity type
      if (activityType.includes("lead") || activityType.includes("client")) {
        if (activityType.includes("qualified") || activityType.includes("won")) {
          dotColor = "bg-green-500";
          iconComponent = <Users className="h-4 w-4 text-green-500" />;
        } else {
          dotColor = "bg-blue-500";
          iconComponent = <Users className="h-4 w-4 text-blue-500" />;
        }
      } else if (activityType.includes("load") || activityType.includes("dispatch")) {
        if (activityType.includes("completed") || activityType.includes("delivered")) {
          dotColor = "bg-emerald-500";
          iconComponent = <Package className="h-4 w-4 text-emerald-500" />;
        } else {
          dotColor = "bg-indigo-500";
          iconComponent = <Package className="h-4 w-4 text-indigo-500" />;
        }
      } else if (activityType.includes("invoice") || activityType.includes("payment") || activityType.includes("paid")) {
        dotColor = "bg-purple-500";
        iconComponent = <MessageCircle className="h-4 w-4 text-purple-500" />;
      } else if (activityType.includes("message") || activityType.includes("comment")) {
        dotColor = "bg-yellow-500";
        iconComponent = <MessageCircle className="h-4 w-4 text-yellow-500" />;
      }
    } else {
      // It's the original activity format (from database)
      activityType = activity.action || "";
      userName = activity.userName || "System";
      details = activity.details || "";
      timestamp = activity.timestamp || new Date().toISOString();
      
      // Set dot color and icon based on activity type
      if (activity.entityType === "lead" || activity.entityType === "client") {
        if ((activity.action === "status_changed" && (activity.details || "").includes("qualified")) ||
            activity.action === "qualified") {
          dotColor = "bg-green-500";
          iconComponent = <Users className="h-4 w-4 text-green-500" />;
        } else {
          dotColor = "bg-blue-500";
          iconComponent = <Users className="h-4 w-4 text-blue-500" />;
        }
      } else if (activity.entityType === "load" || activity.entityType === "dispatch") {
        if ((activity.action === "status_changed" && (activity.details || "").includes("completed")) ||
            activity.action === "completed") {
          dotColor = "bg-emerald-500";
          iconComponent = <Package className="h-4 w-4 text-emerald-500" />;
        } else {
          dotColor = "bg-indigo-500";
          iconComponent = <Package className="h-4 w-4 text-indigo-500" />;
        }
      } else if (activity.entityType === "invoice" || activity.entityType === "payment") {
        dotColor = "bg-purple-500";
        iconComponent = <MessageCircle className="h-4 w-4 text-purple-500" />;
      } else if (activity.entityType === "message" || activity.entityType === "comment") {
        dotColor = "bg-yellow-500";
        iconComponent = <MessageCircle className="h-4 w-4 text-yellow-500" />;
      }
    }
  } catch (error) {
    console.error("Error processing activity:", error);
    // Use default values if there's an error
    userName = "System";
    details = "Activity recorded";
    timestamp = new Date().toISOString();
  }
  
  return (
    <li className="relative pb-5 pl-7 border-l border-gray-200 last:border-l-0 last:pb-0">
      <div className={`absolute -left-[5px] top-0 h-[10px] w-[10px] rounded-full ${dotColor} ring-4 ring-white`}></div>
      <div className="absolute -left-7 top-[-2px] bg-white p-1 rounded-md">
        {iconComponent}
      </div>
      <div className="flex flex-col space-y-1">
        <div className="flex items-center">
          <span className="font-medium text-gray-900">{userName}</span>
          <span className="text-xs text-gray-500 ml-auto">{formatDateTime(timestamp)}</span>
        </div>
        <p className="text-sm text-gray-600">{details}</p>
      </div>
    </li>
  );
}

interface ActivityFeedProps {
  activities?: CombinedActivity[];
}

export function ActivityFeed({ activities = [] }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Activity Feed</CardTitle>
        <button className="text-sm text-primary hover:text-primary/80">
          View all
        </button>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent activities</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-4 mt-2 max-h-[320px] overflow-y-auto">
            {activities.map((activity, index) => (
              <ActivityItem 
                key={'id' in activity ? `activity-${activity.id}` : `activity-${index}`} 
                activity={activity} 
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
