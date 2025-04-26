import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as notificationService from "./notifications";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  
  const server = await registerRoutes(app);
  
  // Initialize socket.io server
  const { initializeSocketServer } = await import('./socket');
  const io = initializeSocketServer(server);
  
  // Initialize scheduler
  const { initializeScheduler } = await import('./scheduler');
  const schedulerJobs = initializeScheduler();

  // Import and use the error handling middleware
  const { errorHandler, notFoundHandler } = await import('./middleware/error-handler');
  
  // Route not found handler - must be before the errorHandler
  app.use(notFoundHandler);
  
  // Global error handler - must be registered last
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
