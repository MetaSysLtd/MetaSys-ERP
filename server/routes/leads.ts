import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { leads, leadHandoffs, users } from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { createAuthMiddleware } from "../auth-middleware";
import { notifyDataChange } from "../socket";

const leadsRouter = Router();
const authMiddleware = createAuthMiddleware();

// Schema for lead status update validation
const statusUpdateSchema = z.object({
  status: z.enum(["New", "InProgress", "FollowUp", "HandToDispatch", "Active", "Lost"]),
  notes: z.string().optional(),
});

// Schema for lead qualification update
const qualificationUpdateSchema = z.object({
  qualificationScore: z.enum(["Low", "Medium", "High", "Very High"]),
  notes: z.string().optional(),
});

// Get a specific lead by ID
leadsRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const leadId = Number(req.params.id);
    
    if (isNaN(leadId)) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }
    
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
    });
    
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    
    return res.json(lead);
  } catch (error: any) {
    console.error("Error fetching lead:", error);
    return res.status(500).json({ message: "Server error fetching lead" });
  }
});

// Update lead status
leadsRouter.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const leadId = Number(req.params.id);
    
    if (isNaN(leadId)) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }
    
    // Validate the request body
    const validationResult = statusUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid status update data", 
        errors: validationResult.error.errors 
      });
    }
    
    const { status, notes } = validationResult.data;
    
    // Fetch the current lead
    const [currentLead] = await db.select().from(leads).where(eq(leads.id, leadId));
    
    if (!currentLead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    
    // Implement the HandToDispatch guardrail
    if (status === "HandToDispatch") {
      // Enforce callAttempts >= 3
      if (!currentLead.callAttempts || currentLead.callAttempts < 3) {
        return res.status(412).json({
          message: "Precondition failed: Must have at least 3 call attempts before handing to dispatch",
          code: "INSUFFICIENT_CALL_ATTEMPTS"
        });
      }
      
      // Enforce MC Number presence
      if (!currentLead.mcNumber || currentLead.mcNumber === "Pending" || currentLead.mcNumber.trim() === "") {
        return res.status(412).json({
          message: "Precondition failed: MC Number is required before handing to dispatch",
          code: "MISSING_MC_NUMBER"
        });
      }
    }
    
    // Build timestamp updates based on status
    const timestampUpdates: Record<string, any> = {};
    
    if (status === "InProgress" && !currentLead.inProgressAt) {
      timestampUpdates.inProgressAt = new Date();
    }
    
    if (status === "HandToDispatch" && !currentLead.handToDispatchAt) {
      timestampUpdates.handToDispatchAt = new Date();
      timestampUpdates.dispatchHandoffDate = new Date();
      timestampUpdates.dispatchHandoffBy = req.user?.id;
    }
    
    if (status === "Active" && !currentLead.activatedAt) {
      timestampUpdates.activatedAt = new Date();
    }
    
    // Create activity record for timeline
    const newActivity = {
      type: "status_change",
      userId: req.user?.id || 0,
      timestamp: new Date().toISOString(),
      payload: {
        previousStatus: currentLead.status,
        newStatus: status,
        notes: notes || undefined
      }
    };
    
    // Append to existing timeline or create new one
    let activityTimeline = currentLead.activityTimeline || [];
    if (typeof activityTimeline === 'string') {
      try {
        activityTimeline = JSON.parse(activityTimeline);
      } catch (e) {
        activityTimeline = [];
      }
    }
    
    activityTimeline = [...activityTimeline, newActivity];
    
    // Update the lead status
    const [updatedLead] = await db
      .update(leads)
      .set({
        status,
        ...timestampUpdates,
        notes: notes || currentLead.notes,
        activityTimeline: JSON.stringify(activityTimeline),
        updatedAt: new Date()
      })
      .where(eq(leads.id, leadId))
      .returning();
    
    // If status is HandToDispatch, create a handoff record
    if (status === "HandToDispatch") {
      // Create a lead handoff record
      await db.insert(leadHandoffs).values({
        leadId,
        salesRepId: req.user?.id || 0,
        handoffDate: new Date(),
        status: "pending",
        callsVerified: true,
        requiredFormsFilled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Notify clients about lead update using unified socket system
    notifyDataChange(
      'lead',
      leadId,
      'updated',
      updatedLead,
      {
        userId: updatedLead.assignedTo,
        orgId: req.user?.orgId,
        broadcastToOrg: true
      }
    );
    
    // Send specific notification for status change
    notifyDataChange(
      'lead-status',
      leadId,
      'updated',
      {
        leadId,
        previousStatus: currentLead.status,
        newStatus: status,
        updatedBy: req.user?.id,
        timestamp: new Date().toISOString()
      },
      {
        broadcastToOrg: true,
        orgId: req.user?.orgId
      }
    );
    
    // Special notification for HandToDispatch
    if (status === "HandToDispatch") {
      notifyDataChange(
        'lead-handoff',
        leadId,
        'created',
        {
          leadId,
          salesRepId: req.user?.id,
          timestamp: new Date().toISOString()
        },
        {
          broadcastToOrg: true,
          orgId: req.user?.orgId
        }
      );
    }
    
    return res.json(updatedLead);
  } catch (error: any) {
    console.error("Error updating lead status:", error);
    return res.status(500).json({ message: "Server error updating lead status" });
  }
});

// Update lead qualification score
leadsRouter.patch("/:id/qualification", authMiddleware, async (req, res) => {
  try {
    const leadId = Number(req.params.id);
    
    if (isNaN(leadId)) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }
    
    // Validate the request body
    const validationResult = qualificationUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid qualification update data", 
        errors: validationResult.error.errors 
      });
    }
    
    const { qualificationScore, notes } = validationResult.data;
    
    // Fetch the current lead
    const [currentLead] = await db.select().from(leads).where(eq(leads.id, leadId));
    
    if (!currentLead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    
    // Create activity record for timeline
    const newActivity = {
      type: "qualification_updated",
      userId: req.user?.id || 0,
      timestamp: new Date().toISOString(),
      payload: {
        previousScore: currentLead.qualificationScore,
        qualificationScore,
        notes: notes || undefined
      }
    };
    
    // Append to existing timeline or create new one
    let activityTimeline = currentLead.activityTimeline || [];
    if (typeof activityTimeline === 'string') {
      try {
        activityTimeline = JSON.parse(activityTimeline);
      } catch (e) {
        activityTimeline = [];
      }
    }
    
    activityTimeline = [...activityTimeline, newActivity];
    
    // Update the lead qualification score
    const [updatedLead] = await db
      .update(leads)
      .set({
        qualificationScore,
        activityTimeline: JSON.stringify(activityTimeline),
        updatedAt: new Date()
      })
      .where(eq(leads.id, leadId))
      .returning();
    
    // Notify clients about lead qualification update
    notifyDataChange(
      'lead',
      leadId,
      'updated',
      updatedLead,
      {
        userId: updatedLead.assignedTo,
        orgId: req.user?.orgId,
        broadcastToOrg: true
      }
    );
    
    // Send specific notification for qualification change
    notifyDataChange(
      'lead-qualification',
      leadId,
      'updated',
      {
        leadId,
        previousScore: currentLead.qualificationScore,
        newScore: qualificationScore,
        updatedBy: req.user?.id,
        timestamp: new Date().toISOString()
      },
      {
        broadcastToOrg: true,
        orgId: req.user?.orgId
      }
    );
    
    return res.json(updatedLead);
  } catch (error: any) {
    console.error("Error updating lead qualification:", error);
    return res.status(500).json({ message: "Server error updating lead qualification" });
  }
});

