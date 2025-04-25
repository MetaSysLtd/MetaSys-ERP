import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useSocket } from './use-socket';
import { useToast } from './use-toast';

// Lead notification types
export enum LeadNotificationType {
  LEAD_ASSIGNED = 'leadAssigned',
  LEAD_FOLLOW_UP = 'leadFollowUpReminder',
  INACTIVE_LEADS = 'weeklyInactiveLeadsReminder',
  LEAD_STATUS_CHANGE = 'leadStatusChange'
}

export interface LeadNotification {
  id: string;
  type: LeadNotificationType;
  title: string;
  message: string;
  leadId?: number;
  leadName?: string;
  clientName?: string;
  status?: string;
  previousStatus?: string;
  assignedAt?: string;
  changedAt?: string;
  timestamp: Date;
  read: boolean;
  leadIds?: number[];
  leadNames?: string[];
  count?: number;
}

interface LeadNotificationContextProps {
  notifications: LeadNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const LeadNotificationContext = createContext<LeadNotificationContextProps | undefined>(undefined);

export const LeadNotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<LeadNotification[]>([]);
  const { socket } = useSocket();
  const { toast } = useToast();

  // Listen for socket notifications
  useEffect(() => {
    if (!socket) return;

    // Handler for new lead assignment
    const handleLeadAssigned = (data: any) => {
      const notification: LeadNotification = {
        id: `lead-assigned-${Date.now()}`,
        type: LeadNotificationType.LEAD_ASSIGNED,
        title: data.title || 'New Lead Assigned',
        message: data.message || `New lead ${data.leadName} assigned`,
        leadId: data.leadId,
        leadName: data.leadName,
        clientName: data.clientName,
        status: data.status,
        assignedAt: data.assignedAt,
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [notification, ...prev]);
      
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        variant: "default",
      });
    };

    // Handler for lead follow-up reminder
    const handleLeadFollowUp = (data: any) => {
      const notification: LeadNotification = {
        id: `lead-followup-${Date.now()}`,
        type: LeadNotificationType.LEAD_FOLLOW_UP,
        title: data.title || 'Lead Follow-Up Required',
        message: data.message || `Lead ${data.leadName} requires follow-up`,
        leadId: data.leadId,
        leadName: data.leadName,
        clientName: data.clientName,
        status: data.status,
        assignedAt: data.assignedAt,
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [notification, ...prev]);
      
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        variant: "destructive", // Using red for follow-up reminders
      });
    };

    // Handler for weekly inactive leads reminder
    const handleInactiveLeads = (data: any) => {
      const notification: LeadNotification = {
        id: `inactive-leads-${Date.now()}`,
        type: LeadNotificationType.INACTIVE_LEADS,
        title: data.title || 'Inactive Leads Reminder',
        message: data.message || `${data.count} inactive lead(s) need attention`,
        leadIds: data.leadIds,
        leadNames: data.leadNames,
        count: data.count,
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [notification, ...prev]);
      
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        variant: "warning", // Using yellow for reminders
      });
    };

    // Handler for lead status changes
    const handleLeadStatusChange = (data: any) => {
      const notification: LeadNotification = {
        id: `status-change-${Date.now()}`,
        type: LeadNotificationType.LEAD_STATUS_CHANGE,
        title: data.title || 'Lead Status Changed',
        message: data.message || `Lead ${data.leadName} status changed to ${data.status}`,
        leadId: data.leadId,
        leadName: data.leadName,
        status: data.status,
        previousStatus: data.previousStatus,
        changedAt: data.changedAt,
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [notification, ...prev]);
      
      // Calculate variant based on status
      let variant: "default" | "destructive" | "success" = "default";
      if (data.status === 'Active') {
        variant = "success";
      } else if (data.status === 'Unqualified') {
        variant = "destructive";
      }
      
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        variant: variant,
      });
    };

    // Register event handlers
    socket.on(LeadNotificationType.LEAD_ASSIGNED, handleLeadAssigned);
    socket.on(LeadNotificationType.LEAD_FOLLOW_UP, handleLeadFollowUp);
    socket.on(LeadNotificationType.INACTIVE_LEADS, handleInactiveLeads);
    socket.on(LeadNotificationType.LEAD_STATUS_CHANGE, handleLeadStatusChange);

    // Clean up event listeners
    return () => {
      socket.off(LeadNotificationType.LEAD_ASSIGNED, handleLeadAssigned);
      socket.off(LeadNotificationType.LEAD_FOLLOW_UP, handleLeadFollowUp);
      socket.off(LeadNotificationType.INACTIVE_LEADS, handleInactiveLeads);
      socket.off(LeadNotificationType.LEAD_STATUS_CHANGE, handleLeadStatusChange);
    };
  }, [socket, toast]);

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Clear a notification
  const clearNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== id)
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <LeadNotificationContext.Provider
      value={{
        notifications,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications
      }}
    >
      {children}
    </LeadNotificationContext.Provider>
  );
};

// Hook to use lead notifications
export const useLeadNotifications = () => {
  const context = useContext(LeadNotificationContext);
  if (context === undefined) {
    throw new Error('useLeadNotifications must be used within a LeadNotificationProvider');
  }
  return context;
};