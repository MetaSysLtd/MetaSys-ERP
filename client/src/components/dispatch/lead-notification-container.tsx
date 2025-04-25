import { useState, useMemo } from 'react';
import { useLeadNotifications, LeadNotificationType } from '@/hooks/use-lead-notifications';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  RefreshCw,
  Clock,
  CheckCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LeadAlertBanner } from '@/components/crm/lead-alert-banner';
import { MotionWrapper } from '@/components/ui/motion-wrapper-fixed';

export function LeadNotificationContainer() {
  const { notifications, markAsRead, clearNotification, markAllAsRead, clearAllNotifications } = useLeadNotifications();
  const [activeTab, setActiveTab] = useState<string>('all');

  // Group notifications by type
  const groupedNotifications = useMemo(() => {
    const assigned = notifications.filter(n => n.type === LeadNotificationType.LEAD_ASSIGNED);
    const followUp = notifications.filter(n => n.type === LeadNotificationType.LEAD_FOLLOW_UP);
    const inactive = notifications.filter(n => n.type === LeadNotificationType.INACTIVE_LEADS);
    const statusChange = notifications.filter(n => n.type === LeadNotificationType.LEAD_STATUS_CHANGE);
    
    return {
      all: notifications,
      assigned,
      followUp,
      inactive,
      statusChange
    };
  }, [notifications]);

  // Get the currently displayed notifications based on active tab
  const currentNotifications = useMemo(() => {
    return groupedNotifications[activeTab as keyof typeof groupedNotifications] || [];
  }, [groupedNotifications, activeTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Calculate counts for badge displays
  const counts = useMemo(() => ({
    all: notifications.length,
    assigned: groupedNotifications.assigned.length,
    followUp: groupedNotifications.followUp.length,
    inactive: groupedNotifications.inactive.length,
    statusChange: groupedNotifications.statusChange.length,
    unread: notifications.filter(n => !n.read).length
  }), [notifications, groupedNotifications]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-lg bg-white z-50 overflow-hidden">
      <div className="flex items-center justify-between bg-primary p-3 text-white">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Lead Notifications</h3>
          {counts.unread > 0 && (
            <Badge variant="destructive" className="ml-2">
              {counts.unread} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={markAllAsRead}
            title="Mark all as read"
            className="h-7 w-7 text-white hover:bg-primary/50"
          >
            <CheckCheck className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearAllNotifications}
            title="Clear all notifications"
            className="h-7 w-7 text-white hover:bg-primary/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="all">
            All 
            {counts.all > 0 && <Badge variant="secondary" className="ml-1">{counts.all}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="assigned">
            New
            {counts.assigned > 0 && <Badge variant="secondary" className="ml-1">{counts.assigned}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="followUp">
            Follow-up
            {counts.followUp > 0 && <Badge variant="secondary" className="ml-1">{counts.followUp}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive
            {counts.inactive > 0 && <Badge variant="secondary" className="ml-1">{counts.inactive}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="statusChange">
            Status
            {counts.statusChange > 0 && <Badge variant="secondary" className="ml-1">{counts.statusChange}</Badge>}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="p-0 m-0">
          <ScrollArea className="h-[350px]">
            <div className="p-3 space-y-3">
              {currentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Bell className="h-10 w-10 mb-2 opacity-20" />
                  <p>No notifications in this category</p>
                </div>
              ) : (
                currentNotifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDismiss={clearNotification}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

const getTypeIcon = (type: LeadNotificationType) => {
  switch (type) {
    case LeadNotificationType.LEAD_ASSIGNED:
      return <Bell className="h-5 w-5 text-blue-500" />;
    case LeadNotificationType.LEAD_FOLLOW_UP:
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case LeadNotificationType.INACTIVE_LEADS:
      return <Clock className="h-5 w-5 text-amber-500" />;
    case LeadNotificationType.LEAD_STATUS_CHANGE:
      return <RefreshCw className="h-5 w-5 text-green-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
};

// Show a banner for lead follow-up reminders
const shouldShowBanner = (type: LeadNotificationType) => {
  return type === LeadNotificationType.LEAD_FOLLOW_UP;
};

// Notification item component
function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDismiss 
}: { 
  notification: any, 
  onMarkAsRead: (id: string) => void, 
  onDismiss: (id: string) => void 
}) {
  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
  };

  const handleDismiss = () => {
    onDismiss(notification.id);
  };

  // For lead follow-ups, render a special banner component
  if (shouldShowBanner(notification.type)) {
    return (
      <MotionWrapper 
        animation="fade-up" 
        delay={0.1}
        className="relative"
      >
        <LeadAlertBanner 
          leadId={notification.leadId} 
          leadName={notification.leadName}
          clientName={notification.clientName}
          status={notification.status}
          onDismiss={handleDismiss}
          color="red"
        />
      </MotionWrapper>
    );
  }

  return (
    <MotionWrapper 
      animation="fade-up" 
      delay={0.1}
    >
      <Card className={`relative p-3 ${!notification.read ? 'bg-muted/30 border-l-4 border-l-primary' : ''}`}>
        <div className="absolute top-2 right-2 flex space-x-1">
          {!notification.read && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleMarkAsRead}
              title="Mark as read"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleDismiss}
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-3 items-start mb-2 pr-16">
          <div className="mt-1">
            {getTypeIcon(notification.type)}
          </div>
          <div>
            <h4 className="font-medium text-sm">{notification.title}</h4>
            <p className="text-sm text-muted-foreground">{notification.message}</p>
          </div>
        </div>
        
        {notification.leadId && (
          <div className="text-xs text-muted-foreground ml-8 mt-1">
            Lead ID: {notification.leadId}
          </div>
        )}
        
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-muted-foreground ml-8">
            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
          </div>
          
          {notification.status && (
            <Badge variant={
              notification.status === 'Active' ? 'success' : 
              notification.status === 'Unqualified' ? 'destructive' : 
              'secondary'
            }>
              {notification.status}
            </Badge>
          )}
        </div>
      </Card>
    </MotionWrapper>
  );
}