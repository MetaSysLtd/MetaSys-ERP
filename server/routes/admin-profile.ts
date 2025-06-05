import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = express.Router();

// Authentication middleware
const createAuthMiddleware = (requiredRoleLevel: number = 1) => {
  return async (req: any, res: any, next: any) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const role = await storage.getRole(user.roleId);
      if (!role || role.level < requiredRoleLevel) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user = user;
      req.userRole = role;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
};

// Admin profile update schema - allows all fields for system admins
const adminProfileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phoneNumber: z.string().nullable().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
});

// Admin password change schema
const adminPasswordChangeSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  currentPassword: z.string().optional(), // Optional for system admins
});

// Get admin profile
router.get('/profile', createAuthMiddleware(1), async (req, res) => {
  try {
    const user = await storage.getUser(req.user!.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove sensitive info before sending response
    const { password, ...userProfile } = user;
    res.json(userProfile);
  } catch (error: any) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// Update admin profile - system admins can update any field
router.patch('/profile', createAuthMiddleware(1), async (req, res) => {
  try {
    const userId = req.user!.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is system admin
    const isSystemAdmin = user.isSystemAdmin === true || (req.userRole?.level && req.userRole.level >= 5);
    
    if (!isSystemAdmin) {
      return res.status(403).json({ 
        error: 'System administrator privileges required' 
      });
    }
    
    // Validate the request body
    const validationResult = adminProfileUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid profile data', 
        details: validationResult.error.format() 
      });
    }
    
    // Update the user profile
    const updatedUser = await storage.updateUser(userId, validationResult.data);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'Failed to update profile' });
    }
    
    // Remove password from response
    const { password, ...userProfile } = updatedUser;
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userProfile
    });
  } catch (error: any) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// Change admin password - system admins don't need current password
router.patch('/password', createAuthMiddleware(1), async (req, res) => {
  try {
    const userId = req.user!.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is system admin
    const isSystemAdmin = user.isSystemAdmin === true || (req.userRole?.level && req.userRole.level >= 5);
    
    if (!isSystemAdmin) {
      return res.status(403).json({ 
        error: 'System administrator privileges required' 
      });
    }
    
    // Validate the request body
    const validationResult = adminPasswordChangeSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid password data', 
        details: validationResult.error.format() 
      });
    }
    
    const { newPassword, currentPassword } = validationResult.data;
    
    // For system admins, current password is optional
    if (currentPassword && user.password !== currentPassword) {
      return res.status(401).json({ 
        error: 'Current password is incorrect' 
      });
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
    console.error('Error changing admin password:', error);
    res.status(500).json({
      error: 'Failed to change password',
      message: error.message
    });
  }
});

export default router;