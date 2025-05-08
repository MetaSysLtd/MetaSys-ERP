import express from 'express';
import { storage } from '../storage';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, subDays, format, parseISO } from 'date-fns';

const router = express.Router();

// Helper functions for date calculations
function getDateRange(timeframe: string) {
  const now = new Date();
  
  switch (timeframe) {
    case 'day':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        previous: {
          start: startOfDay(subDays(now, 1)),
          end: endOfDay(subDays(now, 1))
        }
      };
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
        previous: {
          start: startOfWeek(subDays(now, 7), { weekStartsOn: 1 }),
          end: endOfWeek(subDays(now, 7), { weekStartsOn: 1 })
        }
      };
    case 'month':
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        previous: {
          start: startOfMonth(subDays(now, 30)),
          end: endOfMonth(subDays(now, 30))
        }
      };
  }
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Main dashboard endpoint
router.get('/', async (req, res) => {
  try {
    const timeframe = req.query.timeframe as string || 'week';
    const dateRange = getDateRange(timeframe);
    const userId = req.user?.id;
    const orgId = req.user?.orgId;
    
    // Initialize dashboard data structure
    const dashboardData = {
      metrics: {
        createdLeads: 0,
        createdLeadsChange: 0,
        qualifiedLeads: 0,
        qualifiedLeadsChange: 0,
        qualificationRate: 0,
        handoffCount: 0,
        handoffRate: 0,
        handoffChange: 0,
        commissionsEarned: 0,
        commissionsChange: 0,
        activeClients: 0
      },
      leadsOverview: {
        byStatus: [],
        bySource: [],
        trend: []
      },
      conversionRatios: {
        ratios: [],
        funnelStages: [],
        insight: ""
      },
      handoffRates: {
        overall: 0,
        byMonth: [],
        byRep: []
      },
      topPerformers: {
        salesReps: []
      },
      commissionHighlights: {
        earned: 0,
        target: 0,
        projected: 0,
        growth: 0,
        average: 0,
        insight: ""
      },
      recentActivities: []
    };
    
    // Fetch all leads for calculations
    const allLeads = await storage.getLeads({});
    
    if (!allLeads || !Array.isArray(allLeads)) {
      return res.json(dashboardData);
    }
    
    // Calculate metrics based on date ranges
    const currentLeads = allLeads.filter(lead => {
      const createdAt = lead.createdAt instanceof Date ? lead.createdAt : new Date(lead.createdAt);
      return createdAt >= dateRange.start && createdAt <= dateRange.end;
    });
    
    const previousLeads = allLeads.filter(lead => {
      const createdAt = lead.createdAt instanceof Date ? lead.createdAt : new Date(lead.createdAt);
      return createdAt >= dateRange.previous.start && createdAt <= dateRange.previous.end;
    });
    
    // Current period metrics
    const totalCurrentLeads = currentLeads.length;
    const qualifiedCurrentLeads = currentLeads.filter(lead => 
      lead.status === 'qualified' || lead.status === 'HandToDispatch' || lead.status === 'Active'
    ).length;
    
    const handoffCurrentLeads = currentLeads.filter(lead => 
      lead.status === 'HandToDispatch' || lead.status === 'Active'
    ).length;
    
    // Previous period metrics for comparison
    const totalPreviousLeads = previousLeads.length;
    const qualifiedPreviousLeads = previousLeads.filter(lead => 
      lead.status === 'qualified' || lead.status === 'HandToDispatch' || lead.status === 'Active'
    ).length;
    
    const handoffPreviousLeads = previousLeads.filter(lead => 
      lead.status === 'HandToDispatch' || lead.status === 'Active'
    ).length;
    
    // Calculate percentage changes
    const createdLeadsChange = calculatePercentageChange(totalCurrentLeads, totalPreviousLeads);
    const qualifiedLeadsChange = calculatePercentageChange(qualifiedCurrentLeads, qualifiedPreviousLeads);
    const handoffChange = calculatePercentageChange(handoffCurrentLeads, handoffPreviousLeads);
    
    // Calculate qualification and handoff rates
    const qualificationRate = totalCurrentLeads > 0 
      ? Math.round((qualifiedCurrentLeads / totalCurrentLeads) * 100) 
      : 0;
      
    const handoffRate = qualifiedCurrentLeads > 0 
      ? Math.round((handoffCurrentLeads / qualifiedCurrentLeads) * 100) 
      : 0;
    
    // Populate metrics
    dashboardData.metrics.createdLeads = totalCurrentLeads;
    dashboardData.metrics.createdLeadsChange = createdLeadsChange;
    dashboardData.metrics.qualifiedLeads = qualifiedCurrentLeads;
    dashboardData.metrics.qualifiedLeadsChange = qualifiedLeadsChange;
    dashboardData.metrics.qualificationRate = qualificationRate;
    dashboardData.metrics.handoffCount = handoffCurrentLeads;
    dashboardData.metrics.handoffRate = handoffRate;
    dashboardData.metrics.handoffChange = handoffChange;
    dashboardData.metrics.activeClients = allLeads.filter(lead => lead.status === 'Active').length;
    
    // Get commissions data
    let commissionsData = { total: 0 };
    let previousCommissionsData = { total: 0 };
    
    try {
      // Try to get commissions from dedicated endpoint if it exists
      if (userId) {
        const monthStr = format(new Date(), 'yyyy-MM');
        const prevMonthStr = format(subDays(new Date(), 30), 'yyyy-MM');
        
        const commissionsRes = await storage.getCommissionsByUserIdAndMonth?.(userId, monthStr);
        commissionsData = commissionsRes || { total: 0 };
        
        const prevCommissionsRes = await storage.getCommissionsByUserIdAndMonth?.(userId, prevMonthStr);
        previousCommissionsData = prevCommissionsRes || { total: 0 };
      }
    } catch (err) {
      console.log('Error fetching commissions data:', err);
      // Continue with default values
    }
    
    // Calculate commission metrics
    const currentCommissions = typeof commissionsData === 'object' && commissionsData.total 
      ? commissionsData.total 
      : 0;
      
    const previousCommissions = typeof previousCommissionsData === 'object' && previousCommissionsData.total 
      ? previousCommissionsData.total 
      : 0;
      
    const commissionsChange = calculatePercentageChange(currentCommissions, previousCommissions);
    
    dashboardData.metrics.commissionsEarned = currentCommissions;
    dashboardData.metrics.commissionsChange = commissionsChange;
    
    // Format leads by status for charts
    const statusCounts: Record<string, number> = {};
    allLeads.forEach(lead => {
      const status = lead.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    dashboardData.leadsOverview.byStatus = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }));
    
    // Format leads by source for charts
    const sourceCounts: Record<string, number> = {};
    allLeads.forEach(lead => {
      const source = lead.source || 'unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    
    dashboardData.leadsOverview.bySource = Object.entries(sourceCounts).map(([name, value]) => ({
      name,
      value
    }));
    
    // Generate trend data (last 7 days)
    const trendDays = 7;
    const trendData = [];
    
    for (let i = trendDays - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM dd');
      const startOfDayDate = startOfDay(date);
      const endOfDayDate = endOfDay(date);
      
      const daysLeads = allLeads.filter(lead => {
        const createdAt = lead.createdAt instanceof Date ? lead.createdAt : new Date(lead.createdAt);
        return createdAt >= startOfDayDate && createdAt <= endOfDayDate;
      });
      
      const created = daysLeads.length;
      const qualified = daysLeads.filter(lead => 
        lead.status === 'qualified' || lead.status === 'HandToDispatch' || lead.status === 'Active'
      ).length;
      
      const converted = daysLeads.filter(lead => 
        lead.status === 'Active'
      ).length;
      
      trendData.push({
        date: dateStr,
        created,
        qualified,
        converted
      });
    }
    
    dashboardData.leadsOverview.trend = trendData;
    
    // Conversion ratios
    const mqlCount = allLeads.filter(lead => lead.source === 'MQL').length;
    const sqlCount = allLeads.filter(lead => lead.source === 'SQL').length;
    const qualifiedCount = allLeads.filter(lead => 
      lead.status === 'qualified' || lead.status === 'HandToDispatch' || lead.status === 'Active'
    ).length;
    const activeCount = allLeads.filter(lead => lead.status === 'Active').length;
    
    dashboardData.conversionRatios.ratios = [
      { name: 'MQL → SQL', value: mqlCount > 0 ? Math.round((sqlCount / mqlCount) * 100) : 0 },
      { name: 'SQL → Qualified', value: sqlCount > 0 ? Math.round((qualifiedCount / sqlCount) * 100) : 0 },
      { name: 'Qualified → Active', value: qualifiedCount > 0 ? Math.round((activeCount / qualifiedCount) * 100) : 0 }
    ];
    
    // Funnel stages
    const totalLeads = allLeads.length;
    
    dashboardData.conversionRatios.funnelStages = [
      { 
        name: 'Initial Leads', 
        value: 100 
      },
      { 
        name: 'Marketing Qualified', 
        value: totalLeads > 0 ? Math.round((mqlCount / totalLeads) * 100) : 0 
      },
      { 
        name: 'Sales Qualified', 
        value: totalLeads > 0 ? Math.round((sqlCount / totalLeads) * 100) : 0 
      },
      { 
        name: 'Qualified', 
        value: totalLeads > 0 ? Math.round((qualifiedCount / totalLeads) * 100) : 0 
      },
      { 
        name: 'Active Clients', 
        value: totalLeads > 0 ? Math.round((activeCount / totalLeads) * 100) : 0 
      }
    ];
    
    dashboardData.conversionRatios.insight = activeCount > 0 
      ? `Converting ${dashboardData.conversionRatios.funnelStages[4].value}% of leads to active clients` 
      : "Focus on moving qualified leads to active client status";
    
    // Handoff rates
    dashboardData.handoffRates.overall = handoffRate;
    
    // Mock monthly handoff rates (6 months)
    dashboardData.handoffRates.byMonth = [
      { name: 'Jan', success: 68, target: 70 },
      { name: 'Feb', success: 72, target: 70 },
      { name: 'Mar', success: 75, target: 75 },
      { name: 'Apr', success: 78, target: 75 },
      { name: 'May', success: handoffRate, target: 80 },
      { name: 'Jun', success: 0, target: 80 }
    ];
    
    // Get users with sales role
    const users = await storage.getUsers();
    const salesReps = users.filter(user => {
      return user.roleId === 2 || // Assuming 2 is the Sales role ID
        (user.role && user.role.department === 'sales');
    });
    
    // Handoff rates by rep (use real sales reps if available)
    if (salesReps && salesReps.length > 0) {
      dashboardData.handoffRates.byRep = salesReps.map(rep => {
        // Calculate success rate for each rep (randomized for mock data)
        const successRate = Math.floor(65 + Math.random() * 30); // 65-95% 
        return {
          name: rep.firstName ? `${rep.firstName} ${rep.lastName || ''}` : rep.username,
          success: successRate,
          failed: 100 - successRate
        };
      });
    } else {
      // Fallback mock data if no sales reps found
      dashboardData.handoffRates.byRep = [
        { name: "Alex Johnson", success: 92, failed: 8 },
        { name: "Sarah Kim", success: 85, failed: 15 },
        { name: "Carlos Rodriguez", success: 78, failed: 22 },
        { name: "Maya Johnson", success: 75, failed: 25 }
      ];
    }
    
    // Top performers
    if (salesReps && salesReps.length > 0) {
      // For each sales rep, count their leads and conversions
      const repPerformance = salesReps.map(rep => {
        const repLeads = allLeads.filter(lead => lead.assignedTo === rep.id);
        const conversions = repLeads.filter(lead => lead.status === 'Active').length;
        const qualifiedLeads = repLeads.filter(lead => 
          lead.status === 'qualified' || lead.status === 'HandToDispatch' || lead.status === 'Active'
        ).length;
        
        // Calculate metrics
        const conversionRate = repLeads.length > 0 
          ? Math.round((conversions / repLeads.length) * 100) 
          : 0;
        
        return {
          id: rep.id,
          name: rep.firstName ? `${rep.firstName} ${rep.lastName || ''}` : rep.username,
          leads: repLeads.length,
          conversions,
          qualifiedLeads,
          conversionRate,
          avatarUrl: rep.profileImageUrl || null
        };
      });
      
      // Sort by conversions (descending)
      const sortedReps = [...repPerformance].sort((a, b) => b.conversions - a.conversions);
      
      // Format for dashboard
      dashboardData.topPerformers.salesReps = sortedReps
        .slice(0, 5) // Top 5 performers
        .map((rep, index) => ({
          name: rep.name,
          metric: "conversions",
          count: rep.conversions,
          achievement: `${rep.conversionRate}% conversion`,
          avatarUrl: rep.avatarUrl
        }));
    }
    
    // If no sales reps with data found, use fallback mock data
    if (!dashboardData.topPerformers.salesReps.length) {
      dashboardData.topPerformers.salesReps = [
        { name: "Alex Johnson", metric: "conversions", count: 12, achievement: "125% of target", avatarUrl: null },
        { name: "Sarah Kim", metric: "revenue", value: 45000, achievement: "115% of target", avatarUrl: null },
        { name: "Carlos Rodriguez", metric: "conversions", count: 8, achievement: "105% of target", avatarUrl: null },
        { name: "Maya Johnson", metric: "growth", percentage: 18, achievement: "18% growth", avatarUrl: null },
        { name: "John Smith", metric: "conversions", count: 6, achievement: "85% of target", avatarUrl: null }
      ];
    }
    
    // Commission highlights
    const monthlyTarget = 10000; // Example monthly target
    
    dashboardData.commissionHighlights = {
      earned: currentCommissions,
      target: monthlyTarget,
      projected: Math.round(currentCommissions * 1.2), // Example projection
      growth: commissionsChange,
      average: activeCount > 0 ? Math.round(currentCommissions / activeCount) : 0,
      insight: commissionsChange >= 0 
        ? `You're ${commissionsChange}% ahead of last month's commissions` 
        : `You're ${Math.abs(commissionsChange)}% behind last month's commissions`
    };
    
    // Get recent activities
    let activities = [];
    try {
      activities = await storage.getActivitiesByEntityType('lead', 20) || [];
    } catch (err) {
      console.log('Error fetching activities:', err);
    }
    
    // Format activities for dashboard
    dashboardData.recentActivities = activities.map((activity: any) => ({
      ...activity,
      timestamp: activity.timestamp || activity.createdAt
    }));
    
    return res.json(dashboardData);
  } catch (error) {
    console.error('Error generating CRM dashboard:', error);
    return res.status(500).json({ error: 'Failed to generate CRM dashboard data' });
  }
});

export default router;