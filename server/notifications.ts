import * as slackService from './slack';
import * as emailService from './email';
import { log } from './vite';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { leads, users } from '@shared/schema';
import { storage } from './storage';

// Types of notifications
export enum NotificationType {
  LEAD_CREATED = 'lead_created',
  LEAD_UPDATED = 'lead_updated',
  LEAD_STATUS_CHANGED = 'lead_status_changed',
  LEAD_REMARK_ADDED = 'lead_remark_added',
  LOAD_CREATED = 'load_created',
  LOAD_UPDATED = 'load_updated',
  LOAD_STATUS_CHANGED = 'load_status_changed',
  INVOICE_CREATED = 'invoice_created',
  INVOICE_UPDATED = 'invoice_updated',
  INVOICE_STATUS_CHANGED = 'invoice_status_changed',
  DISPATCH_CLIENT_CREATED = 'dispatch_client_created',
  DISPATCH_CLIENT_UPDATED = 'dispatch_client_updated',
  DISPATCH_CLIENT_STATUS_CHANGED = 'dispatch_client_status_changed',
  DAILY_SUMMARY = 'daily_summary'
}

// User notification preferences (to be stored in user settings)
export interface NotificationPreferences {
  email: boolean;
  slack: boolean;
  sms: boolean;
  inApp: boolean;
  whatsapp: boolean;
  teamNotifications: {
    leadUpdates: boolean;
    loadUpdates: boolean;
    invoiceUpdates: boolean;
    dailySummaries: boolean;
  };
}

// Default notification preferences
export const defaultNotificationPreferences: NotificationPreferences = {
  email: true,
  slack: true,
  sms: false,
  inApp: true,
  whatsapp: false,
  teamNotifications: {
    leadUpdates: true,
    loadUpdates: true,
    invoiceUpdates: true,
    dailySummaries: true
  }
};

// Store notification settings in memory since we aren't using a DB yet
const userNotificationSettings = new Map<number, NotificationPreferences>();

// Helper function to get notification preferences for a user
export const getUserNotificationPreferences = (userId: number): NotificationPreferences => {
  return userNotificationSettings.get(userId) || defaultNotificationPreferences;
};

// Save user notification preferences
export const saveUserNotificationPreferences = (userId: number, preferences: NotificationPreferences): void => {
  userNotificationSettings.set(userId, preferences);
};

// Send a lead notification
export const sendLeadNotification = async (
  leadId: number,
  action: 'created' | 'updated' | 'status_changed',
  urgent: boolean = false
): Promise<void> => {
  try {
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) {
      log(`Lead notification failed: Lead ${leadId} not found`);
      return;
    }

    // Get the creator's info
    const creator = await storage.getUser(lead.createdBy);
    const assignee = lead.assignedTo ? await storage.getUser(lead.assignedTo) : null;

    // Construct notification message
    const notificationType = action === 'created' 
      ? NotificationType.LEAD_CREATED 
      : action === 'status_changed' 
        ? NotificationType.LEAD_STATUS_CHANGED 
        : NotificationType.LEAD_UPDATED;

    const message = {
      type: notificationType,
      title: action === 'created' 
        ? 'New Lead Created' 
        : action === 'status_changed' 
          ? `Lead Status Changed to ${lead.status}` 
          : 'Lead Updated',
      body: `Lead for ${lead.companyName} has been ${action}`,
      details: {
        leadId: lead.id,
        companyName: lead.companyName,
        createdBy: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown',
        assignedTo: assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned',
        status: lead.status,
        urgent: urgent
      }
    };

    // In a real app, we would determine recipients based on roles and notification preferences
    // For now, just get users who have enabled the relevant notification channel

    // Get all active users
    const allUsers = await storage.getUsers();

    // Send notifications to appropriate users based on their preferences
    for (const user of allUsers) {
      // Skip inactive users
      if (!user.active) continue;

      // Get user preferences
      const preferences = getUserNotificationPreferences(user.id);

      // Check if user wants lead notifications
      if (preferences.teamNotifications.leadUpdates) {
        // Send through enabled channels
        if (preferences.email) {
          log(`Would send email to ${user.email} about lead ${leadId}`);
          // emailService.sendEmail(user.email, message.title, message.body);
        }

        if (preferences.slack) {
          log(`Would send Slack message to ${user.username} about lead ${leadId}`);
          // slackService.sendMessage(user.username, message.title, message.body);
        }

        if (preferences.sms && user.phone) {
          log(`Would send SMS to ${user.phone} about lead ${leadId}`);
          // smsService.sendSMS(user.phone, message.body);
        }

        // Store in-app notification
        if (preferences.inApp) {
          log(`Would store in-app notification for ${user.username} about lead ${leadId}`);
          // In a real app, we would store this in a notifications collection
        }
      }
    }

    log(`Notifications sent for lead ${leadId} ${action}`);
  } catch (error) {
    log(`Failed to send lead notification: ${error}`);
  }
};

