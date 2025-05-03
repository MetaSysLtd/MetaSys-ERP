import { db } from './db';
import { sql, eq, and, desc, count, sum } from 'drizzle-orm';
import { 
  users, 
  leads, 
  loads,
  roles
} from '@shared/schema';
import { 
  startOfWeek, 
  endOfWeek, 
  format,
  subWeeks
} from 'date-fns';

/**
 * Gets the weekly leaderboard for Sales team based on leads closed
 * @param orgId - Organization ID
 * @param date - Date within the week to calculate leaderboard for (defaults to current week)
 * @returns Array of sales reps with their performance metrics
 */
export async function getSalesLeaderboard(orgId: number, date: Date = new Date()) {
  // Calculate week boundaries
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
  
  try {
    // Get all users in the sales department
    const salesUsers = await db.select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      profileImageUrl: users.profileImageUrl
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(
      and(
        eq(roles.department, 'sales'),
        orgId ? eq(users.orgId, orgId) : sql`true`
      )
    );
    
    // For each sales user, calculate their lead stats
    const leaderboardResults = await Promise.all(
      salesUsers.map(async (user) => {
        // Count total leads assigned
        const totalLeadsAssigned = await db.select({
          count: count(leads.id)
        })
        .from(leads)
        .where(
          and(
            eq(leads.assignedTo, user.userId),
            orgId ? eq(leads.orgId, orgId) : sql`true`
          )
        );
        
        // Count leads closed this week
        const leadsClosedThisWeek = await db.select({
          count: count(leads.id)
        })
        .from(leads)
        .where(
          and(
            eq(leads.assignedTo, user.userId),
            eq(leads.status, 'Closed'),
            sql`${leads.updatedAt} >= ${weekStart}`,
            sql`${leads.updatedAt} <= ${weekEnd}`,
            orgId ? eq(leads.orgId, orgId) : sql`true`
          )
        );
        
        // Count active leads converted to customers this week
        const leadsConvertedThisWeek = await db.select({
          count: count(leads.id)
        })
        .from(leads)
        .where(
          and(
            eq(leads.assignedTo, user.userId),
            eq(leads.status, 'Active'),
            sql`${leads.updatedAt} >= ${weekStart}`,
            sql`${leads.updatedAt} <= ${weekEnd}`,
            orgId ? eq(leads.orgId, orgId) : sql`true`
          )
        );
        
        return {
          userId: user.userId,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
          totalLeadsAssigned: totalLeadsAssigned[0]?.count || 0,
          leadsClosedThisWeek: leadsClosedThisWeek[0]?.count || 0,
          leadsConvertedThisWeek: leadsConvertedThisWeek[0]?.count || 0,
          // Combined score for ranking (converts + closes)
          performanceScore: (leadsConvertedThisWeek[0]?.count || 0) * 2 + (leadsClosedThisWeek[0]?.count || 0)
        };
      })
    );
    
    // Sort by performance score
    return leaderboardResults.sort((a, b) => b.performanceScore - a.performanceScore);
  } catch (error) {
    console.error('Error getting sales leaderboard:', error);
    throw error;
  }
}

/**
 * Gets the weekly leaderboard for Dispatch team based on loads booked
 * @param orgId - Organization ID
 * @param date - Date within the week to calculate leaderboard for (defaults to current week)
 * @returns Array of dispatchers with their performance metrics
 */
export async function getDispatchLeaderboard(orgId: number, date: Date = new Date()) {
  // Calculate week boundaries
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
  
  try {
    // Get all users in the dispatch department
    const dispatchUsers = await db.select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      profileImageUrl: users.profileImageUrl
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(
      and(
        eq(roles.department, 'dispatch'),
        orgId ? eq(users.orgId, orgId) : sql`true`
      )
    );
    
    // For each dispatch user, calculate their load stats
    const leaderboardResults = await Promise.all(
      dispatchUsers.map(async (user) => {
        // Count total loads assigned
        const totalLoadsAssigned = await db.select({
          count: count(loads.id)
        })
        .from(loads)
        .where(
          and(
            eq(loads.assignedTo, user.userId),
            orgId ? eq(loads.orgId, orgId) : sql`true`
          )
        );
        
        // Count loads booked this week
        const loadsBookedThisWeek = await db.select({
          count: count(loads.id)
        })
        .from(loads)
        .where(
          and(
            eq(loads.assignedTo, user.userId),
            eq(loads.status, 'booked'),
            sql`${loads.createdAt} >= ${weekStart}`,
            sql`${loads.createdAt} <= ${weekEnd}`,
            orgId ? eq(loads.orgId, orgId) : sql`true`
          )
        );
        
        // Calculate total revenue from loads this week
        const revenueThisWeek = await db.select({
          total: sum(loads.freightAmount)
        })
        .from(loads)
        .where(
          and(
            eq(loads.assignedTo, user.userId),
            sql`${loads.createdAt} >= ${weekStart}`,
            sql`${loads.createdAt} <= ${weekEnd}`,
            orgId ? eq(loads.orgId, orgId) : sql`true`
          )
        );
        
        return {
          userId: user.userId,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
          totalLoadsAssigned: totalLoadsAssigned[0]?.count || 0,
          loadsBookedThisWeek: loadsBookedThisWeek[0]?.count || 0,
          revenueThisWeek: revenueThisWeek[0]?.total || 0,
          // Performance score is 50% loads booked + 50% revenue (normalized to make them comparable)
          performanceScore: (loadsBookedThisWeek[0]?.count || 0) * 1000 + (revenueThisWeek[0]?.total || 0) / 100
        };
      })
    );
    
    // Sort by performance score
    return leaderboardResults.sort((a, b) => b.performanceScore - a.performanceScore);
  } catch (error) {
    console.error('Error getting dispatch leaderboard:', error);
    throw error;
  }
}

