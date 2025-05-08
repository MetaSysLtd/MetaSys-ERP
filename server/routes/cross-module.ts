import express from 'express';
import { createAuthMiddleware } from '../auth-middleware';
import { logger } from '../logger';
import { getModuleData, getIntegratedData, emitCrossModuleUpdate } from '../services/cross-module-data';

const router = express.Router();

/**
 * GET /api/cross-module/data/:dataType
 * Get data from a module with permission checks
 */
router.get('/data/:dataType', createAuthMiddleware(1), async (req, res, next) => {
  try {
    const userId = req.user?.id || 0;
    const dataType = req.params.dataType;
    const options = {
      userId,
      orgId: req.user?.orgId || 0,
      includeDetails: req.query.includeDetails === 'true'
    };
    
    const result = await getModuleData(dataType, userId, options);
    
    if (!result.hasAccess) {
      return res.status(403).json({
        error: `Access denied: You don't have permission to view ${dataType}`
      });
    }
    
    res.json(result.data);
  } catch (error) {
    logger.error(`Error in cross-module data route (type: ${req.params.dataType}):`, error);
    next(error);
  }
});

/**
 * GET /api/cross-module/integrated/:dataType/:entityId
 * Get integrated data from multiple modules
 */
router.get('/integrated/:dataType/:entityId', createAuthMiddleware(1), async (req, res, next) => {
  try {
    const userId = req.user?.id || 0;
    const dataType = req.params.dataType;
    const entityId = parseInt(req.params.entityId, 10);
    
    if (isNaN(entityId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const options = {
      userId,
      orgId: req.user?.orgId || 0,
      includeDetails: req.query.includeDetails === 'true'
    };
    
    const result = await getIntegratedData(userId, dataType, entityId, options);
    
    res.json(result);
  } catch (error) {
    logger.error(`Error in cross-module integrated data route (type: ${req.params.dataType}, id: ${req.params.entityId}):`, error);
    next(error);
  }
});

/**
 * POST /api/cross-module/emit-update
 * Emit a cross-module update event
 */
router.post('/emit-update', createAuthMiddleware(2), async (req, res, next) => {
  try {
    const { sourceModule, dataType, data, targetUsers } = req.body;
    
    if (!sourceModule || !dataType || !data) {
      return res.status(400).json({
        error: 'Missing required fields: sourceModule, dataType, data'
      });
    }
    
    // Emit the update event
    emitCrossModuleUpdate(
      sourceModule,
      dataType,
      data,
      targetUsers || []
    );
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error in cross-module emit-update route:', error);
    next(error);
  }
});

/**
 * GET /api/cross-module/dashboard
 * Get cross-module dashboard data
 */
router.get('/dashboard', createAuthMiddleware(1), async (req, res, next) => {
  try {
    const userId = req.user?.id || 0;
    const modules = (req.query.modules as string || 'crm,dispatch,finance,hr').split(',');
    const results: Record<string, any> = {};
    
    // Get data from each requested module
    await Promise.all(
      modules.map(async (module) => {
        try {
          const result = await getModuleData(module, userId, { userId });
          if (result.hasAccess) {
            results[module] = result.data;
          } else {
            results[module] = { accessDenied: true };
          }
        } catch (error) {
          logger.error(`Error getting ${module} data for cross-module dashboard:`, error);
          results[module] = { error: `Failed to load ${module} data` };
        }
      })
    );
    
    res.json(results);
  } catch (error) {
    logger.error('Error in cross-module dashboard route:', error);
    next(error);
  }
});

export default router;