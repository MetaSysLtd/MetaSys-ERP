import { Router } from "express";
import { z } from "zod";
import { insertTeamSchema, insertTeamMemberSchema } from "@shared/schema";
import * as teamStorage from "../teamStorage";
import { storage } from "../storage";
import { checkAuth, checkPermission } from "../middleware";
import { notifyDataChange, RealTimeEvents } from "../socket";
import { logger } from "../logger";

export function registerTeamRoutes(apiRouter: Router) {
  const teamRouter = Router();
  
  // Apply auth middleware to all team routes
  teamRouter.use(checkAuth);

  // Get all teams
  teamRouter.get("/", checkPermission(2), async (req, res) => {
    try {
      // Use the user's organization ID or fallback to a specified org ID
      const orgId = req.user?.orgId;
      
      if (!orgId) {
        return res.status(400).json({ 
          error: "Organization ID is required" 
        });
      }
      
      const teams = await teamStorage.getTeams(orgId);
      res.json(teams);
    } catch (error) {
      console.error("Error getting teams:", error);
      res.status(500).json({ 
        error: "Failed to retrieve teams" 
      });
    }
  });

  // Get a specific team
  teamRouter.get("/:id", checkPermission(2), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          error: "Invalid team ID" 
        });
      }
      
      const team = await teamStorage.getTeam(id);
      
      if (!team) {
        return res.status(404).json({ 
          error: "Team not found" 
        });
      }
      
      res.json(team);
    } catch (error) {
      console.error("Error getting team:", error);
      res.status(500).json({ 
        error: "Failed to retrieve team" 
      });
    }
  });

  // Create a team
  teamRouter.post("/", checkPermission(3), async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertTeamSchema.parse({
        ...req.body,
        orgId: req.user?.orgId
      });
      
      const team = await teamStorage.createTeam(validatedData);
      
      // Emit socket event for team creation
      notifyDataChange(
        'team', 
        team.id, 
        'created', 
        team, 
        { 
          orgId: team.orgId, 
          broadcastToOrg: true 
        }
      );
      
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid team data", 
          details: error.errors 
        });
      }
      
      console.error("Error creating team:", error);
      res.status(500).json({ 
        error: "Failed to create team" 
      });
    }
  });

  // Update a team
  teamRouter.put("/:id", checkPermission(3), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          error: "Invalid team ID" 
        });
      }
      
      const team = await teamStorage.getTeam(id);
      
      if (!team) {
        return res.status(404).json({ 
          error: "Team not found" 
        });
      }
      
      // Check if user has permission to update this team
      if (req.user?.orgId !== team.orgId && req.userRole?.level < 5) {
        return res.status(403).json({ 
          error: "You don't have permission to update this team" 
        });
      }
      
      // Update team
      const updatedTeam = await teamStorage.updateTeam(id, req.body);
      
      // Emit socket event for team update
      notifyDataChange(
        'team', 
        updatedTeam.id, 
        'updated', 
        updatedTeam, 
        { 
          orgId: updatedTeam.orgId, 
          broadcastToOrg: true 
        }
      );
      
      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ 
        error: "Failed to update team" 
      });
    }
  });

  // Delete a team
  teamRouter.delete("/:id", checkPermission(4), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          error: "Invalid team ID" 
        });
      }
      
      const team = await teamStorage.getTeam(id);
      
      if (!team) {
        return res.status(404).json({ 
          error: "Team not found" 
        });
      }
      
      // Check if user has permission to delete this team
      if (req.user?.orgId !== team.orgId && req.userRole?.level < 5) {
        return res.status(403).json({ 
          error: "You don't have permission to delete this team" 
        });
      }
      
      // Store team info before deletion for the socket event
      const teamInfo = { ...team };
      
      // First remove all team members
      await teamStorage.removeAllTeamMembers(id);
      
      // Then delete the team
      await teamStorage.deleteTeam(id);
      
      // Emit socket event for team deletion
      notifyDataChange(
        'team', 
        id, 
        'deleted', 
        teamInfo, 
        { 
          orgId: teamInfo.orgId, 
          broadcastToOrg: true 
        }
      );
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ 
        error: "Failed to delete team" 
      });
    }
  });

  // Get team members
  teamRouter.get("/:id/members", checkPermission(2), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          error: "Invalid team ID" 
        });
      }
      
      const team = await teamStorage.getTeam(id);
      
      if (!team) {
        return res.status(404).json({ 
          error: "Team not found" 
        });
      }
      
      const members = await teamStorage.getTeamMembers(id);
      res.json(members);
    } catch (error) {
      console.error("Error getting team members:", error);
      res.status(500).json({ 
        error: "Failed to retrieve team members" 
      });
    }
  });

  // Add a member to a team
  teamRouter.post("/:id/members", checkPermission(3), async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ 
          error: "Invalid team ID" 
        });
      }
      
      const team = await teamStorage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ 
          error: "Team not found" 
        });
      }
      
      // Check if user has permission to add members to this team
      if (req.user?.orgId !== team.orgId && req.userRole?.level < 5) {
        return res.status(403).json({ 
          error: "You don't have permission to add members to this team" 
        });
      }
      
      // Check if user is already in a team
      const userTeam = await teamStorage.getUserTeam(req.body.userId);
      
      if (userTeam) {
        return res.status(400).json({ 
          error: "User is already in a team" 
        });
      }
      
      // Add member to team
      const teamMember = await teamStorage.addTeamMember({
        userId: req.body.userId,
        teamId
      });
      
      // Get user info for the event
      const user = await storage.getUser(req.body.userId);
      
      // Emit socket event for team member addition
      notifyDataChange(
        'team', 
        teamId, 
        'updated', 
        { 
          team,
          action: 'member_added',
          teamMember,
          user
        }, 
        { 
          orgId: team.orgId, 
          broadcastToOrg: true,
          userId: req.body.userId
        }
      );
      
      // Also emit a specific team_member_added event
      notifyDataChange(
        'team_member', 
        teamMember.id, 
        'created', 
        { 
          teamId,
          userId: req.body.userId,
          teamName: team.name,
          userName: user?.username
        },
        {
          orgId: team.orgId,
          broadcastToOrg: true,
          userId: req.body.userId
        }
      );
      
      res.status(201).json(teamMember);
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(500).json({ 
        error: "Failed to add team member" 
      });
    }
  });

  // Remove a member from a team
  teamRouter.delete("/:teamId/members/:userId", checkPermission(3), async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(teamId) || isNaN(userId)) {
        return res.status(400).json({ 
          error: "Invalid team ID or user ID" 
        });
      }
      
      const team = await teamStorage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ 
          error: "Team not found" 
        });
      }
      
      // Check if user has permission to remove members from this team
      if (req.user?.orgId !== team.orgId && req.userRole?.level < 5) {
        return res.status(403).json({ 
          error: "You don't have permission to remove members from this team" 
        });
      }
      
      // Get user info for the event
      const user = await storage.getUser(userId);
      
      // Remove member from team
      await teamStorage.removeTeamMember(teamId, userId);
      
      // Emit socket event for team member removal
      notifyDataChange(
        'team', 
        teamId, 
        'updated', 
        { 
          team,
          action: 'member_removed',
          userId,
          user
        }, 
        { 
          orgId: team.orgId, 
          broadcastToOrg: true,
          userId 
        }
      );
      
      // Also emit a specific team_member_removed event
      notifyDataChange(
        'team_member', 
        `${teamId}_${userId}`, 
        'deleted', 
        { 
          teamId,
          userId,
          teamName: team.name,
          userName: user?.username
        },
        {
          orgId: team.orgId,
          broadcastToOrg: true,
          userId
        }
      );
      
      res.status(204).end();
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ 
        error: "Failed to remove team member" 
      });
    }
  });

  // Get available users (not in a team)
  teamRouter.get("/available-users", checkPermission(3), async (req, res) => {
    try {
      const orgId = req.user?.orgId;
      
      if (!orgId) {
        return res.status(400).json({ 
          error: "Organization ID is required" 
        });
      }
      
      const availableUsers = await teamStorage.getAvailableUsers(orgId);
      res.json(availableUsers);
    } catch (error) {
      console.error("Error getting available users:", error);
      res.status(500).json({ 
        error: "Failed to retrieve available users" 
      });
    }
  });

  // Register the team router
  apiRouter.use("/teams", teamRouter);
}