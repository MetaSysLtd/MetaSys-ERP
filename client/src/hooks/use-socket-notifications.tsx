import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ToastAlert } from "@/components/ui/toast-alert";

export type TaskReminderData = {
  taskId: number;
  message: string;
  date: string;
};

export type ReportReminderData = {
  reportId: number;
  message: string;
  date: string;
};

export type PerformanceAlertData = {
  color: "Red" | "Green";
  message: string;
  percentOfGoal: number;
  target: number;
  actual: number;
};

export type LeadAssignedData = {
  leadId: number;
  message: string;
  leadName: string;
  clientName: string;
  assignedBy: number;
  assignedAt: string;
  status: string;
};

export type LeadStatusChangeData = {
  leadId: number;
  message: string;
  leadName: string;
  clientName: string;
  previousStatus: string;
  status: string;
  changedBy: number;
  changedAt: string;
};

export type FollowUpReminderData = {
  leadId: number;
  message: string;
  leadName: string;
  clientName: string;
  assignedAt: string;
  status: string;
};

export type WeeklyInactiveLeadsData = {
  message: string;
  leadIds: number[];
  leadNames: string[];
  count: number;
};

export function useSocketNotifications() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [taskReminderData, setTaskReminderData] = useState<TaskReminderData | null>(null);
  const [reportReminderData, setReportReminderData] = useState<ReportReminderData | null>(null);
  const [performanceAlertData, setPerformanceAlertData] = useState<PerformanceAlertData | null>(null);
  const [leadAssignedData, setLeadAssignedData] = useState<LeadAssignedData | null>(null);
  const [leadStatusChangeData, setLeadStatusChangeData] = useState<LeadStatusChangeData | null>(null);
  const [followUpReminderData, setFollowUpReminderData] = useState<FollowUpReminderData | null>(null);
  const [weeklyInactiveLeadsData, setWeeklyInactiveLeadsData] = useState<WeeklyInactiveLeadsData | null>(null);

  useEffect(() => {
    if (!socket || !user) return;

    // Task reminder handler
    const handleTaskReminder = (data: TaskReminderData) => {
      setTaskReminderData(data);
      toast({
        description: (
          <ToastAlert color="amber">
            {data.message}
          </ToastAlert>
        ),
      });
    };

    // Report reminder handler
    const handleReportReminder = (data: ReportReminderData) => {
      setReportReminderData(data);
      toast({
        description: (
          <ToastAlert color="amber">
            {data.message}
          </ToastAlert>
        ),
      });
    };

    // Performance alert handler
    const handlePerfAlert = (data: PerformanceAlertData) => {
      setPerformanceAlertData(data);
      toast({
        description: (
          <ToastAlert color={data.color === "Red" ? "red" : "green"}>
            {data.message}: {data.percentOfGoal}% of target
          </ToastAlert>
        ),
      });
    };

    // Lead assigned handler
    const handleLeadAssigned = (data: LeadAssignedData) => {
      setLeadAssignedData(data);
      // Toast is handled by lead-notification-container component
    };

    // Lead status change handler
    const handleLeadStatusChange = (data: LeadStatusChangeData) => {
      setLeadStatusChangeData(data);
      // Toast is handled by lead-notification-container component
    };

    // Follow-up reminder handler
    const handleFollowUpReminder = (data: FollowUpReminderData) => {
      setFollowUpReminderData(data);
      // Toast is handled by lead-notification-container component
    };

    // Weekly inactive leads reminder handler
    const handleWeeklyInactiveLeads = (data: WeeklyInactiveLeadsData) => {
      setWeeklyInactiveLeadsData(data);
      // Toast is handled by lead-notification-container component
    };

    // Subscribe to socket events
    socket.on("taskReminder", handleTaskReminder);
    socket.on("reportReminder", handleReportReminder);
    socket.on("perfAlert", handlePerfAlert);
    socket.on("leadAssigned", handleLeadAssigned);
    socket.on("leadStatusChange", handleLeadStatusChange);
    socket.on("leadFollowUpReminder", handleFollowUpReminder);
    socket.on("weeklyInactiveLeadsReminder", handleWeeklyInactiveLeads);

    // Clean up event listeners
    return () => {
      socket.off("taskReminder", handleTaskReminder);
      socket.off("reportReminder", handleReportReminder);
      socket.off("perfAlert", handlePerfAlert);
      socket.off("leadAssigned", handleLeadAssigned);
      socket.off("leadStatusChange", handleLeadStatusChange);
      socket.off("leadFollowUpReminder", handleFollowUpReminder);
      socket.off("weeklyInactiveLeadsReminder", handleWeeklyInactiveLeads);
    };
  }, [socket, user, toast]);

  return {
    taskReminderData,
    reportReminderData,
    performanceAlertData,
    leadAssignedData,
    leadStatusChangeData,
    followUpReminderData,
    weeklyInactiveLeadsData,
    resetTaskReminder: () => setTaskReminderData(null),
    resetReportReminder: () => setReportReminderData(null),
    resetPerformanceAlert: () => setPerformanceAlertData(null),
    resetLeadAssigned: () => setLeadAssignedData(null),
    resetLeadStatusChange: () => setLeadStatusChangeData(null),
    resetFollowUpReminder: () => setFollowUpReminderData(null),
    resetWeeklyInactiveLeads: () => setWeeklyInactiveLeadsData(null),
  };
}