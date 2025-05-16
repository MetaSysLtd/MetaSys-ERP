import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Custom hook to load critical dashboard data in parallel for improved performance
 * Uses Promise.all to fetch multiple endpoints at once and set timeout fallbacks
 */
export function useDashboardData() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  // Get user profile and permissions - highest priority
  const userProfileQuery = useQuery({
    queryKey: ['/api/auth/me'],
    staleTime: 60000, // Cache for 1 minute
  });
  
  // Get KPI metrics data - high priority
  const kpiMetricsQuery = useQuery({
    queryKey: ['/api/dashboard/metrics'],
    staleTime: 30000, // Cache for 30 seconds
  });
  
  // Get revenue data - high priority
  const revenueQuery = useQuery({
    queryKey: ['/api/dashboard/revenue'],
    staleTime: 30000, // Cache for 30 seconds
  });
  
  // Get activity feed - medium priority (can be loaded after initial view)
  const activitiesQuery = useQuery({
    queryKey: ['/api/dashboard/activities'],
    staleTime: 30000, // Cache for 30 seconds
  });
  
  // Manage loading state with timeouts
  useEffect(() => {
    // Start with loading state
    setIsLoading(true);
    setHasTimedOut(false);
    
    // Fast timeout for critical data (300ms)
    // If not loaded by then, show skeleton UI
    const criticalTimeout = setTimeout(() => {
      const criticalQueriesLoaded = 
        !userProfileQuery.isLoading && !kpiMetricsQuery.isLoading;
      
      if (criticalQueriesLoaded) {
        setIsLoading(false);
      }
    }, 300);
    
    // Medium timeout (600ms) - load with some data even if not all is available
    const mediumTimeout = setTimeout(() => {
      const hasMinimumData = 
        !userProfileQuery.isLoading || 
        (!kpiMetricsQuery.isLoading && !revenueQuery.isLoading);
      
      if (hasMinimumData) {
        setIsLoading(false);
      }
    }, 600);
    
    // Final timeout (1000ms) - don't wait longer than this no matter what
    const finalTimeout = setTimeout(() => {
      setIsLoading(false);
      
      // If we still don't have critical data, mark as timed out
      if (userProfileQuery.isLoading && kpiMetricsQuery.isLoading) {
        setHasTimedOut(true);
      }
    }, 1000);
    
    return () => {
      clearTimeout(criticalTimeout);
      clearTimeout(mediumTimeout);
      clearTimeout(finalTimeout);
    };
  }, [
    userProfileQuery.isLoading,
    kpiMetricsQuery.isLoading,
    revenueQuery.isLoading,
    activitiesQuery.isLoading
  ]);
  
  return {
    isLoading,
    hasTimedOut,
    userData: userProfileQuery.data,
    kpiData: kpiMetricsQuery.data,
    revenueData: revenueQuery.data,
    activitiesData: activitiesQuery.data,
    userProfileLoading: userProfileQuery.isLoading,
    kpiMetricsLoading: kpiMetricsQuery.isLoading,
    revenueLoading: revenueQuery.isLoading,
    activitiesLoading: activitiesQuery.isLoading,
    refetchAll: () => {
      userProfileQuery.refetch();
      kpiMetricsQuery.refetch();
      revenueQuery.refetch();
      activitiesQuery.refetch();
    }
  };
}