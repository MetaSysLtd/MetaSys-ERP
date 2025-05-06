import express from 'express';
import { storage } from '../storage';
import { insertDashboardWidgetSchema } from '@shared/schema';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { createAuthMiddleware } from '../auth-middleware';

const router = express.Router();
const authMiddleware = createAuthMiddleware(1); // Require at least role level 1

// Get all dashboard widgets for the current user
router.get('/widgets', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const widgets = await storage.getDashboardWidgets(req.user.id);
    res.json(widgets);
  } catch (error) {
    console.error('Error getting dashboard widgets:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard widgets' });
  }
});

// Get a specific dashboard widget
router.get('/widgets/:id', authMiddleware, async (req, res) => {
  try {
    const widgetId = parseInt(req.params.id);
    if (isNaN(widgetId)) {
      return res.status(400).json({ error: 'Invalid widget ID' });
    }
    
    const widget = await storage.getDashboardWidget(widgetId);
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    // Check if the widget belongs to the user
    if (widget.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(widget);
  } catch (error) {
    console.error('Error getting dashboard widget:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard widget' });
  }
});

// Create a new dashboard widget
router.post('/widgets', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate input data using Zod schema
    const parsedData = insertDashboardWidgetSchema.parse({
      ...req.body,
      userId: req.user.id,
      orgId: req.user.orgId || 1
    });
    
    const newWidget = await storage.createDashboardWidget(parsedData);
    res.status(201).json(newWidget);
  } catch (error) {
    console.error('Error creating dashboard widget:', error);
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ 
        error: 'Validation error',
        details: validationError.message
      });
    }
    res.status(500).json({ error: 'Failed to create dashboard widget' });
  }
});

// Update a dashboard widget
router.put('/widgets/:id', authMiddleware, async (req, res) => {
  try {
    const widgetId = parseInt(req.params.id);
    if (isNaN(widgetId)) {
      return res.status(400).json({ error: 'Invalid widget ID' });
    }
    
    const existingWidget = await storage.getDashboardWidget(widgetId);
    if (!existingWidget) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    // Check if the widget belongs to the user
    if (existingWidget.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updatedWidget = await storage.updateDashboardWidget(widgetId, req.body);
    res.json(updatedWidget);
  } catch (error) {
    console.error('Error updating dashboard widget:', error);
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ 
        error: 'Validation error',
        details: validationError.message
      });
    }
    res.status(500).json({ error: 'Failed to update dashboard widget' });
  }
});

// Delete a dashboard widget
router.delete('/widgets/:id', authMiddleware, async (req, res) => {
  try {
    const widgetId = parseInt(req.params.id);
    if (isNaN(widgetId)) {
      return res.status(400).json({ error: 'Invalid widget ID' });
    }
    
    const widget = await storage.getDashboardWidget(widgetId);
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    // Check if the widget belongs to the user
    if (widget.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const deleted = await storage.deleteDashboardWidget(widgetId);
    if (deleted) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to delete widget' });
    }
  } catch (error) {
    console.error('Error deleting dashboard widget:', error);
    res.status(500).json({ error: 'Failed to delete dashboard widget' });
  }
});

// Reorder dashboard widgets
router.post('/widgets/reorder', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!Array.isArray(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'Invalid reorder data' });
    }
    
    // Verify all widgets belong to the user
    for (const item of req.body) {
      const widget = await storage.getDashboardWidget(item.id);
      if (!widget || widget.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied to one or more widgets' });
      }
    }
    
    const updatedWidgets = await storage.reorderDashboardWidgets(req.body);
    res.json(updatedWidgets);
  } catch (error) {
    console.error('Error reordering dashboard widgets:', error);
    res.status(500).json({ error: 'Failed to reorder widgets' });
  }
});

export default router;