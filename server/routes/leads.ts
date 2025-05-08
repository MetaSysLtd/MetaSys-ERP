import express from 'express';
import { createAuthMiddleware } from '../auth-middleware';
import { logger } from '../logger';

const router = express.Router();

/**
 * GET /api/leads
 * Get leads
 */
router.get('/', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // In a real implementation, this would fetch from database
    // For now, return some sample leads with the fields from our form
    const sampleLeads = [
      {
        id: 1001,
        companyName: "ABC Logistics",
        contactName: "John Smith",
        email: "john@abclogistics.com",
        phoneNumber: "(555) 123-4567",
        source: "SQL",
        sourceDetails: "Sales team outreach",
        mcNumber: "MC123456",
        mcAge: 12,
        dotNumber: "DOT7891011",
        equipmentType: "flatbed",
        truckCategory: "Class 8",
        factoringStatus: "has-factoring",
        serviceCharges: 4.5,
        commissionRate: 10,
        priority: "High",
        category: "Carrier",
        currentAvailability: "Available",
        notes: "Potential high-value carrier",
        status: "New",
        assignedTo: req.user?.id,
        orgId: 1,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000)
      },
      {
        id: 1002,
        companyName: "XYZ Transport",
        contactName: "Jane Doe",
        email: "jane@xyztransport.com",
        phoneNumber: "(555) 987-6543",
        source: "Referral",
        sourceDetails: "Referred by Client #1001",
        mcNumber: "MC654321",
        mcAge: 36,
        dotNumber: "DOT1122334",
        equipmentType: "dry-van",
        truckCategory: "Class 8",
        factoringStatus: "needs-factoring",
        serviceCharges: 5.0,
        commissionRate: 12,
        priority: "Medium",
        category: "Carrier",
        currentAvailability: "Limited",
        notes: "Interested in factoring services",
        status: "Contacted",
        assignedTo: req.user?.id,
        orgId: 1,
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        updatedAt: new Date(Date.now() - 86400000)  // 1 day ago
      }
    ];
    
    res.json(sampleLeads);
  } catch (error) {
    logger.error('Error in leads route:', error);
    next(error);
  }
});

/**
 * POST /api/leads
 * Create a new lead
 */
router.post('/', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Log the incoming request body for debugging
    logger.debug('Creating lead with data:', JSON.stringify(req.body, null, 2));
    
    // Create a new lead with all the fields from the form
    const newLead = {
      id: Date.now(), // Generate a unique ID based on timestamp
      companyName: req.body.companyName,
      contactName: req.body.contactName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      source: req.body.source,
      sourceDetails: req.body.sourceDetails,
      mcNumber: req.body.mcNumber,
      mcAge: req.body.mcAge,
      dotNumber: req.body.dotNumber,
      equipmentType: req.body.equipmentType,
      truckCategory: req.body.truckCategory,
      factoringStatus: req.body.factoringStatus,
      serviceCharges: req.body.serviceCharges,
      commissionRate: req.body.commissionRate,
      priority: req.body.priority,
      category: req.body.category,
      currentAvailability: req.body.currentAvailability,
      notes: req.body.notes,
      status: 'New',
      assignedTo: req.body.assignedTo || req.user?.id,
      createdBy: req.user?.id,
      orgId: req.body.orgId || 1, // Default organization ID
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // In a real implementation, this would save to database
    // For now, just return the created lead
    
    // Emit a socket event to notify clients of the new lead
    if (req.app.locals.io) {
      req.app.locals.io.emit('leadCreated', {
        lead: newLead,
        createdBy: req.user?.id
      });
    }
    
    res.status(201).json(newLead);
  } catch (error) {
    logger.error('Error creating lead:', error);
    next(error);
  }
});

/**
 * GET /api/leads/:id
 * Get a specific lead
 */
