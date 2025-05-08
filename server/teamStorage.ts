import { and, eq, sql } from "drizzle-orm";
import { 
  teams, teamMembers, users, roles, 
  type Team, type InsertTeam, type TeamMember, type InsertTeamMember, type User
} from "@shared/schema";
import { db } from './db';

// Team Management Methods
export async function getTeams(orgId: number): Promise<Team[]> {
  try {
    return await db.select()
      .from(teams)
      .where(eq(teams.orgId, orgId))
      .orderBy(teams.name);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
}

export async function getTeam(id: number): Promise<Team | undefined> {
  try {
    const [team] = await db.select()
      .from(teams)
      .where(eq(teams.id, id));
    
    return team;
  } catch (error) {
    console.error(`Error fetching team ${id}:`, error);
    return undefined;
  }
}

export async function getTeamsByDepartment(department: string, orgId: number): Promise<Team[]> {
  try {
    return await db.select()
      .from(teams)
      .where(
        and(
          eq(teams.department, department),
          eq(teams.orgId, orgId)
        )
      )
      .orderBy(teams.name);
  } catch (error) {
    console.error(`Error fetching teams by department ${department}:`, error);
    return [];
  }
}

export async function createTeam(team: InsertTeam): Promise<Team> {
  try {
    const [newTeam] = await db.insert(teams)
      .values({
        ...team,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return newTeam;
  } catch (error) {
    console.error("Error creating team:", error);
    throw error;
  }
}

export async function updateTeam(id: number, data: Partial<Team>): Promise<Team> {
  try {
    const [updatedTeam] = await db.update(teams)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(teams.id, id))
      .returning();
      
    return updatedTeam;
  } catch (error) {
    console.error(`Error updating team ${id}:`, error);
    throw error;
  }
}

export async function deleteTeam(id: number): Promise<void> {
  try {
    await db.delete(teams)
      .where(eq(teams.id, id));
  } catch (error) {
    console.error(`Error deleting team ${id}:`, error);
    throw error;
  }
}

export async function getTeamMembers(teamId: number): Promise<any[]> {
  try {
    // Join team_members with users and roles to get full user information
    const members = await db.select({
      id: teamMembers.id,
      userId: teamMembers.userId,
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
    .where(eq(teamMembers.teamId, teamId));
    
    return members;
  } catch (error) {
    console.error(`Error fetching team members for team ${teamId}:`, error);
    return [];
  }
}

export async function getUserTeam(userId: number): Promise<{ teamId: number } | null> {
  try {
    const [userTeam] = await db.select({
      teamId: teamMembers.teamId
    })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));
    
    return userTeam || null;
  } catch (error) {
    console.error(`Error fetching team for user ${userId}:`, error);
    return null;
  }
}

export async function addTeamMember(data: { userId: number; teamId: number }): Promise<any> {
  try {
    // Check if the user is already in another team
    const existingMembership = await getUserTeam(data.userId);
    
    if (existingMembership) {
      throw new Error(`User already belongs to team ${existingMembership.teamId}`);
    }
    
    // Add the user to the team
    const [teamMember] = await db.insert(teamMembers)
      .values({
        userId: data.userId,
        teamId: data.teamId,
        createdAt: new Date()
      })
      .returning();
      
    return teamMember;
  } catch (error) {
    console.error(`Error adding user ${data.userId} to team ${data.teamId}:`, error);
    throw error;
  }
}

export async function removeTeamMember(teamId: number, userId: number): Promise<void> {
  try {
    await db.delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      );
  } catch (error) {
    console.error(`Error removing user ${userId} from team ${teamId}:`, error);
    throw error;
  }
}

export async function removeAllTeamMembers(teamId: number): Promise<void> {
  try {
    await db.delete(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
  } catch (error) {
    console.error(`Error removing all members from team ${teamId}:`, error);
    throw error;
  }
}

export async function getAvailableUsers(orgId: number): Promise<User[]> {
  try {
    // Get users that are in the organization but not in any team
    const availableUsers = await db.select()
      .from(users)
      .where(
        and(
          eq(users.orgId, orgId),
          sql`NOT EXISTS (
            SELECT 1 FROM ${teamMembers} 
            WHERE ${teamMembers.userId} = ${users.id}
          )`
        )
      );
    
    return availableUsers;
  } catch (error) {
    console.error("Error fetching available users:", error);
    return [];
  }
}