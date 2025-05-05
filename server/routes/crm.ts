import express from 'express';
import { storage } from '../storage';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { 
  insertFormTemplateSchema, 
  insertFormSubmissionSchema, 
  insertLeadHandoffSchema,
  insertAccountSchema,
  insertSurveySchema,
  insertActivitySchema,
  activities as schemaActivities
} from '@shared/schema';
import crypto from 'crypto';
import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
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

// Lead endpoints
router.get('/leads', authMiddleware, async (req, res) => {
  try {
    const leads = await storage.getLeads();
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.get('/leads/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }
    
    const lead = await storage.getLead(id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.json(lead);
  } catch (error) {
    console.error(`Error fetching lead ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// Update lead status (for Kanban drag-and-drop)
router.patch('/leads/:id/status', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }
    
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Validate the status value is one of the allowed statuses
    const validStatuses = ['New', 'InProgress', 'FollowUp', 'HandToDispatch', 'Active', 'Lost'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Get the lead to make sure it exists
    const lead = await storage.getLead(id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // Update the lead status
    const updatedLead = await storage.updateLead(id, { 
      status,
      updatedBy: req.session.userId,
      updatedAt: new Date()
    });
    
    // Log this activity
    const userId = req.session.userId || 1; // Default to admin if not authenticated
    
    // Insert directly into activities table using db
    await db.insert(schemaActivities).values({
      userId,
      entityType: 'lead',
      entityId: id,
      action: 'status_changed',
      details: `Status changed from "${lead.status}" to "${status}"`,
      timestamp: new Date()
    });
    
    res.json(updatedLead);
  } catch (error) {
    console.error(`Error updating lead status for lead ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to update lead status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
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
    
    // Validate the lead has at least 3 calls logged before handoff
    const leadId = data.leadId;
    const callLogs = await storage.getCallLogsByLeadId(leadId);
    
    if (!callLogs || callLogs.length < 3) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        message: 'A minimum of 3 calls must be logged with this lead before handoff',
        code: 'MIN_CALLS_REQUIRED'
      });
    }
    
    // Verify required fields are present on the lead
    const lead = await storage.getLead(leadId);
    if (!lead) {
      return res.status(404).json({
        error: 'Lead not found',
        message: 'The specified lead does not exist'
      });
    }
    
    // Check for required fields
    const missingFields = [];
    if (!lead.mcNumber) missingFields.push('MC Number');
    if (!lead.equipmentType) missingFields.push('Equipment Type');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    // Create the handoff
    const handoff = await storage.createLeadHandoff({
      ...data,
      callsVerified: true,
      requiredFormsFilled: true
    });
    
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

// Accounts (CRM Deep-Carve) endpoints
router.get('/accounts', authMiddleware, async (req, res) => {
  try {
    const accounts = await storage.getAccounts();
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

router.get('/accounts/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid account ID' });
    }
    
    const account = await storage.getAccount(id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(account);
  } catch (error) {
    console.error(`Error fetching account ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

router.post('/accounts', authMiddleware, async (req, res) => {
  try {
    const userId = req.session.userId;
    const data = insertAccountSchema.parse({
      ...req.body,
      createdBy: userId,
      // If no assignedTo is provided, assign to the creator
      assignedTo: req.body.assignedTo || userId,
      // If no orgId is provided, use the user's orgId
      orgId: req.body.orgId || req.user?.orgId || 1
    });
    
    const account = await storage.createAccount(data);
    
    // Log this activity
    await storage.createActivity({
      userId,
      entityType: 'account',
      entityId: account.id,
      action: 'created',
      details: `Created new account: ${account.name}`
    });
    
    res.status(201).json(account);
  } catch (error) {
    handleZodError(error, res);
  }
});

router.put('/accounts/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid account ID' });
    }
    
    const account = await storage.getAccount(id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const updates = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const updatedAccount = await storage.updateAccount(id, updates);
    
    // Log this activity
    await storage.createActivity({
      userId: req.session.userId,
      entityType: 'account',
      entityId: account.id,
      action: 'updated',
      details: `Updated account: ${account.name}`
    });
    
    res.json(updatedAccount);
  } catch (error) {
    handleZodError(error, res);
  }
});

router.delete('/accounts/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid account ID' });
    }
    
    const account = await storage.getAccount(id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const success = await storage.deleteAccount(id);
    if (success) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: 'Failed to delete account' });
    }
  } catch (error) {
    console.error(`Error deleting account ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Surveys (CRM Deep-Carve) endpoints
router.get('/surveys', authMiddleware, async (req, res) => {
  try {
    const surveys = await storage.getSurveys();
    res.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

router.get('/surveys/lead/:leadId', authMiddleware, async (req, res) => {
  try {
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }
    
    const surveys = await storage.getSurveysByLead(leadId);
    res.json(surveys);
  } catch (error) {
    console.error(`Error fetching surveys for lead ${req.params.leadId}:`, error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

router.get('/surveys/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid survey ID' });
    }
    
    const survey = await storage.getSurvey(id);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    res.json(survey);
  } catch (error) {
    console.error(`Error fetching survey ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

router.post('/surveys', authMiddleware, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Generate a unique token for public access
    const token = crypto.randomUUID().replace(/-/g, '');
    
    const data = insertSurveySchema.parse({
      ...req.body,
      token,
      status: 'pending'
    });
    
    const survey = await storage.createSurvey(data);
    
    // Log this activity
    await storage.createActivity({
      userId,
      entityType: 'lead',
      entityId: survey.leadId,
      action: 'survey',
      details: `Created a survey for Lead #${survey.leadId}`
    });
    
    res.status(201).json(survey);
  } catch (error) {
    handleZodError(error, res);
  }
});

router.put('/surveys/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid survey ID' });
    }
    
    const survey = await storage.getSurvey(id);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    const updates = req.body;
    
    // If status is changing to "sent", set the sentAt timestamp
    if (updates.status === 'sent' && survey.status !== 'sent') {
      updates.sentAt = new Date();
    }
    
    // If status is changing to "completed", set the completedAt timestamp
    if (updates.status === 'completed' && survey.status !== 'completed') {
      updates.completedAt = new Date();
    }
    
    const updatedSurvey = await storage.updateSurvey(id, updates);
    res.json(updatedSurvey);
  } catch (error) {
    handleZodError(error, res);
  }
});

router.delete('/surveys/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid survey ID' });
    }
    
    const survey = await storage.getSurvey(id);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    const success = await storage.deleteSurvey(id);
    if (success) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: 'Failed to delete survey' });
    }
  } catch (error) {
    console.error(`Error deleting survey ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

// Activities (CRM Deep-Carve) endpoints
router.get('/activities', authMiddleware, async (req, res) => {
  try {
    const activities = await db.select().from(schemaActivities).orderBy(desc(schemaActivities.timestamp));
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

router.get('/activities/entity/:entityType/:entityId', authMiddleware, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const entityIdNumber = parseInt(entityId);
    
    if (isNaN(entityIdNumber)) {
      return res.status(400).json({ error: 'Invalid entity ID' });
    }
    
    const activityList = await db
      .select()
      .from(schemaActivities)
      .where(
        and(
          eq(schemaActivities.entityType, entityType),
          eq(schemaActivities.entityId, entityIdNumber)
        )
      )
      .orderBy(desc(schemaActivities.timestamp));
      
    res.json(activityList);
  } catch (error) {
    console.error(`Error fetching activities for ${req.params.entityType} ${req.params.entityId}:`, error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

router.post('/activities', authMiddleware, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const data = insertActivitySchema.parse({
      ...req.body,
      userId
    });
    
    // If this is a reminder, ensure reminder date is in the future
    if (data.action === 'reminder' && !data.reminderDate) {
      return res.status(400).json({ 
        error: 'Validation Error',
        details: 'Reminder date is required for reminder activities'
      });
    }
    
    const [activity] = await db.insert(schemaActivities).values(data).returning();
    res.status(201).json(activity);
  } catch (error) {
    handleZodError(error, res);
  }
});

router.patch('/activities/:id/complete-reminder', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }
    
    const [activity] = await db.select().from(schemaActivities).where(eq(schemaActivities.id, id));
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    if (activity.action !== 'reminder') {
      return res.status(400).json({ error: 'This activity is not a reminder' });
    }
    
    const [updatedActivity] = await db
      .update(activities)
      .set({ reminderCompleted: true })
      .where(eq(activities.id, id))
      .returning();
      
    res.json(updatedActivity);
  } catch (error) {
    console.error(`Error completing reminder ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to complete reminder' });
  }
});

export default router;