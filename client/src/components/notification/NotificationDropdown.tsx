import { useState, useRef, useEffect } from "react";
import { Bell, Check, Dot, ExternalLink, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

// Type icons mapping
const typeIcons: Record<string, any> = {
  lead: () => (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
      <span className="text-xs font-bold">L</span>
    </div>
  ),
  load: () => (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
      <span className="text-xs font-bold">LD</span>
    </div>
  ),
  invoice: () => (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600">
      <span className="text-xs font-bold">INV</span>
    </div>
  ),
  task: () => (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600">
      <span className="text-xs font-bold">T</span>
    </div>
  ),
  system: () => (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600">
      <span className="text-xs font-bold">S</span>
    </div>
  ),
  message: () => (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600">
      <span className="text-xs font-bold">M</span>
    </div>
  ),
};

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  // Handle notification click
  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    if (link) {
      window.location.href = link;
    }
    setOpen(false);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <div ref={ref}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-full"
          >
            <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            {unreadCount > 0 && (
              <NotificationBadge
                count={unreadCount}
                className="absolute -top-1 -right-1"
              />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 md:w-96"
          forceMount
        >
          <div className="flex items-center justify-between p-4">
            <DropdownMenuLabel className="text-base font-semibold">
              Notifications
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#2170dd] hover:text-[#1861c9]"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          <ScrollArea className="h-[calc(80vh-8rem)] md:h-[480px]">
            <DropdownMenuGroup className="p-2">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-md"
                  >
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Bell className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    No notifications
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    When you receive notifications, they'll appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const TypeIcon =
                    typeIcons[notification.type] ||
                    typeIcons.system;
                  
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-md cursor-pointer ${
                        !notification.read
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : ""
                      }`}
                      onClick={() =>
                        handleNotificationClick(
                          notification.id,
                          notification.link
                        )
                      }
                    >
                      {/* Notification icon */}
                      <TypeIcon />
                      
                      {/* Notification content */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {!notification.read && (
                              <Dot className="h-5 w-5 text-[#2170dd]" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDistanceToNow(
                              new Date(notification.timestamp),
                              { addSuffix: true }
                            )}
                          </span>
                          {notification.type && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4 px-1.5 capitalize"
                            >
                              {notification.type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })
              )}
            </DropdownMenuGroup>
          </ScrollArea>
          <DropdownMenuSeparator />
          <Link href="/notifications" className="block">
            <Button
              variant="ghost"
              className="w-full justify-center py-2 text-[#2170dd] hover:text-[#1861c9]"
              onClick={() => setOpen(false)}
            >
              View all notifications
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}