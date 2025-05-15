import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./consolidated-routes";
import { setupVite, serveStatic, log } from "./vite";
import * as notificationService from "./notifications";
import session from "express-session";
import { storage } from "./storage";
import { sessionHandler } from "./middleware/error-handler";

// JSON error handler middleware with proper type handling
function jsonErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof SyntaxError && 'body' in err) {
    // Type-safe check for SyntaxError in JSON parsing
    const syntaxError = err as unknown as { type?: string };
    if (syntaxError.type === 'entity.parse.failed') {
      console.error("JSON parse error:", err.message);
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid JSON payload'
      });
    }
  }
  next(err);
}

// Generate a secure random string for session secret if not provided
const SESSION_SECRET = process.env.SESSION_SECRET || "metasys_erp_secure_session_secret";

const app = express();
app.use(express.json());
app.use(jsonErrorHandler);
app.use(express.urlencoded({ extended: false }));

// Enhanced session middleware with robust persistence configuration
app.use(session({
  secret: SESSION_SECRET,
  // Save session for any changes to ensure consistency
  resave: true,
  // Don't save empty uninitialized sessions
  saveUninitialized: false,
  // Store sessions in PostgreSQL for better persistence
  store: storage.sessionStore,
  name: 'metasys.sid', // Custom cookie name to avoid collisions
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days - longer persistence
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  }
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

  // Create a dedicated API router
  const apiRouter = express.Router();

  // Apply specific middleware to API routes only
  apiRouter.use(express.json());  
  apiRouter.use(express.urlencoded({ extended: false }));

  // Set proper headers for API responses
  apiRouter.use((req, res, next) => {
    // Log original URL for debugging
    console.log(`API request: ${req.method} ${req.url}`);

    // IMPORTANT: Set proper content type for API responses
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    next();
  });

  // Mount the API router at /api
  app.use('/api', apiRouter);

  // Setup Vite or static serving BEFORE API routes
  // This is counter-intuitive but fixes the clash between Vite's "*" handler and our API routes
  if (app.get("env") === "development") {
    // Make sure we pass the correct httpServer to setupVite
    await setupVite(app, httpServer); 
  } else {
    serveStatic(app);
  }

  // Now register API routes using our dedicated apiRouter
  // Pass the apiRouter and httpServer to registerRoutes
  await registerRoutes(apiRouter, httpServer);

  // Initialize socket.io server using the correct HTTP server
  const { initSocketIO } = await import('./socket');
  const io = initSocketIO(httpServer);

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
  const port = process.env.PORT || 5000;
  const server = httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.close(() => {
      console.log('Server shut down gracefully');
      process.exit(0);
    });
  });
})();