/**
 * Gets the combined weekly leaderboard for all departments
 * For comparing overall performance across departments
 * @param orgId - Organization ID
 * @param date - Date within the week to calculate leaderboard for (defaults to current week)
 * @returns Combined array of sales and dispatch users with normalized scores
 */
export async function getCombinedLeaderboard(orgId: number, date: Date = new Date()) {
  try {
    const salesLeaderboard = await getSalesLeaderboard(orgId, date);
    const dispatchLeaderboard = await getDispatchLeaderboard(orgId, date);
    
    // Normalize scores to make them comparable
    const maxSalesScore = Math.max(...salesLeaderboard.map(item => item.performanceScore));
    const maxDispatchScore = Math.max(...dispatchLeaderboard.map(item => item.performanceScore));
    
    const normalizedSales = salesLeaderboard.map(item => ({
      ...item,
      department: 'sales',
      normalizedScore: maxSalesScore > 0 ? (item.performanceScore / maxSalesScore) * 100 : 0
    }));
    
    const normalizedDispatch = dispatchLeaderboard.map(item => ({
      ...item,
      department: 'dispatch',
      normalizedScore: maxDispatchScore > 0 ? (item.performanceScore / maxDispatchScore) * 100 : 0
    }));
    
    // Combine and sort
    return [...normalizedSales, ...normalizedDispatch]
      .sort((a, b) => b.normalizedScore - a.normalizedScore);
  } catch (error) {
    console.error('Error getting combined leaderboard:', error);
    throw error;
  }
}

/**
 * Gets comparison between current week and previous week
 * Useful for showing trends in performance
 * @param orgId - Organization ID
 * @returns Object with this week and previous week data
 */
export async function getWeekOverWeekComparison(orgId: number) {
  const currentDate = new Date();
  const previousWeekDate = subWeeks(currentDate, 1);
  
  try {
    const thisWeekSales = await getSalesLeaderboard(orgId, currentDate);
    const lastWeekSales = await getSalesLeaderboard(orgId, previousWeekDate);
    const thisWeekDispatch = await getDispatchLeaderboard(orgId, currentDate);
    const lastWeekDispatch = await getDispatchLeaderboard(orgId, previousWeekDate);
    
    // Calculate team totals
    const thisWeekSalesTotal = thisWeekSales.reduce((sum, item) => sum + item.leadsClosedThisWeek, 0);
    const lastWeekSalesTotal = lastWeekSales.reduce((sum, item) => sum + item.leadsClosedThisWeek, 0);
    const thisWeekDispatchTotal = thisWeekDispatch.reduce((sum, item) => sum + item.loadsBookedThisWeek, 0);
    const lastWeekDispatchTotal = lastWeekDispatch.reduce((sum, item) => sum + item.loadsBookedThisWeek, 0);
    
    // Calculate growth percentages
    const salesGrowth = lastWeekSalesTotal > 0 
      ? ((thisWeekSalesTotal - lastWeekSalesTotal) / lastWeekSalesTotal) * 100 
      : 0;
    
    const dispatchGrowth = lastWeekDispatchTotal > 0 
      ? ((thisWeekDispatchTotal - lastWeekDispatchTotal) / lastWeekDispatchTotal) * 100 
      : 0;
    
    return {
      sales: {
        thisWeek: {
          total: thisWeekSalesTotal,
          topPerformers: thisWeekSales.slice(0, 3) // Top 3
        },
        lastWeek: {
          total: lastWeekSalesTotal,
          topPerformers: lastWeekSales.slice(0, 3) // Top 3
        },
        growth: salesGrowth
      },
      dispatch: {
        thisWeek: {
          total: thisWeekDispatchTotal,
          topPerformers: thisWeekDispatch.slice(0, 3) // Top 3
        },
        lastWeek: {
          total: lastWeekDispatchTotal,
          topPerformers: lastWeekDispatch.slice(0, 3) // Top 3
        },
        growth: dispatchGrowth
      }
    };
  } catch (error) {
    console.error('Error getting week-over-week comparison:', error);
    throw error;
  }
}