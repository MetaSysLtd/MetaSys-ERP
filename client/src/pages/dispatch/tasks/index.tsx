import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Check, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/layout/PageHeader';
import UserAvatar from '@/components/ui/user-avatar';

interface DispatchTask {
  id: number;
  dispatcherId: number;
  date: string;
  orgId: number;
  status: 'Pending' | 'Submitted';
  salesQuotaAchieved: boolean;
  leadsFollowedUp: boolean;
  deadLeadsArchived: boolean;
  carriersUpdated: boolean;
  notes: string | null;
  createdAt: string;
}

export default function DispatchTasksPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // New task form state
  const [newTask, setNewTask] = useState({
    salesQuotaAchieved: false,
    leadsFollowedUp: false,
    deadLeadsArchived: false,
    carriersUpdated: false,
    notes: '',
  });
  
  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['/api/dispatch/tasks'],
    queryFn: () => 
      apiRequest('GET', '/api/dispatch/tasks')
        .then(res => res.json()),
  });
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => 
      apiRequest('POST', '/api/dispatch/tasks', taskData)
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dispatch/tasks'] });
      setIsCreateDialogOpen(false);
      resetNewTaskForm();
      toast({
        title: 'Task created',
        description: 'Your task has been created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create task',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/dispatch/tasks/${id}`, data)
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dispatch/tasks'] });
      toast({
        title: 'Task updated',
        description: 'Your task has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update task',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
  
  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    taskId: number, 
    field: string
  ) => {
    updateTaskMutation.mutate({ 
      id: taskId, 
      data: { [field]: e.target.checked } 
    });
  };
  
  const handleStatusChange = (taskId: number, status: string) => {
    updateTaskMutation.mutate({ 
      id: taskId, 
      data: { status } 
    });
  };
  
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate({
      ...newTask,
      date: selectedDate,
    });
  };
  
  const resetNewTaskForm = () => {
    setNewTask({
      salesQuotaAchieved: false,
      leadsFollowedUp: false,
      deadLeadsArchived: false,
      carriersUpdated: false,
      notes: '',
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'Submitted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Submitted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const tasksByDate = tasks ? 
    Object.entries(
      tasks.reduce((acc: Record<string, DispatchTask[]>, task: DispatchTask) => {
        const date = task.date.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(task);
        return acc;
      }, {})
    ).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    : [];
  
  return (
    <div className="container mx-auto p-4">
      <PageHeader 
        title="Dispatch Tasks" 
        description="Manage and track your daily dispatch tasks"
        actionButton={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Create a new dispatch task for tracking your daily activities.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateTask}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="salesQuotaAchieved"
                      checked={newTask.salesQuotaAchieved}
                      onChange={(e) => setNewTask({...newTask, salesQuotaAchieved: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="salesQuotaAchieved">Sales Quota Achieved</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="leadsFollowedUp"
                      checked={newTask.leadsFollowedUp}
                      onChange={(e) => setNewTask({...newTask, leadsFollowedUp: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="leadsFollowedUp">Leads Followed Up</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="deadLeadsArchived"
                      checked={newTask.deadLeadsArchived}
                      onChange={(e) => setNewTask({...newTask, deadLeadsArchived: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="deadLeadsArchived">Dead Leads Archived</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="carriersUpdated"
                      checked={newTask.carriersUpdated}
                      onChange={(e) => setNewTask({...newTask, carriersUpdated: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="carriersUpdated">Carriers Updated</Label>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any additional notes here..."
                      value={newTask.notes}
                      onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                      rows={4}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createTaskMutation.isPending}
                  >
                    {createTaskMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Task
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tasksByDate.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            You haven't created any dispatch tasks yet. Click the "New Task" button to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {tasksByDate.map(([date, dateTasks]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{format(new Date(date), 'MMMM d, yyyy')}</span>
                  {dateTasks.some(task => task.status === 'Submitted') ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Check className="mr-1 h-3 w-3" /> Submitted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Pending
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Dispatch tasks for {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead className="w-[120px] text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dateTasks.map((task) => (
                      <React.Fragment key={task.id}>
                        <TableRow className="border-b">
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <UserAvatar 
                                user={{ 
                                  id: task.dispatcherId,
                                  firstName: user?.firstName || '',
                                  lastName: user?.lastName || '',
                                  profileImageUrl: user?.profileImageUrl || null
                                }} 
                                className="h-8 w-8 mr-2" 
                              />
                              <div>
                                <p className="font-semibold">Daily Dispatch Checklist</p>
                                <p className="text-sm text-muted-foreground">
                                  Created on {format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Select
                              value={task.status}
                              onValueChange={(value) => handleStatusChange(task.id, value)}
                              disabled={updateTaskMutation.isPending}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Submitted">Submit</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={2}>
                            <div className="py-2">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`sales-${task.id}`}
                                    checked={task.salesQuotaAchieved}
                                    onChange={(e) => handleCheckboxChange(e, task.id, 'salesQuotaAchieved')}
                                    className="h-4 w-4 rounded border-gray-300"
                                    disabled={task.status === 'Submitted'}
                                  />
                                  <Label htmlFor={`sales-${task.id}`}>Sales Quota Achieved</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`leads-${task.id}`}
                                    checked={task.leadsFollowedUp}
                                    onChange={(e) => handleCheckboxChange(e, task.id, 'leadsFollowedUp')}
                                    className="h-4 w-4 rounded border-gray-300"
                                    disabled={task.status === 'Submitted'}
                                  />
                                  <Label htmlFor={`leads-${task.id}`}>Leads Followed Up</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`deadLeads-${task.id}`}
                                    checked={task.deadLeadsArchived}
                                    onChange={(e) => handleCheckboxChange(e, task.id, 'deadLeadsArchived')}
                                    className="h-4 w-4 rounded border-gray-300"
                                    disabled={task.status === 'Submitted'}
                                  />
                                  <Label htmlFor={`deadLeads-${task.id}`}>Dead Leads Archived</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`carriers-${task.id}`}
                                    checked={task.carriersUpdated}
                                    onChange={(e) => handleCheckboxChange(e, task.id, 'carriersUpdated')}
                                    className="h-4 w-4 rounded border-gray-300"
                                    disabled={task.status === 'Submitted'}
                                  />
                                  <Label htmlFor={`carriers-${task.id}`}>Carriers Updated</Label>
                                </div>
                              </div>
                              
                              {task.notes && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium mb-1">Notes:</p>
                                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                    {task.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}