import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware';

const router = express.Router();

// All settings routes require authentication
router.use(requireAuth);

// Define the validation schema for profile updates
const profileUpdateSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Must be a valid email address"),
  phoneNumber: z.string().optional(),
});

// Get current user profile settings
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user!.id;
    const profile = await storage.getUser(userId);
    
    if (!profile) {
      return res.status(404).json({ error: "User profile not found" });
    }
    
    return res.json(profile);
  } catch (error: any) {
    console.error('Error fetching profile settings:', error);
    return res.status(500).json({ 
      error: "Failed to fetch profile settings",
      message: error.message
    });
  }
});

// Update user profile settings
router.post('/profile/edit', async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Validate the request data
    const validationResult = profileUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid profile data", 
        details: validationResult.error.format() 
      });
    }
    
    // Update the user profile
    const updatedProfile = await storage.updateUser(userId, validationResult.data);
    
    // Return the updated profile
    return res.json(updatedProfile);
  } catch (error: any) {
    console.error('Error updating profile settings:', error);
    return res.status(500).json({ 
      error: "Failed to update profile settings",
      message: error.message
    });
  }
});

export default router;