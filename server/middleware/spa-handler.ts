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
    console.log(`SPA fallback for URL: ${req.originalUrl} (path: ${req.path})`);
    
    // In production, serve the index.html file directly
    if (process.env.NODE_ENV !== 'development') {
      // Try multiple possible paths for the index.html file
      const possiblePaths = [
        path.resolve(process.cwd(), 'client/index.html'), // This is the original source file
        path.resolve(process.cwd(), 'server/public/index.html'),
        path.resolve(process.cwd(), 'public/index.html'),
        path.resolve(process.cwd(), 'dist/index.html'),
        path.resolve(process.cwd(), 'client/dist/index.html'),
        path.resolve(process.cwd(), 'client/public/index.html'),
      ];
      
      // List all directories to help debug
      console.log('Current directory structure:');
      try {
        const dirs = ['client', 'server', 'public', 'dist', '.'].filter(dir => fs.existsSync(dir));
        for (const dir of dirs) {
          console.log(`Contents of ${dir}/:`);
          console.log(fs.readdirSync(dir).join(', '));
        }
      } catch (error) {
        console.error('Error listing directories:', error);
      }
      
      // Try each possible path
      let indexHtmlContent = null;
      let foundPath = null;
      
      for (const indexPath of possiblePaths) {
        if (fs.existsSync(indexPath)) {
          console.log(`SPA handler: Found index.html at ${indexPath}`);
          
          try {
            // Read the file content to make sure it's not empty
            indexHtmlContent = fs.readFileSync(indexPath, 'utf8');
            console.log(`File size: ${indexHtmlContent.length} bytes`);
            
            if (indexHtmlContent && indexHtmlContent.length > 0) {
              foundPath = indexPath;
              break;
            } else {
              console.warn(`Found empty index.html at ${indexPath}`);
            }
          } catch (error) {
            console.error(`Error reading ${indexPath}:`, error);
          }
        }
      }
      
      if (foundPath && indexHtmlContent) {
        // Ensure content type is set to HTML
        res.setHeader('Content-Type', 'text/html');
        
        // Directly send the content instead of using sendFile to ensure it works
        return res.send(indexHtmlContent);
      }
      
      console.error(`SPA handler: Could not find valid index.html in any expected location`);
      console.error(`Looked in: ${possiblePaths.join(', ')}`);
      
      // In case we can't find the index.html, return a basic HTML page instead of blank
      res.setHeader('Content-Type', 'text/html');
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>MetaSys ERP</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
              h1 { color: #025E73; }
              .error { color: #e44; }
              .container { max-width: 800px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>MetaSys ERP</h1>
              <p>The application could not be loaded.</p>
              <p class="error">Error: Could not find the application files.</p>
              <p>Please contact the administrator.</p>
            </div>
          </body>
        </html>
      `);
    }
  }
  
  // Let other middleware handle it
  next();
}