import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import {
  Filter,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Clock3,
  XCircle,
  Hourglass,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { MotionWrapper } from "@/components/ui/motion-wrapper-fixed";
import { AnimationSettings } from "@/components/ui/animation-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { PageLayout } from "@/components/layout/PageLayout";

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: string; // "todo", "in_progress", "completed", "cancelled"
  priority: string; // "low", "medium", "high", "urgent"
  dueDate: string | null;
  orgId: number | null;
  createdBy: number;
  assignedTo: number | null;
  relatedEntityType: string | null; // "lead", "load", "invoice", etc.
  relatedEntityId: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export default function TasksPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);

  // Fetch tasks based on current filters
  const { data: tasks, isLoading, isError, refetch } = useQuery<Task[]>({
    queryKey: ['/api/tasks', { status: statusFilter !== 'all' ? statusFilter : undefined, priority: priorityFilter !== 'all' ? priorityFilter : undefined }],
  });

  // Fetch tasks assigned to current user
  const { data: myTasks, isLoading: isLoadingMyTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks/user', userId],
    enabled: !!userId,
  });

  const getFilteredTasks = () => {
    let filteredTasks = tasks || [];

    // Apply tab filter
    if (currentTab === 'my-tasks') {
      filteredTasks = myTasks || [];
    }

    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
    }

    // Apply priority filter if not 'all'
    if (priorityFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
    }

    return filteredTasks;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <Hourglass className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'todo': return <Clock3 className="h-4 w-4 text-purple-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'todo': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, {
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : null
      });

      // Invalidate queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/user', userId] });

      toast({
        title: "Task Updated",
        description: `Task status changed to ${newStatus.replace(/_/g, ' ')}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = getFilteredTasks();

  return (
    <PageLayout
      title="Tasks"
      action={<Button onClick={() => setShowCreateTaskDialog(true)} className="bg-[#457B9D] hover:bg-[#2EC4B6] text-white"><Plus className="mr-2 h-4 w-4" /> Create Task</Button>}
    >
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Task Management</h2>
        <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab} className="w-full mb-6">
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          {(statusFilter !== 'all' || priorityFilter !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <CardContent>
          {isLoading || isLoadingMyTasks ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-60" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-6 text-muted-foreground">
              Failed to load tasks. Please try again.
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className="border rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium flex items-center gap-1.5">
                        {getStatusIcon(task.status)}
                        {task.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {task.description || 'No description provided'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                        {task.priority}
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(task.status))}>
                        {task.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        Created: {format(new Date(task.createdAt), 'MMM d, yyyy')}
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {task.status === 'todo' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => handleStatusChange(task.id, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}

                      {task.status === 'in_progress' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => handleStatusChange(task.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}

                      {(task.status === 'todo' || task.status === 'in_progress') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => handleStatusChange(task.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No tasks found matching your filters.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
              queryClient.invalidateQueries({ queryKey: ['/api/tasks/user', userId] });
            }}
          >
            Refresh
          </Button>
        </CardFooter>
      </Card>
      <CreateTaskDialog
        open={showCreateTaskDialog}
        onOpenChange={setShowCreateTaskDialog}
        onSuccess={() => {
          setShowCreateTaskDialog(false);
          toast({
            title: "Task Created",
            description: "New task has been successfully created.",
          });
        }}
      />
    </PageLayout>
  );
}