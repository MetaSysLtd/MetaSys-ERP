import express, { Request } from "express";
import { db } from "../db";
import { hrLeavePolicies, hrLeaveBalances, hrLeaveRequests, insertHrLeavePolicySchema, insertHrLeaveBalanceSchema, insertHrLeaveRequestSchema } from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { createAuthMiddleware } from "../auth-middleware";

// Add user property to Express.Request
declare global {
  namespace Express {
    interface Request {
      user: {
        id: number;
        orgId: number; 
        isSystemAdmin?: boolean;
        canManageUsers?: boolean;
      };
      userRole: any;
    }
  }
}

const router = express.Router();

// Middleware to ensure user is authenticated
router.use(createAuthMiddleware(1));

// Get all leave policies for an organization
router.get("/policies", async (req, res) => {
  try {
    const orgId = req.user.orgId;
    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    const policies = await db.select().from(hrLeavePolicies).where(eq(hrLeavePolicies.orgId, orgId));
    return res.json(policies);
  } catch (error) {
    console.error("Error fetching leave policies:", error);
    return res.status(500).json({ error: "Failed to fetch leave policies" });
  }
});

// Create a new leave policy
router.post("/policies", async (req, res) => {
  try {
    const orgId = req.user.orgId;
    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    // Validate request body against schema
    const validatedData = insertHrLeavePolicySchema.parse({
      ...req.body,
      orgId,
      createdBy: req.user.id
    });

    const newPolicy = await db.insert(hrLeavePolicies).values(validatedData).returning();
    return res.status(201).json(newPolicy[0]);
  } catch (error) {
    console.error("Error creating leave policy:", error);
    return res.status(500).json({ error: "Failed to create leave policy" });
  }
});

// Update a leave policy
router.patch("/policies/:id", async (req, res) => {
  try {
    const policyId = parseInt(req.params.id);
    const orgId = req.user.orgId;
    
    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    // Check if policy exists and belongs to user's organization
    const existingPolicy = await db.select()
      .from(hrLeavePolicies)
      .where(and(
        eq(hrLeavePolicies.id, policyId),
        eq(hrLeavePolicies.orgId, orgId)
      ));

    if (existingPolicy.length === 0) {
      return res.status(404).json({ error: "Leave policy not found" });
    }

    // Update the policy
    const updatedPolicy = await db.update(hrLeavePolicies)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(hrLeavePolicies.id, policyId))
      .returning();

    return res.json(updatedPolicy[0]);
  } catch (error) {
    console.error("Error updating leave policy:", error);
    return res.status(500).json({ error: "Failed to update leave policy" });
  }
});

// Delete a leave policy
router.delete("/policies/:id", async (req, res) => {
  try {
    const policyId = parseInt(req.params.id);
    const orgId = req.user.orgId;
    
    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    // Check if policy exists and belongs to user's organization
    const existingPolicy = await db.select()
      .from(hrLeavePolicies)
      .where(and(
        eq(hrLeavePolicies.id, policyId),
        eq(hrLeavePolicies.orgId, orgId)
      ));

    if (existingPolicy.length === 0) {
      return res.status(404).json({ error: "Leave policy not found" });
    }

    // Delete the policy
    await db.delete(hrLeavePolicies).where(eq(hrLeavePolicies.id, policyId));

    return res.json({ message: "Leave policy deleted successfully" });
  } catch (error) {
    console.error("Error deleting leave policy:", error);
    return res.status(500).json({ error: "Failed to delete leave policy" });
  }
});

