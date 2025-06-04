import { CronJob } from 'cron';
import { db } from './db';
import { getIo, RealTimeEvents } from './socket';
import { 
  users, 
  dispatchTasks, 
  dispatchReports, 
  invoices, 
  performanceTargets, 
  leads,
  roles,
  notifications
} from '@shared/schema';
import { eq, and, gte, lte, or, ne, sql, not, isNull, desc } from 'drizzle-orm';
import { storage } from './storage';
import { 
  addHours, 
  startOfWeek, 
  endOfWeek, 
  format, 
  subMinutes,
  subDays,
  subWeeks,
  isAfter,
  startOfDay,
  endOfDay,
  differenceInDays
} from 'date-fns';
// Import required modules
import { initializeDispatchReportAutomation } from './dispatch-report-automation';
import { sendSlackMessage, sendSlackNotification } from './slack';

/**
 * Creates daily tasks for dispatchers at the start of their shift
 * Default shift start is 09:00 if user.shiftStart is not defined
 */
export function scheduleDailyTasksReminder() {
  // Run at 9:00 AM every day (default shift start)
  return new CronJob('0 9 * * *', async () => {
    console.log('Running daily tasks reminder cron job');
    try {
      // Get all dispatchers (users with dispatcherId)
      const dispatchers = await db.select()
        .from(users)
        .where(eq(users.dept, 'dispatch'));

      const today = format(new Date(), 'yyyy-MM-dd');

      // Create tasks for each dispatcher
      for (const dispatcher of dispatchers) {
        // Check if task already exists for today
        const existingTask = await db.select()
          .from(dispatchTasks)
          .where(
            and(
              eq(dispatchTasks.dispatcherId, dispatcher.id),
              eq(dispatchTasks.date, today)
            )
          )
          .limit(1);

        // If no task exists, create one
        if (existingTask.length === 0) {
          const [newTask] = await db.insert(dispatchTasks)
            .values({
              dispatcherId: dispatcher.id,
              date: today,
              orgId: dispatcher.orgId || 1,
              status: 'Pending',
              salesQuotaAchieved: false,
              leadsFollowedUp: false,
              deadLeadsArchived: false,
              carriersUpdated: false,
              notes: null,
            })
            .returning();

          // Emit socket event to notify dispatcher
          getIo().to(`user:${dispatcher.id}`).emit(RealTimeEvents.TASK_CREATED, {
            taskId: newTask.id,
            message: 'You have a new dispatch task for today',
            date: today
          });
        }
      }
    } catch (error) {
      console.error('Error in daily tasks reminder cron job:', error);
    }
  }, null, true, 'America/New_York');
}

/**
 * Creates daily report reminders 15 minutes before the end of dispatcher's shift
 * Default shift is 8 hours from start (09:00 - 17:00)
 */
export function scheduleDailyReportReminder() {
  // Run at 16:45 PM every day (15 min before default shift end)
  return new CronJob('45 16 * * *', async () => {
    console.log('Running daily report reminder cron job');
    try {
      // Get all dispatchers
      const dispatchers = await db.select()
        .from(users)
        .where(eq(users.dept, 'dispatch'));

      const today = format(new Date(), 'yyyy-MM-dd');

      // Check and create reports for each dispatcher
      for (const dispatcher of dispatchers) {
        // Calculate shift end (default or custom)
        const shiftStart = dispatcher.shiftStart || '09:00';
        const [hours, minutes] = shiftStart.split(':').map(Number);
        const shiftEndTime = addHours(new Date().setHours(hours, minutes, 0, 0), 8);
        
        // Check if report already exists for today
        const existingReport = await db.select()
          .from(dispatchReports)
          .where(
            and(
              eq(dispatchReports.dispatcherId, dispatcher.id),
              eq(dispatchReports.date, today)
            )
          )
          .limit(1);

        // If no report exists, create one
        if (existingReport.length === 0) {
          const [newReport] = await db.insert(dispatchReports)
            .values({
              dispatcherId: dispatcher.id,
              date: today,
              orgId: dispatcher.orgId || 1,
              status: 'Pending',
              loadsBooked: 0,
              invoiceUsd: 0,
              newLeads: 0,
              notes: null,
            })
            .returning();

          // Emit socket event to notify dispatcher
          getIo().to(`user:${dispatcher.id}`).emit(RealTimeEvents.REPORT_GENERATED, {
            reportId: newReport.id,
            message: 'Please submit your daily dispatch report',
            date: today
          });
        }
      }
    } catch (error) {
      console.error('Error in daily report reminder cron job:', error);
    }
  }, null, true, 'America/New_York');
}

