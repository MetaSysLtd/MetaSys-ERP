import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface WeekOverWeekData {
  thisWeek: {
    totalSalesLeads: number;
    totalLoads: number;
    totalCombined: number;
    salesUsers: number;
    dispatchUsers: number;
  };
  prevWeek: {
    totalSalesLeads: number;
    totalLoads: number;
    totalCombined: number;
    salesUsers: number;
    dispatchUsers: number;
  };
}

interface WeeklyComparisonProps {
  data: WeekOverWeekData | undefined;
  departmentType: 'sales' | 'dispatch' | 'combined';
}

export function WeeklyComparison({ data, departmentType }: WeeklyComparisonProps) {
  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No comparison data available.</p>
      </div>
    );
  }

  // Calculate the metrics based on the department type
  const currentValue = departmentType === 'sales' 
    ? data.thisWeek.totalSalesLeads 
    : departmentType === 'dispatch' 
      ? data.thisWeek.totalLoads 
      : data.thisWeek.totalCombined;
  
  const previousValue = departmentType === 'sales' 
    ? data.prevWeek.totalSalesLeads 
    : departmentType === 'dispatch' 
      ? data.prevWeek.totalLoads 
      : data.prevWeek.totalCombined;
  
  const percentChange = previousValue > 0
    ? ((currentValue - previousValue) / previousValue) * 100
    : currentValue > 0 ? 100 : 0;
  
  const isPositive = percentChange > 0;
  const isNeutral = percentChange === 0;

  // The number of active users
  const activeUsers = departmentType === 'sales' 
    ? data.thisWeek.salesUsers
    : departmentType === 'dispatch'
      ? data.thisWeek.dispatchUsers
      : data.thisWeek.salesUsers + data.thisWeek.dispatchUsers;
  
  // The trend labels based on department
  const trendLabel = departmentType === 'sales'
    ? 'leads closed'
    : departmentType === 'dispatch'
      ? 'loads booked'
      : 'combined performance';

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 text-center">
        <div className="text-4xl font-bold mb-2">
          {currentValue}
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          {departmentType === 'sales' ? 'Total leads closed this week' : 
           departmentType === 'dispatch' ? 'Total loads booked this week' : 
           'Combined performance score'}
        </div>
        
        <div className="flex items-center justify-center gap-1 font-medium">
          <div className={`flex items-center ${isPositive ? 'text-green-600' : isNeutral ? 'text-slate-500' : 'text-red-600'}`}>
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 mr-1" />
            ) : isNeutral ? (
              <ArrowRight className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 mr-1" />
            )}
            {Math.abs(percentChange).toFixed(1)}%
          </div>
          <span className="text-muted-foreground">vs last week</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Weekly Trend</h3>
        <div className="flex justify-between items-end h-32 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          {/* This week's bar */}
          <div className="flex flex-col items-center gap-2">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${Math.min(100, (currentValue / Math.max(currentValue, previousValue)) * 100)}%` }}
              transition={{ duration: 0.5 }}
              className="w-12 bg-[#025E73] rounded-t-md"
            />
            <div className="text-xs font-medium">This Week</div>
            <div className="text-xs text-muted-foreground">{currentValue} {trendLabel}</div>
          </div>
          
          {/* Previous week's bar */}
          <div className="flex flex-col items-center gap-2">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${Math.min(100, (previousValue / Math.max(currentValue, previousValue)) * 100)}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-12 bg-[#412754] rounded-t-md"
            />
            <div className="text-xs font-medium">Last Week</div>
            <div className="text-xs text-muted-foreground">{previousValue} {trendLabel}</div>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Based on data from {activeUsers} active {departmentType === 'combined' ? 'team members' : `${departmentType} team members`}.
      </div>
    </div>
  );
}