import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSocket } from './use-socket';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// Types of lead notifications
export enum LeadNotificationType {
  LEAD_ASSIGNED = 'leadAssigned',
  LEAD_FOLLOW_UP = 'leadFollowUpReminder',
  INACTIVE_LEADS = 'weeklyInactiveLeadsReminder',
  LEAD_STATUS_CHANGE = 'leadStatusChange'
}

// Lead notification data structure
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

// Provider props for the context
interface LeadNotificationContextProps {
  notifications: LeadNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  hasUnreadNotifications: boolean;
  unreadCount: number;
  resetWeeklyInactiveLeads: () => void;
}

// Create context with default values
const LeadNotificationContext = createContext<LeadNotificationContextProps>({
  notifications: [],
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotification: () => {},
  clearAllNotifications: () => {},
  hasUnreadNotifications: false,
  unreadCount: 0,
  resetWeeklyInactiveLeads: () => {}
});

// Provider component
export const LeadNotificationProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<LeadNotification[]>([]);
  
  // Utility to store notifications in local storage
  const saveNotifications = useCallback((notifs: LeadNotification[]) => {
    if (user) {
      localStorage.setItem(`lead_notifications_${user.id}`, JSON.stringify(notifs));
    }
  }, [user]);

  // Load notifications from local storage on user change
  useEffect(() => {
    if (user) {
      const savedNotifications = localStorage.getItem(`lead_notifications_${user.id}`);
      if (savedNotifications) {
        try {
          const parsed = JSON.parse(savedNotifications);
          // Convert string timestamps to Date objects
          const notifs = parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
          setNotifications(notifs);
        } catch (err) {
          console.error('Error parsing saved notifications:', err);
        }
      }
    }
  }, [user]);
  
  // Socket event handlers for different notification types
  useEffect(() => {
    if (!socket || !user) return;

    // Handler for lead assigned notification
    const handleLeadAssigned = (data: any) => {
      const notification: LeadNotification = {
        id: uuidv4(),
        type: LeadNotificationType.LEAD_ASSIGNED,
        title: 'New Lead Assigned',
        message: `A new lead '${data.leadName}' has been assigned to you.`,
        leadId: data.leadId,
        leadName: data.leadName,
        clientName: data.clientName,
        status: data.status,
        assignedAt: data.assignedAt,
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => {
        const updated = [notification, ...prev];
        saveNotifications(updated);
        return updated;
      });
      
      toast({
        title: 'New Lead Assigned',
        description: `A new lead '${data.leadName}' has been assigned to you.`,
        variant: "warning",
        duration: 8000
      });
    };
    
    // Handler for follow-up reminder
    const handleLeadFollowUp = (data: any) => {
      const notification: LeadNotification = {
        id: uuidv4(),
        type: LeadNotificationType.LEAD_FOLLOW_UP,
        title: 'Lead Follow-up Required',
        message: `Lead '${data.leadName}' requires follow-up. It has been in HandToDispatch status for over 24 hours.`,
        leadId: data.leadId,
        leadName: data.leadName,
        clientName: data.clientName,
        status: data.status,
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => {
        const updated = [notification, ...prev];
        saveNotifications(updated);
        return updated;
      });
      
      toast({
        title: 'Lead Follow-up Required',
        description: `Lead '${data.leadName}' requires follow-up. It has been in HandToDispatch status for over 24 hours.`,
        variant: "destructive",
        duration: 10000
      });
    };
    
    // Handler for weekly inactive leads reminder
    const handleWeeklyInactiveLeads = (data: any) => {
      const notification: LeadNotification = {
        id: uuidv4(),
        type: LeadNotificationType.INACTIVE_LEADS,
        title: 'Inactive Leads Reminder',
        message: `You have ${data.count} inactive leads in HandToDispatch status that need attention.`,
        leadIds: data.leadIds,
        leadNames: data.leadNames,
        count: data.count,
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => {
        const updated = [notification, ...prev];
        saveNotifications(updated);
        return updated;
      });
      
      toast({
        title: 'Inactive Leads Reminder',
        description: `You have ${data.count} inactive leads in HandToDispatch status that need attention.`,
        variant: "default",
        duration: 8000
      });
    };
    
    // Handler for lead status changes
    const handleLeadStatusChange = (data: any) => {
      const notification: LeadNotification = {
        id: uuidv4(),
        type: LeadNotificationType.LEAD_STATUS_CHANGE,
        title: 'Lead Status Change',
        message: `Lead '${data.leadName}' status changed from ${data.previousStatus} to ${data.newStatus}.`,
        leadId: data.leadId,
        leadName: data.leadName,
        clientName: data.clientName,
        status: data.newStatus,
        previousStatus: data.previousStatus,
        changedAt: data.changedAt,
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => {
        const updated = [notification, ...prev];
        saveNotifications(updated);
        return updated;
      });
      
      // Color the toast by the new status
      const variant = 
        data.newStatus === 'Active' ? 'success' :
        data.newStatus === 'Unqualified' ? 'destructive' : 'default';
      
      toast({
        title: 'Lead Status Change',
        description: `Lead '${data.leadName}' status changed from ${data.previousStatus} to ${data.newStatus}.`,
        variant,
        duration: 6000
      });
    };

    // Register event listeners
    socket.on(LeadNotificationType.LEAD_ASSIGNED, handleLeadAssigned);
    socket.on(LeadNotificationType.LEAD_FOLLOW_UP, handleLeadFollowUp);
    socket.on(LeadNotificationType.INACTIVE_LEADS, handleWeeklyInactiveLeads);
    socket.on(LeadNotificationType.LEAD_STATUS_CHANGE, handleLeadStatusChange);
    
    // Clean up listeners on unmount
    return () => {
      socket.off(LeadNotificationType.LEAD_ASSIGNED, handleLeadAssigned);
      socket.off(LeadNotificationType.LEAD_FOLLOW_UP, handleLeadFollowUp);
      socket.off(LeadNotificationType.INACTIVE_LEADS, handleWeeklyInactiveLeads);
      socket.off(LeadNotificationType.LEAD_STATUS_CHANGE, handleLeadStatusChange);
    };
  }, [socket, user, toast, saveNotifications]);

  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      );
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Clear a notification by ID
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notification => notification.id !== id);
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    if (user) {
      localStorage.removeItem(`lead_notifications_${user.id}`);
    }
  }, [user]);
  
  // Reset weekly inactive leads notifications to prevent duplicates
  const resetWeeklyInactiveLeads = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.type !== LeadNotificationType.INACTIVE_LEADS);
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Calculate if there are unread notifications
  const hasUnreadNotifications = notifications.some(n => !n.read);
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <LeadNotificationContext.Provider
      value={{
        notifications,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        hasUnreadNotifications,
        unreadCount,
        resetWeeklyInactiveLeads
      }}
    >
      {children}
    </LeadNotificationContext.Provider>
  );
};

// Hook to use lead notifications
export const useLeadNotifications = () => {
  const context = useContext(LeadNotificationContext);
  if (!context) {
    throw new Error('useLeadNotifications must be used within a LeadNotificationProvider');
  }
  return context;
};