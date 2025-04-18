import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

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

interface ActivityItemProps {
  activity: Activity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  // Determine color based on action type
  let dotColor = "bg-primary-500";
  
  if (activity.action === "status_changed" && activity.details.includes("qualified")) {
    dotColor = "bg-green-500";
  } else if (activity.action === "created") {
    dotColor = "bg-primary-500";
  } else if (activity.action === "updated") {
    dotColor = "bg-blue-500";
  } else if (activity.action.includes("converted") || activity.entityType === "invoice") {
    dotColor = "bg-accent-500";
  }
  
  return (
    <li className="relative pb-4 pl-6 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
      <div className={`absolute -left-[7px] top-0 h-3 w-3 rounded-full ${dotColor}`}></div>
      <div className="flex flex-col sm:flex-row">
        <div>
          <div className="text-sm font-medium">{activity.userName} {activity.details}</div>
          {activity.entityName && (
            <div className="text-xs text-gray-500">{activity.entityName}</div>
          )}
        </div>
        <div className="text-xs text-gray-400 sm:ml-auto">
          {formatDateTime(activity.timestamp)}
        </div>
      </div>
    </li>
  );
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="shadow rounded-lg">
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          Activity Feed
        </CardTitle>
        <button className="text-sm text-gray-500 hover:text-gray-700">See all</button>
      </CardHeader>
      <CardContent className="p-5">
        <ul className="space-y-4">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
