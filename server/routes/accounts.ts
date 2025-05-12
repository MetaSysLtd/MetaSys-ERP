import express from 'express';
import { createAuthMiddleware } from '../auth-middleware';
import { logger } from '../logger';

const router = express.Router();

/**
 * GET /api/accounts
 * Get client accounts
 */
router.get('/', createAuthMiddleware(1), async (req, res, next) => {
  try {
    const accounts = await storage.getAccounts();

    // Emit socket event for real-time updates
    req.io?.emit('accounts:updated', {
      type: 'FETCH',
      data: accounts
    });

    res.json(accounts);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/accounts
 * Create a new client account
 */
router.post('/', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Create a new client account
    res.status(201).json({
      id: 1,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      company: req.body.company,
      industry: req.body.industry,
      status: 'Active',
      assignedTo: req.user?.id,
      createdBy: req.user?.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    logger.error('Error creating client account:', error);
    next(error);
  }
});

/**
 * GET /api/accounts/:id
 * Get a specific client account
 */
router.get('/:id', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Get a specific client account
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    res.json({
      id,
      name: 'Example Account',
      email: 'account@example.com',
      phone: '123-456-7890',
      company: 'Example Company',
      industry: 'Technology',
      status: 'Active',
      assignedTo: req.user?.id,
      createdBy: req.user?.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    logger.error('Error in specific account route:', error);
    next(error);
  }
});

/**
 * PUT /api/accounts/:id
 * Update a client account
 */
router.post('/:id/change-password', createAuthMiddleware(1), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { currentPassword, newPassword } = req.body;

    // Validate request
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user has permission
    const isAdmin = req.user?.role?.level >= 5;
    const isSelf = req.user?.id === id;
    
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Verify current password and update
    const success = await storage.updateUserPassword(id, currentPassword, newPassword);
    
    if (!success) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Emit socket event for real-time updates
    req.io?.emit('user:updated', {
      type: 'PASSWORD_CHANGED',
      userId: id
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    next(error);
  }
});

router.put('/:id', createAuthMiddleware(1), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = { ...req.body };

    // Check if user has permission to update
    const isAdmin = req.user?.role?.level >= 5;
    const isSelf = req.user?.id === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to update user profile' 
      });
    }

    // Sanitize updates
    delete updates.id; // Prevent ID changes
    delete updates.role; // Prevent role changes via this endpoint

    const updatedUser = await storage.updateUser(id, updates);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Emit socket event for real-time updates
    req.io?.emit('user:updated', {
      type: 'UPDATE',
      data: updatedUser
    });

    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    console.error('Profile update error:', error);
    next(error);
  }
});

export default router;