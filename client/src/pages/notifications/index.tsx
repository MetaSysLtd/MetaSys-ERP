
import { useNotifications } from "@/contexts/NotificationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Bell, Info, Package, FileText, Users } from "lucide-react";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'lead': return <Users className="h-5 w-5" />;
    case 'load': return <Package className="h-5 w-5" />;
    case 'invoice': return <FileText className="h-5 w-5" />;
    default: return <Info className="h-5 w-5" />;
  }
};

export default function NotificationsPage() {
  const { notifications, markAsRead } = useNotifications();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-2">
        <Bell className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      <div className="grid gap-4">
        {notifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`transition-colors ${!notification.read ? 'bg-muted/50' : ''}`}
            onClick={() => markAsRead(notification.id)}
          >
            <CardContent className="flex items-start gap-4 p-4">
              <div className="mt-1">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{notification.title}</h3>
                  <Badge variant="outline">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {notifications.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Bell className="mx-auto h-8 w-8 mb-2" />
              <p>No notifications yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
