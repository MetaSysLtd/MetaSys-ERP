import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

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
  // Determine color based on activity type
  let dotColor = "bg-primary-500";
  let activityType = "";
  let userName = "";
  let details = "";
  let timestamp = "";
  
  // Check which type of activity we're dealing with
  if ('type' in activity) {
    // It's a dashboard activity (from dummy data)
    activityType = activity.type;
    userName = activity.user;
    details = activity.details;
    timestamp = activity.timestamp;
    
    // Set dot color based on activity type
    if (activityType.includes("lead_qualified") || activityType.includes("load_completed")) {
      dotColor = "bg-green-500";
    } else if (activityType.includes("created") || activityType.includes("new")) {
      dotColor = "bg-primary-500";
    } else if (activityType.includes("updated")) {
      dotColor = "bg-blue-500";
    } else if (activityType.includes("invoice") || activityType.includes("paid")) {
      dotColor = "bg-accent-500";
    }
  } else {
    // It's the original activity format (from database)
    activityType = activity.action;
    userName = activity.userName;
    details = activity.details;
    timestamp = activity.timestamp;
    
    // Set dot color based on activity type
    if (activity.action === "status_changed" && activity.details.includes("qualified")) {
      dotColor = "bg-green-500";
    } else if (activity.action === "created") {
      dotColor = "bg-primary-500";
    } else if (activity.action === "updated") {
      dotColor = "bg-blue-500";
    } else if ((activity.action && activity.action.includes("converted")) || activity.entityType === "invoice") {
      dotColor = "bg-accent-500";
    }
  }
  
  return (
    <li className="relative pb-4 pl-6 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
      <div className={`absolute -left-[7px] top-0 h-3 w-3 rounded-full ${dotColor}`}></div>
      <div className="flex flex-col sm:flex-row">
        <div className="flex-1">
          <div className="text-sm font-medium">
            <span className="font-semibold text-gray-800">{userName}</span>
            <span className="ml-1">{details}</span>
          </div>
        </div>
        <div className="text-xs text-gray-400 sm:ml-auto whitespace-nowrap">
          {formatDateTime(timestamp)}
        </div>
      </div>
    </li>
  );
}

interface ActivityFeedProps {
  activities?: CombinedActivity[];
}

export function ActivityFeed({ activities = [] }: ActivityFeedProps) {
  return (
    <Card className="shadow rounded-lg">
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          Activity Feed
        </CardTitle>
        <button className="text-sm text-primary hover:text-primary/80">See all</button>
      </CardHeader>
      <CardContent className="p-5">
        {activities && activities.length > 0 ? (
          <ul className="space-y-4">
            {activities.map((activity, index) => (
              <ActivityItem key={'id' in activity ? activity.id : index} activity={activity} />
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No recent activities</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
