import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

/**
 * Middleware to ensure SPA routes always serve the index.html file 
 * with proper content type headers in production
 */
export function spaHandler(req: Request, res: Response, next: NextFunction) {
  // Only handle HTML requests, not API or asset requests
  if (
    req.method === 'GET' && 
    !req.path.startsWith('/api') && 
    !req.path.includes('.') && // Skip files with extensions (static assets)
    req.headers.accept && 
    req.headers.accept.includes('text/html')
  ) {
    console.log(`SPA handler: serving index.html for route ${req.path}`);
    
    // In production, serve the index.html file directly
    if (process.env.NODE_ENV !== 'development') {
      const distPath = path.resolve(process.cwd(), 'server/public');
      const indexPath = path.resolve(distPath, 'index.html');
      
      if (fs.existsSync(indexPath)) {
        res.setHeader('Content-Type', 'text/html');
        return res.sendFile(indexPath);
      } else {
        console.error(`SPA handler: Could not find index.html at ${indexPath}`);
      }
    }
  }
  
  // Let other middleware handle it
  next();
}