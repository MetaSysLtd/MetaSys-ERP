import express, { Router } from "express";
import { storage } from "./storage";
import { insertLeadSchema } from "@shared/schema";
import { leadRealTimeMiddleware } from "./utils/real-time-handler";
import * as notificationService from "./notifications";
import { getIo, notifyDataChange } from "./socket";
import { ZodError } from "zod"; 
import { fromZodError } from "zod-validation-error";

// Auth middleware function - copied from consolidated-routes
const createAuthMiddleware = (requiredRoleLevel: number = 1) => {
  return async (req: any, res: any, next: any) => {
    // Check if user is authenticated via session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        error: "Unauthorized: Please log in to access this resource",
        missing: ["session"] 
      });
    }

    try {
      // Fetch the user from storage
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ 
          error: "Unauthorized: User not found", 
          missing: ["user"] 
        });
      }

      // Attach user to request
      req.user = user;
      
      // Fetch the user's role
      const role = await storage.getRole(user.roleId);
      if (!role) {
        return res.status(400).json({ 
          error: "Invalid user configuration: Role not found", 
          missing: ["role"] 
        });
      }
      
      // Check if role meets required level
      if (role.level < requiredRoleLevel) {
        return res.status(403).json({ 
          error: "Forbidden: Insufficient permission level", 
          required: requiredRoleLevel,
          current: role.level
        });
      }
      
      // Attach role to request
      req.userRole = role;
      
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      next(error);
    }
  };
};

export function setupLeadRoutes() {
  const leadsRouter = Router();
  
  // Apply real-time middleware
  leadsRouter.use(leadRealTimeMiddleware);
  
  // GET all leads
  leadsRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      next(error);
    }
  });
  
  // GET lead by ID
  leadsRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
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
  leadsRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
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
      
      // Emit socket events for real-time updates
      const io = getIo();
      if (io) {
        io.emit('lead:created', { 
          lead: newLead, 
          userId: req.user?.id 
        });
        io.emit('data:updated', { 
          type: 'leads', 
          action: 'created', 
          data: newLead 
        });
      }
      
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
      
      // Emit socket events for real-time updates
      const io = getIo();
      if (io) {
        io.emit('lead:updated', { 
          lead: updatedLead, 
          userId: req.user?.id 
        });
        io.emit('data:updated', { 
          type: 'leads', 
          action: 'updated', 
          data: updatedLead 
        });
      }
      
      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead:", error);
      next(error);
    }
  });
  
  // PATCH update lead status
  leadsRouter.patch("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadId = Number(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // For simplicity, only allow updating status
      if (!req.body.status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Update the lead
      const updatedLead = await storage.updateLead(leadId, { 
        status: req.body.status,
        lastStatusChangeAt: new Date().toISOString()
      });
      
      // Create activity record for the update
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'lead',
        entityId: leadId,
        action: 'updated_status',
        details: `Updated lead status to: ${req.body.status}`
      });
      
      // Notify of update via sockets
      notifyDataChange('lead', leadId, 'updated', updatedLead);
      
      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead status:", error);
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