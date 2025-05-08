import express from 'express';
import { createAuthMiddleware } from '../auth-middleware';
import { logger } from '../logger';

const router = express.Router();

/**
 * GET /api/activities
 * Get activities
 */
router.get('/', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Get activities
    res.json([]);
  } catch (error) {
    logger.error('Error in activities route:', error);
    next(error);
  }
});

/**
 * POST /api/activities
 * Create a new activity
 */
router.post('/', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Create a new activity
    res.status(201).json({
      id: 1,
      userId: req.user?.id,
      entityType: req.body.entityType,
      entityId: req.body.entityId,
      action: req.body.action,
      details: req.body.details,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error creating activity:', error);
    next(error);
  }
});

export default router;