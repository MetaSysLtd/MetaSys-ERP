import express from 'express';
import { createAuthMiddleware } from '../auth-middleware';
import { storage } from '../storage';

const hrRouter = express.Router();

// Get team members (all users with their roles)
hrRouter.get("/team", createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Return all users with their roles
    const users = await storage.getUsers();
    const teamMembers = await Promise.all(users.map(async (user) => {
      try {
        const role = await storage.getRole(user.roleId);
        const { password, ...safeUser } = user;
        return { ...safeUser, role };
      } catch (error) {
        const { password, ...safeUser } = user;
        return { ...safeUser, role: null };
      }
    }));
    
    res.json(teamMembers);
  } catch (error) {
    next(error);
  }
});

// Get job postings
hrRouter.get("/jobs", createAuthMiddleware(1), async (req, res, next) => {
  try {
    // Mock job postings data
    res.json([
      {
        id: 1,
        title: "Senior Dispatcher",
        department: "Operations",
        location: "Chicago, IL",
        type: "Full-time",
        postedDate: "2025-04-15",
        status: "Active",
        applicants: 12
      },
      {
        id: 2,
        title: "Sales Representative",
        department: "Sales",
        location: "Remote",
        type: "Full-time",
        postedDate: "2025-04-20",
        status: "Active",
        applicants: 8
      },
      {
        id: 3,
        title: "Administrative Assistant",
        department: "Admin",
        location: "Chicago, IL",
        type: "Part-time",
        postedDate: "2025-04-25",
        status: "Active",
        applicants: 15
      }
    ]);
  } catch (error) {
    next(error);
  }
});

// Get employee records (minimal version for now)
hrRouter.get("/employees", createAuthMiddleware(1), async (req, res, next) => {
  try {
    const users = await storage.getUsers();
    const employees = users.map(user => {
      const { password, ...safeUser } = user;
      return {
        ...safeUser,
        department: user.roleId === 2 ? "Sales" : user.roleId === 3 ? "Dispatch" : "Administration",
        startDate: "2025-01-01", // Placeholder
        status: "Active"
      };
    });
    
    res.json(employees);
  } catch (error) {
    next(error);
  }
});

export default hrRouter;