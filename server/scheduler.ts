import { CronJob } from 'cron';
import { db } from './db';
import { io } from './socket';
import { 
  users, 
  dispatchTasks, 
  dispatchReports, 
  invoices, 
  performanceTargets, 
  leads,
  roles
} from '@shared/schema';
import { eq, and, gte, lte, or, ne, sql } from 'drizzle-orm';
import { storage } from './storage';
import { 
  addHours, 
  startOfWeek, 
  endOfWeek, 
  format, 
  subMinutes,
  subDays,
  subWeeks,
  isAfter
} from 'date-fns';
import { 
  sendLeadAssignedNotification, 
  sendLeadFollowUpReminder, 
  sendWeeklyInactiveLeadsReminder, 
  sendLeadStatusChangeNotification
} from './socket';
import { initializeDispatchReportAutomation } from './dispatch-report-automation';

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
          io.to(`user_${dispatcher.id}`).emit('taskReminder', {
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
          io.to(`user_${dispatcher.id}`).emit('reportReminder', {
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
          io.to(`user_${dispatcher.id}`).emit('perfAlert', {
            color: 'Red',
            message: 'Weekly invoice <40%',
            percentOfGoal: Math.round(percentOfGoal),
            target: weeklyTarget.maxPct,
            actual: totalInvoiceAmount
          });
        } else if (percentOfGoal >= 100) {
          // Send green alert for meeting or exceeding target
          io.to(`user_${dispatcher.id}`).emit('perfAlert', {
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
          await sendLeadFollowUpReminder(lead.assignedTo, {
            id: lead.id,
            name: lead.name,
            clientName: lead.clientName,
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
          const leadNames = inactiveLeads.map(lead => lead.name);
          
          await sendWeeklyInactiveLeadsReminder(dispatcher.users.id, {
            count: inactiveLeads.length,
            leadIds,
            leadNames
          });
        }
      }
    } catch (error) {
      console.error('Error in weekly inactive leads reminder cron job:', error);
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

  // Initialize the dispatch report automation jobs
  const dispatchReportJobs = initializeDispatchReportAutomation();

  console.log('Scheduler initialized with the following jobs:');
  console.log('- Daily Tasks Reminder: runs at 09:00 daily');
  console.log('- Daily Report Reminder: runs at 16:45 daily');
  console.log('- Weekly Invoice Target Check: runs at 23:00 on Fridays');
  console.log('- Lead Follow-up Check: runs at 10:00 daily');
  console.log('- Weekly Inactive Leads Reminder: runs at 10:00 on Mondays');
  console.log('- Daily Report Generation: runs at 18:00 daily');
  console.log('- Monthly Report Generation: runs at 01:00 on the 1st of each month');

  return {
    dailyTasksJob,
    dailyReportJob,
    weeklyInvoiceJob,
    leadFollowUpJob,
    weeklyInactiveLeadsJob,
    dispatchReportJobs
  };
}