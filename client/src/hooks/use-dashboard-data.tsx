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
  
  // Get KPI metrics data - high priority with aggressive caching
  const kpiMetricsQuery = useQuery({
    queryKey: ['/api/dashboard/metrics'],
    staleTime: 300000, // Cache for 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });
  
  // Get revenue data - high priority with aggressive caching
  const revenueQuery = useQuery({
    queryKey: ['/api/dashboard/revenue'],
    staleTime: 300000, // Cache for 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });
  
  // Get activity feed - medium priority with aggressive caching
  const activitiesQuery = useQuery({
    queryKey: ['/api/dashboard/activities'],
    staleTime: 300000, // Cache for 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
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