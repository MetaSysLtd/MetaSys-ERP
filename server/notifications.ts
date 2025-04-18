import * as slackService from './slack';
import * as emailService from './email';
import { storage } from './storage';
import { SlackChannelType } from './slack';
import { EmailType } from './email';

// Types of notifications
export enum NotificationType {
  LEAD_CREATED = 'lead_created',
  LEAD_UPDATED = 'lead_updated',
  LEAD_STATUS_CHANGED = 'lead_status_changed',
  LOAD_CREATED = 'load_created',
  LOAD_UPDATED = 'load_updated',
  LOAD_STATUS_CHANGED = 'load_status_changed',
  INVOICE_CREATED = 'invoice_created',
  INVOICE_UPDATED = 'invoice_updated',
  INVOICE_STATUS_CHANGED = 'invoice_status_changed',
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

/**
 * Send a lead notification through configured channels
 * @param leadId The ID of the lead
 * @param action The action performed on the lead
 * @param sendToAssignee Whether to send notification to the assigned user
 * @returns Promise resolving to success status
 */
export async function sendLeadNotification(
  leadId: number,
  action: 'created' | 'updated' | 'status_changed',
  sendToAssignee: boolean = true
): Promise<boolean> {
  try {
    // Get the lead from storage
    const lead = await storage.getLead(leadId);
    if (!lead) {
      console.warn(`Cannot send notification: Lead with ID ${leadId} not found`);
      return false;
    }
    
    // Get the assigned user if needed
    let assignedUser = null;
    if (lead.assignedTo && sendToAssignee) {
      assignedUser = await storage.getUser(lead.assignedTo);
    }
    
    // Get equipment type name
    const equipmentTypeName = lead.equipmentType || 'Not specified';
    
    // Format for Slack
    const slackNotification = {
      id: lead.id,
      companyName: lead.companyName,
      status: lead.status,
      contactName: lead.contactName || 'Not provided',
      equipmentType: equipmentTypeName,
      assignedTo: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : 'Unassigned',
      action
    };
    
    // Send to Slack
    const slackResult = await slackService.sendLeadNotification(slackNotification);
    
    // Send email to assignee if available
    let emailResult = true;
    if (assignedUser && assignedUser.email) {
      // Format for email
      const emailNotification = {
        id: lead.id,
        companyName: lead.companyName,
        status: lead.status,
        contactName: lead.contactName || 'Not provided',
        contactEmail: lead.contactEmail || 'Not provided',
        contactPhone: lead.contactPhone || 'Not provided',
        equipmentType: equipmentTypeName,
        notes: lead.notes,
        userEmail: assignedUser.email,
        userName: `${assignedUser.firstName} ${assignedUser.lastName}`
      };
      
      emailResult = await emailService.sendLeadNotificationEmail(emailNotification);
    }
    
    // Create activity record
    await storage.createActivity({
      userId: lead.assignedTo || null,
      entityType: 'lead',
      entityId: lead.id,
      activityType: action === 'created' ? 'create' : action === 'updated' ? 'update' : 'status_change',
      details: `Lead ${action}: ${lead.companyName} (${lead.status})`
    });
    
    return slackResult && emailResult;
  } catch (error) {
    console.error("Error sending lead notification:", error);
    return false;
  }
}

/**
 * Send a load notification through configured channels
 * @param loadId The ID of the load
 * @param action The action performed on the load
 * @param sendToAssignee Whether to send notification to the assigned user
 * @returns Promise resolving to success status
 */
export async function sendLoadNotification(
  loadId: number,
  action: 'created' | 'updated' | 'status_changed',
  sendToAssignee: boolean = true
): Promise<boolean> {
  try {
    // Get the load from storage
    const load = await storage.getLoad(loadId);
    if (!load) {
      console.warn(`Cannot send notification: Load with ID ${loadId} not found`);
      return false;
    }
    
    // Get the related lead for company information
    const lead = await storage.getLead(load.leadId);
    if (!lead) {
      console.warn(`Cannot find related lead for load ${loadId}`);
      return false;
    }
    
    // Get the assigned user if needed
    let assignedUser = null;
    if (load.assignedTo && sendToAssignee) {
      assignedUser = await storage.getUser(load.assignedTo);
    }
    
    // Format for Slack
    const slackNotification = {
      id: load.id,
      leadId: load.leadId,
      companyName: lead.companyName,
      origin: load.origin,
      destination: load.destination,
      status: load.status,
      freightAmount: load.freightAmount,
      pickupDate: load.pickupDate.toISOString(),
      action
    };
    
    // Send to Slack
    const slackResult = await slackService.sendLoadNotification(slackNotification);
    
    // Log the activity
    await storage.createActivity({
      userId: load.assignedTo || null,
      entityType: 'load',
      entityId: load.id,
      activityType: action === 'created' ? 'create' : action === 'updated' ? 'update' : 'status_change',
      details: `Load ${action}: ${load.origin} to ${load.destination} (${load.status})`
    });
    
    return slackResult;
  } catch (error) {
    console.error("Error sending load notification:", error);
    return false;
  }
}

/**
 * Send an invoice notification through configured channels
 * @param invoiceId The ID of the invoice
 * @param action The action performed on the invoice
 * @param sendToClient Whether to send the invoice to the client
 * @returns Promise resolving to success status
 */
export async function sendInvoiceNotification(
  invoiceId: number,
  action: 'created' | 'updated' | 'status_changed',
  sendToClient: boolean = false
): Promise<boolean> {
  try {
    // Get the invoice from storage
    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      console.warn(`Cannot send notification: Invoice with ID ${invoiceId} not found`);
      return false;
    }
    
    // Get the related lead for company information
    const lead = await storage.getLead(invoice.leadId);
    if (!lead) {
      console.warn(`Cannot find related lead for invoice ${invoiceId}`);
      return false;
    }
    
    // Get invoice items
    const invoiceItems = await storage.getInvoiceItemsByInvoice(invoice.id);
    
    // Format for Slack
    const slackNotification = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      leadId: invoice.leadId,
      companyName: lead.companyName,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      dueDate: invoice.dueDate.toISOString(),
      action
    };
    
