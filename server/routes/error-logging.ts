import express from 'express';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { storage } from '../storage';

/**
 * Register error logging routes for both API and client errors
 */
export function registerErrorRoutes(app: express.Express) {
  // Create logs directory if it doesn't exist
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // API endpoint for client-side error logging
  app.post('/api/log-client-error', async (req: Request, res: Response) => {
    try {
      const { error, timestamp, url, userAgent, context } = req.body;
      const userId = req.session.userId;
      
      // Log to file
      const logEntry = {
        source: 'client',
        timestamp: timestamp || new Date().toISOString(),
        userId,
        error,
        url,
        userAgent,
        context
      };
      
      // Log to activities table if user is logged in
      if (userId) {
        await storage.createActivity({
          userId,
          entityType: 'error',
          entityId: 0,
          action: 'client_error',
          details: JSON.stringify({
            message: error.message,
            type: error.type,
            url,
            context
          })
        });
      }
      
      // Append to daily log file
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(logsDir, `client-errors-${today}.log`);
      
      fs.appendFileSync(
        logFile, 
        JSON.stringify(logEntry) + '\n',
        { encoding: 'utf8' }
      );
      
      // Return success
      res.status(200).json({ message: 'Error logged successfully' });
    } catch (error) {
      console.error('Error logging client error:', error);
      res.status(500).json({ 
        message: 'Error logging failed', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Internal API for logging server-side errors
  app.post('/api/log-server-error', async (req: Request, res: Response) => {
    try {
      const { error, source, context } = req.body;
      const userId = req.session.userId;
      
      // Log to file
      const logEntry = {
        source: source || 'server',
        timestamp: new Date().toISOString(),
        userId,
        error,
        context
      };
      
      // Log to activities table if user is logged in and storage is available
      if (userId && storage.createActivity) {
        await storage.createActivity({
          userId,
          entityType: 'error',
          entityId: 0,
          action: 'server_error',
          details: JSON.stringify({
            message: error.message,
            stack: error.stack,
            source,
            context
          })
        });
      }
      
      // Append to daily log file
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(logsDir, `server-errors-${today}.log`);
      
      fs.appendFileSync(
        logFile, 
        JSON.stringify(logEntry) + '\n',
        { encoding: 'utf8' }
      );
      
      // Return success
      res.status(200).json({ message: 'Error logged successfully' });
    } catch (error) {
      console.error('Error logging server error:', error);
      res.status(500).json({ 
        message: 'Error logging failed', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // API for error monitoring dashboard (admin only) 
  app.get('/api/error-logs', async (req: Request, res: Response) => {
    try {
      // Check if user has permission to view logs
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Get user with role
      const user = await storage.getUser(userId);
      if (!user || !user.canViewAuditLog) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions to view error logs' });
      }
      
      // Get query params
      const { type, limit = '100', date } = req.query;
      const maxLimit = 500;
      const parsedLimit = Math.min(parseInt(limit as string), maxLimit);
      
      // Determine which log file to read
      const logDate = date ? String(date) : new Date().toISOString().split('T')[0];
      const logType = type === 'client' ? 'client' : 'server';
      const logFile = path.join(logsDir, `${logType}-errors-${logDate}.log`);
      
      // Check if log file exists
      if (!fs.existsSync(logFile)) {
        return res.status(200).json({ logs: [] });
      }
      
      // Read and parse log file
      const logContents = fs.readFileSync(logFile, 'utf8');
      const logs = logContents
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (error) {
            return { error: 'Failed to parse log entry', raw: line };
          }
        })
        .slice(-parsedLimit);
      
      // Return logs
      res.status(200).json({ logs });
    } catch (error) {
      console.error('Error retrieving error logs:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve error logs', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
}