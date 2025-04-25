import { useState, useEffect, useCallback } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Types for lead notifications
export type LeadNotificationType = {
  id: string; // Unique ID for the notification
  type: "assignment" | "followUp" | "weeklyReminder" | "statusChange";
  message: string;
  status?: "Active" | "Unqualified" | "HandToDispatch";
  leadId?: number;
  timestamp: Date;
  read: boolean;
};

// Custom hook for managing lead notifications
export const useLeadNotifications = () => {
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<LeadNotificationType[]>([]);

  // Handle new lead assignment notifications
  const handleLeadAssigned = useCallback((data: any) => {
    const newNotification: LeadNotificationType = {
      id: `lead-assignment-${Date.now()}`,
      type: "assignment",
      message: `Lead "${data.leadName}" from ${data.clientName} has been assigned to you`,
      status: "HandToDispatch" as const,
      leadId: data.leadId,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast notification with amber color (neutral reminder)
    toast({
      title: "New Lead Assigned",
      description: newNotification.message,
      variant: "default",
      className: "border-yellow-500 bg-yellow-50 text-yellow-800"
    });
  }, [toast]);

  // Handle lead follow-up reminder notifications
  const handleLeadFollowUp = useCallback((data: any) => {
    const newNotification: LeadNotificationType = {
      id: `lead-followup-${Date.now()}`,
      type: "followUp",
      message: `Follow-up required: Lead "${data.leadName}" from ${data.clientName} has been in HandToDispatch status for 24+ hours`,
      status: "HandToDispatch" as const,
      leadId: data.leadId,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast notification with red color (critical action needed)
    toast({
      title: "Follow-up Required",
      description: newNotification.message,
      variant: "destructive"
    });
  }, [toast]);

  // Handle weekly inactive leads reminder notifications
  const handleWeeklyInactiveLeads = useCallback((data: any) => {
    const newNotification: LeadNotificationType = {
      id: `weekly-reminder-${Date.now()}`,
      type: "weeklyReminder",
      message: `Weekly reminder: You have ${data.count} inactive lead(s) in HandToDispatch status for more than a week`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast notification with red color (critical action needed)
    toast({
      title: "Weekly Reminder",
      description: newNotification.message,
      variant: "destructive"
    });
  }, [toast]);

  // Handle lead status change notifications
  const handleLeadStatusChange = useCallback((data: any) => {
    // Determine notification color based on status
    let color: "red" | "green" | "yellow" = "yellow";
    if (data.status === "Active") color = "green";
    if (data.status === "Unqualified") color = "red";
    
    const newNotification: LeadNotificationType = {
      id: `status-change-${Date.now()}`,
      type: "statusChange",
      message: `Lead "${data.leadName}" from ${data.clientName} status changed from ${data.previousStatus} to ${data.status}`,
      status: data.status,
      leadId: data.leadId,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast notification with appropriate color
    toast({
      title: "Lead Status Changed",
      description: newNotification.message,
      variant: color === "red" ? "destructive" : "default",
      className: color === "green" 
        ? "border-green-500 bg-green-50 text-green-800" 
        : color === "yellow" 
        ? "border-yellow-500 bg-yellow-50 text-yellow-800"
        : undefined
    });
  }, [toast]);

  // Setup event listeners for socket events
  useEffect(() => {
    if (!socket || !user) return;

    // Subscribe to lead notification events
    socket.on("leadAssigned", handleLeadAssigned);
    socket.on("leadFollowUpReminder", handleLeadFollowUp);
    socket.on("weeklyInactiveLeadsReminder", handleWeeklyInactiveLeads);
    socket.on("leadStatusChange", handleLeadStatusChange);

    // Cleanup event listeners
    return () => {
      socket.off("leadAssigned", handleLeadAssigned);
      socket.off("leadFollowUpReminder", handleLeadFollowUp);
      socket.off("weeklyInactiveLeadsReminder", handleWeeklyInactiveLeads);
      socket.off("leadStatusChange", handleLeadStatusChange);
    };
  }, [
    socket, 
    user, 
    handleLeadAssigned, 
    handleLeadFollowUp, 
    handleWeeklyInactiveLeads, 
    handleLeadStatusChange
  ]);

  // Function to dismiss a single notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Function to clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Return the hook API
  return {
    notifications,
    dismissNotification,
    clearAllNotifications
  };
};