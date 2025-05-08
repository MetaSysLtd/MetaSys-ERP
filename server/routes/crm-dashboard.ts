import express from 'express';
import { createAuthMiddleware } from '../auth-middleware';
import { logger } from '../logger';

const router = express.Router();

/**
 * GET /api/crm/dashboard/leads-overview
 * Get leads overview data for CRM dashboard
 */
router.get('/leads-overview', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Get leads overview data
    res.json({
      totalLeads: 32,
      newLeads: 8,
      contactedLeads: 15,
      qualifiedLeads: 6,
      convertedLeads: 5,
      lostLeads: 3,
      conversionRate: 15.63,
      byStatus: [
        { status: 'New', count: 8, color: '#3498db' },
        { status: 'Contacted', count: 15, color: '#f39c12' },
        { status: 'Qualified', count: 6, color: '#2ecc71' },
        { status: 'Converted', count: 5, color: '#27ae60' },
        { status: 'Lost', count: 3, color: '#e74c3c' }
      ],
      bySource: [
        { source: 'Website', count: 12, percentage: 37.5 },
        { source: 'Referral', count: 8, percentage: 25 },
        { source: 'Social Media', count: 6, percentage: 18.75 },
        { source: 'Email Campaign', count: 4, percentage: 12.5 },
        { source: 'Other', count: 2, percentage: 6.25 }
      ]
    });
  } catch (error) {
    logger.error('Error in CRM dashboard leads overview route:', error);
    next(error);
  }
});

/**
 * GET /api/crm/dashboard/conversion-ratios
 * Get conversion ratios data for CRM dashboard
 */
router.get('/conversion-ratios', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Get conversion ratios data
    res.json({
      overall: {
        newToContacted: 63.7,
        contactedToQualified: 31.6,
        qualifiedToConverted: 42.1,
        newToConverted: 16.5
      },
      byRep: [
        {
          name: 'John Smith',
          newToContacted: 78.5,
          contactedToQualified: 45.2,
          qualifiedToConverted: 55.3,
          newToConverted: 24.8
        },
        {
          name: 'Jane Doe',
          newToContacted: 65.2,
          contactedToQualified: 38.7,
          qualifiedToConverted: 47.5,
          newToConverted: 19.2
        },
        {
          name: 'Bob Johnson',
          newToContacted: 52.3,
          contactedToQualified: 29.8,
          qualifiedToConverted: 35.6,
          newToConverted: 12.7
        }
      ],
      monthly: [
        {
          month: 'Jan',
          newToContacted: 65.2,
          contactedToQualified: 32.5,
          qualifiedToConverted: 48.7,
          newToConverted: 17.3
        },
        {
          month: 'Feb',
          newToContacted: 67.8,
          contactedToQualified: 35.1,
          qualifiedToConverted: 46.2,
          newToConverted: 18.9
        },
        {
          month: 'Mar',
          newToContacted: 59.3,
          contactedToQualified: 28.7,
          qualifiedToConverted: 39.5,
          newToConverted: 14.8
        },
        {
          month: 'Apr',
          newToContacted: 63.7,
          contactedToQualified: 31.6,
          qualifiedToConverted: 42.1,
          newToConverted: 16.5
        }
      ]
    });
  } catch (error) {
    logger.error('Error in CRM dashboard conversion ratios route:', error);
    next(error);
  }
});

/**
 * GET /api/crm/dashboard/top-performers
 * Get top performers data for CRM dashboard
 */
router.get('/top-performers', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Default period is 'month' if not specified
    const period = req.query.period || 'month';
    const metric = req.query.metric || 'leads';
    
    // Get top performers data
    res.json([
      {
        id: 1,
        name: 'John Smith',
        avatar: null,
        value: metric === 'leads' ? 15 : metric === 'conversions' ? 8 : 12500,
        change: 15,
        rank: 1
      },
      {
        id: 2,
        name: 'Jane Doe',
        avatar: null,
        value: metric === 'leads' ? 12 : metric === 'conversions' ? 7 : 10800,
        change: 5,
        rank: 2
      },
      {
        id: 3,
        name: 'Bob Johnson',
        avatar: null,
        value: metric === 'leads' ? 10 : metric === 'conversions' ? 5 : 8200,
        change: -2,
        rank: 3
      },
      {
        id: 4,
        name: 'Alice Williams',
        avatar: null,
        value: metric === 'leads' ? 8 : metric === 'conversions' ? 3 : 5600,
        change: 10,
        rank: 4
      },
      {
        id: 5,
        name: 'Charlie Brown',
        avatar: null,
        value: metric === 'leads' ? 6 : metric === 'conversions' ? 2 : 3500,
        change: -5,
        rank: 5
      }
    ]);
  } catch (error) {
    logger.error('Error in CRM dashboard top performers route:', error);
    next(error);
  }
});

/**
 * GET /api/crm/dashboard/commission-highlights
 * Get commission highlights data for CRM dashboard
 */
router.get('/commission-highlights', createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Get commission highlights data
    res.json({
      totalCommission: 25000,
      previousPeriod: 22000,
      change: 13.64,
      breakdown: {
        basicCommission: 18000,
        bonuses: 5000,
        overrides: 2000
      },
      topEarners: [
        { name: 'John Smith', amount: 6500 },
        { name: 'Jane Doe', amount: 5800 },
        { name: 'Bob Johnson', amount: 4200 }
      ],
      trending: [
        { date: '2025-01', amount: 19500 },
        { date: '2025-02', amount: 21000 },
        { date: '2025-03', amount: 22000 },
        { date: '2025-04', amount: 25000 }
      ]
    });
  } catch (error) {
    logger.error('Error in CRM dashboard commission highlights route:', error);
    next(error);
  }
});

export default router;