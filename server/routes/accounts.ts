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
router.put('/:id', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Update a client account
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    res.json({
      id,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      company: req.body.company,
      industry: req.body.industry,
      status: req.body.status,
      assignedTo: req.body.assignedTo || req.user?.id,
      createdBy: req.user?.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    logger.error('Error updating client account:', error);
    next(error);
  }
});

export default router;