// Get user's leave balance
router.get("/balances/:userId?", async (req, res) => {
  try {
    const userId = req.params.userId ? parseInt(req.params.userId) : req.user.id;
    const orgId = req.user.orgId;
    
    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    // Get current year's balance
    const currentYear = new Date().getFullYear();
    
    const balance = await db.select()
      .from(hrLeaveBalances)
      .where(and(
        eq(hrLeaveBalances.userId, userId),
        eq(hrLeaveBalances.orgId, orgId),
        eq(hrLeaveBalances.year, currentYear)
      ));

    if (balance.length === 0) {
      // If balance doesn't exist for current year, create one based on policy
      // First get applicable policy for this user
      const policies = await db.select()
        .from(hrLeavePolicies)
        .where(and(
          eq(hrLeavePolicies.orgId, orgId),
          eq(hrLeavePolicies.active, true)
        ));

      // Find the most specific policy for this user
      // Order: Employee-specific > Team > Department > Organization-wide
      let applicablePolicy = policies.find(p => 
        p.policyLevel === "Employee" && p.targetId === userId
      );

      if (!applicablePolicy) {
        // Get user's team
        const userTeams = await db.execute(
          `SELECT t.id FROM teams t 
           JOIN team_members tm ON t.id = tm.team_id 
           WHERE tm.user_id = $1 AND t.org_id = $2`,
          [userId, orgId]
        );
        
        const teamIds = userTeams.rows.map(r => r.id);
        
        // Find team-level policy
        if (teamIds.length > 0) {
          applicablePolicy = policies.find(p => 
            p.policyLevel === "Team" && teamIds.includes(p.targetId)
          );
        }
      }

      if (!applicablePolicy) {
        // Find department-level policy
        const userDept = await db.execute(
          `SELECT d.id FROM departments d 
           JOIN users u ON u.department_id = d.id 
           WHERE u.id = $1 AND u.org_id = $2`,
          [userId, orgId]
        );
        
        if (userDept.rows.length > 0) {
          const deptId = userDept.rows[0].id;
          applicablePolicy = policies.find(p => 
            p.policyLevel === "Department" && p.targetId === deptId
          );
        }
      }

      if (!applicablePolicy) {
        // Use organization-wide policy
        applicablePolicy = policies.find(p => 
          p.policyLevel === "Organization" && p.targetId === orgId
        );
      }

      // If no policy found, use default values
      const newBalance = {
        userId,
        orgId,
        year: currentYear,
        casualLeaveUsed: 0,
        casualLeaveBalance: applicablePolicy?.casualLeaveQuota ?? 8,
        medicalLeaveUsed: 0,
        medicalLeaveBalance: applicablePolicy?.medicalLeaveQuota ?? 8,
        annualLeaveUsed: 0,
        annualLeaveBalance: applicablePolicy?.annualLeaveQuota ?? 0,
        carryForwardUsed: 0,
        carryForwardBalance: 0,
        policyId: applicablePolicy?.id
      };

      const createdBalance = await db.insert(hrLeaveBalances)
        .values(newBalance)
        .returning();

      return res.json(createdBalance[0]);
    }

    return res.json(balance[0]);
  } catch (error) {
    console.error("Error fetching leave balance:", error);
    return res.status(500).json({ error: "Failed to fetch leave balance" });
  }
});

// Update leave balance (admin only)
router.patch("/balances/:userId", async (req, res) => {
  try {
    if (!req.user.isSystemAdmin && !req.user.canManageUsers) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const userId = parseInt(req.params.userId);
    const orgId = req.user.orgId;
    
    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    const currentYear = new Date().getFullYear();
    
    // Check if balance exists
    const existingBalance = await db.select()
      .from(hrLeaveBalances)
      .where(and(
        eq(hrLeaveBalances.userId, userId),
        eq(hrLeaveBalances.orgId, orgId),
        eq(hrLeaveBalances.year, currentYear)
      ));

    if (existingBalance.length === 0) {
      return res.status(404).json({ error: "Leave balance not found" });
    }

    // Update balance
    const updatedBalance = await db.update(hrLeaveBalances)
      .set({ ...req.body, lastUpdated: new Date() })
      .where(and(
        eq(hrLeaveBalances.userId, userId),
        eq(hrLeaveBalances.orgId, orgId),
        eq(hrLeaveBalances.year, currentYear)
      ))
      .returning();

    return res.json(updatedBalance[0]);
  } catch (error) {
    console.error("Error updating leave balance:", error);
    return res.status(500).json({ error: "Failed to update leave balance" });
  }
});

// Get leave requests for user or all if admin
router.get("/requests", async (req, res) => {
  try {
    const orgId = req.user.orgId;
    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    const { userId, status } = req.query;
    
    // Build the query with SQL template to avoid TypeScript issues
    let queryBuilder = db.select().from(hrLeaveRequests);
    
    // Apply filters
    const conditions = [];
    conditions.push(eq(hrLeaveRequests.orgId, orgId));
    
    if (userId) {
      conditions.push(eq(hrLeaveRequests.userId, parseInt(userId as string)));
    } else if (!req.user.isSystemAdmin && !req.user.canManageUsers) {
      conditions.push(eq(hrLeaveRequests.userId, req.user.id));
    }
    
    if (status) {
      conditions.push(eq(hrLeaveRequests.status, status as string));
    }
    
    // Execute query with AND conditions
    const requests = await queryBuilder.where(and(...conditions)).orderBy(desc(hrLeaveRequests.createdAt));
    
    return res.json(requests);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return res.status(500).json({ error: "Failed to fetch leave requests" });
  }
});

// Create a new leave request
router.post("/requests", async (req, res) => {
  try {
    const userId = req.user.id;
    const orgId = req.user.orgId;
    
    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    // Validate input data
    const validatedData = insertHrLeaveRequestSchema.parse({
      ...req.body,
      userId,
      orgId,
      status: "Pending"
    });

    // Calculate total days excluding weekends
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    let totalDays = 0;
    
    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (day.getDay() !== 0 && day.getDay() !== 6) {
        totalDays++;
      }
    }

    // Create leave request
    const newRequest = await db.insert(hrLeaveRequests)
      .values({ ...validatedData, totalDays })
      .returning();

    return res.status(201).json(newRequest[0]);
  } catch (error) {
    console.error("Error creating leave request:", error);
    return res.status(500).json({ error: "Failed to create leave request" });
  }
});