// Send a load notification
export const sendLoadNotification = async (
  loadId: number,
  action: 'created' | 'updated' | 'status_changed',
  urgent: boolean = false
): Promise<void> => {
  try {
    const load = await storage.getLoad(loadId);
    if (!load) {
      log(`Load notification failed: Load ${loadId} not found`);
      return;
    }

    // Get relevant user info
    const assignee = load.assignedTo ? await storage.getUser(load.assignedTo) : null;

    // Construct notification message
    const notificationType = action === 'created' 
      ? NotificationType.LOAD_CREATED 
      : action === 'status_changed' 
        ? NotificationType.LOAD_STATUS_CHANGED 
        : NotificationType.LOAD_UPDATED;

    const message = {
      type: notificationType,
      title: action === 'created' 
        ? 'New Load Created' 
        : action === 'status_changed' 
          ? `Load Status Changed to ${load.status}` 
          : 'Load Updated',
      body: `Load #${load.id} from ${load.origin} to ${load.destination} has been ${action}`,
      details: {
        loadId: load.id,
        origin: load.origin,
        destination: load.destination,
        assignedTo: assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned',
        status: load.status,
        urgent: urgent
      }
    };

    // Send notifications to appropriate users based on their preferences
    // Similar to lead notifications, but would filter for dispatch department users
    const allUsers = await storage.getUsers();

    for (const user of allUsers) {
      if (!user.active) continue;

      // Get user preferences
      const preferences = getUserNotificationPreferences(user.id);

      // Check if user wants load notifications
      if (preferences.teamNotifications.loadUpdates) {
        // Send through enabled channels
        if (preferences.email) {
          log(`Would send email to ${user.email} about load ${loadId}`);
          // emailService.sendEmail(user.email, message.title, message.body);
        }

        if (preferences.slack) {
          log(`Would send Slack message to ${user.username} about load ${loadId}`);
          // slackService.sendMessage(user.username, message.title, message.body);
        }
      }
    }

    log(`Notifications sent for load ${loadId} ${action}`);
  } catch (error) {
    log(`Failed to send load notification: ${error}`);
  }
};

// Send a invoice notification
export const sendInvoiceNotification = async (
  invoiceId: number,
  action: 'created' | 'updated' | 'status_changed',
  urgent: boolean = false
): Promise<void> => {
  try {
    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      log(`Invoice notification failed: Invoice ${invoiceId} not found`);
      return;
    }

    // Construct notification message
    const notificationType = action === 'created' 
      ? NotificationType.INVOICE_CREATED 
      : action === 'status_changed' 
        ? NotificationType.INVOICE_STATUS_CHANGED 
        : NotificationType.INVOICE_UPDATED;

    const message = {
      type: notificationType,
      title: action === 'created' 
        ? 'New Invoice Created' 
        : action === 'status_changed' 
          ? `Invoice Status Changed to ${invoice.status}` 
          : 'Invoice Updated',
      body: `Invoice #${invoice.invoiceNumber} for $${invoice.totalAmount} has been ${action}`,
      details: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.totalAmount,
        status: invoice.status,
        urgent: urgent
      }
    };

    // Send notifications to appropriate users based on their preferences
    // Similar logic to lead and load notifications
    log(`Notifications sent for invoice ${invoiceId} ${action}`);
  } catch (error) {
    log(`Failed to send invoice notification: ${error}`);
  }
};