/**
 * Checks weekly invoice targets every Friday at 23:00
 * Sends performance alerts to dispatchers based on their progress
 */
export function scheduleWeeklyInvoiceTargetCheck() {
  // Run at 23:00 every Friday
  return new CronJob('0 23 * * 5', async () => {
    console.log('Running weekly invoice target check cron job');
    try {
      // Get all dispatchers
      const dispatchers = await db.select()
        .from(users)
        .where(eq(users.dept, 'dispatch'));

      // Get weekly performance targets
      const targetsResult = await db.select()
        .from(performanceTargets)
        .where(eq(performanceTargets.type, 'weekly'))
        .limit(1);
      
      const weeklyTarget = targetsResult[0];
      if (!weeklyTarget) {
        console.warn('No weekly performance target found');
        return;
      }

      const currentDate = new Date();
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // Sunday

      for (const dispatcher of dispatchers) {
        // Get all invoices for this dispatcher for the current week
        const dispatcherInvoices = await db.select()
          .from(invoices)
          .where(
            and(
              eq(invoices.createdBy, dispatcher.id),
              gte(invoices.createdAt, weekStart),
              lte(invoices.createdAt, weekEnd)
            )
          );

        // Calculate total amount
        const totalInvoiceAmount = dispatcherInvoices.reduce(
          (sum, invoice) => sum + invoice.totalAmount,
          0
        );

        // Compare against targets
        const percentOfGoal = (totalInvoiceAmount / weeklyTarget.maxPct) * 100;
        
        if (percentOfGoal < 40) {
          // Send red alert for under 40% of target
          getIo().to(`user:${dispatcher.id}`).emit(RealTimeEvents.DASHBOARD_UPDATED, {
            color: 'Red',
            message: 'Weekly invoice <40%',
            percentOfGoal: Math.round(percentOfGoal),
            target: weeklyTarget.maxPct,
            actual: totalInvoiceAmount
          });
        } else if (percentOfGoal >= 100) {
          // Send green alert for meeting or exceeding target
          getIo().to(`user:${dispatcher.id}`).emit(RealTimeEvents.DASHBOARD_UPDATED, {
            color: 'Green',
            message: 'Weekly invoice ≥100%',
            percentOfGoal: Math.round(percentOfGoal),
            target: weeklyTarget.maxPct,
            actual: totalInvoiceAmount
          });
        }
      }
    } catch (error) {
      console.error('Error in weekly invoice target check cron job:', error);
    }
  }, null, true, 'America/New_York');
}

/**
 * Check for leads that are still in HandToDispatch status after 24 hours
 * Sends a follow-up reminder to the assigned dispatcher
 * Runs at 10:00 AM every day
 */
export function scheduleLeadFollowUpCheck() {
  return new CronJob('0 10 * * *', async () => {
    console.log('Running lead follow-up check cron job');
    try {
      // Find all leads that are still in HandToDispatch status and were assigned more than 24 hours ago
      const oneDayAgo = subDays(new Date(), 1);
      
      const handToDispatchLeads = await db.select()
        .from(leads)
        .where(
          and(
            eq(leads.status, 'HandToDispatch'),
            not(isNull(leads.assignedTo)),
            lte(leads.updatedAt, oneDayAgo)
          )
        );
      
      console.log(`Found ${handToDispatchLeads.length} leads in HandToDispatch status for more than 24 hours`);
      
      // Send reminder for each lead
      for (const lead of handToDispatchLeads) {
        if (lead.assignedTo) {
          // Create a notification for the lead
          await storage.createNotification({
            userId: lead.assignedTo,
            orgId: lead.orgId || 1,
            title: 'Lead Follow-up Reminder',
            message: `Please follow up on lead: ${lead.companyName || 'Unnamed Lead'}`,
            type: 'reminder',
            read: false,
            entityType: 'lead',
            entityId: lead.id,
            createdAt: new Date()
          });
          
          // Emit real-time notification
          getIo().to(`user:${lead.assignedTo}`).emit(RealTimeEvents.NOTIFICATION_CREATED, {
            id: lead.id,
            companyName: lead.companyName,
            assignedAt: lead.updatedAt,
            status: lead.status
          });
        }
      }
    } catch (error) {
      console.error('Error in lead follow-up check cron job:', error);
    }
  }, null, true, 'America/New_York');
}

