import express from 'express';
import { createAuthMiddleware } from '../auth-middleware';

const financeRouter = express.Router();

// Get financial summary
financeRouter.get("/summary", createAuthMiddleware(1), async (req, res, next) => {
  try {
    res.json({
      revenue: {
        monthly: 246500,
        ytd: 980000,
        previousMonth: 227600
      },
      expenses: {
        monthly: 184720,
        ytd: 760500,
        previousMonth: 192600
      },
      cashFlow: {
        monthly: 61780,
        ytd: 219500,
        previousMonth: 35000
      },
      invoices: {
        pending: 87320,
        count: 12
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get expenses
financeRouter.get("/expenses", createAuthMiddleware(1), async (req, res, next) => {
  try {
    res.json([
      {
        id: 1,
        category: "Payroll",
        amount: 120000,
        date: "2025-05-01",
        description: "Monthly payroll"
      },
      {
        id: 2,
        category: "Rent",
        amount: 15000,
        date: "2025-05-01",
        description: "Office rent"
      },
      {
        id: 3,
        category: "Software",
        amount: 4500,
        date: "2025-05-03",
        description: "SaaS subscriptions"
      },
      {
        id: 4,
        category: "Utilities",
        amount: 2800,
        date: "2025-05-05",
        description: "Electricity and internet"
      },
      {
        id: 5,
        category: "Insurance",
        amount: 8600,
        date: "2025-05-10",
        description: "Business insurance"
      }
    ]);
  } catch (error) {
    next(error);
  }
});

// Get profit and loss report
financeRouter.get("/profit-loss", createAuthMiddleware(1), async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || new Date().getMonth() + 1;
    
    res.json({
      period: `${year}-${month.toString().padStart(2, '0')}`,
      revenue: {
        total: 246500,
        breakdown: {
          "Freight Services": 198000,
          "Consulting": 32500,
          "Brokerage Fees": 16000
        }
      },
      expenses: {
        total: 184720,
        breakdown: {
          "Payroll": 120000,
          "Rent": 15000,
          "Software": 4500,
          "Utilities": 2800,
          "Insurance": 8600,
          "Marketing": 7820,
          "Maintenance": 5200,
          "Travel": 12300,
          "Miscellaneous": 8500
        }
      },
      netProfit: 61780,
      profitMargin: 25.06
    });
  } catch (error) {
    next(error);
  }
});

export default financeRouter;