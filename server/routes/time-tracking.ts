import express from 'express';
import { createAuthMiddleware } from '../auth-middleware';

// Define types
interface ClockEvent {
  id: number;
  userId: number;
  type: "IN" | "OUT";
  timestamp: string;
  createdAt: string;
}

interface ClockStatus {
  status: "IN" | "OUT";
  lastEvent?: ClockEvent;
}

// In-memory storage for time tracking events (will be moved to database later)
const clockEvents: ClockEvent[] = [
  {
    id: 1,
    userId: 1,
    type: "IN",
    timestamp: new Date(new Date().setHours(9, 0, 0)).toISOString(),
    createdAt: new Date(new Date().setHours(9, 0, 0)).toISOString()
  },
  {
    id: 2,
    userId: 1,
    type: "OUT",
    timestamp: new Date(new Date().setHours(12, 0, 0)).toISOString(),
    createdAt: new Date(new Date().setHours(12, 0, 0)).toISOString()
  },
  {
    id: 3,
    userId: 1,
    type: "IN",
    timestamp: new Date(new Date().setHours(13, 0, 0)).toISOString(),
    createdAt: new Date(new Date().setHours(13, 0, 0)).toISOString()
  },
  {
    id: 4,
    userId: 1,
    type: "OUT",
    timestamp: new Date(new Date().setHours(17, 0, 0)).toISOString(),
    createdAt: new Date(new Date().setHours(17, 0, 0)).toISOString()
  }
];

// Helper functions for time tracking
function getUserClockEvents(userId: number): ClockEvent[] {
  return clockEvents.filter(event => event.userId === userId);
}

function getUserClockStatus(userId: number): ClockStatus {
  const userEvents = getUserClockEvents(userId);
  
  if (userEvents.length === 0) {
    return { status: "OUT" };
  }
  
  // Sort events by timestamp (newest first)
  const sortedEvents = [...userEvents].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  return {
    status: sortedEvents[0].type,
    lastEvent: sortedEvents[0]
  };
}

// Create router
const timeTrackingRouter = express.Router();

// Get current clock status
timeTrackingRouter.get("/status", createAuthMiddleware(1), async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const status = getUserClockStatus(req.user.id);
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Get all clock events for a user
timeTrackingRouter.get("/events", createAuthMiddleware(1), async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const events = getUserClockEvents(req.user.id);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

// Get today's clock events for a user
timeTrackingRouter.get("/events/day", createAuthMiddleware(1), async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const events = getUserClockEvents(req.user.id).filter(event => {
      const eventDate = new Date(event.timestamp);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    });

    res.json(events);
  } catch (error) {
    next(error);
  }
});

// Clock in/out
timeTrackingRouter.post("/clock", createAuthMiddleware(1), express.json(), async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { type } = req.body;
    if (type !== "IN" && type !== "OUT") {
      return res.status(400).json({ error: "Invalid clock type. Must be 'IN' or 'OUT'" });
    }

    // Check if the current status matches the requested action
    const currentStatus = getUserClockStatus(req.user.id);
    if (currentStatus.status === type) {
      return res.status(400).json({ 
        error: `Already clocked ${type === 'IN' ? 'in' : 'out'}`,
        message: `You are already clocked ${type === 'IN' ? 'in' : 'out'}`
      });
    }

    // Create a new clock event
    const newEvent: ClockEvent = {
      id: clockEvents.length + 1,
      userId: req.user.id,
      type,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Add to the events array
    clockEvents.push(newEvent);

    res.status(201).json({
      message: `Successfully clocked ${type === 'IN' ? 'in' : 'out'}`,
      event: newEvent
    });
  } catch (error) {
    next(error);
  }
});

export default timeTrackingRouter;