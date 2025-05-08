import express from "express";
import { storage } from "../storage";
import { formatDate } from "../utils/formatters";
import { z } from "zod";

const router = express.Router();

// Query parameter validation schema
const dashboardQuerySchema = z.object({
  timeframe: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
  salesRep: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// Main dashboard endpoint
router.get("/crm/dashboard", async (req, res) => {
  try {
    const { timeframe, salesRep, status, dateFrom, dateTo } = dashboardQuerySchema.parse(req.query);
    
    // Get start and end dates based on timeframe
    const { startDate, endDate } = getDateRangeFromTimeframe(timeframe);
    
    // Additional filters
    const filters = {
      ...(salesRep ? { salesRep: parseInt(salesRep, 10) } : {}),
      ...(status ? { status } : {}),
      ...(dateFrom ? { startDate: new Date(dateFrom) } : { startDate }),
      ...(dateTo ? { endDate: new Date(dateTo) } : { endDate }),
    };
    
    // CRM Dashboard data
    const leadsOverview = await getLeadsOverview(filters);
    const conversionRatios = await getConversionRatios(filters);
    const handoffRates = await getHandoffRates(filters);
    const commissionHighlights = await getCommissionHighlights(filters);
    const topPerformers = await getTopPerformers(filters);
    
    res.json({
      leadsOverview,
      conversionRatios,
      handoffRates,
      commissionHighlights,
      topPerformers,
    });
  } catch (error) {
    console.error("CRM Dashboard error:", error);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

// Helper function to get date range from timeframe
function getDateRangeFromTimeframe(timeframe: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);
  
  switch (timeframe) {
    case "day":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      break;
    case "month":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "quarter":
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
  }
  
  return { startDate, endDate };
}

// Data gathering functions for each dashboard component
async function getLeadsOverview(filters: any) {
  // Sample data structure - in a real implementation, this would fetch from DB
  return {
    totalLeads: 120,
    newLeads: 28,
    qualifiedLeads: 45,
    conversion: 0.38,
    trend: [
      { month: "Jan", created: 30, qualified: 12, converted: 8 },
      { month: "Feb", created: 40, qualified: 18, converted: 10 },
      { month: "Mar", created: 35, qualified: 15, converted: 9 },
      { month: "Apr", created: 50, qualified: 22, converted: 14 },
      { month: "May", created: 45, qualified: 20, converted: 12 },
      { month: "Jun", created: 60, qualified: 28, converted: 15 }
    ],
    byStatus: [
      { name: "New", value: 28 },
      { name: "In Progress", value: 34 },
      { name: "Follow Up", value: 22 },
      { name: "Hand to Dispatch", value: 18 },
      { name: "Active", value: 12 },
      { name: "Lost", value: 6 }
    ],
    bySource: [
      { name: "Website", value: 35 },
      { name: "Referral", value: 25 },
      { name: "Cold Call", value: 20 },
      { name: "Event", value: 15 },
      { name: "Partner", value: 15 },
      { name: "Other", value: 10 }
    ]
  };
}

async function getConversionRatios(filters: any) {
  // Sample data structure - in a real implementation, this would fetch from DB
  return {
    qualification: 0.65, // 65% of leads get qualified
    handoff: 0.48,       // 48% of qualified leads get handed to dispatch
    closing: 0.72        // 72% of handed off leads become clients
  };
}

async function getHandoffRates(filters: any) {
  // Sample data structure - in a real implementation, this would fetch from DB
  return {
    overall: {
      success: 45,
      failed: 15,
      total: 60,
      rate: 0.75
    },
    trend: [
      { month: "Jan", success: 6, failed: 2 },
      { month: "Feb", success: 8, failed: 3 },
      { month: "Mar", success: 7, failed: 3 },
      { month: "Apr", success: 10, failed: 2 },
      { month: "May", success: 9, failed: 3 },
      { month: "Jun", success: 5, failed: 2 }
    ],
    bySalesRep: [
      { name: "John Doe", success: 12, failed: 3, total: 15, rate: 0.8 },
      { name: "Jane Smith", success: 10, failed: 4, total: 14, rate: 0.71 },
      { name: "Alex Johnson", success: 9, failed: 2, total: 11, rate: 0.82 },
      { name: "Emily Brown", success: 8, failed: 3, total: 11, rate: 0.73 },
      { name: "Michael Wilson", success: 6, failed: 3, total: 9, rate: 0.67 }
    ]
  };
}

async function getCommissionHighlights(filters: any) {
  // Sample data structure - in a real implementation, this would fetch from DB
  return {
    total: 52500,
    achieved: 42000,
    target: 75000,
    projection: 63000,
    categories: [
      { name: "Lead Generation", amount: 15000, percentage: 0.29 },
      { name: "Client Conversion", amount: 22500, percentage: 0.43 },
      { name: "Retention Bonus", amount: 8500, percentage: 0.16 },
      { name: "Referral", amount: 6500, percentage: 0.12 }
    ],
    previous: {
      total: 48000
    }
  };
}

async function getTopPerformers(filters: any) {
  // Sample data structure - in a real implementation, this would fetch from DB
  return {
    topRevenue: [
      { name: "John Doe", revenue: 25000, leads: 35, conversions: 0.77 },
      { name: "Jane Smith", revenue: 22000, leads: 30, conversions: 0.73 },
      { name: "Alex Johnson", revenue: 18500, leads: 28, conversions: 0.68 },
      { name: "Emily Brown", revenue: 16000, leads: 25, conversions: 0.64 },
      { name: "Michael Wilson", revenue: 14500, leads: 22, conversions: 0.59 }
    ],
    topLeads: [
      { name: "John Doe", revenue: 25000, leads: 35, conversions: 0.77 },
      { name: "Jane Smith", revenue: 22000, leads: 30, conversions: 0.73 },
      { name: "Alex Johnson", revenue: 18500, leads: 28, conversions: 0.68 },
      { name: "Emily Brown", revenue: 16000, leads: 25, conversions: 0.64 },
      { name: "Michael Wilson", revenue: 14500, leads: 22, conversions: 0.59 }
    ],
    topConversion: [
      { name: "John Doe", revenue: 25000, leads: 35, conversions: 0.77 },
      { name: "Alex Johnson", revenue: 18500, leads: 28, conversions: 0.68 },
      { name: "Jane Smith", revenue: 22000, leads: 30, conversions: 0.73 },
      { name: "Michael Wilson", revenue: 14500, leads: 22, conversions: 0.59 },
      { name: "Emily Brown", revenue: 16000, leads: 25, conversions: 0.64 }
    ],
    period: "month"
  };
}

export default router;