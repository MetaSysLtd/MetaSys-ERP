import { and, count, desc, eq, gt, gte, lte, sql, sum } from "drizzle-orm";
import { db } from "./db";
import { leads, loads, users } from "@shared/schema";
import { addDays, endOfWeek, format, startOfWeek, subWeeks } from "date-fns";

// Type definition for leaderboard entries
export interface LeaderboardUser {
  id: number;
  name: string;
  profileImageUrl?: string | null;
  score: number;
  leadsCount?: number;
  loadsCount?: number;
  position?: number;
}

// Type definition for week-over-week comparison
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
 * Get the sales department leaderboard
 * @param organizationId - The ID of the organization
 * @param period - The period to get data for (current or previous)
 * @returns An array of leaderboard users sorted by score
 */
export async function getSalesLeaderboard(
  organizationId: number,
  period: 'current' | 'previous' = 'current'
): Promise<LeaderboardUser[]> {
  // For demonstration purposes, return sample data
  // This data would normally come from the database
  if (period === 'current') {
    return [
      {
        id: 1,
        name: "System Administrator",
        profileImageUrl: null,
        leadsCount: 18,
        score: 90,
        position: 1
      },
      {
        id: 2,
        name: "Sarah Johnson",
        profileImageUrl: null,
        leadsCount: 15,
        score: 75,
        position: 2
      },
      {
        id: 3,
        name: "Michael Chen",
        profileImageUrl: null,
        leadsCount: 12,
        score: 60,
        position: 3
      },
      {
        id: 4,
        name: "Jessica Williams",
        profileImageUrl: null,
        leadsCount: 8,
        score: 40,
        position: 4
      },
      {
        id: 5,
        name: "David Rodriguez",
        profileImageUrl: null,
        leadsCount: 4,
        score: 20,
        position: 5
      }
    ];
  } else {
    return [
      {
        id: 1,
        name: "System Administrator",
        profileImageUrl: null,
        leadsCount: 16,
        score: 80,
        position: 1
      },
      {
        id: 3,
        name: "Michael Chen",
        profileImageUrl: null,
        leadsCount: 14,
        score: 70,
        position: 2
      },
      {
        id: 2,
        name: "Sarah Johnson",
        profileImageUrl: null,
        leadsCount: 12,
        score: 60,
        position: 3
      },
      {
        id: 5,
        name: "David Rodriguez",
        profileImageUrl: null,
        leadsCount: 10,
        score: 50,
        position: 4
      },
      {
        id: 4,
        name: "Jessica Williams",
        profileImageUrl: null,
        leadsCount: 6,
        score: 30,
        position: 5
      }
    ];
  }

  /*
  // Define the start and end dates for the period
  const now = new Date();
  const startDate = period === 'current' 
    ? startOfWeek(now, { weekStartsOn: 1 }) 
    : startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const endDate = period === 'current'
    ? endOfWeek(now, { weekStartsOn: 1 })
    : endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  // Get all the sales users and their lead counts for the period
  const results = await db
    .select({
      id: users.id,
      name: sql`concat(${users.firstName}, ' ', ${users.lastName})`,
      profileImageUrl: users.profileImageUrl,
      leadsCount: count(leads.id),
    })
    .from(users)
    .leftJoin(leads, and(
      eq(leads.assignedTo, users.id),
      gte(leads.createdAt, sql`${format(startDate, 'yyyy-MM-dd')}`),
      lte(leads.createdAt, sql`${format(endDate, 'yyyy-MM-dd')}`),
      eq(leads.status, 'HandToDispatch')
    ))
    .where(and(
      eq(users.orgId, organizationId),
      eq(users.roleId, 2) // Role ID 2 is for sales representatives
    ))
    .groupBy(users.id, users.firstName, users.lastName, users.profileImageUrl)
    .orderBy(desc(count(leads.id)));

  // Calculate the score based on lead count and position
  return results.map((user, index) => ({
    id: user.id,
    name: user.name,
    profileImageUrl: user.profileImageUrl,
    leadsCount: Number(user.leadsCount || 0),
    score: Number(user.leadsCount || 0) > 0 
      ? Number(user.leadsCount) * 10
      : 0,
    position: index + 1
  }));
  */
}

/**
 * Get the dispatch department leaderboard
 * @param organizationId - The ID of the organization
 * @param period - The period to get data for (current or previous)
 * @returns An array of leaderboard users sorted by score
 */
