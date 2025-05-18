import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware';
import { notifyDataChange } from '../socket';

const router = express.Router();

// User profile routes require authentication
router.use(requireAuth);

// Define validation schema for profile updates
const profileUpdateSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNumber: z.string().optional(),
});

// GET user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user!.id;
    const userProfile = await storage.getUser(userId);
    
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    
    res.json(userProfile);
  } catch (error: any) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update user profile
router.post('/profile/edit', async (req, res) => {
  try {
    const userId = req.user!.id;
    const profileData = req.body;
    
    // Validate profile data
    const validationResult = profileUpdateSchema.safeParse(profileData);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid profile data', 
        errors: validationResult.error.errors 
      });
    }
    
    // Update the user profile
    const updatedProfile = await storage.updateUser(userId, validationResult.data);
    
    // Notify clients about the user profile update
    notifyDataChange(
      'users',
      userId,
      'updated',
      {
        entityData: updatedProfile,
        actor: {
          id: userId,
          name: req.user!.username,
          role: req.userRole?.name || 'User'
        }
      },
      {
        userId: userId,
        broadcastToOrg: false
      }
    );
    
    res.json(updatedProfile);
  } catch (error: any) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: error.message || 'Failed to update profile' });
  }
});

export default router;