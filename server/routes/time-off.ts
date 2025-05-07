import express from 'express';
import { createAuthMiddleware } from '../middleware/auth';
import { storage } from '../storage';
import { z } from 'zod';

const router = express.Router();

// Require authentication for all time-off routes
router.use(isAuthenticated);

// Get leave requests for the current user
router.get('/requests', async (req, res) => {
  try {
    // For now, return some sample leave requests
    const requests = [
      {
        id: 1,
        userId: req.user?.id,
        orgId: req.user?.organizationId,
        leaveType: 'Casual',
        startDate: '2025-05-15',
        endDate: '2025-05-17',
        totalDays: 3,
        reason: 'Personal matters',
        status: 'Pending',
        createdAt: '2025-05-03T12:00:00Z',
      },
      {
        id: 2,
        userId: req.user?.id,
        orgId: req.user?.organizationId,
        leaveType: 'Medical',
        startDate: '2025-04-10',
        endDate: '2025-04-15',
        totalDays: 6,
        reason: 'Medical appointment',
        status: 'Approved',
        createdAt: '2025-04-01T10:30:00Z',
        approvedBy: 1,
        approvedAt: '2025-04-02T14:00:00Z',
      }
    ];
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// Create a new leave request
router.post('/requests', async (req, res) => {
  try {
    const schema = z.object({
      leaveType: z.string(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      reason: z.string().min(1),
    });

    const validated = schema.parse(req.body);
    
    // Calculate days between start and end date
    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const newRequest = {
      id: 3, // In a real implementation, this would be auto-generated
      userId: req.user?.id,
      orgId: req.user?.organizationId,
      leaveType: validated.leaveType,
      startDate: validated.startDate,
      endDate: validated.endDate,
      totalDays,
      reason: validated.reason,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    
    // In a real implementation, you would save this to the database
    
    res.status(201).json(newRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      console.error('Error creating leave request:', error);
      res.status(500).json({ error: 'Failed to create leave request' });
    }
  }
});

// Update a leave request status
router.patch('/requests/:id', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { status, rejectionReason } = req.body;
    
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // In a real implementation, you would update the database record
    
    const updatedRequest = {
      id: requestId,
      userId: req.user?.id,
      orgId: req.user?.organizationId,
      leaveType: 'Casual',
      startDate: '2025-05-15',
      endDate: '2025-05-17',
      totalDays: 3,
      reason: 'Personal matters',
      status,
      createdAt: '2025-05-03T12:00:00Z',
    };
    
    if (status === 'Approved') {
      Object.assign(updatedRequest, {
        approvedBy: req.user?.id,
        approvedAt: new Date().toISOString(),
      });
    } else if (status === 'Rejected') {
      Object.assign(updatedRequest, {
        rejectedBy: req.user?.id,
        rejectedAt: new Date().toISOString(),
        rejectionReason,
      });
    }
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ error: 'Failed to update leave request' });
  }
});

// Cancel a leave request
router.post('/requests/:id/cancel', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    
    // In a real implementation, you would update the database record to Cancelled status
    
    const cancelledRequest = {
      id: requestId,
      userId: req.user?.id,
      orgId: req.user?.organizationId,
      leaveType: 'Casual',
      startDate: '2025-05-15',
      endDate: '2025-05-17',
      totalDays: 3,
      reason: 'Personal matters',
      status: 'Cancelled',
      createdAt: '2025-05-03T12:00:00Z',
    };
    
    res.json(cancelledRequest);
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    res.status(500).json({ error: 'Failed to cancel leave request' });
  }
});

// Get leave balances for current user
router.get('/balances', async (req, res) => {
  try {
    // For now, return some sample leave balances
    const currentYear = new Date().getFullYear();
    
    const balance = {
      id: 1,
      userId: req.user?.id,
      orgId: req.user?.organizationId,
      year: currentYear,
      casualLeaveUsed: 2,
      casualLeaveBalance: 8,
      medicalLeaveUsed: 3,
      medicalLeaveBalance: 4,
      annualLeaveUsed: 5,
      annualLeaveBalance: 10,
      carryForwardUsed: 0,
      carryForwardBalance: 2,
      policyId: 1,
      lastUpdated: new Date().toISOString(),
    };
    
    res.json(balance);
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    res.status(500).json({ error: 'Failed to fetch leave balances' });
  }
});

export default router;