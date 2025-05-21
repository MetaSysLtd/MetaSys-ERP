import express, { Router } from "express";
import { storage } from "./storage";
import { createAuthMiddleware } from "./middleware/authMiddleware";
import { insertLeadSchema } from "@shared/schema";
import { leadRealTimeMiddleware } from "./utils/real-time-handler";

export function setupLeadRoutes() {
  return function(router: Router): void {
  // Apply real-time middleware
  router.use(leadRealTimeMiddleware);
  
  // GET all leads
  router.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      next(error);
    }
  });
  
  // GET lead by ID
  router.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadId = Number(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      next(error);
    }
  });
  
  // POST create new lead
  router.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadData = insertLeadSchema.parse({
        ...req.body,
        createdBy: req.user?.id,
        orgId: req.user?.orgId
      });
      
      const newLead = await storage.createLead(leadData);
      
      // Create activity record
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'lead',
        entityId: newLead.id,
        action: 'created',
        details: `Created lead: ${newLead.companyName || 'Unknown Company'}`
      });
      
      res.status(201).json(newLead);
    } catch (error) {
      console.error("Error creating lead:", error);
      next(error);
    }
  });
  
  // PUT update lead
  leadsRouter.put("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const leadId = Number(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Update the lead
      const updatedLead = await storage.updateLead(leadId, req.body);
      
      // Create activity record for the update
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'lead',
        entityId: leadId,
        action: 'updated',
        details: `Updated lead: ${lead.companyName || 'Unknown Company'}`
      });
      
      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead:", error);
      next(error);
    }
  });
  
  // DELETE lead
  leadsRouter.delete("/:id", createAuthMiddleware(5), async (req, res, next) => {
    try {
      const leadId = Number(req.params.id);
      const existingLead = await storage.getLead(leadId);
      
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Instead of deleting the lead, mark it as inactive by setting status to "Lost"
      const updatedLead = await storage.updateLead(leadId, { 
        status: "Lost",
        notes: existingLead.notes 
          ? `${existingLead.notes} (Marked as deleted by admin)`
          : "Marked as deleted by admin"
      });
      
      if (!updatedLead) {
        return res.status(500).json({ message: "Failed to update lead status" });
      }
      
      // Create activity record for the deletion
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'lead',
        entityId: leadId,
        action: 'deleted',
        details: `Marked lead as deleted: ${existingLead.companyName || 'Unknown Company'}`
      });
      
      // Return success
      res.status(200).json({ success: true, message: "Lead marked as deleted successfully" });
    } catch (error) {
      console.error("Error deleting lead:", error);
      next(error);
    }
  });
  
  return leadsRouter;
}