    // Send to Slack
    const slackResult = await slackService.sendInvoiceNotification(slackNotification);
    
    // Send email to client if requested and contact email is available
    let emailResult = true;
    if (sendToClient && lead.contactEmail) {
      // Format invoice items for email
      const formattedItems = invoiceItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount
      }));
      
      // Format for email
      const emailNotification = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        companyName: lead.companyName,
        contactEmail: lead.contactEmail,
        contactName: lead.contactName || lead.companyName,
        totalAmount: invoice.totalAmount,
        dueDate: invoice.dueDate.toISOString(),
        items: formattedItems,
        notes: invoice.notes,
        paymentLink: `https://metasyserp.com/client/invoices/${invoice.id}/pay`
      };
      
      emailResult = await emailService.sendInvoiceEmail(emailNotification);
    }
    
    // Log the activity
    await storage.createActivity({
      userId: null, // System activity
      entityType: 'invoice',
      entityId: invoice.id,
      activityType: action === 'created' ? 'create' : action === 'updated' ? 'update' : 'status_change',
      details: `Invoice ${action}: #${invoice.invoiceNumber} for ${lead.companyName} (${invoice.status})`
    });
    
    return slackResult && emailResult;
  } catch (error) {
    console.error("Error sending invoice notification:", error);
    return false;
  }
}

/**
 * Send a daily summary through configured channels
 * @param date The date for the summary in ISO format
 * @returns Promise resolving to success status
 */
