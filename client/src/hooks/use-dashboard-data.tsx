import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from './use-socket';

/**
 * CONSOLIDATED DASHBOARD DATA HOOK - PREVENTS INFINITE API LOOPS
 * Uses a single consolidated endpoint to fetch all dashboard data at once
 */
export function useDashboardData() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Get user profile and permissions - highest priority
  const userProfileQuery = useQuery({
    queryKey: ['/api/auth/me'],
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });
  
  // SINGLE CONSOLIDATED DASHBOARD QUERY - WITH REAL-TIME UPDATES
  const consolidatedDashboardQuery = useQuery({
    queryKey: ['/api/dashboard/consolidated'],
    staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity
    gcTime: 10 * 60 * 1000, // 10 minutes instead of Infinity
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: false, // Don't retry to prevent loops
    enabled: !!userProfileQuery.data, // Only run after user is loaded
  });

  // Real-time socket subscriptions for dashboard updates
  useEffect(() => {
    if (!socket) return;

    const handleDataUpdate = () => {
      // Invalidate dashboard queries for fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/consolidated'] });
    };

    // Subscribe to all real-time events that affect dashboard data
    socket.on('lead:created', handleDataUpdate);
    socket.on('lead:updated', handleDataUpdate);
    socket.on('lead:deleted', handleDataUpdate);
    socket.on('dispatch:created', handleDataUpdate);
    socket.on('dispatch:updated', handleDataUpdate);
    socket.on('dispatch:deleted', handleDataUpdate);
    socket.on('invoice:created', handleDataUpdate);
    socket.on('invoice:updated', handleDataUpdate);
    socket.on('commission:calculated', handleDataUpdate);
    socket.on('policy:created', handleDataUpdate);
    socket.on('data:updated', handleDataUpdate);

    return () => {
      socket.off('lead:created', handleDataUpdate);
      socket.off('lead:updated', handleDataUpdate);
      socket.off('lead:deleted', handleDataUpdate);
      socket.off('dispatch:created', handleDataUpdate);
      socket.off('dispatch:updated', handleDataUpdate);
      socket.off('dispatch:deleted', handleDataUpdate);
      socket.off('invoice:created', handleDataUpdate);
      socket.off('invoice:updated', handleDataUpdate);
      socket.off('commission:calculated', handleDataUpdate);
      socket.off('policy:created', handleDataUpdate);
      socket.off('data:updated', handleDataUpdate);
    };
  }, [socket, queryClient]);

  // Simple loading state based on critical queries only
  const isLoading = userProfileQuery.isLoading || consolidatedDashboardQuery.isLoading;
  const hasTimedOut = userProfileQuery.isError && consolidatedDashboardQuery.isError;
  
  // Extract data from consolidated response with proper type safety
  const dashboardData = consolidatedDashboardQuery.data as any || {};
  
  return {
    isLoading,
    hasTimedOut,
    userData: userProfileQuery.data,
    kpiData: dashboardData.metrics || {},
    revenueData: dashboardData.revenue || {},
    activitiesData: dashboardData.activities || [],
    commissionData: dashboardData.commissions || { monthlyData: { current: null, previous: null } },
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