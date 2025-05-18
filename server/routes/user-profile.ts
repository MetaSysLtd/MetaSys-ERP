import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { createAuthMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Get user profile
router.get('/profile', createAuthMiddleware(1), async (req, res) => {
  try {
    const userId = req.user!.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove sensitive info before sending response
    const { password, ...userProfile } = user;
    res.json(userProfile);
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user profile',
      message: error.message
    });
  }
});

// Profile update schema
const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().optional().nullable(),
});

// Update user profile
router.post('/update', createAuthMiddleware(1), async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Validate the request body
    try {
      const data = profileUpdateSchema.parse(req.body);
      
      // Update the user profile
      const updatedUser = await storage.updateUser(userId, data);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove sensitive data before sending response
      const { password, ...userProfile } = updatedUser;
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: userProfile
      });
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
    console.error('Error updating user profile:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// Change password
router.post('/change-password', createAuthMiddleware(1), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    // Get current user to check password
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password (would normally use bcrypt compare here)
    if (user.password !== currentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    const updatedUser = await storage.updateUser(userId, { password: newPassword });
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'Failed to update password' });
    }
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error: any) {
    console.error('Error changing password:', error);
    res.status(500).json({
      error: 'Failed to change password',
      message: error.message
    });
  }
});

export default router;