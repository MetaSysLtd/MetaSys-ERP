import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  PlayCircle, 
  PauseCircle, 
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock3,
  XCircle, 
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type ScheduledTask = {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'completed' | 'failed' | 'scheduled' | 'paused';
  schedule: string;
  lastRun?: string;
  nextRun?: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  progress?: number;
  duration?: string;
  type: 'data-sync' | 'backup' | 'report' | 'maintenance' | 'notification' | 'other';
}

type ScheduledTasksProps = {
  tasks?: ScheduledTask[];
  onStartTask?: (id: string) => void;
  onPauseTask?: (id: string) => void;
  onRestartTask?: (id: string) => void;
  onViewTaskDetails?: (id: string) => void;
}

export function ScheduledTasks({
  tasks = [],
  onStartTask = () => {},
  onPauseTask = () => {},
  onRestartTask = () => {},
  onViewTaskDetails = () => {},
}: ScheduledTasksProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (typeFilter !== 'all' && task.type !== typeFilter) return false;
    return true;
  });
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'scheduled': return <Clock3 className="h-4 w-4 text-purple-500" />;
      case 'paused': return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'scheduled': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'data-sync': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100';
      case 'backup': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100';
      case 'report': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100';
      case 'maintenance': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
      case 'notification': return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };
  
  const getActionButtons = (task: ScheduledTask) => {
    switch (task.status) {
      case 'running':
        return (
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => onPauseTask(task.id)}
          >
            <PauseCircle className="h-3.5 w-3.5 mr-1" /> Pause
          </Button>
        );
      case 'paused':
        return (
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => onStartTask(task.id)}
          >
            <PlayCircle className="h-3.5 w-3.5 mr-1" /> Resume
          </Button>
        );
      case 'failed':
        return (
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => onRestartTask(task.id)}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Retry
          </Button>
        );
      case 'completed':
        return (
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => onRestartTask(task.id)}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Run Again
          </Button>
        );
      case 'scheduled':
        return (
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => onStartTask(task.id)}
          >
            <PlayCircle className="h-3.5 w-3.5 mr-1" /> Run Now
          </Button>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xl font-bold">Scheduled Tasks</CardTitle>
            <CardDescription>Manage and monitor system tasks</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[130px]">
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-[130px]">
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="data-sync">Data Sync</SelectItem>
                <SelectItem value="backup">Backup</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div 
                key={task.id} 
                className="border rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => onViewTaskDetails(task.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium flex items-center gap-1.5">
                      {getStatusIcon(task.status)}
                      {task.name}
                    </div>
                    <div className="text-sm text-muted-foreground">{task.description}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={cn("text-xs", getTypeColor(task.type))}>
                      {task.type.replace(/-/g, ' ')}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(task.status))}>
                      {task.status}
                    </Badge>
                  </div>
                </div>
                
                {task.status === 'running' && task.progress !== undefined && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-1.5" />
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {task.lastRun ? `Last: ${task.lastRun}` : 'Never run'}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {task.nextRun ? `Next: ${task.nextRun}` : 'Not scheduled'}
                    </div>
                  </div>
                  {getActionButtons(task)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No tasks match your filters. Try adjusting your criteria.
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setStatusFilter('all');
            setTypeFilter('all');
          }}
        >
          Clear Filters
        </Button>
      </CardFooter>
    </Card>
  );
}