import express, { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Extended Express Request interface with auth properties
interface AuthenticatedRequest extends Request {
  isAuthenticated(): boolean;
  user?: {
    id: number;
    [key: string]: any;
  };
  userRole?: {
    id: number;
    name: string;
    level: number;
    [key: string]: any;
  };
}

const router = express.Router();

// Simple middleware for checking authentication
function checkAuth(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized: Please log in to access this resource" });
  }
  next();
}

// Basic role level check (level 1 for sales reps, level 3 for managers, etc.)
function checkLevel(level: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized: Please log in to access this resource" });
    }
    
    const userLevel = authReq.userRole?.level || 0;
    if (userLevel < level) {
      return res.status(403).json({ error: "Forbidden: You don't have required permissions" });
    }
    
    next();
  };
}

// Get commission data by month for specific user
router.get('/monthly/user/:userId/:month?', checkAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const month = req.params.month || new Date().toISOString().slice(0, 7);
    
    // Get user details
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // For demo purposes, create a sample commission response
    const commission = {
      userId,
      month,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      total: Math.floor(Math.random() * 10000) + 5000, // Random sample for demo
      baseCommission: Math.floor(Math.random() * 8000) + 3000,
      adjustedCommission: Math.floor(Math.random() * 9000) + 4000,
      bonuses: {
        repOfMonth: Math.floor(Math.random() * 500),
        activeTrucks: Math.floor(Math.random() * 300),
        teamLead: Math.floor(Math.random() * 200)
      },
      leads: Math.floor(Math.random() * 20),
      clients: Math.floor(Math.random() * 10),
      items: [
        {
          id: 1,
          date: new Date().toISOString(),
          clientName: "ABC Trucking",
          type: "Load Commission",
          leadSource: "Cold Call",
          amount: 450,
          status: "Paid"
        },
        {
          id: 2,
          date: new Date().toISOString(),
          clientName: "XYZ Logistics",
          type: "Referral Bonus",
          leadSource: "Website",
          amount: 250,
          status: "Pending"
        }
      ]
    };
    
    return res.json(commission);
  } catch (error) {
    console.error("Error in /monthly/user/:userId/:month route:", error);
    return res.status(500).json({ error: "Failed to fetch commission data" });
  }
});

// Get all commission data for a user (for listing available months)
router.get('/monthly/user/:userId', checkAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // For demo purposes, return last 6 months as placeholders
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7);
      
      months.push({
        month: monthStr,
        total: Math.floor(Math.random() * 10000) + 5000 // Random sample for demo
      });
    }
    
    return res.json(months);
  } catch (error) {
    console.error("Error in /monthly/user/:userId route:", error);
    return res.status(500).json({ error: "Failed to fetch commission months" });
  }
});

// Get metrics for commission details view
router.get('/metrics/:userId', checkAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const month = req.query.month as string || new Date().toISOString().slice(0, 7);
    
    // Get user details
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // For demo purposes, create sample metrics
    const metrics = {
      userId,
      month,
      name: `${user.firstName} ${user.lastName}`,
      activeLeads: Math.floor(Math.random() * 15),
      totalLeads: Math.floor(Math.random() * 30),
      callsMade: Math.floor(Math.random() * 100),
      leadsConverted: Math.floor(Math.random() * 10),
      targets: {
        leadTarget: 10,
        clientTarget: 3,
        revenueTarget: 15000,
        callTarget: 20 * 20 // Daily call target * working days
      },
      performance: {
        leadProgress: Math.floor(Math.random() * 100),
        callProgress: Math.floor(Math.random() * 100)
      }
    };
    
    return res.json(metrics);
  } catch (error) {
    console.error("Error in /metrics/:userId route:", error);
    return res.status(500).json({ error: "Failed to fetch commission metrics" });
  }
});

// Get all sales representatives with commission data (for team view)
router.get('/sales-reps', checkLevel(3), async (req: Request, res: Response) => {
  try {
    const month = req.query.month as string || new Date().toISOString().slice(0, 7);
    
    // Get all users with sales roles
    const users = await storage.getAllUsers();
    const salesReps = users.filter(user => user.roleId === 2); // Assuming roleId 2 is for sales reps
    
    // For demo purposes, create sample sales rep data
    const repsWithCommission = salesReps.map((rep, index) => {
      return {
        userId: rep.id,
        firstName: rep.firstName,
        lastName: rep.lastName,
        username: rep.username,
        profileImageUrl: rep.profileImageUrl,
        totalCommission: Math.floor(Math.random() * 20000) + 1000,
        leads: Math.floor(Math.random() * 30),
        clients: Math.floor(Math.random() * 15),
        growth: Math.floor(Math.random() * 200) - 100, // Between -100 and +100
        targetPercentage: Math.floor(Math.random() * 100),
        rank: index + 1
      };
    });
    
    // Sort by total commission and assign proper ranks
    const sortedReps = repsWithCommission
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .map((rep, index) => ({
        ...rep,
        rank: index + 1
      }));
    
    return res.json(sortedReps);
  } catch (error) {
    console.error("Error in /sales-reps route:", error);
    return res.status(500).json({ error: "Failed to fetch sales representatives data" });
  }
});

// Calculate commission for a user based on their activity
router.post('/calculate/:userId', checkLevel(3), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const month = req.body.month || new Date().toISOString().slice(0, 7);
    
    // Check if the user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if request user has permission
    const authReq = req as AuthenticatedRequest;
    const isAdmin = authReq.userRole && authReq.userRole.level >= 3;
    if (!isAdmin && authReq.user?.id !== userId) {
      return res.status(403).json({ error: "You don't have permission to calculate commissions for other users" });
    }
    
    // For demo purposes, create sample calculation result
    const calculation = {
      userId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      month,
      total: Math.floor(Math.random() * 10000) + 5000,
      baseCommission: Math.floor(Math.random() * 8000) + 3000,
      adjustedCommission: Math.floor(Math.random() * 9000) + 4000,
      repOfMonthBonus: Math.floor(Math.random() * 500),
      activeTrucksBonus: Math.floor(Math.random() * 300),
      teamLeadBonus: Math.floor(Math.random() * 200),
      calculationDetails: {
        baseCommissionDetails: {
          activeLeadsCount: Math.floor(Math.random() * 20),
          baseAmount: Math.floor(Math.random() * 8000) + 3000
        },
        bonuses: {
          repOfMonth: Math.floor(Math.random() * 500),
          activeTrucks: Math.floor(Math.random() * 300),
          teamLead: Math.floor(Math.random() * 200)
        }
      },
      message: "Newly calculated"
    };
    
    return res.json(calculation);
  } catch (error) {
    console.error("Error in /calculate/:userId route:", error);
    return res.status(500).json({ error: "Failed to calculate commission" });
  }
});

export default router;