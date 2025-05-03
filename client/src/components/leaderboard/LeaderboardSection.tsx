import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, BarChart3, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
// Import the components
import { WeeklyLeaderboard } from './WeeklyLeaderboard';
import { WeeklyComparison } from './WeeklyComparison';

export function LeaderboardSection() {
  const [department, setDepartment] = useState<'sales' | 'dispatch' | 'combined'>('sales');
  const [period, setPeriod] = useState<'current' | 'previous'>('current');
  
  // Fetch sales leaderboard data
  const { 
    data: salesData, 
    isLoading: salesLoading, 
    error: salesError 
  } = useQuery({
    queryKey: ['/api/leaderboard/sales'],
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Fetch dispatch leaderboard data
  const { 
    data: dispatchData, 
    isLoading: dispatchLoading, 
    error: dispatchError 
  } = useQuery({
    queryKey: ['/api/leaderboard/dispatch'],
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Fetch combined leaderboard data
  const { 
    data: combinedData, 
    isLoading: combinedLoading, 
    error: combinedError 
  } = useQuery({
    queryKey: ['/api/leaderboard/combined'],
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Fetch week over week comparison data
  const { 
    data: weekOverWeekData, 
    isLoading: weekOverWeekLoading, 
    error: weekOverWeekError 
  } = useQuery({
    queryKey: ['/api/leaderboard/week-over-week'],
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  const isLoading = salesLoading || dispatchLoading || combinedLoading || weekOverWeekLoading;
  const hasError = salesError || dispatchError || combinedError || weekOverWeekError;
  
  // Get appropriate data based on department selection
  const getLeaderboardData = () => {
    switch (department) {
      case 'sales':
        return salesData;
      case 'dispatch':
        return dispatchData;
      case 'combined':
        return combinedData;
      default:
        return salesData;
    }
  };
  
  // Get appropriate title based on department selection
  const getDepartmentTitle = () => {
    switch (department) {
      case 'sales':
        return 'Sales';
      case 'dispatch':
        return 'Dispatch';
      case 'combined':
        return 'Combined Departments';
      default:
        return 'Sales';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs defaultValue="sales" className="w-full max-w-md" onValueChange={(value) => setDepartment(value as any)}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="sales" className="data-[state=active]:bg-[#025E73] data-[state=active]:text-white">
              Sales
            </TabsTrigger>
            <TabsTrigger value="dispatch" className="data-[state=active]:bg-[#025E73] data-[state=active]:text-white">
              Dispatch
            </TabsTrigger>
            <TabsTrigger value="combined" className="data-[state=active]:bg-[#025E73] data-[state=active]:text-white">
              Combined
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant={period === 'current' ? 'default' : 'outline'} 
            onClick={() => setPeriod('current')}
            className={period === 'current' ? 'bg-[#025E73] hover:bg-[#011F26] text-white' : ''}
            size="sm"
          >
            Current Week
          </Button>
          <Button 
            variant={period === 'previous' ? 'default' : 'outline'} 
            onClick={() => setPeriod('previous')}
            className={period === 'previous' ? 'bg-[#025E73] hover:bg-[#011F26] text-white' : ''}
            size="sm"
          >
            Previous Week
          </Button>
        </div>
      </div>
      
      {hasError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading the leaderboard data. Please try again later.
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                    <Skeleton className="h-4 w-[60px]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-[200px] w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#025E73]" />
                <span>{getDepartmentTitle()} Leaderboard</span>
              </CardTitle>
              <CardDescription>
                Top performers based on {department === 'sales' ? 'leads closed' : department === 'dispatch' ? 'loads booked' : 'overall performance'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyLeaderboard 
                data={getLeaderboardData()} 
                departmentType={department} 
                period={period}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#F2A71B]" />
                <span>Week-over-Week Comparison</span>
              </CardTitle>
              <CardDescription>
                Performance trends compared to previous week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyComparison 
                data={weekOverWeekData} 
                departmentType={department}
              />
            </CardContent>
          </Card>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#412754]" />
            <span>Performance Insights</span>
          </CardTitle>
          <CardDescription>
            Key metrics and insights to drive performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h3 className="font-medium text-sm mb-1">Top Performer</h3>
              {isLoading ? (
                <Skeleton className="h-6 w-[180px]" />
              ) : (
                <p className="text-lg font-semibold">
                  {department === 'sales' && salesData?.length > 0 ? salesData[0].name :
                   department === 'dispatch' && dispatchData?.length > 0 ? dispatchData[0].name :
                   department === 'combined' && combinedData?.length > 0 ? combinedData[0].name : 'No data available'}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {department === 'sales' ? 'Most leads closed' : 
                 department === 'dispatch' ? 'Most loads booked' : 'Highest overall performance'}
              </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h3 className="font-medium text-sm mb-1">Weekly Growth</h3>
              {isLoading || !weekOverWeekData ? (
                <Skeleton className="h-6 w-[100px]" />
              ) : (
                <p className="text-lg font-semibold">
                  {department === 'sales' ? 
                    `${((weekOverWeekData.thisWeek.totalSalesLeads / Math.max(1, weekOverWeekData.prevWeek.totalSalesLeads) - 1) * 100).toFixed(1)}%` :
                   department === 'dispatch' ? 
                    `${((weekOverWeekData.thisWeek.totalLoads / Math.max(1, weekOverWeekData.prevWeek.totalLoads) - 1) * 100).toFixed(1)}%` :
                    `${((weekOverWeekData.thisWeek.totalCombined / Math.max(1, weekOverWeekData.prevWeek.totalCombined) - 1) * 100).toFixed(1)}%`}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">Compared to previous week</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h3 className="font-medium text-sm mb-1">Weekly Target</h3>
              {isLoading || !weekOverWeekData ? (
                <Skeleton className="h-6 w-[120px]" />
              ) : (
                <p className="text-lg font-semibold">
                  {department === 'sales' ? 
                    `${((weekOverWeekData.thisWeek.totalSalesLeads / 20) * 100).toFixed(0)}% of goal` :
                   department === 'dispatch' ? 
                    `${((weekOverWeekData.thisWeek.totalLoads / 15) * 100).toFixed(0)}% of goal` :
                    `${((weekOverWeekData.thisWeek.totalCombined / 35) * 100).toFixed(0)}% of goal`}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {department === 'sales' ? '20 leads/week target' : 
                 department === 'dispatch' ? '15 loads/week target' : '35 weekly target'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}