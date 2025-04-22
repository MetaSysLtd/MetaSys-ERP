import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Bell, CheckCircle, Clock, Filter } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define notification type
interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  entityType?: string;
  entityId?: number;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string[]>(["system", "team", "commission", "task"]);
  
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Filter notifications based on read status and type
  const filteredNotifications = notifications?.filter(notification => {
    // Check read status filter
    if (filter === "unread" && notification.isRead) return false;
    if (filter === "read" && !notification.isRead) return false;
    
    // Check type filter
    return typeFilter.includes(notification.type);
  });
  
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "commission":
        return <Bell className="w-5 h-5 text-green-500" />;
      case "task":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "team":
        return <Bell className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <Helmet>
        <title>Notifications | Metio ERP</title>
      </Helmet>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your system notifications
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuCheckboxItem
                checked={typeFilter.includes("system")}
                onCheckedChange={(checked) => {
                  setTypeFilter(
                    checked
                      ? [...typeFilter, "system"]
                      : typeFilter.filter((t) => t !== "system")
                  );
                }}
              >
                System
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter.includes("team")}
                onCheckedChange={(checked) => {
                  setTypeFilter(
                    checked
                      ? [...typeFilter, "team"]
                      : typeFilter.filter((t) => t !== "team")
                  );
                }}
              >
                Team
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter.includes("commission")}
                onCheckedChange={(checked) => {
                  setTypeFilter(
                    checked
                      ? [...typeFilter, "commission"]
                      : typeFilter.filter((t) => t !== "commission")
                  );
                }}
              >
                Commission
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter.includes("task")}
                onCheckedChange={(checked) => {
                  setTypeFilter(
                    checked
                      ? [...typeFilter, "task"]
                      : typeFilter.filter((t) => t !== "task")
                  );
                }}
              >
                Tasks
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm" className="h-8">
            Mark all as read
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                All system notifications across all categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-4 p-3 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-36 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))
                ) : filteredNotifications && filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`flex gap-4 p-3 border rounded-lg ${!notification.isRead ? 'bg-slate-50' : ''}`}
                    >
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-base">{notification.title}</h4>
                          {notification.isRead ? (
                            <span className="text-xs text-slate-500">Read</span>
                          ) : (
                            <span className="text-xs font-medium text-blue-600">New</span>
                          )}
                        </div>
                        <p className="text-slate-600 my-1">{notification.content}</p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No notifications to display
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="unread" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Unread Notifications</CardTitle>
              <CardDescription>
                Notifications you haven't seen yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-4 p-3 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-36 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))
                ) : filteredNotifications && filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className="flex gap-4 p-3 border rounded-lg bg-slate-50"
                    >
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-base">{notification.title}</h4>
                          <span className="text-xs font-medium text-blue-600">New</span>
                        </div>
                        <p className="text-slate-600 my-1">{notification.content}</p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No unread notifications
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="read" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Read Notifications</CardTitle>
              <CardDescription>
                Previously viewed notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-4 p-3 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-36 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))
                ) : filteredNotifications && filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className="flex gap-4 p-3 border rounded-lg"
                    >
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-base">{notification.title}</h4>
                          <span className="text-xs text-slate-500">Read</span>
                        </div>
                        <p className="text-slate-600 my-1">{notification.content}</p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No read notifications
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}