export async function getDispatchLeaderboard(
  organizationId: number,
  period: 'current' | 'previous' = 'current'
): Promise<LeaderboardUser[]> {
  // For demonstration purposes, return sample data
  // This data would normally come from the database
  if (period === 'current') {
    return [
      {
        id: 6,
        name: "Alex Thompson",
        profileImageUrl: null,
        loadsCount: 17,
        score: 85,
        position: 1
      },
      {
        id: 7,
        name: "Emily Martinez",
        profileImageUrl: null,
        loadsCount: 14,
        score: 70,
        position: 2
      },
      {
        id: 8,
        name: "Christopher Lee",
        profileImageUrl: null,
        loadsCount: 12,
        score: 60,
        position: 3
      },
      {
        id: 9,
        name: "Amanda Wilson",
        profileImageUrl: null,
        loadsCount: 8,
        score: 40,
        position: 4
      },
      {
        id: 10,
        name: "Daniel Garcia",
        profileImageUrl: null,
        loadsCount: 4,
        score: 20,
        position: 5
      }
    ];
  } else {
    return [
      {
        id: 7,
        name: "Emily Martinez",
        profileImageUrl: null,
        loadsCount: 16,
        score: 80,
        position: 1
      },
      {
        id: 6,
        name: "Alex Thompson",
        profileImageUrl: null,
        loadsCount: 15,
        score: 75,
        position: 2
      },
      {
        id: 8,
        name: "Christopher Lee",
        profileImageUrl: null,
        loadsCount: 13,
        score: 65,
        position: 3
      },
      {
        id: 10,
        name: "Daniel Garcia",
        profileImageUrl: null,
        loadsCount: 9,
        score: 45,
        position: 4
      },
      {
        id: 9,
        name: "Amanda Wilson",
        profileImageUrl: null,
        loadsCount: 6,
        score: 30,
        position: 5
      }
    ];
  }

  /*
  // Define the start and end dates for the period
  const now = new Date();
  const startDate = period === 'current' 
    ? startOfWeek(now, { weekStartsOn: 1 }) 
    : startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const endDate = period === 'current'
    ? endOfWeek(now, { weekStartsOn: 1 })
    : endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  // Get all the dispatch users and their load counts for the period
  const results = await db
    .select({
      id: users.id,
      name: sql`concat(${users.firstName}, ' ', ${users.lastName})`,
      profileImageUrl: users.profileImageUrl,
      loadsCount: count(loads.id),
    })
    .from(users)
    .leftJoin(loads, and(
      eq(loads.dispatcherId, users.id),
      gte(loads.createdAt, sql`${format(startDate, 'yyyy-MM-dd')}`),
      lte(loads.createdAt, sql`${format(endDate, 'yyyy-MM-dd')}`)
    ))
    .where(and(
      eq(users.orgId, organizationId),
      eq(users.roleId, 3) // Role ID 3 is for dispatch representatives
    ))
    .groupBy(users.id, users.firstName, users.lastName, users.profileImageUrl)
    .orderBy(desc(count(loads.id)));

  // Calculate the score based on load count and position
  return results.map((user, index) => ({
    id: user.id,
    name: user.name,
    profileImageUrl: user.profileImageUrl,
    loadsCount: Number(user.loadsCount || 0),
    score: Number(user.loadsCount || 0) > 0 
      ? Number(user.loadsCount) * 15
      : 0,
    position: index + 1
  }));
  */
}

/**
 * Get the combined departments leaderboard
 * @param organizationId - The ID of the organization
 * @param period - The period to get data for (current or previous)
 * @returns An array of leaderboard users sorted by score
 */
export async function getCombinedLeaderboard(
  organizationId: number,
  period: 'current' | 'previous' = 'current'
): Promise<LeaderboardUser[]> {
  // Get both sales and dispatch leaderboards
  const salesLeaderboard = await getSalesLeaderboard(organizationId, period);
  const dispatchLeaderboard = await getDispatchLeaderboard(organizationId, period);
  
  // Create a map to combine users who might be in both departments
  const combinedMap = new Map<number, LeaderboardUser>();
  
  // Add sales users to the map
  for (const user of salesLeaderboard) {
    combinedMap.set(user.id, {
      ...user,
      score: user.score,
    });
  }
  
  // Combine or add dispatch users
  for (const user of dispatchLeaderboard) {
    if (combinedMap.has(user.id)) {
      const existingUser = combinedMap.get(user.id)!;
      combinedMap.set(user.id, {
        ...existingUser,
        loadsCount: user.loadsCount,
        score: existingUser.score + user.score, // Combine the scores
      });
    } else {
      combinedMap.set(user.id, user);
    }
  }
  
  // Convert map to array and sort by score
  const combinedLeaderboard = Array.from(combinedMap.values())
    .sort((a, b) => b.score - a.score)
    .map((user, index) => ({
      ...user,
      position: index + 1,
    }));
  
  return combinedLeaderboard;
}

