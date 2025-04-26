import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCheck, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { LeadAlertBanner } from '../crm/lead-alert-banner';
import { useLeadNotifications, LeadNotificationType, LeadNotification } from '@/hooks/use-lead-notifications';
import { format } from 'date-fns';
import { useMediaQuery } from '@/hooks/use-media-query';

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
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallTablet = useMediaQuery('(max-width: 992px)');
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  
  // Check if scrolling controls are needed
  useEffect(() => {
    const checkScrollNeeded = () => {
      if (tabsContainerRef.current) {
        const { scrollWidth, clientWidth } = tabsContainerRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
      }
    };
    
    checkScrollNeeded();
    window.addEventListener('resize', checkScrollNeeded);
    
    return () => {
      window.removeEventListener('resize', checkScrollNeeded);
    };
  }, []);
  
  // Scroll tabs left/right
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200; // pixels to scroll
      const currentScroll = tabsContainerRef.current.scrollLeft;
      
      tabsContainerRef.current.scrollTo({
        left: direction === 'left' 
          ? currentScroll - scrollAmount 
          : currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
            leadId={notification.leadId || 0}
            leadName={notification.leadName || 'Unknown Lead'}
            clientName={notification.clientName || ''}
            status={notification.status || ''}
            onDismiss={() => clearNotification(notification.id)}
            color={notification.type === LeadNotificationType.LEAD_FOLLOW_UP ? 'red' : 'yellow'}
          />
        </motion.div>
      );
    }

    // For other notifications, show a card-based design with responsive layout
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
          <div className={`${isMobile ? 'flex flex-col' : 'flex justify-between'} items-start`}>
            <div className={isMobile ? 'w-full mb-3' : ''}>
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
              className={`text-gray-400 hover:text-gray-500 ${isMobile ? 'w-full' : ''}`}
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

  // Render nothing if there are no notifications to show
  // This is different from the conditional in NotificationContainer which handles route/permission logic
  if (!hasNotifications) return null;

  return (
    <Card className="w-full max-w-3xl mx-auto mb-6 shadow-md border border-gray-200 md:w-full sm:w-[95%]">
      <div className="p-4 pb-0">
        <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex justify-between'} items-start md:items-center mb-4`}>
          <h2 className="text-xl font-bold text-gray-900 sm:text-lg">Lead Notifications</h2>
          <Button
            size="sm"
            variant="outline"
            className={`flex items-center gap-1 min-h-[44px] sm:text-sm ${isMobile ? 'w-full' : ''}`}
            onClick={markAllAsRead}
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark all as read</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="relative">
            {/* Scroll left button - only shown when needed */}
            {showScrollButtons && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => scrollTabs('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-white/80 rounded-full shadow-md"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Scroll left</span>
              </Button>
            )}
            
            {/* Tabs scrollable container */}
            <div 
              ref={tabsContainerRef}
              className="overflow-x-auto scrollbar-hide pb-1 mb-4 relative"
            >
              <TabsList className="flex-nowrap inline-flex w-auto min-w-full">
                <TabsTrigger 
                  value="assigned" 
                  className={`relative ${isSmallTablet ? 'min-w-[100px]' : 'min-w-[120px]'} min-h-[44px] sm:text-sm`}
                >
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
                <TabsTrigger 
                  value="follow-up" 
                  className={`relative ${isSmallTablet ? 'min-w-[100px]' : 'min-w-[120px]'} min-h-[44px] sm:text-sm`}
                >
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
                <TabsTrigger 
                  value="inactive" 
                  className={`relative ${isSmallTablet ? 'min-w-[80px]' : 'min-w-[120px]'} min-h-[44px] sm:text-sm`}
                >
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
                <TabsTrigger 
                  value="status" 
                  className={`relative ${isSmallTablet ? 'min-w-[80px]' : 'min-w-[120px]'} min-h-[44px] sm:text-sm`}
                >
                  {isSmallTablet ? 'Status' : 'Status Changes'}
                  {unreadCounts.status > 0 && (
                    <Badge 
                      variant="success" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCounts.status}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="remarks" 
                  className={`relative ${isSmallTablet ? 'min-w-[80px]' : 'min-w-[120px]'} min-h-[44px] sm:text-sm`}
                >
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
            </div>
            
            {/* Scroll right button - only shown when needed */}
            {showScrollButtons && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => scrollTabs('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-white/80 rounded-full shadow-md"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Scroll right</span>
              </Button>
            )}
          </div>

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