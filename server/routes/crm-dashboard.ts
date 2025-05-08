import { Router } from 'express';
import { storage } from '../storage';
import { adminOnly, isAuthenticated } from '../middleware/auth';
import { eq } from 'drizzle-orm';
import { getDateRangeByTimeframe, getCurrentYearMonth } from '../utils/date-formatter';

const router = Router();

// Helper to handle errors consistently
const errorHandler = (res: any, error: any, message: string) => {
  console.error(`CRM Dashboard Error - ${message}:`, error);
  res.status(500).json({ 
    error: message, 
    details: error.message
  });
};

/**
 * GET /api/crm-dashboard/overview
 * Returns an overview of lead statistics for the CRM dashboard
 * Requires authentication
 * Query parameters:
 *  - timeframe: (day|week|month|quarter) - defaults to 'day'
 */
router.get('/overview', isAuthenticated, async (req, res) => {
  try {
    // Get the date range based on the timeframe parameter (or default to today)
    const timeframe = (req.query.timeframe as string) || 'day';
    const { startDate, endDate } = getDateRangeByTimeframe(timeframe);
    
    // Get all leads within the date range
    const leads = await storage.getLeadsByDateRange(startDate, endDate);
    
    // Calculate statistics
    const totalLeads = leads.length;
    const newLeads = leads.filter(lead => lead.status === 'New').length;
    const inProgressLeads = leads.filter(lead => lead.status === 'InProgress').length;
    const followUpLeads = leads.filter(lead => lead.status === 'FollowUp').length;
    const handedToDispatchLeads = leads.filter(lead => lead.status === 'HandToDispatch').length;
    const activeLeads = leads.filter(lead => lead.status === 'Active').length;
    const lostLeads = leads.filter(lead => lead.status === 'Lost').length;
    
    // Calculate conversion rates
    const qualifiedLeads = handedToDispatchLeads + activeLeads;
    const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;
    const handoffRate = inProgressLeads > 0 ? (handedToDispatchLeads / inProgressLeads) * 100 : 0;
    
    // Format the response
    res.json({
      timeframe,
      startDate,
      endDate,
      stats: {
        totalLeads,
        newLeads,
        inProgressLeads,
        followUpLeads,
        handedToDispatchLeads,
        activeLeads,
        lostLeads,
        qualifiedLeads,
        qualificationRate: parseFloat(qualificationRate.toFixed(2)),
        handoffRate: parseFloat(handoffRate.toFixed(2))
      }
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to fetch CRM dashboard overview');
  }
});

/**
 * GET /api/crm-dashboard/commissions
 * Returns commission statistics for the CRM dashboard
 * Requires authentication
 * Query parameters:
 *  - month: (YYYY-MM) - defaults to current month
 */
router.get('/commissions', isAuthenticated, async (req, res) => {
  try {
    // Get the month parameter (or default to current month)
    const month = (req.query.month as string) || getCurrentYearMonth();
    
    // Get commission data for the specified month
    const commissionData = await storage.getCommissionsByMonth(month);
    
    // Format the response
    res.json({
      month,
      stats: commissionData
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to fetch CRM dashboard commission data');
  }
});

/**
 * GET /api/crm-dashboard/activity
 * Returns recent activity data for the CRM dashboard
 * Requires authentication
 * Query parameters:
 *  - timeframe: (day|week|month|quarter) - defaults to 'day'
 *  - limit: number of activities to return - defaults to 20
 */
router.get('/activity', isAuthenticated, async (req, res) => {
  try {
    // Get the date range based on the timeframe parameter (or default to today)
    const timeframe = (req.query.timeframe as string) || 'day';
    const limit = parseInt(req.query.limit as string || '20');
    const { startDate, endDate } = getDateRangeByTimeframe(timeframe);
    
    // Get activities within the date range
    const activities = await storage.getActivitiesByDateRange(startDate, endDate, limit);
    
    // Enrich activities with user information
    const enrichedActivities = [];
    for (const activity of activities) {
      const user = await storage.getUser(activity.userId);
      enrichedActivities.push({
        ...activity,
        user: user ? {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          profileImageUrl: user.profileImageUrl
        } : null
      });
    }
    
    // Format the response
    res.json({
      timeframe,
      startDate,
      endDate,
      activities: enrichedActivities
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to fetch CRM dashboard activity data');
  }
});

/**
 * GET /api/crm-dashboard/top-performers
 * Returns top performing users for the CRM dashboard
 * Requires authentication
 * Query parameters:
 *  - timeframe: (day|week|month|quarter) - defaults to 'month'
 *  - metric: (leads|conversions|handoffs|commissions) - defaults to 'leads'
 *  - limit: number of users to return - defaults to 5
 */
router.get('/top-performers', isAuthenticated, async (req, res) => {
  try {
    // Get parameters
    const timeframe = (req.query.timeframe as string) || 'month';
    const metric = (req.query.metric as 'leads' | 'conversions' | 'handoffs' | 'commissions') || 'leads';
    const limit = parseInt(req.query.limit as string || '5');
    
    // Get date range
    const { startDate, endDate } = getDateRangeByTimeframe(timeframe);
    
    // Get top performers
    let orgId: number | undefined = undefined;
    if (req.user && req.user.orgId) {
      orgId = req.user.orgId;
    }
    
    const topPerformers = await storage.getTopPerformingUsers({
      startDate,
      endDate,
      metric,
      limit,
      orgId
    });
    
    // Format the response
    res.json({
      timeframe,
      metric,
      startDate,
      endDate,
      performers: topPerformers
    });
  } catch (error) {
    errorHandler(res, error, 'Failed to fetch CRM dashboard top performers');
  }
});

export default router;