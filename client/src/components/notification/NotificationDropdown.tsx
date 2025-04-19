import React from 'react';
import { useNavigate } from 'wouter/use-location';
import { Button } from '@/components/ui/button';
import { Notification, useNotifications } from '@/contexts/NotificationContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { BellIcon, CheckIcon, MoreHorizontal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
    
    setOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <div className="bg-blue-100 text-blue-700 rounded-full p-1.5">📋</div>;
      case 'load':
        return <div className="bg-purple-100 text-purple-700 rounded-full p-1.5">🚚</div>;
      case 'invoice':
        return <div className="bg-green-100 text-green-700 rounded-full p-1.5">💰</div>;
      case 'task':
        return <div className="bg-yellow-100 text-yellow-700 rounded-full p-1.5">✅</div>;
      case 'system':
        return <div className="bg-red-100 text-red-700 rounded-full p-1.5">⚙️</div>;
      case 'message':
        return <div className="bg-indigo-100 text-indigo-700 rounded-full p-1.5">💬</div>;
      default:
        return <div className="bg-gray-100 text-gray-700 rounded-full p-1.5">📢</div>;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)}>
          <BellIcon className="h-5 w-5" />
          <NotificationBadge 
            count={unreadCount} 
            className="absolute -top-1 -right-1"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="h-8 text-xs"
            >
              <CheckIcon className="mr-1 h-3.5 w-3.5" />
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="py-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-3 px-4 py-2 hover:bg-accent cursor-pointer transition-colors",
                    !notification.read && "bg-muted/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="mt-1 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="space-y-1 flex-1 overflow-hidden">
                    <div className="flex justify-between items-start">
                      <p className={cn(
                        "text-sm",
                        !notification.read && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      <small className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </small>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="shrink-0 self-center">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-[300px] text-muted-foreground text-sm">
              No notifications
            </div>
          )}
        </ScrollArea>
        
        <div className="border-t p-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-center text-xs"
            onClick={() => {
              navigate('/notifications');
              setOpen(false);
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}