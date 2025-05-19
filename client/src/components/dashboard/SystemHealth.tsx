import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowUpCircle, 
  Server, 
  Database, 
  Cloud, 
  RefreshCw, 
  Globe, 
  KeyRound, 
  PackageCheck, 
  Activity,
  Wifi,
  Gauge,
  BarChart3,
  Bell,
  Cpu,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  Calendar,
  Clock
} from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

type SystemMetric = {
  name: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ReactNode;
}

type ApiStatus = {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  responseTime: number;
  lastChecked: string;
}

type DatabaseStats = {
  totalTables: number;
  totalRows: number;
  size: string;
  activeConnections: number;
  queriesPerSecond: number;
  averageQueryTime: number;
  lastBackup: string;
}

type SystemHealthProps = {
  metrics?: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    uptime: number;
  },
  apiStatuses?: ApiStatus[],
  databaseStats?: DatabaseStats,
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
  apiStatuses = [
    {
      name: 'Authentication API',
      status: 'operational',
      responseTime: 42,
      lastChecked: '5 min ago'
    },
    {
      name: 'Payments API',
      status: 'operational',
      responseTime: 56,
      lastChecked: '5 min ago'
    },
    {
      name: 'Notification Service',
      status: 'degraded',
      responseTime: 230,
      lastChecked: '5 min ago'
    },
    {
      name: 'File Storage',
      status: 'operational',
      responseTime: 89,
      lastChecked: '5 min ago'
    },
    {
      name: 'SMS Gateway',
      status: 'outage',
      responseTime: 0,
      lastChecked: '5 min ago'
    }
  ],
  databaseStats = {
    totalTables: 24,
    totalRows: 456789,
    size: '2.3 GB',
    activeConnections: 8,
    queriesPerSecond: 42.5,
    averageQueryTime: 24.6,
    lastBackup: 'Today, 02:00 AM'
  },
  lastUpdated = new Date().toLocaleString(),
  onRefresh = () => {}
}: SystemHealthProps) {
  const [activeTab, setActiveTab] = useState('system');
  
  const getStatusFromValue = (value: number): 'healthy' | 'warning' | 'critical' => {
    if (isNaN(value) || value === undefined || value === null) return 'healthy';
    if (value < 50) return 'healthy';
    if (value < 80) return 'warning';
    return 'critical';
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': 
      case 'operational': 
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'warning': 
      case 'degraded': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'critical': 
      case 'outage': 
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  }
  
  const systemMetrics: SystemMetric[] = [
    {
      name: 'CPU Usage',
      value: metrics.cpu,
      status: getStatusFromValue(metrics.cpu),
      icon: <Cpu className="w-4 h-4" />
    },
    {
      name: 'Memory Usage',
      value: metrics.memory,
      status: getStatusFromValue(metrics.memory),
      icon: <Activity className="w-4 h-4" />
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
      icon: <Wifi className="w-4 h-4" />
    }
  ];

  const getApiStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'outage': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefresh}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="system" className="text-xs">
              <Server className="h-3.5 w-3.5 mr-1" />
              System
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs">
              <Globe className="h-3.5 w-3.5 mr-1" />
              API Status
            </TabsTrigger>
            <TabsTrigger value="database" className="text-xs">
              <Database className="h-3.5 w-3.5 mr-1" />
              Database
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="system" className="mt-0 space-y-4">
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
                    value={isNaN(metric.value) || metric.value === undefined || metric.value === null ? undefined : metric.value} 
                    className={cn("h-2", 
                      metric.status === 'healthy' && "[&>div]:bg-green-500",
                      metric.status === 'warning' && "[&>div]:bg-yellow-500",
                      metric.status === 'critical' && "[&>div]:bg-red-500"
                    )}
                  />
                  <span className="text-sm font-medium">{isNaN(metric.value) || metric.value === undefined || metric.value === null ? '-' : `${metric.value}%`}</span>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-800">
              <div className="flex gap-1 items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Last updated: {lastUpdated}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={onRefresh}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="api" className="mt-0">
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {apiStatuses.map((api) => (
                <div
                  key={api.name}
                  className={cn(
                    "border rounded-md p-3",
                    api.status === 'operational' && "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950",
                    api.status === 'degraded' && "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950",
                    api.status === 'outage' && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {api.status === 'operational' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {api.status === 'degraded' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                      {api.status === 'outage' && <XCircle className="h-4 w-4 text-red-500" />}
                      <span className="font-medium">{api.name}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(api.status))}>
                      {api.status.charAt(0).toUpperCase() + api.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <div>
                      Response time: {api.responseTime}{api.status !== 'outage' ? 'ms' : ' - '}
                    </div>
                    <div>
                      Last checked: {api.lastChecked}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-800">
              <div className="text-xs text-muted-foreground">
                Showing {apiStatuses.length} API endpoints
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={onRefresh}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Check Now
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="database" className="mt-0">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Database className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Storage</span>
                </div>
                <div className="text-2xl font-bold">{databaseStats.size}</div>
                <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                  <div>{databaseStats.totalTables} tables</div>
                  <div>{databaseStats.totalRows.toLocaleString()} rows</div>
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Performance</span>
                </div>
                <div className="text-2xl font-bold">{databaseStats.queriesPerSecond} qps</div>
                <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                  <div>{databaseStats.averageQueryTime} ms avg</div>
                  <div>{databaseStats.activeConnections} connections</div>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-3 mb-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Last Backup</span>
              </div>
              <div className="text-base font-medium">{databaseStats.lastBackup}</div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-800">
              <div className="text-xs text-muted-foreground">
                PostgreSQL Database
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={onRefresh}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-7 text-xs"
                >
                  <Database className="h-3 w-3 mr-1" />
                  Backup Now
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}