import express from 'express';
import { storage } from '../storage';
import { createAuthMiddleware } from '../auth-middleware';
import { insertBugSchema } from '@shared/schema';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Create the router
const router = express.Router();

// Set up auth middleware
const authMiddleware = createAuthMiddleware();

// Apply auth middleware to all bug routes
router.use(authMiddleware);

// Get all bugs for the current organization
router.get('/', async (req, res, next) => {
  try {
    if (!req.user || !req.user.orgId) {
      return res.status(400).json({
        error: 'Missing organization ID',
        message: 'User must be associated with an organization'
      });
    }

    const bugs = await storage.getBugs(req.user.orgId);
    res.json(bugs);
  } catch (error) {
    next(error);
  }
});

// Get bugs by status
router.get('/status/:status', async (req, res, next) => {
  try {
    if (!req.user || !req.user.orgId) {
      return res.status(400).json({
        error: 'Missing organization ID',
        message: 'User must be associated with an organization'
      });
    }

    const { status } = req.params;
    const bugs = await storage.getBugsByStatus(status, req.user.orgId);
    res.json(bugs);
  } catch (error) {
    next(error);
  }
});

// Get bugs by urgency
router.get('/urgency/:urgency', async (req, res, next) => {
  try {
    if (!req.user || !req.user.orgId) {
      return res.status(400).json({
        error: 'Missing organization ID',
        message: 'User must be associated with an organization'
      });
    }

    const { urgency } = req.params;
    const bugs = await storage.getBugsByUrgency(urgency, req.user.orgId);
    res.json(bugs);
  } catch (error) {
    next(error);
  }
});

// Get bugs by module
router.get('/module/:module', async (req, res, next) => {
  try {
    if (!req.user || !req.user.orgId) {
      return res.status(400).json({
        error: 'Missing organization ID',
        message: 'User must be associated with an organization'
      });
    }

    const { module } = req.params;
    const bugs = await storage.getBugsByModule(module, req.user.orgId);
    res.json(bugs);
  } catch (error) {
    next(error);
  }
});

// Get bugs reported by a specific user
router.get('/reported-by/:userId', async (req, res, next) => {
  try {
    const reporterId = parseInt(req.params.userId);
    if (isNaN(reporterId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a number'
      });
    }

    const bugs = await storage.getBugsByReporter(reporterId);
    res.json(bugs);
  } catch (error) {
    next(error);
  }
});

// Get bugs assigned to a specific user
router.get('/assigned-to/:userId', async (req, res, next) => {
  try {
    const assigneeId = parseInt(req.params.userId);
    if (isNaN(assigneeId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a number'
      });
    }

    const bugs = await storage.getBugsByAssignee(assigneeId);
    res.json(bugs);
  } catch (error) {
    next(error);
  }
});

// Get bug by ID
router.get('/:id', async (req, res, next) => {
  try {
    const bugId = parseInt(req.params.id);
    if (isNaN(bugId)) {
      return res.status(400).json({
        error: 'Invalid bug ID',
        message: 'Bug ID must be a number'
      });
    }

    const bug = await storage.getBug(bugId);
    if (!bug) {
      return res.status(404).json({
        error: 'Bug not found',
        message: `No bug found with ID ${bugId}`
      });
    }

    // Check if the user has access to this bug
    if (bug.orgId !== req.user?.orgId && req.userRole?.level < 4) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this bug report'
      });
    }

    res.json(bug);
  } catch (error) {
    next(error);
  }
});

// Create a new bug report
router.post('/', async (req, res, next) => {
  try {
    if (!req.user || !req.user.orgId || !req.user.id) {
      return res.status(400).json({
        error: 'Authentication required',
        message: 'You must be logged in to report a bug'
      });
    }

    // Parse and validate the request body
    const validatedData = insertBugSchema.parse({
      ...req.body,
      orgId: req.user.orgId,
      reportedBy: req.user.id
    });

    // Create the bug report
    const bug = await storage.createBug(validatedData);
    res.status(201).json(bug);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        error: 'Validation error',
        message: validationError.message,
        details: error.errors
      });
    }
    next(error);
  }
});

// Update a bug report
router.patch('/:id', async (req, res, next) => {
  try {
    const bugId = parseInt(req.params.id);
    if (isNaN(bugId)) {
      return res.status(400).json({
        error: 'Invalid bug ID',
        message: 'Bug ID must be a number'
      });
    }

    // Get the existing bug to check permissions
    const bug = await storage.getBug(bugId);
    if (!bug) {
      return res.status(404).json({
        error: 'Bug not found',
        message: `No bug found with ID ${bugId}`
      });
    }

    // Check if the user has access to update this bug
    if (bug.orgId !== req.user?.orgId && req.userRole?.level < 4) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to update this bug report'
      });
    }

    // Update the bug
    const updatedBug = await storage.updateBug(bugId, req.body);
    if (!updatedBug) {
      return res.status(404).json({
        error: 'Bug not found',
        message: `Could not update bug with ID ${bugId}`
      });
    }

    res.json(updatedBug);
  } catch (error) {
    next(error);
  }
});