router.get('/:id', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Get a specific lead
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Check if this is one of our sample leads
    if (id === 1001 || id === 1002) {
      // Return the matching sample lead
      const sampleLead = id === 1001 
        ? {
            id: 1001,
            companyName: "ABC Logistics",
            contactName: "John Smith",
            email: "john@abclogistics.com",
            phoneNumber: "(555) 123-4567",
            source: "SQL",
            sourceDetails: "Sales team outreach",
            mcNumber: "MC123456",
            mcAge: 12,
            dotNumber: "DOT7891011",
            equipmentType: "flatbed",
            truckCategory: "Class 8",
            factoringStatus: "has-factoring",
            serviceCharges: 4.5,
            commissionRate: 10,
            priority: "High",
            category: "Carrier",
            currentAvailability: "Available",
            notes: "Potential high-value carrier",
            status: "New",
            assignedTo: req.user?.id,
            orgId: 1,
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
            updatedAt: new Date(Date.now() - 86400000)
          }
        : {
            id: 1002,
            companyName: "XYZ Transport",
            contactName: "Jane Doe",
            email: "jane@xyztransport.com",
            phoneNumber: "(555) 987-6543",
            source: "Referral",
            sourceDetails: "Referred by Client #1001",
            mcNumber: "MC654321",
            mcAge: 36,
            dotNumber: "DOT1122334",
            equipmentType: "dry-van",
            truckCategory: "Class 8",
            factoringStatus: "needs-factoring",
            serviceCharges: 5.0,
            commissionRate: 12,
            priority: "Medium",
            category: "Carrier",
            currentAvailability: "Limited",
            notes: "Interested in factoring services",
            status: "Contacted",
            assignedTo: req.user?.id,
            orgId: 1,
            createdAt: new Date(Date.now() - 172800000), // 2 days ago
            updatedAt: new Date(Date.now() - 86400000)  // 1 day ago
          };
          
      return res.json(sampleLead);
    }
    
    // Generic response for other IDs
    res.json({
      id,
      companyName: `Company ${id}`,
      contactName: "Contact Name",
      email: `contact${id}@example.com`,
      phoneNumber: "(555) 000-0000",
      source: "Website",
      sourceDetails: "",
      mcNumber: `MC${id}000`,
      mcAge: 6,
      dotNumber: `DOT${id}000`,
      equipmentType: "flatbed",
      truckCategory: "Class 8",
      factoringStatus: "has-factoring",
      serviceCharges: 5.0,
      commissionRate: 10,
      priority: "Medium",
      category: "Carrier",
      currentAvailability: "Available",
      notes: "",
      status: "New",
      assignedTo: req.user?.id,
      createdBy: req.user?.id,
      orgId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    logger.error('Error in specific lead route:', error);
    next(error);
  }
});

/**
 * PUT /api/leads/:id
 * Update a lead
 */
router.put('/:id', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Update a lead
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Log the incoming update data for debugging
    logger.debug('Updating lead with data:', JSON.stringify(req.body, null, 2));
    
    // Create the updated lead object with all fields from the form
    const updatedLead = {
      id,
      companyName: req.body.companyName,
      contactName: req.body.contactName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      source: req.body.source,
      sourceDetails: req.body.sourceDetails,
      mcNumber: req.body.mcNumber,
      mcAge: req.body.mcAge,
      dotNumber: req.body.dotNumber,
      equipmentType: req.body.equipmentType,
      truckCategory: req.body.truckCategory,
      factoringStatus: req.body.factoringStatus,
      serviceCharges: req.body.serviceCharges,
      commissionRate: req.body.commissionRate,
      priority: req.body.priority,
      category: req.body.category,
      currentAvailability: req.body.currentAvailability,
      notes: req.body.notes,
      status: req.body.status || 'New',
      assignedTo: req.body.assignedTo || req.user?.id,
      orgId: req.body.orgId || 1,
      // Keep the original createdAt if it was provided
      createdAt: req.body.createdAt ? new Date(req.body.createdAt) : new Date(),
      updatedAt: new Date() // Always update the updatedAt
    };
    
    // In a real implementation, this would update the database
    // For now, just return the updated lead
    
    // Emit a socket event to notify clients of the lead update
    if (req.app.locals.io) {
      req.app.locals.io.emit('leadUpdated', {
        lead: updatedLead,
        updatedBy: req.user?.id
      });
    }
    
    res.json(updatedLead);
  } catch (error) {
    logger.error('Error updating lead:', error);
    next(error);
  }
});

export default router;