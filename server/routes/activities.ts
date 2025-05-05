import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { activities, insertActivitySchema } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { createAuthMiddleware } from "../auth-middleware";
import { notifyDataChange } from "../socket";

const activitiesRouter = Router();
const authMiddleware = createAuthMiddleware();

// Get all activities
activitiesRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const activityList = await db.select().from(activities).orderBy(desc(activities.timestamp));
    res.json(activityList);
  } catch (error: any) {
    console.error("Error fetching activities:", error);
    return res.status(500).json({ message: "Server error fetching activities" });
  }
});

// Get activities for a specific entity (lead, account, etc.)
activitiesRouter.get("/entity/:entityType/:entityId", authMiddleware, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const entityIdNumber = parseInt(entityId);
    
    if (isNaN(entityIdNumber)) {
      return res.status(400).json({ message: "Invalid entity ID" });
    }
    
    const activityList = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.entityType, entityType as any),
          eq(activities.entityId, entityIdNumber)
        )
      )
      .orderBy(desc(activities.timestamp));
    
    res.json(activityList);
  } catch (error: any) {
    console.error(`Error fetching activities for ${req.params.entityType}/${req.params.entityId}:`, error);
    return res.status(500).json({ message: "Server error fetching activities" });
  }
});

// Create a new activity
activitiesRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || 0;
    
    // Validate the request body
    const validationResult = insertActivitySchema.safeParse({
      ...req.body,
      userId
    });
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid activity data", 
        errors: validationResult.error.errors 
      });
    }
    
    const data = validationResult.data;
    
    // If this is a reminder, ensure reminder date is present
    if (data.action === 'reminder' && !data.reminderDate) {
      return res.status(400).json({ 
        message: "Reminder date is required for reminder activities"
      });
    }
    
    const [activity] = await db.insert(activities).values(data).returning();
    res.status(201).json(activity);
  } catch (error: any) {
    console.error("Error creating activity:", error);
    return res.status(500).json({ message: "Server error creating activity" });
  }
});

// Mark a reminder as completed
activitiesRouter.patch("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const activityId = parseInt(req.params.id);
    
    if (isNaN(activityId)) {
      return res.status(400).json({ message: "Invalid activity ID" });
    }
    
    // Get the activity to ensure it exists and is a reminder
    const [existingActivity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId));
    
    if (!existingActivity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    
    if (existingActivity.action !== 'reminder') {
      return res.status(400).json({ message: "Only reminder activities can be marked as completed" });
    }
    
    // Update the activity
    const [updatedActivity] = await db
      .update(activities)
      .set({
        reminderCompleted: true
      })
      .where(eq(activities.id, activityId))
      .returning();
    
    res.json(updatedActivity);
  } catch (error: any) {
    console.error(`Error completing activity ${req.params.id}:`, error);
    return res.status(500).json({ message: "Server error completing activity" });
  }
});

// Delete an activity
activitiesRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const activityId = parseInt(req.params.id);
    
    if (isNaN(activityId)) {
      return res.status(400).json({ message: "Invalid activity ID" });
    }
    
    // Check if the activity exists
    const [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId));
    
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    
    // Delete the activity
    await db.delete(activities).where(eq(activities.id, activityId));
    
    res.status(204).end();
  } catch (error: any) {
    console.error(`Error deleting activity ${req.params.id}:`, error);
    return res.status(500).json({ message: "Server error deleting activity" });
  }
});

export default activitiesRouter;