// Assign a bug to a user
router.patch('/:id/assign', async (req, res, next) => {
  try {
    const bugId = parseInt(req.params.id);
    if (isNaN(bugId)) {
      return res.status(400).json({
        error: 'Invalid bug ID',
        message: 'Bug ID must be a number'
      });
    }

    const { assigneeId } = req.body;
    if (!assigneeId || typeof assigneeId !== 'number') {
      return res.status(400).json({
        error: 'Invalid assignee ID',
        message: 'Assignee ID must be provided as a number'
      });
    }

    // Get the existing bug to check permissions
    const bug = await storage.getBug(bugId);
    if (!bug) {
      return res.status(404).json({
        error: 'Bug not found',
        message: `No bug found with ID ${bugId}`
      });
    }

    // Check if the user has permission to assign bugs
    if (req.userRole?.level < 3 && req.user?.id !== bug.reportedBy) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to assign this bug'
      });
    }

    // Assign the bug
    const updatedBug = await storage.assignBug(bugId, assigneeId);
    if (!updatedBug) {
      return res.status(404).json({
        error: 'Bug not found',
        message: `Could not assign bug with ID ${bugId}`
      });
    }

    res.json(updatedBug);
  } catch (error) {
    next(error);
  }
});

// Change bug status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const bugId = parseInt(req.params.id);
    if (isNaN(bugId)) {
      return res.status(400).json({
        error: 'Invalid bug ID',
        message: 'Bug ID must be a number'
      });
    }

    const { status } = req.body;
    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be provided as a string'
      });
    }

    // Get the existing bug to check permissions
    const bug = await storage.getBug(bugId);
    if (!bug) {
      return res.status(404).json({
        error: 'Bug not found',
        message: `No bug found with ID ${bugId}`
      });
    }

    // Check if the user has permission to change the status
    if (req.userRole?.level < 3 && req.user?.id !== bug.reportedBy && req.user?.id !== bug.assignedTo) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to change the status of this bug'
      });
    }

    // Update the status
    const updatedBug = await storage.changeBugStatus(bugId, status);
    if (!updatedBug) {
      return res.status(404).json({
        error: 'Bug not found',
        message: `Could not update status for bug with ID ${bugId}`
      });
    }

    res.json(updatedBug);
  } catch (error) {
    next(error);
  }
});

// Mark a bug as fixed
router.patch('/:id/fix', async (req, res, next) => {
  try {
    const bugId = parseInt(req.params.id);
    if (isNaN(bugId)) {
      return res.status(400).json({
        error: 'Invalid bug ID',
        message: 'Bug ID must be a number'
      });
    }

    const { fixVersion } = req.body;
    if (!fixVersion || typeof fixVersion !== 'string') {
      return res.status(400).json({
        error: 'Invalid fix version',
        message: 'Fix version must be provided as a string'
      });
    }

    // Get the existing bug to check permissions
    const bug = await storage.getBug(bugId);
    if (!bug) {
      return res.status(404).json({
        error: 'Bug not found',
        message: `No bug found with ID ${bugId}`
      });
    }

    // Check if the user has permission to mark as fixed
    if (req.userRole?.level < 3 && req.user?.id !== bug.assignedTo) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to mark this bug as fixed'
      });
    }

    // Mark as fixed
    const updatedBug = await storage.fixBug(bugId, fixVersion);
    if (!updatedBug) {
      return res.status(404).json({
        error: 'Bug not found',
        message: `Could not mark bug with ID ${bugId} as fixed`
      });
    }

    res.json(updatedBug);
  } catch (error) {
    next(error);
  }
});

// Close a bug
router.patch('/:id/close', async (req, res, next) => {
  try {
    const bugId = parseInt(req.params.id);
    if (isNaN(bugId)) {
      return res.status(400).json({
        error: 'Invalid bug ID',
        message: 'Bug ID must be a number'
      });
    }

    // Get the existing bug to check permissions
    const bug = await storage.getBug(bugId);
    if (!bug) {
      return res.status(404).json({
        error: 'Bug not found',
        message: `No bug found with ID ${bugId}`
      });
    }

    // Check if the user has permission to close the bug
    if (req.userRole?.level < 3 && req.user?.id !== bug.reportedBy) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to close this bug'
      });
    }

    // Close the bug
    const updatedBug = await storage.closeBug(bugId);
    if (!updatedBug) {
      return res.status(404).json({
        error: 'Bug not found',
        message: `Could not close bug with ID ${bugId}`
      });
    }

    res.json(updatedBug);
  } catch (error) {
    next(error);
  }
});

// Reopen a bug
router.patch('/:id/reopen', async (req, res, next) => {
  try {
    const bugId = parseInt(req.params.id);
    if (isNaN(bugId)) {
      return res.status(400).json({
        error: 'Invalid bug ID',
        message: 'Bug ID must be a number'
      });
    }

    // Get the existing bug to check permissions
    const bug = await storage.getBug(bugId);
    if (!bug) {
      return res.status(404).json({
        error: 'Bug not found',
        message: `No bug found with ID ${bugId}`
      });
    }

    // Check if the bug is already closed or fixed
    if (bug.status !== 'Closed' && bug.status !== 'Fixed') {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'Only closed or fixed bugs can be reopened'
      });
    }

    // Check if the user has permission to reopen the bug
    if (req.userRole?.level < 3 && req.user?.id !== bug.reportedBy && req.user?.id !== bug.assignedTo) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to reopen this bug'
      });
    }

    // Reopen the bug
    const updatedBug = await storage.reopenBug(bugId);
    if (!updatedBug) {
      return res.status(404).json({
        error: 'Bug not found',
        message: `Could not reopen bug with ID ${bugId}`
      });
    }

    res.json(updatedBug);
  } catch (error) {
    next(error);
  }
});

export default router;