import { CronJob } from 'cron';
import { db } from './db';
import { io } from './socket';
import { users, dispatchTasks, dispatchReports, invoices, performanceTargets } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { storage } from './storage';
import { addHours, startOfWeek, endOfWeek, format, subMinutes } from 'date-fns';

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
 * Initializes all scheduler jobs
 */
export function initializeScheduler() {
  const dailyTasksJob = scheduleDailyTasksReminder();
  const dailyReportJob = scheduleDailyReportReminder();
  const weeklyInvoiceJob = scheduleWeeklyInvoiceTargetCheck();

  console.log('Scheduler initialized with the following jobs:');
  console.log('- Daily Tasks Reminder: runs at 09:00 daily');
  console.log('- Daily Report Reminder: runs at 16:45 daily');
  console.log('- Weekly Invoice Target Check: runs at 23:00 on Fridays');

  return {
    dailyTasksJob,
    dailyReportJob,
    weeklyInvoiceJob
  };
}