import express, { Router } from 'express';
import { storage } from '../storage';
import { getDateRangeByTimeframe, getCurrentYearMonth } from '../utils/date-formatter';

// Using the createAuthMiddleware directly from consolidated-routes.ts
// This function is available at the global level in the application
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

      // Fetch the user's role
      const role = await storage.getRole(user.roleId);
      if (!role) {
        return res.status(403).json({ 
          error: "User is not assigned to any role. Contact Admin.", 
          missing: ["role", "permissions"] 
        });
      }

      // Check if the user's role level is sufficient
      if (role.level < requiredRoleLevel) {
        return res.status(403).json({ 
          error: "Forbidden: Insufficient permissions", 
          missing: ["permissions"],
          details: `Required level: ${requiredRoleLevel}, Current level: ${role.level}`
        });
      }

      // Add user and role to the request object for use in route handlers
      req.user = user;
      req.userRole = role;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      next(error);
    }
  };
};

const router = express.Router();

// Apply auth middleware to all routes in this router
// Minimum role level 2 required for CRM Dashboard access
router.use(createAuthMiddleware(2));

// Get dashboard overview data based on timeframe
router.get('/', async (req, res) => {
  try {
    const timeframe = req.query.timeframe as string || 'week';
    const { startDate, endDate } = getDateRangeByTimeframe(timeframe);
    
    // Get leads data for the timeframe
    const leads = await storage.getLeadsByDateRange(startDate, endDate);
    
    // Get activities data for the timeframe
    const activities = await storage.getActivitiesByDateRange(startDate, endDate);
    
    // Calculate conversion ratios
    const totalLeads = leads.length;
    // In the actual schema, we consider leads with status 'Active' or 'HandToDispatch' as qualified
    const qualifiedLeads = leads.filter(lead => lead.status === 'Active' || lead.status === 'HandToDispatch').length;
    const unqualifiedLeads = totalLeads - qualifiedLeads;
    
    const conversionRatio = totalLeads > 0 
      ? Math.round((qualifiedLeads / totalLeads) * 100) 
      : 0;
    
    // Calculate handoff success rates - leads that were successfully handed off to dispatch
    const handoffLeads = leads.filter(lead => lead.status === 'HandToDispatch' || lead.status === 'Active').length;
    const handoffRate = qualifiedLeads > 0 
      ? Math.round((handoffLeads / qualifiedLeads) * 100) 
      : 0;
    
    // Response data
    const dashboardData = {
      timeframe,
      period: {
        startDate,
        endDate
      },
      leads: {
        total: totalLeads,
        qualified: qualifiedLeads,
        unqualified: unqualifiedLeads,
        conversionRate: conversionRatio
      },
      handoffs: {
        total: handoffLeads,
        successRate: handoffRate
      },
      activities: {
        total: activities.length,
        byType: activities.reduce((acc, activity) => {
          // Use action as the activity type since there's no type field
          const type = activity.action || 'other';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };
    
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error retrieving CRM dashboard data:', error);
    res.status(500).json({ error: 'Failed to retrieve CRM dashboard data' });
  }
});

// Get top performing users
router.get('/top-performers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    // Get the current month date range
    const { startDate, endDate } = getCurrentMonthRange();
    // Pass full parameters object to getTopPerformingUsers
    const topUsers = await storage.getTopPerformingUsers({
      startDate,
      endDate,
      metric: 'leads',
      limit: limit
    });
    
    res.status(200).json(topUsers);
  } catch (error) {
    console.error('Error retrieving top performers:', error);
    res.status(500).json({ error: 'Failed to retrieve top performers' });
  }
});

// Get commission data
router.get('/commissions', async (req, res) => {
  try {
    const month = req.query.month as string || getCurrentYearMonth();
    const commissions = await storage.getCommissionsByMonth(month);
    
    res.status(200).json(commissions);
  } catch (error) {
    console.error('Error retrieving commission data:', error);
    res.status(500).json({ error: 'Failed to retrieve commission data' });
  }
});

export default router;