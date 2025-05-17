import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./consolidated-routes";
import { setupVite, serveStatic, log } from "./vite";
import * as notificationService from "./notifications";
import session from "express-session";
import { storage } from "./storage";
import { sessionHandler } from "./middleware/error-handler";
import { spaHandler } from "./middleware/spa-handler";
import path from "path";
import fs from "fs";

// JSON error handler middleware
function jsonErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof SyntaxError && 'body' in err && err.type === 'entity.parse.failed') {
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
  
  // Add compatibility middleware for authentication routes
  // This handles both /auth/... and /api/auth/... routes for backward compatibility
  app.use('/auth', (req, res, next) => {
    // Only redirect API calls, not HTML page requests
    if (!req.headers.accept || !req.headers.accept.includes('text/html')) {
      console.log(`Redirecting API ${req.path} to /api${req.originalUrl}`);
      
      // Forward the request to the /api/auth route
      req.url = `/api${req.originalUrl}`;
      app._router.handle(req, res, next);
    } else {
      // For HTML requests, let the SPA handler middleware take care of it
      next();
    }
  });
  
  // Register SPA handler for HTML requests
  // This ensures all routes serve the React app correctly
  app.use(spaHandler);

  // Setup Vite or static serving for frontend assets
  if (app.get("env") === "development") {
    // Make sure we pass the correct httpServer to setupVite
    await setupVite(app, httpServer); 
  } else {
    // Log available paths for static files to help with debugging
    console.log('Setting up static file serving for production...');
    
    // Check for client/dist folder (standard Vite output)
    const clientDistPath = path.resolve(process.cwd(), 'client/dist');
    if (fs.existsSync(clientDistPath)) {
      console.log(`Found client/dist folder at ${clientDistPath}`);
      app.use(express.static(clientDistPath, {
        index: false, // Don't serve index.html automatically for SPA routes
        setHeaders: (res, filePath) => {
          // Set appropriate MIME types for Vite-generated files
          if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          } else if (filePath.match(/\.module\.js$/)) {
            // Special case for ES modules - this is critical
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          } else if (filePath.endsWith('.mjs')) {
            // Special case for ES modules with .mjs extension
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
          } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
          } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
          } else if (filePath.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
            // Let Express handle image MIME types automatically
          } else if (filePath.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
            // Let Express handle font MIME types automatically
          } else {
            console.log(`Setting default headers for: ${filePath}`);
          }
        }
      }));
      console.log('Serving static files from client/dist');
    } else {
      console.log('client/dist folder not found, falling back to serveStatic');
      serveStatic(app);
    }
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

  // Explicit handler for the root path to ensure it always serves the SPA
  app.get('/', (req, res, next) => {
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      console.log('Explicit root handler for SPA');
      // For development, let Vite handle it
      if (app.get("env") === "development") {
        return next();
      }
      
      // For production, try to serve our emergency index.html if it exists
      const emergencyIndexPath = path.resolve(process.cwd(), 'public/emergency-index.html');
      if (fs.existsSync(emergencyIndexPath)) {
        console.log(`Using emergency index.html from ${emergencyIndexPath}`);
        res.setHeader('Content-Type', 'text/html');
        return res.sendFile(emergencyIndexPath);
      }
      
      next();
    } else {
      next();
    }
  });

  // Route not found handler - must be after Vite/static middleware and before the errorHandler
  app.use(notFoundHandler);

  // Global error handler - must be registered last
  app.use(errorHandler);

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