import { apiRequest } from "@/lib/queryClient";

export interface LeaderboardUser {
  id: number;
  name: string;
  profileImageUrl?: string | null;
  score: number;
  leadsCount?: number;
  loadsCount?: number;
  position?: number;
}

export interface WeekOverWeekData {
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

/**
 * Fetches the sales department leaderboard
 * @returns Promise resolving to leaderboard data
 */
export async function getSalesLeaderboard(): Promise<LeaderboardUser[]> {
  const response = await apiRequest('GET', '/leaderboard/sales');
  const data = await response.json();
  return data;
}

/**
 * Fetches the dispatch department leaderboard
 * @returns Promise resolving to leaderboard data
 */
export async function getDispatchLeaderboard(): Promise<LeaderboardUser[]> {
  const response = await apiRequest('GET', '/leaderboard/dispatch');
  const data = await response.json();
  return data;
}

/**
 * Fetches the combined departments leaderboard
 * @returns Promise resolving to leaderboard data
 */
export async function getCombinedLeaderboard(): Promise<LeaderboardUser[]> {
  const response = await apiRequest('GET', '/leaderboard/combined');
  const data = await response.json();
  return data;
}

/**
 * Fetches the week-over-week comparison data
 * @returns Promise resolving to week-over-week comparison data
 */
export async function getWeekOverWeekComparison(): Promise<WeekOverWeekData> {
  const response = await apiRequest('GET', '/leaderboard/week-over-week');
  const data = await response.json();
  return data;
}