/**
 * Send weekly reminders for inactive leads that are still in HandToDispatch status
 * Runs at 10:00 AM every Monday
 */
export function scheduleWeeklyInactiveLeadsReminder() {
  return new CronJob('0 10 * * 1', async () => {
    console.log('Running weekly inactive leads reminder cron job');
    try {
      // Get all dispatchers
      const dispatchers = await db.select()
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(eq(roles.department, 'dispatch'));
      
      // For each dispatcher, find their inactive leads
      for (const dispatcher of dispatchers) {
        const inactiveLeads = await db.select()
          .from(leads)
          .where(
            and(
              eq(leads.assignedTo, dispatcher.users.id),
              eq(leads.status, 'HandToDispatch')
            )
          )
          .orderBy(desc(leads.updatedAt));
        
        // Only send reminder if there are inactive leads
        if (inactiveLeads.length > 0) {
          // Format data for notification
          const leadIds = inactiveLeads.map(lead => lead.id);
          const leadCompanyNames = inactiveLeads.map(lead => lead.companyName || 'Unnamed Lead');
          
          // Create notification in database
          await storage.createNotification({
            userId: dispatcher.users.id,
            orgId: dispatcher.users.orgId || 1,
            title: 'Weekly Inactive Leads Reminder',
            message: `You have ${inactiveLeads.length} inactive leads that require follow-up`,
            type: 'reminder',
            read: false,
            entityType: 'leads',
            entityId: leadIds[0], // First lead as primary entity
            createdAt: new Date()
          });
          
          // Emit real-time notification
          getIo().to(`user:${dispatcher.users.id}`).emit(RealTimeEvents.NOTIFICATION_CREATED, {
            count: inactiveLeads.length,
            leadIds,
            leadCompanyNames
          });
        }
      }
    } catch (error) {
      console.error('Error in weekly inactive leads reminder cron job:', error);
    }
  }, null, true, 'America/New_York');
}

/**
 * Send daily performance alerts and notifications based on invoice targets
 * Runs at the end of each day (19:00) to check on daily performance
 */
