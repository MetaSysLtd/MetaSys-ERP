import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes-stable";
import { setupVite, serveStatic, log } from "./vite";
import * as notificationService from "./notifications";
import session from "express-session";
import { storage } from "./storage";
import { globalErrorHandler, setupUnhandledRejectionHandler } from "./middleware/error-handler";

// JSON error handler middleware
function jsonErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Invalid JSON payload'
    });
  }
  next(err);
}

// Generate a secure random string for session secret if not provided
const SESSION_SECRET = process.env.SESSION_SECRET || "metasys_erp_secure_session_secret";

const app = express();
app.use(express.json());
app.use(jsonErrorHandler);
app.use(express.urlencoded({ extended: false }));

// Detect if we're in a secure production environment that uses HTTPS
const isSecureEnvironment = process.env.NODE_ENV === 'production' && 
                            (process.env.SECURE_COOKIES === 'true' || 
                            process.env.SECURE_ENVIRONMENT === 'true');

// Set up session middleware with improved configuration for both dev and production
app.use(session({
  secret: process.env.SESSION_SECRET || 'metasys_erp_secure_session_secret',
  resave: false,                // Only save session if changed
  saveUninitialized: false,     // Don't create session until something stored
  rolling: true,                // Reset cookie expiration on each response
  proxy: true,                  // Trust the reverse proxy
  cookie: { 
    // Only use secure cookies in secure environment (HTTPS)
    secure: isSecureEnvironment,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for better persistence
    httpOnly: true,
    sameSite: isSecureEnvironment ? 'none' : 'lax', // Cross-site cookies for HTTPS, lax for HTTP
    path: '/',                  // Ensure cookies are available across all paths
    domain: undefined           // Allow the cookie to work on any domain
  },
  store: storage.sessionStore   // Use the configured database session store
}));

// Setup global error handling
setupUnhandledRejectionHandler();

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

  // CRITICAL FIX: Register API routes FIRST, before Vite middleware
  // This prevents Vite from intercepting API calls and returning HTML
  registerRoutes(app);
  
  // Setup Vite or static serving AFTER API routes are registered
  if (app.get("env") === "development") {
    await setupVite(app, httpServer); 
  } else {
    serveStatic(app);
  }

  // Initialize socket.io server using the correct HTTP server
  const { initSocketIO } = await import('./socket');
  const io = initSocketIO(httpServer);

  // Scheduler initialization disabled due to schema conflicts
  console.log('Scheduler temporarily disabled for stability');

  // Import error handling middleware
  const { globalErrorHandler, notFoundHandler } = await import('./middleware/error-handler');

  // Route not found handler - must be after Vite/static middleware and before the errorHandler
  app.use(notFoundHandler);

  // Global error handler - must be registered last
  app.use(globalErrorHandler);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000; // Force port 5000 for deployment
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