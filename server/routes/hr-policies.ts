import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = express.Router();

// Authentication is handled at the API router level
// Don't need to add it again here

// Get leave policies
router.get('/leave', async (req, res) => {
  try {
    // For now, return some sample leave policies
    const policies = [
      {
        id: 1,
        orgId: req.user?.orgId,
        name: 'Standard Leave Policy',
        description: 'Default leave policy for all employees',
        policyLevel: 'Organization',
        targetId: req.user?.orgId,
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
        orgId: req.user?.orgId,
        name: 'Executive Leave Policy',
        description: 'Leave policy for executive staff',
        policyLevel: 'Team',
        targetId: 3, // Executive team ID
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
      description: z.string(),
      policyLevel: z.enum(['Organization', 'Department', 'Team', 'Employee']),
      targetId: z.number(),
      casualLeaveQuota: z.number().min(0),
      medicalLeaveQuota: z.number().min(0),
      annualLeaveQuota: z.number().min(0),
      carryForwardEnabled: z.boolean(),
      maxCarryForward: z.number().min(0),
      active: z.boolean().default(true),
    });
    
    const validated = schema.parse(req.body);
    
    const newPolicy = {
      id: 3, // In a real implementation, this would be auto-generated
      orgId: req.user?.orgId,
      ...validated,
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
    };
    
    // In a real implementation, you would save this to the database
    
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

// Update a leave policy
router.patch('/leave/:id', async (req, res) => {
  try {
    const policyId = parseInt(req.params.id);
    
    // In a real implementation, you would fetch the policy and check if it exists
    const existingPolicy = {
      id: policyId,
      orgId: req.user?.orgId,
      name: 'Standard Leave Policy',
      description: 'Default leave policy for all employees',
      policyLevel: 'Organization',
      targetId: req.user?.orgId,
      casualLeaveQuota: 10,
      medicalLeaveQuota: 7,
      annualLeaveQuota: 15,
      carryForwardEnabled: true,
      maxCarryForward: 5,
      active: true,
      createdBy: 1,
      createdAt: '2025-01-01T00:00:00Z',
    };
    
    const updatedPolicy = {
      ...existingPolicy,
      ...req.body,
      updatedBy: req.user?.id,
      updatedAt: new Date().toISOString(),
    };
    
    // In a real implementation, you would update the database record
    
    res.json(updatedPolicy);
  } catch (error) {
    console.error('Error updating leave policy:', error);
    res.status(500).json({ error: 'Failed to update leave policy' });
  }
});

// Delete a leave policy
router.delete('/leave/:id', async (req, res) => {
  try {
    const policyId = parseInt(req.params.id);
    
    // In a real implementation, you would check if the policy exists and delete it
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting leave policy:', error);
    res.status(500).json({ error: 'Failed to delete leave policy' });
  }
});

// Get time tracking policies
router.get('/time-tracking', async (req, res) => {
  try {
    // For now, return some sample time tracking policies
    const policies = [
      {
        id: 1,
        orgId: req.user?.orgId,
        name: 'Standard Work Hours',
        description: 'Default work hours policy for all employees',
        policyLevel: 'Organization',
        targetId: req.user?.orgId,
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
        orgId: req.user?.orgId,
        name: 'Development Team Hours',
        description: 'Work hours policy for development team',
        policyLevel: 'Team',
        targetId: 2, // Development team ID
        workHoursPerDay: 8,
        workDaysPerWeek: 5,
        flexibleHours: true,
        overtimeAllowed: true,
        maxOvertimeHours: 15,
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
      description: z.string(),
      policyLevel: z.enum(['Organization', 'Department', 'Team', 'Employee']),
      targetId: z.number(),
      workHoursPerDay: z.number().min(1).max(24),
      workDaysPerWeek: z.number().min(1).max(7),
      flexibleHours: z.boolean(),
      overtimeAllowed: z.boolean(),
      maxOvertimeHours: z.number().min(0),
      active: z.boolean().default(true),
    });
    
    const validated = schema.parse(req.body);
    
    const newPolicy = {
      id: 3, // In a real implementation, this would be auto-generated
      orgId: req.user?.orgId,
      ...validated,
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
    };
    
    // In a real implementation, you would save this to the database
    
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

// Update a time tracking policy
router.patch('/time-tracking/:id', async (req, res) => {
  try {
    const policyId = parseInt(req.params.id);
    
    // In a real implementation, you would fetch the policy and check if it exists
    const existingPolicy = {
      id: policyId,
      orgId: req.user?.orgId,
      name: 'Standard Work Hours',
      description: 'Default work hours policy for all employees',
      policyLevel: 'Organization',
      targetId: req.user?.orgId,
      workHoursPerDay: 8,
      workDaysPerWeek: 5,
      flexibleHours: true,
      overtimeAllowed: true,
      maxOvertimeHours: 10,
      active: true,
      createdBy: 1,
      createdAt: '2025-01-01T00:00:00Z',
    };
    
    const updatedPolicy = {
      ...existingPolicy,
      ...req.body,
      updatedBy: req.user?.id,
      updatedAt: new Date().toISOString(),
    };
    
    // In a real implementation, you would update the database record
    
    res.json(updatedPolicy);
  } catch (error) {
    console.error('Error updating time tracking policy:', error);
    res.status(500).json({ error: 'Failed to update time tracking policy' });
  }
});

// Delete a time tracking policy
router.delete('/time-tracking/:id', async (req, res) => {
  try {
    const policyId = parseInt(req.params.id);
    
    // In a real implementation, you would check if the policy exists and delete it
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting time tracking policy:', error);
    res.status(500).json({ error: 'Failed to delete time tracking policy' });
  }
});

// Get policy assignments
router.get('/assignments', async (req, res) => {
  try {
    // For now, return some sample policy assignments
    const assignments = [
      {
        id: 1,
        orgId: req.user?.orgId,
        policyId: 1,
        policyType: 'leave',
        assigneeType: 'Department',
        assigneeId: 1,
        assigneeName: 'Sales',
        assignedBy: 1,
        assignedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 2,
        orgId: req.user?.orgId,
        policyId: 2,
        policyType: 'time-tracking',
        assigneeType: 'Team',
        assigneeId: 3,
        assigneeName: 'Executive Team',
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

// Assign a policy
router.post('/assign', async (req, res) => {
  try {
    const schema = z.object({
      policyId: z.number(),
      policyType: z.enum(['leave', 'time-tracking']),
      assigneeType: z.enum(['Organization', 'Department', 'Team', 'Employee']),
      assigneeId: z.number(),
      assigneeName: z.string(),
    });
    
    const validated = schema.parse(req.body);
    
    const newAssignment = {
      id: 3, // In a real implementation, this would be auto-generated
      orgId: req.user?.orgId,
      ...validated,
      assignedBy: req.user?.id,
      assignedAt: new Date().toISOString(),
    };
    
    // In a real implementation, you would save this to the database
    
    res.status(201).json(newAssignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      console.error('Error assigning policy:', error);
      res.status(500).json({ error: 'Failed to assign policy' });
    }
  }
});

// Remove a policy assignment
router.delete('/assignments/:id', async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    
    // In a real implementation, you would check if the assignment exists and delete it
    
    res.status(204).end();
  } catch (error) {
    console.error('Error removing policy assignment:', error);
    res.status(500).json({ error: 'Failed to remove policy assignment' });
  }
});

export default router;