export function scheduleDailyPerformanceAlerts() {
  return new CronJob('0 19 * * *', async () => {
    console.log('Running daily performance alerts cron job');
    try {
      // Get all dispatchers
      const dispatchers = await db.select()
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(eq(roles.department, 'dispatch'));
      
      // Get daily performance targets
      const targetsResult = await db.select()
        .from(performanceTargets)
        .where(eq(performanceTargets.type, 'daily'))
        .limit(1);
      
      const dailyTarget = targetsResult[0];
      if (!dailyTarget) {
        console.warn('No daily performance target found');
        return;
      }

      const today = new Date();
      
      for (const dispatcher of dispatchers) {
        // Get today's invoices for this dispatcher
        const dispatcherInvoices = await db.select()
          .from(invoices)
          .where(
            and(
              eq(invoices.createdBy, dispatcher.users.id),
              gte(invoices.createdAt, startOfDay(today)),
              lte(invoices.createdAt, endOfDay(today))
            )
          );
        
        // Calculate total amount
        const totalInvoiceAmount = dispatcherInvoices.reduce(
          (sum, invoice) => sum + invoice.totalAmount,
          0
        );
        
        // Compare against targets
        const percentOfGoal = (totalInvoiceAmount / dailyTarget.maxPct) * 100;
        
        // Determine alert type
        let alertType: 'critical' | 'warning' | 'success' | null = null;
        let alertMessage = '';
        
        if (percentOfGoal < 40) {
          // Critical alert for very low performance
          alertType = 'critical';
          alertMessage = `Your daily invoice total is less than 40% of target. Current: $${totalInvoiceAmount.toFixed(2)}`;
          
          // Create notification
          await db.insert(notifications).values({
            userId: dispatcher.users.id,
            orgId: dispatcher.users.orgId || 1,
            title: 'Daily Invoice Alert',
            message: alertMessage,
            type: 'performance_alert',
            read: false,
            entityType: 'invoice',
            entityId: null, // Generic alert, not tied to specific invoice
            createdAt: new Date()
          });
          
          // Emit real-time notification
          getIo().to(`user:${dispatcher.users.id}`).emit(RealTimeEvents.PERFORMANCE_ALERT, {
            type: 'daily_invoice',
            alertType: 'critical',
            message: alertMessage,
            percentOfGoal: Math.round(percentOfGoal),
            target: dailyTarget.maxPct,
            actual: totalInvoiceAmount
          });
        } else if (percentOfGoal >= 100) {
          // Success alert for exceeding target
          alertType = 'success';
          alertMessage = `Congratulations! You've exceeded your daily invoice target by ${(percentOfGoal - 100).toFixed(0)}%`;
          
          // Create notification
          await db.insert(notifications).values({
            userId: dispatcher.users.id,
            orgId: dispatcher.users.orgId || 1,
            title: 'Daily Performance Achievement',
            message: alertMessage,
            type: 'performance_success',
            read: false,
            entityType: 'invoice',
            entityId: null,
            createdAt: new Date()
          });
          
          // Emit real-time notification
          getIo().to(`user:${dispatcher.users.id}`).emit(RealTimeEvents.PERFORMANCE_ALERT, {
            type: 'daily_invoice',
            alertType: 'success',
            message: alertMessage,
            percentOfGoal: Math.round(percentOfGoal),
            target: dailyTarget.maxPct,
            actual: totalInvoiceAmount
          });
        }
      }
    } catch (error) {
      console.error('Error in daily performance alerts cron job:', error);
    }
  }, null, true, 'America/New_York');
}

/**
 * When a Team Lead assigns a lead to a dispatcher, send a notification
 * This is triggered via API, not scheduled
 */
export async function sendLeadAssignmentNotification(
  leadId: number,
  dispatcherId: number,
  teamLeadId: number
) {
  try {
    // Get lead details
    const lead = await storage.getLead(leadId);
    if (!lead) {
      console.error(`Lead notification failed: Lead ${leadId} not found`);
      return;
    }
    
    // Get team lead details for the notification
    const teamLead = await storage.getUser(teamLeadId);
    if (!teamLead) {
      console.error(`Lead notification failed: Team Lead ${teamLeadId} not found`);
      return;
    }
    
    const teamLeadName = `${teamLead.firstName} ${teamLead.lastName}`;
    const companyName = lead.companyName || 'Unnamed Lead';
    
    // Create a notification for the dispatcher
    await db.insert(notifications).values({
      userId: dispatcherId,
      orgId: lead.orgId || 1,
      title: 'New Lead Assigned',
      message: `${teamLeadName} has assigned ${companyName} to you`,
      type: 'lead_assignment',
      read: false,
      entityType: 'lead',
      entityId: leadId,
      createdAt: new Date()
    });
    
    // Send real-time notification
    getIo().to(`user:${dispatcherId}`).emit(RealTimeEvents.LEAD_ASSIGNED, {
      leadId,
      companyName,
      assignedBy: teamLeadName,
      timestamp: new Date()
    });
    
    // Also notify relevant teams in Slack if enabled
    if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_SALES_CHANNEL_ID) {
      await sendSlackMessage({
        channel: process.env.SLACK_SALES_CHANNEL_ID,
        text: `${teamLeadName} assigned lead ${companyName} to ${dispatcherId}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Lead Assignment Notification*`
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Lead:* ${companyName}`
              },
              {
                type: "mrkdwn",
                text: `*Assigned By:* ${teamLeadName}`
              },
              {
                type: "mrkdwn",
                text: `*Assigned To:* Dispatcher #${dispatcherId}`
              }
            ]
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error sending lead assignment notification:', error);
  }
}

/**
 * Send notifications when lead status changes
 * This is triggered via API, not scheduled
 */