// Get lead activities timeline
leadsRouter.get("/:id/timeline", authMiddleware, async (req, res) => {
  try {
    const leadId = Number(req.params.id);
    
    if (isNaN(leadId)) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }
    
    // Fetch the lead with timeline
    const [lead] = await db.select({
      activityTimeline: leads.activityTimeline
    }).from(leads).where(eq(leads.id, leadId));
    
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    
    // Parse the timeline JSON
    let timeline = [];
    if (lead.activityTimeline) {
      try {
        if (typeof lead.activityTimeline === 'string') {
          timeline = JSON.parse(lead.activityTimeline);
        } else {
          timeline = lead.activityTimeline;
        }
      } catch (e) {
        console.error("Error parsing timeline JSON:", e);
      }
    }
    
    // Enrich the timeline with user information
    const userIds = [...new Set(timeline.map((activity: any) => activity.userId))];
    
    if (userIds.length > 0) {
      const userMap = await db.query.users.findMany({
        where: or(...userIds.map(id => eq(users.id, id))),
        columns: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        }
      }).then(users => {
        return users.reduce((map: Record<number, any>, user) => {
          map[user.id] = user;
          return map;
        }, {});
      });
      
      // Add username to each activity
      timeline = timeline.map((activity: any) => ({
        ...activity,
        username: userMap[activity.userId] 
          ? `${userMap[activity.userId].firstName} ${userMap[activity.userId].lastName}` 
          : 'Unknown User'
      }));
    }
    
    return res.json(timeline);
  } catch (error: any) {
    console.error("Error fetching lead timeline:", error);
    return res.status(500).json({ message: "Server error fetching lead timeline" });
  }
});

export default leadsRouter;