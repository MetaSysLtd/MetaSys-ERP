import express from 'express';
import { createAuthMiddleware } from '../auth-middleware';

const marketingRouter = express.Router();

// Get marketing campaigns
marketingRouter.get("/campaigns", createAuthMiddleware(1), async (req, res, next) => {
  try {
    res.json([
      {
        id: 1,
        name: "Q2 Email Series",
        type: "Email",
        status: "Active",
        startDate: "2025-04-01",
        endDate: "2025-06-30",
        leads: 45,
        conversionRate: 8.3
      },
      {
        id: 2,
        name: "Social Media Promotion",
        type: "Social",
        status: "Active",
        startDate: "2025-04-15",
        endDate: "2025-05-15",
        leads: 32,
        conversionRate: 6.2
      },
      {
        id: 3,
        name: "Industry Conference",
        type: "Event",
        status: "Active",
        startDate: "2025-05-10",
        endDate: "2025-05-12",
        leads: 28,
        conversionRate: 12.5
      },
      {
        id: 4,
        name: "Website Redesign",
        type: "Website",
        status: "Draft",
        startDate: null,
        endDate: null,
        leads: 0,
        conversionRate: 0
      }
    ]);
  } catch (error) {
    next(error);
  }
});

// Get marketing analytics
marketingRouter.get("/analytics", createAuthMiddleware(1), async (req, res, next) => {
  try {
    res.json({
      leadSources: [
        { source: "Website", count: 45, percentage: 36 },
        { source: "Referral", count: 32, percentage: 25.6 },
        { source: "Direct", count: 28, percentage: 22.4 },
        { source: "Social", count: 20, percentage: 16 }
      ],
      conversionRates: {
        overall: 8.7,
        bySource: [
          { source: "Website", rate: 7.2 },
          { source: "Referral", rate: 12.5 },
          { source: "Direct", rate: 9.1 },
          { source: "Social", rate: 5.8 }
        ]
      },
      campaignPerformance: [
        { campaign: "Q2 Email Series", leads: 45, conversions: 4, revenue: 28500 },
        { campaign: "Social Media Promotion", leads: 32, conversions: 2, revenue: 15200 },
        { campaign: "Industry Conference", leads: 28, conversions: 3, revenue: 32000 }
      ]
    });
  } catch (error) {
    next(error);
  }
});

// Get content calendar
marketingRouter.get("/content-calendar", createAuthMiddleware(1), async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    res.json([
      {
        id: 1,
        title: "Industry Trends Blog Post",
        type: "Blog",
        publishDate: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-10`,
        status: "Draft",
        assignedTo: 2
      },
      {
        id: 2,
        title: "Client Success Story Video",
        type: "Video",
        publishDate: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`,
        status: "In Progress",
        assignedTo: 3
      },
      {
        id: 3,
        title: "Monthly Newsletter",
        type: "Email",
        publishDate: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-28`,
        status: "Scheduled",
        assignedTo: 1
      },
      {
        id: 4,
        title: "Social Media Campaign",
        type: "Social",
        publishDate: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-20`,
        status: "In Progress",
        assignedTo: 2
      }
    ]);
  } catch (error) {
    next(error);
  }
});

export default marketingRouter;