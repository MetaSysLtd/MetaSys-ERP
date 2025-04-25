import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAlert } from "@/components/ui/toast-alert";
import { io, Socket } from "socket.io-client";

interface PerformanceAlert {
  color: 'Red' | 'Green';
  message: string;
  target: number;
  actual: number;
}

interface TaskReminder {
  taskId: number;
  message: string;
}

interface ReportReminder {
  reportId: number;
  message: string;
}

export function useSocketNotifications() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [taskReminder, setTaskReminder] = useState<TaskReminder | null>(null);
  const [reportReminder, setReportReminder] = useState<ReportReminder | null>(null);
  const [performanceAlert, setPerformanceAlert] = useState<PerformanceAlert | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Determine the appropriate protocol (ws or wss) based on the current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socketUrl = `${protocol}//${window.location.host}`;
    
    console.log("Connecting to socket at:", socketUrl);
    
    // Create a new socket connection
    const newSocket = io(socketUrl);
    
    // Set up event listeners
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setConnected(true);
    });
    
    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });
    
    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });
    
    // Listen for task reminders
    newSocket.on("taskReminder", (data: TaskReminder) => {
      console.log("Task reminder received:", data);
      setTaskReminder(data);
      
      toast({
        description: (
          <ToastAlert color="green">
            {data.message}
          </ToastAlert>
        ),
      });
    });
    
    // Listen for report reminders
    newSocket.on("reportReminder", (data: ReportReminder) => {
      console.log("Report reminder received:", data);
      setReportReminder(data);
      
      toast({
        description: (
          <ToastAlert color="green">
            {data.message}
          </ToastAlert>
        ),
      });
    });
    
    // Listen for performance alerts
    newSocket.on("perfAlert", (data: PerformanceAlert) => {
      console.log("Performance alert received:", data);
      setPerformanceAlert(data);
      
      toast({
        description: (
          <ToastAlert color={data.color.toLowerCase() as 'red' | 'green'}>
            {data.message}
          </ToastAlert>
        ),
      });
    });
    
    // Store the socket instance
    setSocket(newSocket);
    
    // Clean up on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [toast]);
  
  // Clear notifications
  const clearTaskReminder = () => setTaskReminder(null);
  const clearReportReminder = () => setReportReminder(null);
  const clearPerformanceAlert = () => setPerformanceAlert(null);
  
  return {
    socket,
    connected,
    taskReminder,
    reportReminder,
    performanceAlert,
    clearTaskReminder,
    clearReportReminder,
    clearPerformanceAlert,
  };
}