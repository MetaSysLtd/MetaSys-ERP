import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as notificationService from "./notifications";
import session from "express-session";
import { storage } from "./storage";
import { sessionHandler } from "./middleware/error-handler";

// Generate a secure random string for session secret if not provided
const SESSION_SECRET = process.env.SESSION_SECRET || "metasys_erp_secure_session_secret";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up session middleware
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === "production", 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  store: storage.sessionStore
}));

// Apply session authentication check middleware
app.use(sessionHandler);

// Add a special middleware to handle API routes specifically
// This ensures API routes are handled correctly
app.use((req, res, next) => {
  // Add header to prevent HTML caching
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  // For API routes, ensure they return JSON and are not intercepted
  if (req.path.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json');
  }
  
  next();
});

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Perform database sanity check
  try {
    const { performDatabaseHealthCheck } = await import('./utils/db-health-check');
    await performDatabaseHealthCheck();
    console.log('Database health check completed successfully');
  } catch (err) {
    console.error('Database health check failed:', err);
    console.log('Application will continue, but some features may not work correctly');
  }
  
  // Create the HTTP server first - this needs to be used consistently
  const httpServer = createServer(app);
  
  // Set up a custom middleware to only handle the API routes and leave the rest for Vite
  // Set up a custom middleware to only handle the API routes and leave the rest for Vite
  app.use('/api', (req, res, next) => {
    // Log original URL for debugging
    console.log(`Original URL: ${req.url}, Path: ${req.path}`);
    
    // IMPORTANT: Set proper content type for API responses
    res.setHeader('Content-Type', 'application/json');
    
    // Keep original URL - no longer stripping /api prefix
    // This matches how we registered routes in server/routes.ts
    // We now use the full path everywhere (/api/auth/login, etc.)
    
    next();
  });
  
  // Setup Vite or static serving BEFORE API routes
  // This is counter-intuitive but fixes the clash between Vite's "*" handler and our API routes
  if (app.get("env") === "development") {
    // Make sure we pass the correct httpServer to setupVite
    await setupVite(app, httpServer); 
  } else {
    serveStatic(app);
  }
  
  // Now register API routes - they'll only be triggered for /api/* paths
  // Pass the httpServer to registerRoutes so it uses the same server instance
  await registerRoutes(app, httpServer);
  
  // Initialize socket.io server using the correct HTTP server
  const { initializeSocketServer } = await import('./socket');
  const io = initializeSocketServer(httpServer);
  
  // Initialize scheduler
  const { initializeScheduler } = await import('./scheduler');
  const schedulerJobs = initializeScheduler();

  // Import error handling middleware
  const { errorHandler, notFoundHandler } = await import('./middleware/error-handler');
  
  // Route not found handler - must be after Vite/static middleware and before the errorHandler
  app.use(notFoundHandler);
  
  // Global error handler - must be registered last
  app.use(errorHandler);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
