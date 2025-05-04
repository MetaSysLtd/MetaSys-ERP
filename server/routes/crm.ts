import express from 'express';
import { storage } from '../storage';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { 
  insertFormTemplateSchema, 
  insertFormSubmissionSchema, 
  insertLeadHandoffSchema 
} from '@shared/schema';
import { createAuthMiddleware } from '../auth-middleware';

const router = express.Router();
const authMiddleware = createAuthMiddleware(1); // Require at least role level 1

// Error handling middleware for this router
const handleZodError = (error: unknown, res: express.Response) => {
  if (error instanceof ZodError) {
    const validationError = fromZodError(error);
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: validationError.message 
    });
  }
  console.error('API Error:', error);
  return res.status(500).json({ 
    error: 'Internal Server Error',
    message: error instanceof Error ? error.message : 'Unknown error'
  });
};

// Form Template endpoints
router.get('/form-templates', authMiddleware, async (req, res) => {
  try {
    const templates = await storage.getFormTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching form templates:', error);
    res.status(500).json({ error: 'Failed to fetch form templates' });
  }
});

router.get('/form-templates/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    const template = await storage.getFormTemplate(id);
    if (!template) {
      return res.status(404).json({ error: 'Form template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error(`Error fetching form template ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch form template' });
  }
});

router.post('/form-templates', authMiddleware, async (req, res) => {
  try {
    const data = insertFormTemplateSchema.parse({
      ...req.body,
      createdBy: req.session.userId
    });
    
    const template = await storage.createFormTemplate(data);
    res.status(201).json(template);
  } catch (error) {
    handleZodError(error, res);
  }
});

router.put('/form-templates/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    const template = await storage.getFormTemplate(id);
    if (!template) {
      return res.status(404).json({ error: 'Form template not found' });
    }
    
    const data = {
      ...req.body,
      updatedBy: req.session.userId
    };
    
    const updatedTemplate = await storage.updateFormTemplate(id, data);
    res.json(updatedTemplate);
  } catch (error) {
    handleZodError(error, res);
  }
});

router.delete('/form-templates/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    const template = await storage.getFormTemplate(id);
    if (!template) {
      return res.status(404).json({ error: 'Form template not found' });
    }
    
    const success = await storage.deleteFormTemplate(id);
    if (success) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: 'Failed to delete form template' });
    }
  } catch (error) {
    console.error(`Error deleting form template ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete form template' });
  }
});

// Form Submission endpoints
router.get('/form-submissions/lead/:leadId', authMiddleware, async (req, res) => {
  try {
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }
    
    const submissions = await storage.getFormSubmissions(leadId);
    res.json(submissions);
  } catch (error) {
    console.error(`Error fetching form submissions for lead ${req.params.leadId}:`, error);
    res.status(500).json({ error: 'Failed to fetch form submissions' });
  }
});

router.get('/form-submissions/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid submission ID' });
    }
    
    const submission = await storage.getFormSubmission(id);
    if (!submission) {
      return res.status(404).json({ error: 'Form submission not found' });
    }
    
    res.json(submission);
  } catch (error) {
    console.error(`Error fetching form submission ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch form submission' });
  }
});

router.post('/form-submissions', authMiddleware, async (req, res) => {
  try {
    const data = insertFormSubmissionSchema.parse({
      ...req.body,
      createdBy: req.session.userId
    });
    
    const submission = await storage.createFormSubmission(data);
    res.status(201).json(submission);
  } catch (error) {
    handleZodError(error, res);
  }
});

router.put('/form-submissions/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid submission ID' });
    }
    
    const submission = await storage.getFormSubmission(id);
    if (!submission) {
      return res.status(404).json({ error: 'Form submission not found' });
    }
    
    const data = {
      ...req.body,
      updatedBy: req.session.userId
    };
    
    const updatedSubmission = await storage.updateFormSubmission(id, data);
    res.json(updatedSubmission);
  } catch (error) {
    handleZodError(error, res);
  }
});

// Lead Handoff endpoints
router.get('/lead-handoffs/lead/:leadId', authMiddleware, async (req, res) => {
  try {
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }
    
    const handoffs = await storage.getLeadHandoffs(leadId);
    res.json(handoffs);
  } catch (error) {
    console.error(`Error fetching lead handoffs for lead ${req.params.leadId}:`, error);
    res.status(500).json({ error: 'Failed to fetch lead handoffs' });
  }
});

router.get('/lead-handoffs/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid handoff ID' });
    }
    
    const handoff = await storage.getLeadHandoff(id);
    if (!handoff) {
      return res.status(404).json({ error: 'Lead handoff not found' });
    }
    
    res.json(handoff);
  } catch (error) {
    console.error(`Error fetching lead handoff ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch lead handoff' });
  }
});

router.post('/lead-handoffs', authMiddleware, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // For handoffs, the sales rep is typically the current user
    const data = insertLeadHandoffSchema.parse({
      ...req.body,
      salesRepId: req.body.salesRepId || userId
    });
    
    const handoff = await storage.createLeadHandoff(data);
    res.status(201).json(handoff);
  } catch (error) {
    handleZodError(error, res);
  }
});

router.put('/lead-handoffs/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid handoff ID' });
    }
    
    const handoff = await storage.getLeadHandoff(id);
    if (!handoff) {
      return res.status(404).json({ error: 'Lead handoff not found' });
    }
    
    // Allow updating with user ID as the updater
    const data = {
      ...req.body,
      updatedBy: req.session.userId
    };
    
    const updatedHandoff = await storage.updateLeadHandoff(id, data);
    res.json(updatedHandoff);
  } catch (error) {
    handleZodError(error, res);
  }
});

export default router;