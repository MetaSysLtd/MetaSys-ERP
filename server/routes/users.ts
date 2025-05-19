import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { createAuthMiddleware } from '../routes';

const router = express.Router();

// Get all users (admin only)
router.get('/', createAuthMiddleware(3), async (req, res) => {
  try {
    const users = await storage.getUsers();
    
    // Remove password from response
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(sanitizedUsers);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// Get a specific user
router.get('/:id', createAuthMiddleware(1), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is requesting their own data or has admin privileges
    if (userId !== req.user!.id && req.userRole!.level < 3) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to view this user'
      });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

// Update a user (corresponds to the ProfileFormValues schema in the client)
router.patch('/:id', createAuthMiddleware(1), async (req, res) => {
  // Set proper content type header to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is updating their own data or has admin privileges
    if (userId !== req.user!.id && req.userRole!.level < 3) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to update this user'
      });
    }
    
    // Validate the update fields
    const updateSchema = z.object({
      firstName: z.string().min(2, { message: "First name is required" }).optional(),
      lastName: z.string().min(2, { message: "Last name is required" }).optional(),
      email: z.string().email({ message: "Invalid email address" }).optional(),
      phoneNumber: z.string().optional().nullable(),
    });
    
    try {
      const validatedData = updateSchema.parse(req.body);
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (validationError: any) {
      if (validationError instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: fromZodError(validationError).message
        });
      }
      throw validationError;
    }
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// Update user password - ensure method is properly supported
router.patch('/:id/password', createAuthMiddleware(1), async (req, res) => {
  // Set proper content type for JSON responses
  res.setHeader('Content-Type', 'application/json');
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is updating their own password or has admin privileges
    if (userId !== req.user!.id && req.userRole!.level < 5) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to update this user\'s password'
      });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Both current password and new password are required' 
      });
    }
    
    // Get the user to verify current password
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if current password matches (in a real app you'd use bcrypt.compare here)
    if (user.password !== currentPassword) {
      return res.status(401).json({ 
        error: 'Current password is incorrect' 
      });
    }
    
    // Update the password
    const updatedUser = await storage.updateUser(userId, { 
      password: newPassword 
    });
    
    res.json({ 
      success: true,
      message: 'Password updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating password:', error);
    res.status(500).json({
      error: 'Failed to update password',
      message: error.message
    });
  }
});

// Get user notification preferences
router.get('/:id/notifications', createAuthMiddleware(1), async (req, res) => {
  // Set proper content type for JSON responses
  res.setHeader('Content-Type', 'application/json');
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is requesting their own notification settings or has admin privileges
    if (userId !== req.user!.id && req.userRole!.level < 3) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to view this user\'s notification settings'
      });
    }
    
    // Get the user to retrieve notification settings
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return the user's notification preferences or default values if not set
    const defaultPrefs = {
      emailNotifications: true,
      slackNotifications: true,
      leadUpdates: true,
      loadUpdates: true,
      invoiceUpdates: true,
      dailySummary: true,
      weeklySummary: true
    };
    
    res.json(user.notificationSettings || defaultPrefs);
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      error: 'Failed to fetch notification preferences',
      message: error.message
    });
  }
});

// Update user notification settings
router.patch('/:id/notifications', createAuthMiddleware(1), async (req, res) => {
  // Set proper content type for JSON responses
  res.setHeader('Content-Type', 'application/json');
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is updating their own notification settings or has admin privileges
    if (userId !== req.user!.id && req.userRole!.level < 3) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to update this user\'s notification settings'
      });
    }
    
    // Validate notification settings
    const notificationSchema = z.object({
      emailNotifications: z.boolean().default(true),
      slackNotifications: z.boolean().default(true),
      leadUpdates: z.boolean().default(true),
      loadUpdates: z.boolean().default(true),
      invoiceUpdates: z.boolean().default(true),
      dailySummary: z.boolean().default(true),
      weeklySummary: z.boolean().default(true),
    });
    
    const validatedData = notificationSchema.parse(req.body);
    
    try {
      // Store notification preferences in the user record using the jsonb column
      const updatedUser = await storage.updateUser(userId, {
        notificationSettings: validatedData 
      });
    
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Notification settings updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      error: 'Failed to update notification settings',
      message: error.message
    });
  }
});

export default router;