import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import { storage } from '../storage';
import { z } from 'zod';

const router = express.Router();

// Require authentication for all HR policy routes
router.use(isAuthenticated);

// Get leave policies for the organization
router.get('/leave', async (req, res) => {
  try {
    // For development purposes, return sample leave policies
    const policies = [
      {
        id: 1,
        orgId: req.user?.organizationId,
        name: 'Standard Leave Policy',
        description: 'Default leave policy for the organization',
        policyLevel: 'Organization',
        targetId: 0,
        casualLeaveQuota: 10,
        medicalLeaveQuota: 7,
        annualLeaveQuota: 15,
        carryForwardEnabled: true,
        maxCarryForward: 5,
        active: true,
        createdBy: 1,
        createdAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 2,
        orgId: req.user?.organizationId,
        name: 'Executive Leave Policy',
        description: 'Enhanced leave policy for executives',
        policyLevel: 'Team',
        targetId: 1,
        casualLeaveQuota: 15,
        medicalLeaveQuota: 10,
        annualLeaveQuota: 20,
        carryForwardEnabled: true,
        maxCarryForward: 10,
        active: true,
        createdBy: 1,
        createdAt: '2025-01-01T00:00:00Z',
      }
    ];
    
    res.json(policies);
  } catch (error) {
    console.error('Error fetching leave policies:', error);
    res.status(500).json({ error: 'Failed to fetch leave policies' });
  }
});

// Create a new leave policy
router.post('/leave', async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      policyLevel: z.enum(['Organization', 'Department', 'Team', 'Employee']),
      targetId: z.number().int().min(0),
      casualLeaveQuota: z.number().int().min(0),
      medicalLeaveQuota: z.number().int().min(0),
      annualLeaveQuota: z.number().int().min(0),
      carryForwardEnabled: z.boolean(),
      maxCarryForward: z.number().int().min(0),
      active: z.boolean(),
    });

    const validated = schema.parse(req.body);
    
    // In a real implementation, we would save this to the database
    const newPolicy = {
      id: 3, // In a real implementation, this would be auto-generated
      orgId: req.user?.organizationId,
      ...validated,
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
    };
    
    res.status(201).json(newPolicy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      console.error('Error creating leave policy:', error);
      res.status(500).json({ error: 'Failed to create leave policy' });
    }
  }
});

// Get time tracking policies for the organization
router.get('/time-tracking', async (req, res) => {
  try {
    // For development purposes, return sample time tracking policies
    const policies = [
      {
        id: 1,
        orgId: req.user?.organizationId,
        name: 'Standard Time Tracking Policy',
        description: 'Default time tracking policy for the organization',
        policyLevel: 'Organization',
        targetId: 0,
        workHoursPerDay: 8,
        workDaysPerWeek: 5,
        flexibleHours: true,
        overtimeAllowed: true,
        maxOvertimeHours: 10,
        active: true,
        createdBy: 1,
        createdAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 2,
        orgId: req.user?.organizationId,
        name: 'Development Team Policy',
        description: 'Flexible hours for development team',
        policyLevel: 'Team',
        targetId: 2,
        workHoursPerDay: 8,
        workDaysPerWeek: 5,
        flexibleHours: true,
        overtimeAllowed: true,
        maxOvertimeHours: 20,
        active: true,
        createdBy: 1,
        createdAt: '2025-01-01T00:00:00Z',
      }
    ];
    
    res.json(policies);
  } catch (error) {
    console.error('Error fetching time tracking policies:', error);
    res.status(500).json({ error: 'Failed to fetch time tracking policies' });
  }
});

// Create a new time tracking policy
router.post('/time-tracking', async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      policyLevel: z.enum(['Organization', 'Department', 'Team', 'Employee']),
      targetId: z.number().int().min(0),
      workHoursPerDay: z.number().int().min(1).max(24),
      workDaysPerWeek: z.number().int().min(1).max(7),
      flexibleHours: z.boolean(),
      overtimeAllowed: z.boolean(),
      maxOvertimeHours: z.number().int().min(0),
      active: z.boolean(),
    });

    const validated = schema.parse(req.body);
    
    // In a real implementation, we would save this to the database
    const newPolicy = {
      id: 3, // In a real implementation, this would be auto-generated
      orgId: req.user?.organizationId,
      ...validated,
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
    };
    
    res.status(201).json(newPolicy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      console.error('Error creating time tracking policy:', error);
      res.status(500).json({ error: 'Failed to create time tracking policy' });
    }
  }
});

// Assign a policy to a department, team, or employee
router.post('/assign', async (req, res) => {
  try {
    const schema = z.object({
      policyId: z.number().int().min(1),
      targetType: z.enum(['Department', 'Team', 'Employee']),
      targetId: z.number().int().min(1),
    });

    const validated = schema.parse(req.body);
    
    // In a real implementation, we would save this to the database
    const assignment = {
      id: 1,
      policyId: validated.policyId,
      targetType: validated.targetType,
      targetId: validated.targetId,
      assignedBy: req.user?.id,
      assignedAt: new Date().toISOString(),
    };
    
    res.status(201).json(assignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      console.error('Error assigning policy:', error);
      res.status(500).json({ error: 'Failed to assign policy' });
    }
  }
});

// Get all policy assignments
router.get('/assignments', async (req, res) => {
  try {
    // For development purposes, return sample policy assignments
    const assignments = [
      {
        id: 1,
        policyId: 1,
        targetType: 'Department',
        targetId: 1,
        assignedBy: 1,
        assignedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 2,
        policyId: 2,
        targetType: 'Team',
        targetId: 2,
        assignedBy: 1,
        assignedAt: '2025-01-01T00:00:00Z',
      }
    ];
    
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching policy assignments:', error);
    res.status(500).json({ error: 'Failed to fetch policy assignments' });
  }
});

export default router;