export async function sendDailySummary(date: string): Promise<boolean> {
  try {
    // Get counts for leads
    const allLeads = await storage.getLeads();
    const newLeads = allLeads.filter(lead => {
      const createdAt = new Date(lead.createdAt);
      const reportDate = new Date(date);
      return createdAt.toDateString() === reportDate.toDateString();
    }).length;
    
    const qualifiedLeads = allLeads.filter(lead => 
      lead.status === 'qualified' || lead.status === 'converted'
    ).length;
    
    // Get counts for loads
    const allLoads = await storage.getLoads();
    const activeLoads = allLoads.filter(load => 
      load.status !== 'completed' && load.status !== 'cancelled'
    ).length;
    
    const completedLoads = allLoads.filter(load => {
      const completedDate = new Date(load.updatedAt);
      const reportDate = new Date(date);
      return load.status === 'completed' && 
             completedDate.toDateString() === reportDate.toDateString();
    }).length;
    
    // Get counts for invoices
    const allInvoices = await storage.getInvoices();
    const pendingInvoices = allInvoices.filter(invoice => 
      invoice.status !== 'paid' && invoice.status !== 'cancelled'
    ).length;
    
    // Calculate total revenue from completed loads with invoices
    const paidInvoices = allInvoices.filter(invoice => invoice.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    
    // Get commissions data
    const allCommissions = await storage.getCommissions();
    const totalCommissions = allCommissions.reduce((sum, commission) => 
      sum + (commission.status === 'paid' ? commission.amount : 0), 0);
    
    // Calculate department commissions
    const salesUsers = (await storage.getUsers()).filter(user => {
      const rolePromise = storage.getRole(user.roleId);
      return rolePromise.then(role => role?.department === 'sales');
    });
    
    const dispatchUsers = (await storage.getUsers()).filter(user => {
      const rolePromise = storage.getRole(user.roleId);
      return rolePromise.then(role => role?.department === 'dispatch');
    });
    
    let salesUserIds: number[] = [];
    for (const user of salesUsers) {
      salesUserIds.push(user.id);
    }
    
    let dispatchUserIds: number[] = [];
    for (const user of dispatchUsers) {
      dispatchUserIds.push(user.id);
    }
    
    const salesCommissions = allCommissions
      .filter(commission => salesUserIds.includes(commission.userId))
      .reduce((sum, commission) => sum + (commission.status === 'paid' ? commission.amount : 0), 0);
    
    const dispatchCommissions = allCommissions
      .filter(commission => dispatchUserIds.includes(commission.userId))
      .reduce((sum, commission) => sum + (commission.status === 'paid' ? commission.amount : 0), 0);
    
    // Prepare the summary data
    const summaryData = {
      date,
      newLeads,
      qualifiedLeads,
      activeLoads,
      completedLoads,
      pendingInvoices,
      totalRevenue,
      commissions: {
        totalPaid: totalCommissions,
        salesTeam: salesCommissions,
        dispatchTeam: dispatchCommissions
      }
    };
    
    // Send to Slack
    const slackResult = await slackService.sendDailySummary(summaryData);
    
    // Also send to administrators via email
    const adminRole = await storage.getRoleByName('super_admin');
    let emailResults: boolean[] = [];
    
    if (adminRole) {
      const adminUsers = await storage.getUsersByRole(adminRole.id);
      
      for (const admin of adminUsers) {
        if (admin.email) {
          const emailSummary = {
            ...summaryData,
            recipientEmail: admin.email,
            recipientName: `${admin.firstName} ${admin.lastName}`,
            // Could include top performers data here too
            topPerformers: {
              salesReps: [],
              dispatchReps: []
            }
          };
          
          const result = await emailService.sendDailySummaryEmail(emailSummary);
          emailResults.push(result);
        }
      }
    }
    
    // Log the activity
    await storage.createActivity({
      userId: null, // System activity
      entityType: 'system',
      entityId: 0,
      activityType: 'report',
      details: `Daily summary report generated for ${date}`
    });
    
    return slackResult && (emailResults.length > 0 ? !emailResults.includes(false) : true);
  } catch (error) {
    console.error("Error sending daily summary:", error);
    return false;
  }
}

// Export default functions for easier imports
export default {
  NotificationType,
  sendLeadNotification,
  sendLoadNotification,
  sendInvoiceNotification,
  sendDailySummary
};