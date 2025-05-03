import { apiRequest } from "@/lib/queryClient";

// Types for leaderboard data
export interface LeaderboardEntry {
  userId: number;
  firstName: string;
  lastName: string;
  department: string;
  metric: number;
  secondaryMetric: number;
  rank: number;
  change: number;  // change in rank from previous week
  avatar?: string;
}

export interface WeeklyComparisonData {
  thisWeek: {
    totalLeads: number;
    totalLoads: number;
    closedLeads: number;
    completedLoads: number;
    newLeads: number;
    cancelledLoads: number;
  };
  lastWeek: {
    totalLeads: number;
    totalLoads: number;
    closedLeads: number;
    completedLoads: number;
    newLeads: number;
    cancelledLoads: number;
  };
  changes: {
    totalLeads: number;
    totalLoads: number;
    closedLeads: number;
    completedLoads: number;
    newLeads: number;
    cancelledLoads: number;
  };
}

/**
 * Fetches the sales leaderboard data for the specified date (week)
 * @param date - Date within the week to get leaderboard for
 * @returns Promise with sales leaderboard data
 */
export async function getSalesLeaderboard(date?: Date): Promise<LeaderboardEntry[]> {
  try {
    const dateParam = date ? `?date=${date.toISOString()}` : '';
    const response = await apiRequest('GET', `/api/leaderboard/sales${dateParam}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching sales leaderboard:', error);
    throw error;
  }
}

/**
 * Fetches the dispatch leaderboard data for the specified date (week)
 * @param date - Date within the week to get leaderboard for
 * @returns Promise with dispatch leaderboard data
 */
export async function getDispatchLeaderboard(date?: Date): Promise<LeaderboardEntry[]> {
  try {
    const dateParam = date ? `?date=${date.toISOString()}` : '';
    const response = await apiRequest('GET', `/api/leaderboard/dispatch${dateParam}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching dispatch leaderboard:', error);
    throw error;
  }
}

/**
 * Fetches the combined leaderboard data for the specified date (week)
 * @param date - Date within the week to get leaderboard for
 * @returns Promise with combined leaderboard data
 */
export async function getCombinedLeaderboard(date?: Date): Promise<LeaderboardEntry[]> {
  try {
    const dateParam = date ? `?date=${date.toISOString()}` : '';
    const response = await apiRequest('GET', `/api/leaderboard/combined${dateParam}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching combined leaderboard:', error);
    throw error;
  }
}

/**
 * Fetches week-over-week comparison data
 * @returns Promise with comparison data
 */
export async function getWeekComparison(): Promise<WeeklyComparisonData> {
  try {
    const response = await apiRequest('GET', '/api/leaderboard/week-comparison');
    return await response.json();
  } catch (error) {
    console.error('Error fetching week comparison data:', error);
    throw error;
  }
}