export async function sendLeadStatusChangeNotification(
  leadId: number, 
  newStatus: string, 
  previousStatus: string,
  changedById: number
) {
  try {
    // Get lead details
    const lead = await storage.getLead(leadId);
    if (!lead) {
      console.error(`Status change notification failed: Lead ${leadId} not found`);
      return;
    }
    
    // Get user who changed the status
    const changedBy = await storage.getUser(changedById);
    if (!changedBy) {
      console.error(`Status change notification failed: User ${changedById} not found`);
      return;
    }
    
    const userName = `${changedBy.firstName} ${changedBy.lastName}`;
    const companyName = lead.companyName || 'Unnamed Lead';
    
    // Determine who should be notified
    let notifyUserIds: number[] = [];
    
    // Always notify the team lead
    const teamLeads = await db.select()
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(
        and(
          eq(roles.department, 'dispatch'),
          eq(roles.name, 'Team Lead')
        )
      );
    
    teamLeads.forEach(teamLead => {
      notifyUserIds.push(teamLead.users.id);
    });
    
    // Notify the sales team if the lead is activated or unqualified
    if (newStatus === 'Active' || newStatus === 'Unqualified') {
      const salesTeam = await db.select()
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(eq(roles.department, 'sales'));
      
      salesTeam.forEach(salesPerson => {
        notifyUserIds.push(salesPerson.users.id);
      });
      
      // Also notify via Slack if configured
      if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_SALES_CHANNEL_ID) {
        await sendSlackMessage({
          channel: process.env.SLACK_SALES_CHANNEL_ID,
          text: `Lead ${companyName} status changed from ${previousStatus} to ${newStatus}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Lead Status Change*`
              }
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Lead:* ${companyName}`
                },
                {
                  type: "mrkdwn",
                  text: `*New Status:* ${newStatus}`
                },
                {
                  type: "mrkdwn",
                  text: `*Previous Status:* ${previousStatus}`
                },
                {
                  type: "mrkdwn",
                  text: `*Changed By:* ${userName}`
                }
              ]
            }
          ]
        });
      }
    }
    
    // Remove duplicates and send notifications
    notifyUserIds = [...new Set(notifyUserIds)];
    
    for (const userId of notifyUserIds) {
      await db.insert(notifications).values({
        userId,
        orgId: lead.orgId || 1,
        title: 'Lead Status Changed',
        message: `${companyName} status changed from ${previousStatus} to ${newStatus}`,
        type: 'lead_status_change',
        read: false,
        entityType: 'lead',
        entityId: leadId,
        createdAt: new Date()
      });
      
      // Send real-time notification
      getIo().to(`user:${userId}`).emit(RealTimeEvents.LEAD_STATUS_CHANGED, {
        leadId,
        companyName,
        previousStatus,
        newStatus,
        changedBy: userName,
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Error sending lead status change notification:', error);
  }
}

/**
 * Send weekly lead status check notifications
 * Runs every Monday at 09:30 AM to remind dispatchers to update inactive leads
 */
export function scheduleWeeklyLeadStatusCheck() {
  return new CronJob('30 9 * * 1', async () => {
    console.log('Running weekly lead status check cron job');
    try {
      // Get all dispatchers
      const dispatchers = await db.select()
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(eq(roles.department, 'dispatch'));
      
      // For each dispatcher, check leads that haven't been updated in the past 7 days
      const sevenDaysAgo = subDays(new Date(), 7);
      
      for (const dispatcher of dispatchers) {
        // Find leads assigned to this dispatcher that haven't been updated in 7 days
        const staleLeads = await db.select()
          .from(leads)
          .where(
            and(
              eq(leads.assignedTo, dispatcher.users.id),
              not(eq(leads.status, 'Closed')),
              not(eq(leads.status, 'Unqualified')),
              lte(leads.updatedAt, sevenDaysAgo)
            )
          )
          .orderBy(leads.updatedAt);
        
        if (staleLeads.length > 0) {
          // Create notification with list of stale leads
          const leadNames = staleLeads.map(lead => lead.companyName || 'Unnamed Lead').join(', ');
          const leadIds = staleLeads.map(lead => lead.id);
          
          await db.insert(notifications).values({
            userId: dispatcher.users.id,
            orgId: dispatcher.users.orgId || 1,
            title: 'Weekly Lead Status Update Required',
            message: `You have ${staleLeads.length} leads that need status updates`,
            type: 'lead_status_reminder',
            read: false,
            entityType: 'leads',
            entityId: leadIds[0], // Primary entity is first lead
            createdAt: new Date()
          });
          
          // Send real-time notification
          getIo().to(`user:${dispatcher.users.id}`).emit(RealTimeEvents.LEAD_FOLLOWUP_REMINDER, {
            count: staleLeads.length,
            leadIds,
            leadNames,
            daysSinceUpdate: 7,
            message: `You have ${staleLeads.length} leads that require status updates`
          });
          
          // Also notify team lead
          const teamLeads = await db.select()
            .from(users)
            .innerJoin(roles, eq(users.roleId, roles.id))
            .where(
              and(
                eq(roles.department, 'dispatch'),
                eq(roles.name, 'Team Lead')
              )
            );
          
          for (const teamLead of teamLeads) {
            await db.insert(notifications).values({
              userId: teamLead.users.id,
              orgId: teamLead.users.orgId || 1,
              title: 'Dispatcher Inactive Leads',
              message: `${dispatcher.users.firstName} ${dispatcher.users.lastName} has ${staleLeads.length} inactive leads`,
              type: 'team_lead_alert',
              read: false,
              entityType: 'dispatcher',
              entityId: dispatcher.users.id,
              createdAt: new Date()
            });
          }
          
          // Send to Slack if configured
          if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_DISPATCH_CHANNEL_ID) {
            await sendSlackMessage({
              channel: process.env.SLACK_DISPATCH_CHANNEL_ID,
              text: `${dispatcher.users.firstName} ${dispatcher.users.lastName} has ${staleLeads.length} leads requiring updates`,
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Weekly Lead Status Update Required*`
                  }
                },
                {
                  type: "section",
                  fields: [
                    {
                      type: "mrkdwn",
                      text: `*Dispatcher:* ${dispatcher.users.firstName} ${dispatcher.users.lastName}`
                    },
                    {
                      type: "mrkdwn",
                      text: `*Inactive Leads:* ${staleLeads.length}`
                    }
                  ]
                }
              ]
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in weekly lead status check cron job:', error);
    }
  }, null, true, 'America/New_York');
}

