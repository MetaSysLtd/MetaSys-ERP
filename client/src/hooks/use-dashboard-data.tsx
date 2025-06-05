import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * CONSOLIDATED DASHBOARD DATA HOOK - PREVENTS INFINITE API LOOPS
 * Uses a single consolidated endpoint to fetch all dashboard data at once
 */
export function useDashboardData() {
  // Get user profile and permissions - highest priority
  const userProfileQuery = useQuery({
    queryKey: ['/api/auth/me'],
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });
  
  // SINGLE CONSOLIDATED DASHBOARD QUERY - ELIMINATES COMPETING QUERIES
  const consolidatedDashboardQuery = useQuery({
    queryKey: ['/api/dashboard/consolidated'],
    staleTime: 300000, // Cache for 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    enabled: !!userProfileQuery.data, // Only run after user is loaded
  });

  // Simple loading state based on critical queries only
  const isLoading = userProfileQuery.isLoading || consolidatedDashboardQuery.isLoading;
  const hasTimedOut = userProfileQuery.isError && consolidatedDashboardQuery.isError;
  
  // Extract data from consolidated response
  const dashboardData = consolidatedDashboardQuery.data || {};
  
  return {
    isLoading,
    hasTimedOut,
    userData: userProfileQuery.data,
    kpiData: dashboardData.metrics,
    revenueData: dashboardData.revenue,
    activitiesData: dashboardData.activities,
    commissionData: dashboardData.commissions,
    userProfileLoading: userProfileQuery.isLoading,
    kpiMetricsLoading: consolidatedDashboardQuery.isLoading,
    revenueLoading: consolidatedDashboardQuery.isLoading,
    activitiesLoading: consolidatedDashboardQuery.isLoading,
    commissionLoading: consolidatedDashboardQuery.isLoading,
    refetchAll: () => {
      userProfileQuery.refetch();
      consolidatedDashboardQuery.refetch();
    }
  };
}