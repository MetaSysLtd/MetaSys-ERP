import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { leads, roles, users } from "@shared/schema";
import { eq } from "drizzle-orm";

const mqlRouter = Router();

// Schema for validating MQL webhook payload
const mqlWebhookSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  truckType: z.string().optional(),
  mcNumber: z.string().optional(),
  sourceForm: z.string().optional(),
});

type MQLWebhookPayload = z.infer<typeof mqlWebhookSchema>;

// Get the sales-unassigned user (Admin for now as fallback)
async function getUnassignedSalesUserID(): Promise<number> {
  try {
    // Try to find a user with role in sales department to auto-assign
    const salesRole = await db.query.roles.findFirst({
      where: eq(roles.department, "sales"),
    });
    
    if (salesRole) {
      const salesUser = await db.query.users.findFirst({
        where: eq(users.roleId, salesRole.id),
      });
      
      if (salesUser) {
        return salesUser.id;
      }
    }
    
    // Fallback to admin user (ID 1)
    return 1;
  } catch (error) {
    console.error("Error finding unassigned sales user:", error);
    // Default to admin user if there's an error
    return 1;
  }
}

// MQL Webhook endpoint for automatic lead creation
mqlRouter.post("/webhook", async (req, res) => {
  try {
    // Validate the incoming payload
    const validationResult = mqlWebhookSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid MQL payload",
        errors: validationResult.error.errors,
      });
    }
    
    const payload = validationResult.data;
    
    // Get unassigned sales user ID
    const assignedUserId = await getUnassignedSalesUserID();
    
    // Create the lead with MQL source
    const [newLead] = await db.insert(leads).values({
      companyName: payload.companyName,
      contactName: payload.contactName,
      phoneNumber: payload.phone,
      email: payload.email || null,
      mcNumber: payload.mcNumber || "Pending",
      equipmentType: payload.truckType || "unknown",
      factoringStatus: "needs-factoring", // Default for MQLs
      truckCategory: null,
      serviceCharges: 5, // Default to 5%
      status: "New",
      source: "MQL",
      sourceDetails: payload.sourceForm || "Website Form",
      qualificationScore: "Medium", // Default qualification score
      assignedTo: assignedUserId,
      createdBy: assignedUserId,
      orgId: 1, // Default organization ID
      
      // Add the initial activity to the timeline
      activityTimeline: JSON.stringify([
        {
          type: "lead_created",
          userId: assignedUserId,
          timestamp: new Date().toISOString(),
          payload: {
            source: "MQL",
            sourceDetails: payload.sourceForm || "Website Form",
          }
        }
      ]),
    }).returning();
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: "MQL lead created successfully",
      leadId: newLead.id,
    });
  } catch (error: any) {
    console.error("Error creating MQL lead:", error);
    
    return res.status(500).json({
      success: false,
      message: "Server error while creating MQL lead",
      error: error.message,
    });
  }
});

export default mqlRouter;