// Send daily summary notifications to all users who have opted in
// Send a lead remark notification
export const sendLeadRemarkNotification = async (
  leadId: number,
  action: 'remark_added',
  data: {
    userId: number;
    userName: string;
    leadId: number;
    remarkId: number;
  }
): Promise<void> => {
  try {
    const lead = await storage.getLead(leadId);
    if (!lead) {
      log(`Lead remark notification failed: Lead ${leadId} not found`);
      return;
    }

    // Get the creator's info
    const creator = await storage.getUser(data.userId);
    if (!creator) {
      log(`Lead remark notification failed: User ${data.userId} not found`);
      return;
    }

    // Construct notification message
    const message = {
      type: NotificationType.LEAD_REMARK_ADDED,
      title: 'New Remark Added',
      body: `${creator.firstName} ${creator.lastName} added a remark to lead: ${lead.companyName}`,
      details: {
        leadId: lead.id,
        companyName: lead.companyName,
        remarkId: data.remarkId,
        createdBy: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown',
        assignedTo: lead.assignedTo,
        status: lead.status
      }
    };

    // Get relevant users to notify
    const allUsers = await storage.getUsers();
    
    // For lead remarks, we want to notify:
    // 1. The lead owner (assignedTo user)
    // 2. Team leads in the same department
    // 3. Admins
    
    const notifyUserIds = new Set<number>();
    
    // Always notify the lead owner
    if (lead.assignedTo) {
      notifyUserIds.add(lead.assignedTo);
    }
    
    // Find team leads and admins
    const salesTeamLeads = allUsers.filter(user => {
      const role = user.roleId;
      return user.active && (role === 2 || role === 4); // Sales Team Lead (2) or Admin (4)
    });
    
    // Add them to the notification list
    salesTeamLeads.forEach(user => notifyUserIds.add(user.id));
    
    // Send notifications to the users
    for (const userId of notifyUserIds) {
      // Get user preferences
      const preferences = getUserNotificationPreferences(userId);
      
      // Check if user wants lead notifications
      if (preferences.teamNotifications.leadUpdates) {
        // Send through enabled channels
        if (preferences.inApp) {
          log(`Would store in-app notification for user ${userId} about lead remark on lead ${leadId}`);
          // In a real app, we would store this in a notifications collection
          
          // Emit socket event
          const io = (global as any).io;
          if (io) {
            io.to(`user_${userId}`).emit('leadRemarkAdded', message);
          }
        }
        
        if (preferences.email) {
          const user = allUsers.find(u => u.id === userId);
          if (user && user.email) {
            log(`Would send email to ${user.email} about lead remark on lead ${leadId}`);
            // emailService.sendEmail(user.email, message.title, message.body);
          }
        }
        
        if (preferences.slack) {
          const user = allUsers.find(u => u.id === userId);
          if (user) {
            log(`Would send Slack message to ${user.username} about lead remark on lead ${leadId}`);
            // slackService.sendMessage(user.username, message.title, message.body);
          }
        }
      }
    }
    
    log(`Notifications sent for lead remark on lead ${leadId}`);
  } catch (error) {
    log(`Failed to send lead remark notification: ${error}`);
  }
};

