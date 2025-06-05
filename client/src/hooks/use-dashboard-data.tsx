import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Custom hook to load critical dashboard data in parallel for improved performance
 * Uses Promise.all to fetch multiple endpoints at once and set timeout fallbacks
 */
export function useDashboardData() {
  // Get user profile and permissions - highest priority
  const userProfileQuery = useQuery({
    queryKey: ['/api/auth/me'],
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });
  
  // Get KPI metrics data - high priority
  const kpiMetricsQuery = useQuery({
    queryKey: ['/api/dashboard/metrics'],
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
  
  // Get revenue data - high priority
  const revenueQuery = useQuery({
    queryKey: ['/api/dashboard/revenue'],
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
  
  // Get activity feed - medium priority (can be loaded after initial view)
  const activitiesQuery = useQuery({
    queryKey: ['/api/dashboard/activities'],
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  // Simple loading state based on critical queries
  const isLoading = userProfileQuery.isLoading || kpiMetricsQuery.isLoading;
  const hasTimedOut = userProfileQuery.isError && kpiMetricsQuery.isError;
  
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