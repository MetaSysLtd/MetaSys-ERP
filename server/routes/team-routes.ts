import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { createInsertSchema } from 'drizzle-zod';
import { teams } from '@shared/schema';
import { checkAuth, checkPermission } from '../middleware';

// Create insert schema for validation
const insertTeamSchema = createInsertSchema(teams);

export function registerTeamRoutes(apiRouter: Router) {
  const teamRouter = Router();
  
  // All team routes require authentication
  teamRouter.use(checkAuth);
  
  // Get all teams for current organization
  teamRouter.get('/', async (req, res) => {
    try {
      // Users need at least role level 1 to view teams
      if (!req.userRole || req.userRole.level < 1) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      const orgId = req.user?.orgId || 1; // Default to org 1 if not set
      const teams = await storage.getTeams(orgId);
      
      res.json(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ error: 'Failed to fetch teams' });
    }
  });
  
  // Get team by ID
  teamRouter.get('/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid team ID' });
      }
      
      const team = await storage.getTeam(id);
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      
      res.json(team);
    } catch (error) {
      console.error(`Error fetching team ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch team' });
    }
  });
  
  // Create a new team
  teamRouter.post('/', checkPermission(2), async (req, res) => {
    try {
      // Minimum level 2 required to create teams
      if (!req.userRole || req.userRole.level < 2) {
        return res.status(403).json({ error: 'Insufficient permissions to create teams' });
      }
      
      const orgId = req.user?.orgId || 1;
      
      // Validate request body
      const validatedData = insertTeamSchema.parse({
        ...req.body,
        orgId
      });
      
      const newTeam = await storage.createTeam(validatedData);
      
      res.status(201).json(newTeam);
    } catch (error) {
      console.error('Error creating team:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid team data', 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: 'Failed to create team' });
    }
  });
  
  // Update a team
  teamRouter.put('/:id', checkPermission(2), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid team ID' });
      }
      
      // Check if team exists
      const team = await storage.getTeam(id);
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      
      // Minimum level 2 required to update teams
      if (!req.userRole || req.userRole.level < 2) {
        return res.status(403).json({ error: 'Insufficient permissions to update teams' });
      }
      
      // Validate request body
      const updatedTeam = await storage.updateTeam(id, req.body);
      
      res.json(updatedTeam);
    } catch (error) {
      console.error(`Error updating team ${req.params.id}:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid team data', 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: 'Failed to update team' });
    }
  });
  
  // Delete a team
  teamRouter.delete('/:id', checkPermission(2), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid team ID' });
      }
      
      // Check if team exists
      const team = await storage.getTeam(id);
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      
      // Minimum level 2 required to delete teams
      if (!req.userRole || req.userRole.level < 2) {
        return res.status(403).json({ error: 'Insufficient permissions to delete teams' });
      }
      
      // Remove all team members first
      await storage.removeAllTeamMembers(id);
      
      // Delete the team
      await storage.deleteTeam(id);
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting team ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete team' });
    }
  });
  
  // Get team members
  teamRouter.get('/:id/members', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid team ID' });
      }
      
      // Check if team exists
      const team = await storage.getTeam(id);
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      
      const members = await storage.getTeamMembers(id);
      
      res.json(members);
    } catch (error) {
      console.error(`Error fetching team members for team ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch team members' });
    }
  });
  
  // Add user to team
  teamRouter.post('/:id/members', checkPermission(2), async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const userId = parseInt(req.body.userId);
      
      if (isNaN(teamId) || isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid team ID or user ID' });
      }
      
      // Check if team exists
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      
      // Minimum level 2 required to manage team members
      if (!req.userRole || req.userRole.level < 2) {
        return res.status(403).json({ error: 'Insufficient permissions to manage team members' });
      }
      
      // Check if user is already in a team
      const userTeam = await storage.getUserTeam(userId);
      
      if (userTeam) {
        return res.status(409).json({ 
          error: 'User already belongs to a team', 
          teamId: userTeam.teamId 
        });
      }
      
      // Add user to team
      const teamMember = await storage.addTeamMember({ userId, teamId });
      
      res.status(201).json(teamMember);
    } catch (error) {
      console.error(`Error adding user to team ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to add user to team' });
    }
  });
  
  // Remove user from team
  teamRouter.delete('/:teamId/members/:userId', checkPermission(2), async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(teamId) || isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid team ID or user ID' });
      }
      
      // Check if team exists
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      
      // Minimum level 2 required to manage team members
      if (!req.userRole || req.userRole.level < 2) {
        return res.status(403).json({ error: 'Insufficient permissions to manage team members' });
      }
      
      // Remove user from team
      await storage.removeTeamMember(teamId, userId);
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error removing user ${req.params.userId} from team ${req.params.teamId}:`, error);
      res.status(500).json({ error: 'Failed to remove user from team' });
    }
  });
  
  // Get users available for team assignment (users not in any team)
  teamRouter.get('/available-users', checkPermission(2), async (req, res) => {
    try {
      const orgId = req.user?.orgId || 1;
      
      // Minimum level 2 required to view available users
      if (!req.userRole || req.userRole.level < 2) {
        return res.status(403).json({ error: 'Insufficient permissions to view available users' });
      }
      
      const availableUsers = await storage.getAvailableUsers(orgId);
      
      res.json(availableUsers);
    } catch (error) {
      console.error('Error fetching available users:', error);
      res.status(500).json({ error: 'Failed to fetch available users' });
    }
  });
  
  // Register team routes
  apiRouter.use('/teams', teamRouter);
}