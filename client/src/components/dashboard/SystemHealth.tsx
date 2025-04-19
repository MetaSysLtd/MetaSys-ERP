import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpCircle, Server, Database, Cloud, RefreshCw } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SystemMetric = {
  name: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ReactNode;
}

type SystemHealthProps = {
  metrics?: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    uptime: number;
  },
  lastUpdated?: string;
  onRefresh?: () => void;
}

export function SystemHealth({ 
  metrics = {
    cpu: 28,
    memory: 42,
    disk: 67,
    network: 33,
    uptime: 99.98
  },
  lastUpdated = new Date().toLocaleString(),
  onRefresh = () => {}
}: SystemHealthProps) {
  
  const getStatusFromValue = (value: number): 'healthy' | 'warning' | 'critical' => {
    if (value < 50) return 'healthy';
    if (value < 80) return 'warning';
    return 'critical';
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  }
  
  const getProgressColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  }
  
  const systemMetrics: SystemMetric[] = [
    {
      name: 'CPU Usage',
      value: metrics.cpu,
      status: getStatusFromValue(metrics.cpu),
      icon: <Server className="w-4 h-4" />
    },
    {
      name: 'Memory Usage',
      value: metrics.memory,
      status: getStatusFromValue(metrics.memory),
      icon: <Database className="w-4 h-4" />
    },
    {
      name: 'Disk Space',
      value: metrics.disk,
      status: getStatusFromValue(metrics.disk),
      icon: <Database className="w-4 h-4" />
    },
    {
      name: 'Network',
      value: metrics.network,
      status: getStatusFromValue(metrics.network),
      icon: <Cloud className="w-4 h-4" />
    }
  ];
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">System Health</CardTitle>
          <CardDescription>Real-time system metrics and status</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            <ArrowUpCircle className="mr-1 h-3 w-3" />
            {metrics.uptime}% Uptime
          </Badge>
          <button 
            onClick={onRefresh}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {systemMetrics.map((metric) => (
            <div key={metric.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  {metric.icon}
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                <Badge variant="outline" className={cn("text-xs font-medium", getStatusColor(metric.status))}>
                  {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={metric.value} 
                  className="h-2"
                  indicatorClassName={getProgressColor(metric.status)}
                />
                <span className="text-sm font-medium">{metric.value}%</span>
              </div>
            </div>
          ))}
          <div className="text-xs text-gray-500 mt-2">
            Last updated: {lastUpdated}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}