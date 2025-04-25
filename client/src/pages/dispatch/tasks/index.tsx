import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, Calendar, CheckCircle, Loader2 } from "lucide-react";
import { useSocketNotifications } from "@/hooks/use-socket-notifications";
import { DailyTaskModal } from "@/components/dispatch/daily-task-modal";
import { DailyReportModal } from "@/components/dispatch/daily-report-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToastAlert } from "@/components/ui/toast-alert";

export default function DispatchTasksPage() {
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  
  const { taskReminder, reportReminder, clearTaskReminder, clearReportReminder } = useSocketNotifications();
  
  // Fetch user's tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/dispatch/tasks"],
    queryFn: async () => {
      const response = await fetch("/api/dispatch/tasks");
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
  });
  
  // Fetch user's reports
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/dispatch/reports"],
    queryFn: async () => {
      const response = await fetch("/api/dispatch/reports");
      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }
      return response.json();
    },
  });
  
  // Handle task reminder event
  useEffect(() => {
    if (taskReminder) {
      setSelectedTaskId(taskReminder.taskId);
      setTaskModalOpen(true);
    }
  }, [taskReminder]);
  
  // Handle report reminder event
  useEffect(() => {
    if (reportReminder) {
      setSelectedReportId(reportReminder.reportId);
      setReportModalOpen(true);
    }
  }, [reportReminder]);
  
  // Close task modal and clear reminder
  const handleTaskModalClose = () => {
    setTaskModalOpen(false);
    clearTaskReminder();
  };
  
  // Close report modal and clear reminder
  const handleReportModalClose = () => {
    setReportModalOpen(false);
    clearReportReminder();
  };
  
  // Open task modal for a specific task
  const openTaskModal = (taskId: number) => {
    setSelectedTaskId(taskId);
    setTaskModalOpen(true);
  };
  
  // Open report modal for a specific report
  const openReportModal = (reportId: number) => {
    setSelectedReportId(reportId);
    setReportModalOpen(true);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dispatch Tasks</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Daily Tasks Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Daily Tasks
            </CardTitle>
            <CardDescription>
              Keep track of your daily dispatcher tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tasks && tasks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task: any) => (
                    <TableRow key={task.id}>
                      <TableCell>{format(new Date(task.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {task.status === "Submitted" ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-500 border-amber-500">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.status === "Pending" && (
                          <Button 
                            onClick={() => openTaskModal(task.id)}
                            className="bg-[#457B9D] hover:bg-[#2EC4B6] text-white rounded-md transition-all duration-200"
                            size="sm"
                          >
                            Submit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No tasks found.</p>
            )}
          </CardContent>
        </Card>
        
        {/* Daily Reports Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Daily Reports
            </CardTitle>
            <CardDescription>
              Submit your end-of-day performance reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : reports && reports.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report: any) => (
                    <TableRow key={report.id}>
                      <TableCell>{format(new Date(report.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {report.status === "Submitted" ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-500 border-amber-500">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {report.status === "Pending" && (
                          <Button 
                            onClick={() => openReportModal(report.id)}
                            className="bg-[#457B9D] hover:bg-[#2EC4B6] text-white rounded-md transition-all duration-200"
                            size="sm"
                          >
                            Submit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No reports found.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Task submission modal */}
      {selectedTaskId && (
        <DailyTaskModal
          isOpen={taskModalOpen}
          onClose={handleTaskModalClose}
          taskId={selectedTaskId}
        />
      )}
      
      {/* Report submission modal */}
      {selectedReportId && (
        <DailyReportModal
          isOpen={reportModalOpen}
          onClose={handleReportModalClose}
          reportId={selectedReportId}
        />
      )}
    </div>
  );
}