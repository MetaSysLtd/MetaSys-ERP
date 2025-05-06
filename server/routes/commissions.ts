import express from "express";
import { storage } from "../storage";
import { createAuthMiddleware } from "../middleware/auth";
import { and, desc, eq, gte, lte, inArray } from "drizzle-orm";
import { users, roles, commissionPolicy, commissionsMonthly, leadRecords, leadSalesUsers } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Extend Express Request type to include userRole
declare global {
  namespace Express {
    interface Request {
      userRole?: {
        id: number;
        name: string;
        description: string | null;
        level: number;
        department: string;
        permissions: any;
        isAdmin: boolean;
        canManageUsers: boolean;
      };
    }
  }
}

const router = express.Router();

// Get all sales representatives
router.get("/sales-reps", createAuthMiddleware(1), async (req, res) => {
  try {
    const month = req.query.month as string || new Date().toISOString().slice(0, 7);
    const orgId = req.user?.orgId || 1;
    
    // Get all users with sales roles
    const salesReps = await storage.getUsersByRole("sales");
    
    // Get commission data for each sales rep for this month
    const commissionData = await Promise.all(
      salesReps.map(async (rep) => {
        // Get commission for this month
        const commission = await storage.getCommissionMonthlyByUserAndMonth(rep.id, month);
        
        // Get previous month's commission for comparison
        const [year, monthNum] = month.split("-").map(Number);
        const prevDate = new Date(year, monthNum - 2, 1);
        const prevMonth = prevDate.toISOString().slice(0, 7);
        const prevCommission = await storage.getCommissionMonthlyByUserAndMonth(rep.id, prevMonth);
        
        // Calculate growth percentage
        let growth;
        if (prevCommission && prevCommission.totalCommission > 0) {
          growth = Math.round(
            ((commission?.totalCommission || 0) - prevCommission.totalCommission) / 
            prevCommission.totalCommission * 100
          );
        } else if ((commission?.totalCommission || 0) > 0) {
          growth = 100; // If no previous commission but current exists, 100% growth
        } else {
          growth = 0;
        }
        
        // Get performance target
        const targets = await storage.getPerformanceTargets({ type: "monthly" });
        const salesTarget = targets.sales?.monthly || 50000;
        const target = salesTarget / (salesReps.length || 1); // Divide by number of reps
        
        // Calculate days since user joined
        const joinedDays = Math.floor(
          (new Date().getTime() - new Date(rep.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return {
          id: commission?.id || 0,
          userId: rep.id,
          username: rep.username,
          firstName: rep.firstName,
          lastName: rep.lastName,
          profileImageUrl: rep.profileImageUrl,
          totalCommission: commission?.totalCommission || 0,
          leads: commission?.activeLeads || 0,
          clients: Math.floor((commission?.activeLeads || 0) / 3), // Simplified calculation
          previousCommission: prevCommission?.totalCommission || 0,
          growth,
          target,
          targetPercentage: Math.min(
            Math.round(((commission?.totalCommission || 0) / target) * 100), 
            100
          ),
          joinedDays,
          rank: 0 // Will be calculated after sorting
        };
      })
    );
    
    // Sort by total commission and assign ranks
    const sortedData = commissionData
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .map((rep, index) => ({ ...rep, rank: index + 1 }));
    
    res.json(sortedData);
  } catch (error) {
    console.error("Error fetching sales rep data:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch sales rep data" 
    });
  }
});

// Get detailed commission metrics for a specific sales rep
router.get("/metrics/:userId", createAuthMiddleware(1), async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const month = req.query.month as string || new Date().toISOString().slice(0, 7);
    
    // Check permission - users can only view their own data unless they're managers
    if (req.userRole?.level === 1 && req.user?.id !== userId) {
      return res.status(403).json({ 
        status: "error", 
        message: "You don't have permission to view this data" 
      });
    }
    
    // Get commission data for this month
    const commission = await storage.getCommissionMonthlyByUserAndMonth(userId, month);
    
    // Get previous month's commission
    const [year, monthNum] = month.split("-").map(Number);
    const prevDate = new Date(year, monthNum - 2, 1);
    const prevMonth = prevDate.toISOString().slice(0, 7);
    const prevCommission = await storage.getCommissionMonthlyByUserAndMonth(userId, prevMonth);
    
    // Get all sales reps
    const salesReps = await storage.getUsersByRole("sales");
    
    // Get monthly commissions for all reps to calculate rank
    const allCommissions = await Promise.all(
      salesReps.map(rep => storage.getCommissionMonthlyByUserAndMonth(rep.id, month))
    );
    
    // Filter out undefined commissions and sort by totalCommission
    const validCommissions = allCommissions
      .filter(comm => comm !== undefined)
      .sort((a, b) => (b?.totalCommission || 0) - (a?.totalCommission || 0));
    
    // Find rank of current user
    const rank = validCommissions.findIndex(comm => comm?.userId === userId) + 1;
    
    // Get performance targets
    const targets = await storage.getPerformanceTargets({ type: "monthly" });
    const salesTarget = targets.sales?.monthly || 50000;
    const individualTarget = salesTarget / (salesReps.length || 1);
    
    // Get historical data for badges
    const pastMonths = [];
    let consecutiveGrowth = 0;
    let currentAmount = commission?.totalCommission || 0;
    
    // Calculate consecutive growth months
    for (let i = 1; i <= 6; i++) {
      const date = new Date(year, monthNum - 1 - i, 1);
      const pastMonth = date.toISOString().slice(0, 7);
      const pastCommission = await storage.getCommissionMonthlyByUserAndMonth(userId, pastMonth);
      
      if (pastCommission) {
        pastMonths.push(pastCommission);
        
        if (currentAmount > pastCommission.totalCommission && pastCommission.totalCommission > 0) {
          consecutiveGrowth++;
          currentAmount = pastCommission.totalCommission;
        } else {
          break;
        }
      }
    }
    
    // Get all-time stats
    const allLeads = await storage.getLeadsByUser(userId);
    const allClients = await storage.getClientsByUser(userId);
    
    // Determine badges
    const badges = [];
    const targetPercentage = Math.min(
      Math.round(((commission?.totalCommission || 0) / individualTarget) * 100), 
      100
    );
    
    if (rank === 1) badges.push("top-performer");
    if (targetPercentage >= 100) badges.push("target-achieved");
    if (consecutiveGrowth >= 2) badges.push("consistent-growth");
    if (targetPercentage < 70) badges.push("at-risk");
    
    // Current and previous amounts
    const currentAmount2 = commission?.totalCommission || 0;
    const previousAmount = prevCommission?.totalCommission || 0;
    
    // Calculate growth percentage
    let growth = 0;
    if (previousAmount > 0) {
      growth = Math.round((currentAmount2 - previousAmount) / previousAmount * 100);
    } else if (currentAmount2 > 0) {
      growth = 100;
    }
    
    // Format response
    const response = {
      userId,
      targetAmount: individualTarget,
      currentAmount: currentAmount2,
      previousAmount,
      leads: commission?.activeLeads || 0,
      clients: Math.floor((commission?.activeLeads || 0) / 3), // Simplified calculation
      growth,
      targetPercentage,
      deptRank: rank,
      deptTotal: salesReps.length,
      badges,
      allTimeLeads: allLeads.length,
      allTimeClients: allClients.length,
      consecutiveGrowth
    };
    
    res.json(response);
  } catch (error) {
    console.error("Error fetching commission metrics:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch commission metrics" 
    });
  }
});

