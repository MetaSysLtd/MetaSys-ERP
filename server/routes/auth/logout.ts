import { Request, Response } from 'express';

/**
 * Enhanced logout handler that properly clears session cookies
 * - Clears session data
 * - Destroys the session
 * - Clears all possible session cookies with proper settings
 */
export async function handleLogout(req: Request, res: Response): Promise<void> {
  try {
    // Log the session info for debugging
    console.log(`Logout requested for session: ${req.sessionID}`, { 
      hasSession: !!req.session,
      userId: req.session?.userId
    });
    
    // If no session exists, still return success but clear cookies
    if (!req.session) {
      console.log("No session found during logout");
      
      // Clear all possible cookies just to be safe
      res.clearCookie('metasys.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax'
      });
      
      res.status(200).json({
        message: "Already logged out",
        success: true
      });
      return;
    }
    
    // Clear session data first
    req.session.userId = undefined;
    req.session.orgId = undefined;
    
    // Save the cleared session then destroy it using promises
    await new Promise<void>((resolve, reject) => {
      req.session.save(err => {
        if (err) {
          console.error("Error saving session during logout:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    // After saving, destroy the session
    await new Promise<void>((resolve, reject) => {
      req.session.destroy(err => {
        if (err) {
          console.error("Error destroying session during logout:", err);
          reject(err);
        } else {
          console.log("Session successfully destroyed");
          resolve();
        }
      });
    });
    
    // Clear all possible session cookies with various options
    // Clear the custom named cookie
    res.clearCookie('metasys.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Also clear the default connect.sid cookie as a fallback
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    console.log(`Successfully logged out user and cleared session cookies`);
    
    // Return success response
    res.status(200).json({
      message: "Successfully logged out",
      success: true
    });
    
  } catch (error) {
    console.error("Error during logout process:", error);
    
    // Even if there's an error, still try to clear cookies as best effort
    try {
      res.clearCookie('metasys.sid', { path: '/' });
      res.clearCookie('connect.sid', { path: '/' });
    } catch (cookieError) {
      console.error("Error clearing cookies:", cookieError);
    }
    
    res.status(500).json({
      message: "Error during logout",
      success: false
    });
  }
}