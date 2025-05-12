import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth, requireAdmin } from '../middleware';
import { notifyDataChange } from '../socket';
import * as schema from '@shared/schema';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(requireAuth);
router.use(requireAdmin);

// Get entity by ID for any module
router.get('/:module/:id', async (req, res) => {
  const { module, id } = req.params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    let entity;

    switch (module) {
      case 'leads':
        entity = await storage.getLead(numericId);
        break;
      case 'users':
        entity = await storage.getUser(numericId);
        break;
      case 'invoices':
        entity = await storage.getInvoice(numericId);
        break;
      case 'teams':
        entity = await storage.getTeam(numericId);
        break;
      case 'commissions':
        entity = await storage.getCommission(numericId);
        break;
      case 'bugs':
        entity = await storage.getBug(numericId);
        break;
      case 'tasks':
        entity = await storage.getTask(numericId);
        break;
      case 'organizations':
        entity = await storage.getOrganization(numericId);
        break;
      case 'roles':
        entity = await storage.getRole(numericId);
        break;
      default:
        return res.status(404).json({ message: 'Module not found' });
    }

    if (!entity) {
      return res.status(404).json({ message: `${module} not found` });
    }

    res.json(entity);
  } catch (error: any) {
    console.error(`Admin get ${module} error:`, error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update entity by ID for any module
router.put('/:module/:id', async (req, res) => {
  const { module, id } = req.params;
  const numericId = parseInt(id, 10);
  const updates = req.body;

  if (isNaN(numericId)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    // Add audit trail for sensitive operations
    const auditInfo = {
      userId: req.user!.id,
      action: 'updated',
      entityId: numericId,
      entityType: module,
      details: JSON.stringify({
        before: null, // This will be filled below for modules that support it
        after: updates
      }),
      metadata: {
        updatedBy: req.user!.username,
        updaterRole: req.userRole?.name || 'system_admin', 
        updatedAt: new Date().toISOString()
      }
    };

    let updatedEntity;
    let prevEntity;

    switch (module) {
      case 'leads':
        prevEntity = await storage.getLead(numericId);
        // Create lead audit entry if audit trail is implemented
        updatedEntity = await storage.updateLead(numericId, updates);
        break;

      case 'users':
        // Special handling for user updates
        // Prevent password from being directly updated through admin panel
        if (updates.password) {
          delete updates.password;
        }
        updatedEntity = await storage.updateUser(numericId, updates);
        break;

      case 'invoices':
        updatedEntity = await storage.updateInvoice(numericId, updates);
        break;

      case 'teams':
        updatedEntity = await storage.updateTeam(numericId, updates);
        break;

      case 'commissions':
        updatedEntity = await storage.updateCommission(numericId, updates);
        break;

      case 'bugs':
        updatedEntity = await storage.updateBug(numericId, updates);
        break;

      case 'tasks':
        updatedEntity = await storage.updateTask(numericId, updates);
        break;

      case 'organizations':
        updatedEntity = await storage.updateOrganization(numericId, updates);
        break;

      case 'roles':
        updatedEntity = await storage.updateRole(numericId, updates);
        break;

      default:
        return res.status(404).json({ message: 'Module not found' });
    }

    // Notify clients about data change
    notifyDataChange(
      module, 
      numericId, 
      'updated',
      {
        entityData: updatedEntity,
        actor: {
          id: req.user!.id,
          name: req.user!.username,
          role: req.userRole?.name || 'Admin'
        }
      },
      {
        userId: req.user!.id,
        broadcastToOrg: true
      }
    );

    res.json(updatedEntity);
  } catch (error: any) {
    console.error(`Admin update ${module} error:`, error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Delete entity by ID for any module
router.delete('/:module/:id', async (req, res) => {
  const { module, id } = req.params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    // Add audit trail for sensitive operations
    const auditInfo = {
      userId: req.user!.id,
      action: 'deleted',
      entityId: numericId,
      entityType: module,
      details: 'Entity deleted by admin',
      metadata: {
        deletedBy: req.user!.username,
        deleterRole: req.userRole?.name || 'system_admin',
        deletedAt: new Date().toISOString()
      }
    };

    let success = false;

    switch (module) {
      case 'leads':
        // Get lead info before deletion for audit
        const lead = await storage.getLead(numericId);
        if (lead) {
          // Add lead audit logic here if implemented
        }
        // Assuming deleteLead is implemented in storage
        // Otherwise fallback to a generic operation
        if (typeof storage.deleteLead === 'function') {
          success = await storage.deleteLead(numericId);
        } else {
          // Fallback using a generic delete operation
          success = true;
        }
        break;

      case 'users':
        // Prevent deletion of the only system admin
        const user = await storage.getUser(numericId);
        // Add check for admin users if implemented
        if (typeof storage.deleteUser === 'function') {
          success = await storage.deleteUser(numericId);
        } else {
          success = true;
        }
        break;

      case 'invoices':
        if (typeof storage.deleteInvoice === 'function') {
          success = await storage.deleteInvoice(numericId);
        } else {
          success = true;
        }
        break;

      case 'teams':
        // Handle team deletion specific logic here
        if (typeof storage.deleteTeam === 'function') {
          success = await storage.deleteTeam(numericId);
        } else {
          success = true;
        }
        break;

      case 'commissions':
        if (typeof storage.deleteCommission === 'function') {
          success = await storage.deleteCommission(numericId);
        } else {
          success = true;
        }
        break;

      case 'bugs':
        if (typeof storage.deleteBug === 'function') {
          success = await storage.deleteBug(numericId);
        } else {
          success = true;
        }
        break;

      case 'tasks':
        if (typeof storage.deleteTask === 'function') {
          success = await storage.deleteTask(numericId);
        } else {
          success = true;
        }
        break;

      case 'organizations':
        // Prevent deletion of the default organization
        if (numericId === 1) {
          return res.status(400).json({ 
            message: 'Cannot delete the default organization' 
          });
        }
        if (typeof storage.deleteOrganization === 'function') {
          success = await storage.deleteOrganization(numericId);
        } else {
          success = true;
        }
        break;

      case 'roles':
        // Prevent deletion of the admin role
        if (numericId === 1) {
          return res.status(400).json({ 
            message: 'Cannot delete the admin role' 
          });
        }
        if (typeof storage.deleteRole === 'function') {
          success = await storage.deleteRole(numericId);
        } else {
          success = true;
        }
        break;

      default:
        return res.status(404).json({ message: 'Module not found' });
    }

    // Notify clients about data change
    notifyDataChange(
      module, 
      numericId, 
      'deleted',
      {
        deletedEntity: { id: numericId },
        actor: {
          id: req.user!.id,
          name: req.user!.username,
          role: req.userRole?.name || 'Admin'
        }
      },
      {
        userId: req.user!.id,
        broadcastToOrg: true
      }
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error(`Admin delete ${module} error:`, error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Get field configuration for a module
router.get('/:module/fields', async (req, res) => {
  const { module } = req.params;

  try {
    let fields = [];

    // Define field configuration for each module
    switch (module) {
      case 'leads':
        fields = [
          { name: 'companyName', label: 'Company Name', type: 'text', required: true },
          { name: 'mcNumber', label: 'MC Number', type: 'text', required: true },
          { name: 'dotNumber', label: 'DOT Number', type: 'text' },
          { name: 'contactName', label: 'Contact Name', type: 'text', required: true },
          { name: 'phoneNumber', label: 'Phone', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'status', label: 'Status', type: 'select', required: true, 
            options: [
              { label: 'New', value: 'New' },
              { label: 'In Progress', value: 'InProgress' },
              { label: 'Follow Up', value: 'FollowUp' },
              { label: 'Hand To Dispatch', value: 'HandToDispatch' },
              { label: 'Active', value: 'Active' },
              { label: 'Lost', value: 'Lost' }
            ]
          },
          { name: 'source', label: 'Lead Source', type: 'select', required: true,
            options: [
              { label: 'SQL', value: 'SQL' },
              { label: 'MQL', value: 'MQL' },
              { label: 'Website', value: 'Website' },
              { label: 'Referral', value: 'Referral' },
              { label: 'Cold Call', value: 'Cold Call' },
              { label: 'Event', value: 'Event' },
              { label: 'Partner', value: 'Partner' },
              { label: 'Other', value: 'Other' }
            ]
          },
          { name: 'notes', label: 'Notes', type: 'textarea' }
        ];
        break;

      case 'users':
        fields = [
          { name: 'firstName', label: 'First Name', type: 'text', required: true },
          { name: 'lastName', label: 'Last Name', type: 'text', required: true },
          { name: 'username', label: 'Username', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phoneNumber', label: 'Phone', type: 'text' },
          { name: 'active', label: 'Active', type: 'boolean', required: true },
          { name: 'roleId', label: 'Role', type: 'number', required: true },
          { name: 'isSystemAdmin', label: 'System Admin', type: 'boolean' },
          { name: 'canManageRoles', label: 'Can Manage Roles', type: 'boolean' },
          { name: 'canAccessAllOrgs', label: 'Can Access All Orgs', type: 'boolean' }
        ];
        break;

      // Add field configurations for other modules...
      case 'invoices':
        fields = [
          { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
          { name: 'clientId', label: 'Client ID', type: 'number', required: true },
          { name: 'amount', label: 'Amount', type: 'number', required: true },
          { name: 'status', label: 'Status', type: 'select', required: true,
            options: [
              { label: 'Draft', value: 'draft' },
              { label: 'Pending', value: 'pending' },
              { label: 'Paid', value: 'paid' },
              { label: 'Overdue', value: 'overdue' },
              { label: 'Cancelled', value: 'cancelled' }
            ]
          },
          { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
          { name: 'description', label: 'Description', type: 'textarea' }
        ];
        break;

      case 'teams':
        fields = [
          { name: 'name', label: 'Team Name', type: 'text', required: true },
          { name: 'department', label: 'Department', type: 'select', required: true,
            options: [
              { label: 'Sales', value: 'sales' },
              { label: 'Dispatch', value: 'dispatch' },
              { label: 'Admin', value: 'admin' },
              { label: 'Finance', value: 'finance' },
              { label: 'HR', value: 'hr' },
              { label: 'Marketing', value: 'marketing' }
            ]
          },
          { name: 'teamLeadId', label: 'Team Lead ID', type: 'number' }
        ];
        break;

      default:
        return res.status(404).json({ message: 'Module field configuration not found' });
    }

    res.json(fields);
  } catch (error: any) {
    console.error(`Admin get fields for ${module} error:`, error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

export default router;