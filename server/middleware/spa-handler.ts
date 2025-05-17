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
      // Try multiple possible paths for the index.html file
      const possiblePaths = [
        path.resolve(process.cwd(), 'server/public/index.html'),
        path.resolve(process.cwd(), 'public/index.html'),
        path.resolve(process.cwd(), 'dist/index.html'),
        path.resolve(process.cwd(), 'client/dist/index.html'),
        path.resolve(process.cwd(), 'client/index.html')
      ];
      
      // Try each possible path
      for (const indexPath of possiblePaths) {
        if (fs.existsSync(indexPath)) {
          console.log(`SPA handler: Found index.html at ${indexPath}`);
          res.setHeader('Content-Type', 'text/html');
          return res.sendFile(indexPath);
        }
      }
      
      console.error(`SPA handler: Could not find index.html in any expected location`);
      console.error(`Looked in: ${possiblePaths.join(', ')}`);
    }
  }
  
  // Let other middleware handle it
  next();
}