// Get commission monthly data by user
router.get("/monthly/user/:userId", createAuthMiddleware(1), async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    
    // Check permission - users can only view their own data unless they're managers
    if (req.userRole?.level === 1 && req.user?.id !== userId) {
      return res.status(403).json({ 
        status: "error", 
        message: "You don't have permission to view this data" 
      });
    }
    
    // Get all monthly commissions for this user
    const commissions = await storage.getCommissionsMonthlyByUser(userId);
    
    // If no commissions, generate mock data for last 6 months
    if (!commissions || commissions.length === 0) {
      const months = [];
      const currentDate = new Date();
      
      for (let i = 0; i < 6; i++) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        months.push({
          month: date.toISOString().slice(0, 7),
        });
      }
      
      return res.json({
        userId,
        month: months[0].month,
        commissions: months
      });
    }
    
    // Return structured response
    res.json({
      userId,
      month: commissions[0]?.month || new Date().toISOString().slice(0, 7),
      commissions: commissions.map(comm => ({ month: comm.month }))
    });
  } catch (error) {
    console.error("Error fetching user commissions:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch user commissions" 
    });
  }
});

// Get commission monthly data by month
router.get("/monthly/user/:userId/:month", createAuthMiddleware(1), async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const month = req.params.month;
    
    // Check permission - users can only view their own data unless they're managers
    if (req.userRole?.level === 1 && req.user?.id !== userId) {
      return res.status(403).json({ 
        status: "error", 
        message: "You don't have permission to view this data" 
      });
    }
    
    // Get commission data for this month
    const commission = await storage.getCommissionMonthlyByUserAndMonth(userId, month);
    
    // If no commission data found, return 404
    if (!commission) {
      return res.status(404).json({ 
        status: "error", 
        message: "No commission data found for this month" 
      });
    }
    
    // Get related transaction items
    const transactions = await storage.getTransactionsByUserAndMonth(userId, month);
    
    // Format response
    const response = {
      userId,
      month,
      total: commission.totalCommission,
      leads: commission.activeLeads,
      clients: Math.floor(commission.activeLeads / 3), // Simplified calculation
      items: transactions.map(t => ({
        id: t.id,
        date: t.date || new Date().toISOString(),
        clientName: t.clientName || "Client",
        type: t.type || "Lead",
        amount: t.amount || 0,
        leadSource: t.source || "Direct",
        status: t.status || "Completed"
      }))
    };
    
    res.json(response);
  } catch (error) {
    console.error("Error fetching monthly commission:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch monthly commission data" 
    });
  }
});

export default router;