import { Team, InsertTeam, teams, teamMembers, users, roles } from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull, not, or, inArray } from "drizzle-orm";

/**
 * Gets all teams for an organization
 */
export async function getTeams(orgId: number): Promise<Team[]> {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.orgId, orgId))
    .orderBy(teams.name);
  return result;
}

/**
 * Gets a specific team by ID
 */
export async function getTeam(id: number): Promise<Team | undefined> {
  const [result] = await db.select().from(teams).where(eq(teams.id, id));
  return result;
}

/**
 * Gets teams filtered by department for an organization
 */
export async function getTeamsByDepartment(department: string, orgId: number): Promise<Team[]> {
  const result = await db
    .select()
    .from(teams)
    .where(and(eq(teams.department, department), eq(teams.orgId, orgId)))
    .orderBy(teams.name);
  return result;
}

/**
 * Creates a new team
 */
export async function createTeam(team: InsertTeam): Promise<Team> {
  const [result] = await db.insert(teams).values(team).returning();
  return result;
}

/**
 * Updates an existing team
 */
export async function updateTeam(id: number, data: Partial<Team>): Promise<Team> {
  const [result] = await db
    .update(teams)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(teams.id, id))
    .returning();
  return result;
}

/**
 * Deletes a team
 */
export async function deleteTeam(id: number): Promise<void> {
  await db.delete(teams).where(eq(teams.id, id));
}

/**
 * Gets all members of a specific team with their user and role information
 */
export async function getTeamMembers(teamId: number): Promise<any[]> {
  const result = await db
    .select({
      id: teamMembers.id,
      userId: users.id,
      teamId: teamMembers.teamId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: {
        id: roles.id,
        name: roles.name,
        level: roles.level
      }
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(users.firstName, users.lastName);
  
  return result;
}

/**
 * Gets the team a user belongs to, if any
 */
export async function getUserTeam(userId: number): Promise<{ teamId: number } | null> {
  const [result] = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));
  
  return result || null;
}

/**
 * Adds a user to a team
 */
export async function addTeamMember(data: { userId: number; teamId: number }): Promise<any> {
  const [result] = await db
    .insert(teamMembers)
    .values(data)
    .returning();
  
  return result;
}

/**
 * Removes a user from a team
 */
export async function removeTeamMember(teamId: number, userId: number): Promise<void> {
  await db
    .delete(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      )
    );
}

/**
 * Removes all members from a team (used before deleting a team)
 */
export async function removeAllTeamMembers(teamId: number): Promise<void> {
  await db
    .delete(teamMembers)
    .where(eq(teamMembers.teamId, teamId));
}

/**
 * Gets all users that are not already in a team and can be added to teams
 */
export async function getAvailableUsers(orgId: number): Promise<any[]> {
  // Get all user IDs that are already in a team
  const usersInTeams = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers);
  
  const userIdsInTeams = usersInTeams.map(u => u.userId);
  
  // Get users not already in a team
  let query = db
    .select({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      roleId: users.roleId,
      roleName: roles.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.active, true));
  
  // Add org filter if provided
  if (orgId) {
    query = query.where(eq(users.orgId, orgId));
  }
  
  // Add filter for users not in any team
  if (userIdsInTeams.length > 0) {
    query = query.where(not(users.id.in(userIdsInTeams)));
  }
  
  const availableUsers = await query.orderBy(users.firstName, users.lastName);
  return availableUsers;
}

/**
 * Gets all members across multiple teams (for hierarchy visualization)
 */
export async function getAllTeamMembers(teamIds: number[]): Promise<any[]> {
  if (!teamIds.length) return [];
  
  const result = await db
    .select({
      id: teamMembers.id,
      userId: users.id,
      teamId: teamMembers.teamId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: {
        id: roles.id,
        name: roles.name,
        level: roles.level
      }
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(teamIds.length === 1 
      ? eq(teamMembers.teamId, teamIds[0]) 
      : inArray(teamMembers.teamId, teamIds)
    )
    .orderBy(users.firstName, users.lastName);
  
  return result;
}