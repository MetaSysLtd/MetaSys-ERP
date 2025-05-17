import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

/**
 * Middleware to handle SPA routes and serve index.html
 * Specifically enhanced to handle production deployment challenges
 */
export const spaHandler = (req: Request, res: Response, next: NextFunction) => {
  // Check if this is an API request (skip SPA handling)
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  // Only handle GET requests that accept HTML or where browser might be requesting a module
  // This helps catch cases where modules are requested but would be handled incorrectly
  if (req.method !== 'GET' || 
      (!req.headers.accept?.includes('text/html') && 
       !req.path.endsWith('.js') && 
       !req.path.endsWith('.mjs') && 
       !req.path.includes('assets/'))) {
    return next();
  }

  console.log(`SPA fallback for URL: ${req.url} (path: ${req.path})`);

  // Log directory structure to help with debugging
  const projectRoot = process.cwd();
  console.log('Current directory structure:');
  
  // Check critical directories and log their contents
  const directories = ['client', 'server', 'public', 'dist', './'];
  directories.forEach(dir => {
    try {
      console.log(`Contents of ${dir}/:`)
      const dirContents = fs.readdirSync(path.join(projectRoot, dir));
      console.log(dirContents.join(', '));
    } catch (e) {
      console.log(`Error reading ${dir}/: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  });

  // Try multiple possible locations for index.html
  const possibleIndexLocations = [
    path.join(projectRoot, 'public/index.html'), // Custom fallback
    path.join(projectRoot, 'dist/client/index.html'), // Typical Vite output
    path.join(projectRoot, 'client/dist/index.html'), // Another possible location
    path.join(projectRoot, 'client/index.html'), // Development version
    path.join(projectRoot, 'dist/index.html'), // Server build location
  ];

  // Find the first existing index.html
  for (const indexPath of possibleIndexLocations) {
    if (fs.existsSync(indexPath)) {
      console.log(`SPA handler: Found index.html at ${indexPath}`);
      const fileSize = fs.statSync(indexPath).size;
      console.log(`File size: ${fileSize} bytes`);
      
      // Set correct content type
      res.setHeader('Content-Type', 'text/html');
      
      // Send the file and end the request
      return res.sendFile(indexPath);
    }
  }

  // If no index.html is found, generate a minimal emergency fallback
  console.log('No index.html found, generating emergency fallback');
  
  const emergencyHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MetaSys ERP</title>
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #f1fafb;
        color: #011F26;
        margin: 0;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }
      
      .container {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
        padding: 2rem;
        text-align: center;
      }
      
      h1 {
        color: #025E73;
        font-size: 1.75rem;
        margin-bottom: 1rem;
      }
      
      p {
        margin-bottom: 1.5rem;
        line-height: 1.6;
        color: #666;
      }
      
      .button {
        display: inline-block;
        background-color: #025E73;
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 500;
        margin-top: 1rem;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>MetaSys ERP</h1>
      <p>Welcome to the MetaSys Enterprise Resource Planning system.</p>
      <p>The application is currently being updated. Please click below to access the system.</p>
      <a href="/auth" class="button">Login to System</a>
    </div>
    
    <script>
      // Redirect to auth after 2 seconds
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    </script>
  </body>
  </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  return res.send(emergencyHtml);
};

export default spaHandler;