/**
 * Initializes all scheduler jobs
 */
export function initializeScheduler() {
  const dailyTasksJob = scheduleDailyTasksReminder();
  const dailyReportJob = scheduleDailyReportReminder();
  const weeklyInvoiceJob = scheduleWeeklyInvoiceTargetCheck();
  const leadFollowUpJob = scheduleLeadFollowUpCheck();
  const weeklyInactiveLeadsJob = scheduleWeeklyInactiveLeadsReminder();
  const dailyPerformanceAlertsJob = scheduleDailyPerformanceAlerts();
  const weeklyLeadStatusCheckJob = scheduleWeeklyLeadStatusCheck();

  // Initialize the dispatch report automation jobs
  const dispatchReportJobs = initializeDispatchReportAutomation();

  console.log('Scheduler initialized with the following jobs:');
  console.log('- Daily Tasks Reminder: runs at 09:00 daily');
  console.log('- Daily Report Reminder: runs at 16:45 daily');
  console.log('- Weekly Invoice Target Check: runs at 23:00 on Fridays');
  console.log('- Lead Follow-up Check: runs at 10:00 daily');
  console.log('- Weekly Inactive Leads Reminder: runs at 10:00 on Mondays');
  console.log('- Daily Performance Alerts: runs at 19:00 daily');
  console.log('- Weekly Lead Status Check: runs at 09:30 on Mondays');
  console.log('- Daily Report Generation: runs at 18:00 daily');
  console.log('- Monthly Report Generation: runs at 01:00 on the 1st of each month');

  return {
    dailyTasksJob,
    dailyReportJob,
    weeklyInvoiceJob,
    leadFollowUpJob,
    weeklyInactiveLeadsJob,
    dailyPerformanceAlertsJob,
    weeklyLeadStatusCheckJob,
    dispatchReportJobs
  };
}