// Send a dispatch client notification
export const sendDispatchNotification = async (
  dispatchClientId: number,
  action: 'created' | 'updated' | 'status_changed',
  data: {
    userId: number,
    userName: string,
    leadId: number,
    companyName: string
  },
  urgent: boolean = false
): Promise<void> => {
  try {
    const dispatchClient = await storage.getDispatchClient(dispatchClientId);
    if (!dispatchClient) {
      log(`Dispatch client notification failed: Client ${dispatchClientId} not found`);
      return;
    }

    // Construct notification message
    const notificationType = action === 'created' 
      ? NotificationType.DISPATCH_CLIENT_CREATED 
      : action === 'status_changed' 
        ? NotificationType.DISPATCH_CLIENT_STATUS_CHANGED 
        : NotificationType.DISPATCH_CLIENT_UPDATED;

    const message = {
      type: notificationType,
      title: action === 'created' 
        ? 'New Dispatch Client Created' 
        : action === 'status_changed' 
          ? `Dispatch Client Status Changed to ${dispatchClient.status}` 
          : 'Dispatch Client Updated',
      body: `Dispatch Client for ${data.companyName} has been ${action}`,
      details: {
        dispatchClientId: dispatchClient.id,
        leadId: dispatchClient.leadId,
        companyName: data.companyName,
        status: dispatchClient.status,
        urgent: urgent,
        createdBy: data.userName
      }
    };

    // Get all active users - focusing on dispatch department
    const allUsers = await storage.getUsers();
    
    // Get dispatch department roles
    const roles = await storage.getRoles();
    const dispatchRoleIds = roles
      .filter(role => role.department === 'dispatch')
      .map(role => role.id);

    // Filter users to only dispatch department
    const dispatchUsers = allUsers.filter(user => 
      dispatchRoleIds.includes(user.roleId) && user.active
    );

    // Send notifications to dispatch team
    for (const user of dispatchUsers) {
      // Get user preferences
      const preferences = getUserNotificationPreferences(user.id);

      // Check if user wants lead updates (for now, dispatch client notifications will be part of lead updates)
      if (preferences.teamNotifications.leadUpdates) {
        // Send through enabled channels
        if (preferences.email) {
          log(`Would send email to ${user.email} about dispatch client ${dispatchClientId}`);
          // emailService.sendEmail(user.email, message.title, message.body);
        }

        if (preferences.slack) {
          // Send to Slack dispatch channel using the specialized function
          slackService.sendDispatchClientNotification({
            id: dispatchClient.id,
            leadId: dispatchClient.leadId,
            companyName: data.companyName,
            status: dispatchClient.status,
            createdBy: data.userName,
            action: action as 'created' | 'updated' | 'status_changed'
          }).catch(err => console.error('Error sending dispatch slack notification:', err));
          
          log(`Sent Slack message to dispatch channel about client ${dispatchClientId}`);
        }

        // Store in-app notification
        if (preferences.inApp) {
          log(`Would store in-app notification for ${user.username} about dispatch client ${dispatchClientId}`);
          // In a real app, we would store this in a notifications collection
        }
      }
    }

    log(`Notifications sent for dispatch client ${dispatchClientId} ${action}`);
  } catch (error) {
    log(`Failed to send dispatch client notification: ${error}`);
  }
};

export const sendDailySummaries = async (): Promise<void> => {
  try {
    // Get all active users
    const allUsers = await storage.getUsers();

    for (const user of allUsers) {
      if (!user.active) continue;

      // Get user preferences
      const preferences = getUserNotificationPreferences(user.id);

      // Check if user wants daily summaries
      if (preferences.teamNotifications.dailySummaries) {
        // Generate summary data specific to user's role
        const summaryData = {
          date: new Date().toLocaleDateString(),
          leadsCreated: 5, // These would be actual metrics in a real app
          leadsConverted: 2,
          loadsCreated: 8,
          loadsCompleted: 6,
          invoicesCreated: 4,
          invoicesPaid: 3,
          totalRevenue: 12500,
          pendingTasks: 7
        };

        const message = {
          type: NotificationType.DAILY_SUMMARY,
          title: `Daily Summary - ${summaryData.date}`,
          body: `Here's your daily summary for ${summaryData.date}`,
          details: summaryData
        };

        // Send through enabled channels
        if (preferences.email) {
          log(`Would send daily summary email to ${user.email}`);
          // emailService.sendEmail(user.email, message.title, message.body, 'daily-summary', summaryData);
        }

        if (preferences.slack) {
          log(`Would send daily summary Slack message to ${user.username}`);
          // slackService.sendMessage(user.username, message.title, message.body, 'daily-summary', summaryData);
        }
      }
    }

    log('Daily summaries sent successfully');
  } catch (error) {
    log(`Failed to send daily summaries: ${error}`);
  }
};