// Approve/Reject leave request
router.patch("/requests/:id", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const orgId = req.user.orgId;
    
    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    // Check if user has permission to approve/reject
    if (!req.user.isSystemAdmin && !req.user.canManageUsers) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // Get the request
    const existingRequest = await db.select()
      .from(hrLeaveRequests)
      .where(and(
        eq(hrLeaveRequests.id, requestId),
        eq(hrLeaveRequests.orgId, orgId)
      ));

    if (existingRequest.length === 0) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    const request = existingRequest[0];
    
    // Handle approval/rejection
    if (req.body.status === "Approved") {
      // Update leave balance
      const currentYear = new Date().getFullYear();
      const leaveBalance = await db.select()
        .from(hrLeaveBalances)
        .where(and(
          eq(hrLeaveBalances.userId, request.userId),
          eq(hrLeaveBalances.orgId, orgId),
          eq(hrLeaveBalances.year, currentYear)
        ));

      if (leaveBalance.length === 0) {
        return res.status(404).json({ error: "Leave balance not found" });
      }

      const balance = leaveBalance[0];
      const leaveType = request.leaveType;
      
      // Update used and balance fields based on leave type
      let updatedFields = {};
      
      if (leaveType === "Casual") {
        if (balance.casualLeaveBalance < request.totalDays) {
          return res.status(400).json({ error: "Insufficient casual leave balance" });
        }
        updatedFields = {
          casualLeaveUsed: balance.casualLeaveUsed + request.totalDays,
          casualLeaveBalance: balance.casualLeaveBalance - request.totalDays
        };
      } else if (leaveType === "Medical") {
        if (balance.medicalLeaveBalance < request.totalDays) {
          return res.status(400).json({ error: "Insufficient medical leave balance" });
        }
        updatedFields = {
          medicalLeaveUsed: balance.medicalLeaveUsed + request.totalDays,
          medicalLeaveBalance: balance.medicalLeaveBalance - request.totalDays
        };
      } else if (leaveType === "Annual") {
        if (balance.annualLeaveBalance < request.totalDays) {
          return res.status(400).json({ error: "Insufficient annual leave balance" });
        }
        updatedFields = {
          annualLeaveUsed: balance.annualLeaveUsed + request.totalDays,
          annualLeaveBalance: balance.annualLeaveBalance - request.totalDays
        };
      }

      // Update leave balance
      await db.update(hrLeaveBalances)
        .set({ ...updatedFields, lastUpdated: new Date() })
        .where(eq(hrLeaveBalances.id, balance.id));

      // Update request status
      const updatedRequest = await db.update(hrLeaveRequests)
        .set({ 
          status: "Approved", 
          approvedBy: req.user.id, 
          approvedAt: new Date(),
          updatedAt: new Date() 
        })
        .where(eq(hrLeaveRequests.id, requestId))
        .returning();

      return res.json(updatedRequest[0]);
    } else if (req.body.status === "Rejected") {
      // Update request status
      const updatedRequest = await db.update(hrLeaveRequests)
        .set({ 
          status: "Rejected", 
          rejectedBy: req.user.id, 
          rejectedAt: new Date(),
          rejectionReason: req.body.rejectionReason || "No reason provided",
          updatedAt: new Date() 
        })
        .where(eq(hrLeaveRequests.id, requestId))
        .returning();

      return res.json(updatedRequest[0]);
    } else {
      return res.status(400).json({ error: "Invalid status" });
    }
  } catch (error) {
    console.error("Error updating leave request:", error);
    return res.status(500).json({ error: "Failed to update leave request" });
  }
});

// Cancel a leave request (only for pending requests)
router.post("/requests/:id/cancel", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const userId = req.user.id;
    const orgId = req.user.orgId;
    
    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    // Get the request
    const existingRequest = await db.select()
      .from(hrLeaveRequests)
      .where(and(
        eq(hrLeaveRequests.id, requestId),
        eq(hrLeaveRequests.orgId, orgId)
      ));

    if (existingRequest.length === 0) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    const request = existingRequest[0];
    
    // Ensure only the owner or admin can cancel
    if (request.userId !== userId && !req.user.isSystemAdmin && !req.user.canManageUsers) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // Can only cancel pending requests
    if (request.status !== "Pending") {
      return res.status(400).json({ error: "Only pending requests can be cancelled" });
    }

    // Update request status
    const updatedRequest = await db.update(hrLeaveRequests)
      .set({ 
        status: "Cancelled", 
        updatedAt: new Date() 
      })
      .where(eq(hrLeaveRequests.id, requestId))
      .returning();

    return res.json(updatedRequest[0]);
  } catch (error) {
    console.error("Error cancelling leave request:", error);
    return res.status(500).json({ error: "Failed to cancel leave request" });
  }
});

export default router;