import express from 'express';
import { createAuthMiddleware } from '../auth-middleware';
import { logger } from '../logger';

const router = express.Router();

/**
 * GET /api/dashboard
 * Get dashboard data
 */
router.get('/', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Get dashboard data
    res.json({
      counts: {
        leads: 5,
        clients: 3,
        loads: 0,
        tasks: 2
      },
      recentActivity: [],
      upcomingTasks: [],
      performance: {
        sales: {
          target: 100000,
          actual: 75000,
          percentage: 75
        },
        leads: {
          target: 50,
          actual: 32,
          percentage: 64
        },
        tasks: {
          target: 20,
          actual: 15,
          percentage: 75
        }
      }
    });
  } catch (error) {
    logger.error('Error in dashboard route:', error);
    next(error);
  }
});

/**
 * GET /api/dashboard/widgets
 * Get dashboard widgets
 */
router.get('/widgets', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Get dashboard widgets
    res.json([
      { 
        id: 1,
        userId: req.user?.id,
        orgId: req.user?.orgId || 1,
        widget: 'leads-overview',
        position: 0,
        settings: { 
          showTarget: true, 
          timeframe: 'month' 
        }
      },
      { 
        id: 2,
        userId: req.user?.id,
        orgId: req.user?.orgId || 1,
        widget: 'tasks',
        position: 1,
        settings: { 
          showCompleted: false, 
          limit: 5 
        }
      }
    ]);
  } catch (error) {
    logger.error('Error in dashboard widgets route:', error);
    next(error);
  }
});

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics
 */
router.get('/metrics', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Get dashboard metrics
    res.json({
      performance: {
        sales: {
          weekly: {
            data: [12500, 15000, 22000, 18000, 20000, 17500, 14000],
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
          },
          monthly: {
            data: [175000, 190000, 220000, 210000],
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
          }
        },
        leads: {
          weekly: {
            data: [5, 8, 12, 7, 9, 6, 4],
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
          },
          monthly: {
            data: [32, 29, 35, 38],
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
          }
        }
      }
    });
  } catch (error) {
    logger.error('Error in dashboard metrics route:', error);
    next(error);
  }
});

export default router;