/**
 * Get the week-over-week comparison data
 * @param organizationId - The ID of the organization
 * @returns Week-over-week comparison data
 */
export async function getWeekOverWeekComparison(
  organizationId: number
): Promise<WeekOverWeekData> {
  // For demonstration purposes, return sample data
  // This data would normally come from the database
  return {
    thisWeek: {
      totalSalesLeads: 57,
      totalLoads: 48,
      totalCombined: 105,
      salesUsers: 5,
      dispatchUsers: 5,
    },
    prevWeek: {
      totalSalesLeads: 52,
      totalLoads: 45,
      totalCombined: 97,
      salesUsers: 5,
      dispatchUsers: 5,
    },
  };
  
  /*
  // This week's dates
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  // Previous week's dates
  const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  
  // Get this week's metrics
  const thisWeekLeads = await db
    .select({ count: count() })
    .from(leads)
    .where(and(
      gte(leads.createdAt, sql`${format(thisWeekStart, 'yyyy-MM-dd')}`),
      lte(leads.createdAt, sql`${format(thisWeekEnd, 'yyyy-MM-dd')}`),
      eq(leads.orgId, organizationId),
      eq(leads.status, 'HandToDispatch')
    ));
  
  const thisWeekLoads = await db
    .select({ count: count() })
    .from(loads)
    .where(and(
      gte(loads.createdAt, sql`${format(thisWeekStart, 'yyyy-MM-dd')}`),
      lte(loads.createdAt, sql`${format(thisWeekEnd, 'yyyy-MM-dd')}`),
      eq(loads.orgId, organizationId)
    ));
  
  const thisWeekSalesUsers = await db
    .select({ count: count() })
    .from(users)
    .where(and(
      eq(users.orgId, organizationId),
      eq(users.roleId, 2),
      eq(users.active, true)
    ));
  
  const thisWeekDispatchUsers = await db
    .select({ count: count() })
    .from(users)
    .where(and(
      eq(users.orgId, organizationId),
      eq(users.roleId, 3),
      eq(users.active, true)
    ));
  
  // Get previous week's metrics
  const prevWeekLeads = await db
    .select({ count: count() })
    .from(leads)
    .where(and(
      gte(leads.createdAt, sql`${format(prevWeekStart, 'yyyy-MM-dd')}`),
      lte(leads.createdAt, sql`${format(prevWeekEnd, 'yyyy-MM-dd')}`),
      eq(leads.orgId, organizationId),
      eq(leads.status, 'HandToDispatch')
    ));
  
  const prevWeekLoads = await db
    .select({ count: count() })
    .from(loads)
    .where(and(
      gte(loads.createdAt, sql`${format(prevWeekStart, 'yyyy-MM-dd')}`),
      lte(loads.createdAt, sql`${format(prevWeekEnd, 'yyyy-MM-dd')}`),
      eq(loads.orgId, organizationId)
    ));
  
  const prevWeekSalesUsers = await db
    .select({ count: count() })
    .from(users)
    .where(and(
      eq(users.orgId, organizationId),
      eq(users.roleId, 2),
      eq(users.active, true)
    ));
  
  const prevWeekDispatchUsers = await db
    .select({ count: count() })
    .from(users)
    .where(and(
      eq(users.orgId, organizationId),
      eq(users.roleId, 3),
      eq(users.active, true)
    ));
  
  return {
    thisWeek: {
      totalSalesLeads: Number(thisWeekLeads[0]?.count || 0),
      totalLoads: Number(thisWeekLoads[0]?.count || 0),
      totalCombined: Number(thisWeekLeads[0]?.count || 0) + Number(thisWeekLoads[0]?.count || 0),
      salesUsers: Number(thisWeekSalesUsers[0]?.count || 0),
      dispatchUsers: Number(thisWeekDispatchUsers[0]?.count || 0),
    },
    prevWeek: {
      totalSalesLeads: Number(prevWeekLeads[0]?.count || 0),
      totalLoads: Number(prevWeekLoads[0]?.count || 0),
      totalCombined: Number(prevWeekLeads[0]?.count || 0) + Number(prevWeekLoads[0]?.count || 0),
      salesUsers: Number(prevWeekSalesUsers[0]?.count || 0),
      dispatchUsers: Number(prevWeekDispatchUsers[0]?.count || 0),
    },
  };
  */
}