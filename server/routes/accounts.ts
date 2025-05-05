import express, { Router } from 'express';
import { accounts, activities, insertAccountSchema, insertActivitySchema } from '@shared/schema';
import { createAuthMiddleware } from '../auth-middleware';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { notifyDataChange } from '../socket';
import { logger } from '../logger';
import { z } from 'zod';

const accountsRouter = Router();
const authMiddleware = createAuthMiddleware();

/**
 * Get all accounts
 */
accountsRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.select().from(accounts);
    return res.json(result);
  } catch (error: any) {
    logger.error("Error fetching accounts:", error);
    return res.status(500).json({ message: "Server error fetching accounts" });
  }
});

/**
 * Get account by ID
 */
accountsRouter.get('/:id', authMiddleware, async (req, res) => {
  try {
    const accountId = Number(req.params.id);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }
    
    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
    
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    return res.json(account);
  } catch (error: any) {
    logger.error(`Error fetching account ${req.params.id}:`, error);
    return res.status(500).json({ message: "Server error fetching account" });
  }
});

/**
 * Create a new account
 */
accountsRouter.post('/', authMiddleware, async (req, res) => {
  try {
    // Validate incoming data
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User ID is required" });
    }
    
    const data = insertAccountSchema.parse({
      ...req.body,
      createdBy: userId,
      // If no assignedTo is provided, assign to the creator
      assignedTo: req.body.assignedTo || userId,
      // If no orgId is provided, use the user's orgId
      orgId: req.body.orgId || req.user?.orgId || 1
    });
    
    // Create the account
    const [createdAccount] = await db.insert(accounts).values(data).returning();
    
    // Log this activity
    const activityData = insertActivitySchema.parse({
      userId,
      entityType: 'account',
      entityId: createdAccount.id,
      action: 'created',
      details: `Created new account: ${createdAccount.name}`
    });
    
    const [activity] = await db.insert(activities).values(activityData).returning();
    
    // Notify clients about account creation
    notifyDataChange(
      'account',
      createdAccount.id,
      'created',
      createdAccount,
      {
        userId: createdAccount.assignedTo || undefined,
        orgId: req.user?.orgId || undefined,
        broadcastToOrg: true
      }
    );
    
    // Notify about activity creation
    notifyDataChange(
      'activity',
      activity.id,
      'created',
      activity,
      {
        userId: userId || undefined,
        orgId: req.user?.orgId || undefined,
        broadcastToOrg: true
      }
    );
    
    return res.status(201).json(createdAccount);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: "Invalid account data",
        errors: error.errors
      });
    }
    logger.error("Error creating account:", error);
    return res.status(500).json({ message: "Server error creating account" });
  }
});

/**
 * Update an account
 */
accountsRouter.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const accountId = Number(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }
    
    if (!userId) {
      return res.status(401).json({ message: "User ID is required" });
    }
    
    // Fetch existing account
    const [existingAccount] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId));
    
    if (!existingAccount) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    // Update the account
    const [updatedAccount] = await db
      .update(accounts)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(accounts.id, accountId))
      .returning();
    
    // Log this update activity
    const changes = Object.entries(req.body)
      .filter(([key, value]) => {
        // Only include valid keys that exist in the account schema
        return value !== undefined && 
               key in existingAccount && 
               existingAccount[key as keyof typeof existingAccount] !== value;
      })
      .map(([key, value]) => {
        const oldValue = existingAccount[key as keyof typeof existingAccount];
        return `${key}: ${oldValue} → ${value}`;
      })
      .join(', ');
    
    if (changes) {
      const activityData = insertActivitySchema.parse({
        userId,
        entityType: 'account',
        entityId: accountId,
        action: 'updated',
        details: `Updated account: ${changes}`
      });
      
      const [activity] = await db.insert(activities).values(activityData).returning();
      
      // Notify about activity creation
      notifyDataChange(
        'activity',
        activity.id,
        'created',
        activity,
        {
          userId: userId || undefined,
          orgId: req.user?.orgId || undefined,
          broadcastToOrg: true
        }
      );
    }
    
    // Notify clients about account update
    notifyDataChange(
      'account',
      updatedAccount.id,
      'updated',
      updatedAccount,
      {
        userId: updatedAccount.assignedTo || undefined,
        orgId: req.user?.orgId || undefined,
        broadcastToOrg: true
      }
    );
    
    return res.json(updatedAccount);
  } catch (error: any) {
    logger.error(`Error updating account ${req.params.id}:`, error);
    return res.status(500).json({ message: "Server error updating account" });
  }
});

/**
 * Delete an account
 */
accountsRouter.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const accountId = Number(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }
    
    if (!userId) {
      return res.status(401).json({ message: "User ID is required" });
    }
    
    // Fetch existing account
    const [existingAccount] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId));
    
    if (!existingAccount) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    // Delete the account
    await db
      .delete(accounts)
      .where(eq(accounts.id, accountId));
    
    // Log this deletion activity
    const activityData = insertActivitySchema.parse({
      userId,
      entityType: 'account',
      entityId: accountId,
      action: 'deleted',
      details: `Deleted account: ${existingAccount.name}`
    });
    
    const [activity] = await db.insert(activities).values(activityData).returning();
    
    // Notify about activity creation
    notifyDataChange(
      'activity',
      activity.id,
      'created',
      activity,
      {
        userId: userId || undefined,
        orgId: req.user?.orgId || undefined,
        broadcastToOrg: true
      }
    );
    
    // Notify clients about account deletion
    notifyDataChange(
      'account',
      accountId,
      'deleted',
      existingAccount,
      {
        userId: existingAccount.assignedTo || undefined,
        orgId: req.user?.orgId || undefined,
        broadcastToOrg: true
      }
    );
    
    return res.status(204).end();
  } catch (error: any) {
    logger.error(`Error deleting account ${req.params.id}:`, error);
    return res.status(500).json({ message: "Server error deleting account" });
  }
});

export default accountsRouter;