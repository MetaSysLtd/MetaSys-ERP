import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCheck, Bell } from 'lucide-react';
import { LeadAlertBanner } from '../crm/lead-alert-banner';
import { useLeadNotifications, LeadNotificationType, LeadNotification } from '@/hooks/use-lead-notifications';
import { format } from 'date-fns';

// Framer motion variants for animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3
    }
  }
};

/**
 * Container for lead-related notifications and alerts
 * Shows different tabs for assigned leads, follow-up reminders and status changes
 */
export function LeadNotificationContainer() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearNotification
  } = useLeadNotifications();
  
  const [activeTab, setActiveTab] = useState<string>('assigned');

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'assigned') {
      return notification.type === LeadNotificationType.LEAD_ASSIGNED;
    } else if (activeTab === 'follow-up') {
      return notification.type === LeadNotificationType.LEAD_FOLLOW_UP;
    } else if (activeTab === 'inactive') {
      return notification.type === LeadNotificationType.INACTIVE_LEADS;
    } else if (activeTab === 'status') {
      return notification.type === LeadNotificationType.LEAD_STATUS_CHANGE;
    } else if (activeTab === 'remarks') {
      return notification.type === LeadNotificationType.LEAD_REMARK_ADDED;
    }
    return false;
  });

  // Count unread notifications by type
  const unreadCounts = {
    assigned: notifications.filter(
      n => n.type === LeadNotificationType.LEAD_ASSIGNED && !n.read
    ).length,
    followUp: notifications.filter(
      n => n.type === LeadNotificationType.LEAD_FOLLOW_UP && !n.read
    ).length,
    inactive: notifications.filter(
      n => n.type === LeadNotificationType.INACTIVE_LEADS && !n.read
    ).length,
    status: notifications.filter(
      n => n.type === LeadNotificationType.LEAD_STATUS_CHANGE && !n.read
    ).length,
    remarks: notifications.filter(
      n => n.type === LeadNotificationType.LEAD_REMARK_ADDED && !n.read
    ).length
  };

  // Mark all visible notifications as read when tab changes
  useEffect(() => {
    const visibleNotifications = filteredNotifications.filter(n => !n.read);
    visibleNotifications.forEach(notification => {
      markAsRead(notification.id);
    });
  }, [activeTab, filteredNotifications, markAsRead]);

  // Returns the right color for notification type
  const getTypeIcon = (type: LeadNotificationType) => {
    switch (type) {
      case LeadNotificationType.LEAD_ASSIGNED:
        return 'text-amber-500';
      case LeadNotificationType.LEAD_FOLLOW_UP:
        return 'text-red-500';
      case LeadNotificationType.INACTIVE_LEADS:
        return 'text-blue-500';
      case LeadNotificationType.LEAD_STATUS_CHANGE:
        return 'text-green-500';
      case LeadNotificationType.LEAD_REMARK_ADDED:
        return 'text-brandYellow';
      default:
        return 'text-gray-500';
    }
  };

  // Returns true if the notification should show a banner
  const shouldShowBanner = (type: LeadNotificationType) => {
    return (
      type === LeadNotificationType.LEAD_ASSIGNED ||
      type === LeadNotificationType.LEAD_FOLLOW_UP
    );
  };

  // Individual notification item
  function NotificationItem({ notification }: { notification: LeadNotification }) {
    // Format timestamp as relative time
    const formattedTime = format(
      new Date(notification.timestamp),
      'MMM d, h:mm a'
    );

    if (shouldShowBanner(notification.type)) {
      // Return a lead alert banner for assigned leads and follow-up reminders
      return (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -10 }}
          layout
        >
          <LeadAlertBanner
            leadId={notification.leadId!}
            leadName={notification.leadName!}
            clientName={notification.clientName}
            status={notification.status}
            onDismiss={() => clearNotification(notification.id)}
            color={notification.type === LeadNotificationType.LEAD_FOLLOW_UP ? 'red' : 'yellow'}
          />
        </motion.div>
      );
    }

    // For other notifications, show a card-based design
    return (
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, y: -10 }}
        layout
        className="mb-2"
      >
        <Card className="p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Bell className={`h-4 w-4 ${getTypeIcon(notification.type)}`} />
                <h4 className="font-medium text-gray-900">{notification.title}</h4>
                {!notification.read && (
                  <Badge variant="secondary" className="text-xs">New</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
              <div className="text-xs text-gray-400">{formattedTime}</div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-gray-500"
              onClick={() => clearNotification(notification.id)}
            >
              Dismiss
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  const hasNotifications = filteredNotifications.length > 0;

  return (
    <Card className="w-full max-w-3xl mx-auto mb-6 shadow-md border border-gray-200">
      <div className="p-4 pb-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Lead Notifications</h2>
          {hasNotifications && (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark all as read</span>
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="assigned" className="relative">
              Assigned Leads
              {unreadCounts.assigned > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCounts.assigned}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="follow-up" className="relative">
              Follow-up
              {unreadCounts.followUp > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCounts.followUp}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="inactive" className="relative">
              Inactive
              {unreadCounts.inactive > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCounts.inactive}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="status" className="relative">
              Status Changes
              {unreadCounts.status > 0 && (
                <Badge 
                  variant="success" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCounts.status}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="remarks" className="relative">
              Remarks
              {unreadCounts.remarks > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-brandYellow text-primary"
                >
                  {unreadCounts.remarks}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {['assigned', 'follow-up', 'inactive', 'status', 'remarks'].map((tabId) => (
            <TabsContent key={tabId} value={tabId} className="mt-0">
              <div className="p-4">
                {filteredNotifications.length > 0 ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <div className="py-8 text-center">
                    <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-gray-500 font-medium">No notifications</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {activeTab === 'assigned' && "You don't have any assigned leads to follow up."}
                      {activeTab === 'follow-up' && "No leads require immediate follow-up."}
                      {activeTab === 'inactive' && "No inactive leads to review."}
                      {activeTab === 'status' && "No recent lead status changes."}
                      {activeTab === 'remarks' && "No new lead remarks have been added."}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Card>
  );
}