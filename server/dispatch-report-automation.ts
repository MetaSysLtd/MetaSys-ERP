import { CronJob } from 'cron';
import { db } from './db';
import { io } from './socket';
import { 
  users, 
  dispatchReports,
  performanceTargets,
  notifications,
  roles
} from '@shared/schema';
import { 
  eq, 
  and, 
  gte, 
  lte, 
  or, 
  ne, 
  sql,
  desc 
} from 'drizzle-orm';
import { storage } from './storage';
import { addDays, format, endOfDay, startOfDay } from 'date-fns';
import { 
  sendDailyDispatchReportToSlack, 
  sendDailyDispatchSummaryToSlack 
} from './slack';

/**
 * Generates daily dispatch reports for all dispatchers
 * This runs automatically at the end of day to capture metrics
 */
export function scheduleDailyReportGeneration() {
  // Run at 18:00 (6 PM) every day
  return new CronJob('0 18 * * *', async () => {
    console.log('Running daily dispatch report generation');
    try {
      // Get all dispatchers from users
      const dispatchers = await db.select()
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(eq(roles.department, 'dispatch'));
        
      const today = new Date();
      const reports = [];

      // Generate reports for each dispatcher
      for (const user of dispatchers) {
        try {
          const report = await storage.generateDailyDispatchReport(user.users.id, today);
          
          // Store report info for summary
          reports.push({
            report,
            dispatcherName: `${user.users.firstName} ${user.users.lastName}`
          });
          
          // Get target for performance context
          const target = await storage.getPerformanceTargetByOrgAndType(
            user.users.orgId || 1,
            'daily'
          );
          
          // Send individual report to Slack
          await sendDailyDispatchReportToSlack(
            report,
            `${user.users.firstName} ${user.users.lastName}`,
            target?.minPct || undefined
          );
          
          console.log(`Generated and sent daily report for ${user.users.firstName} ${user.users.lastName}`);
        } catch (error) {
          console.error(`Error generating report for dispatcher ${user.users.id}:`, error);
        }
      }

      // Send summary report to Slack
      if (reports.length > 0) {
        await sendDailyDispatchSummaryToSlack(reports);
        console.log('Sent daily dispatch summary report to Slack');
      }
    } catch (error) {
      console.error('Error in daily dispatch report generation:', error);
    }
  }, null, true, 'America/New_York');
}

/**
 * Reminds dispatchers to submit their daily reports
 * Runs at end of shift (default 16:45)
 */
export function scheduleDailyReportReminder() {
  // Run at 16:45 (4:45 PM) every day
  return new CronJob('45 16 * * *', async () => {
    console.log('Running daily report reminder cron job');
    try {
      // Get all dispatchers
      const dispatchers = await db.select()
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(eq(roles.department, 'dispatch'));

      const today = new Date();
      
      // Check and remind each dispatcher
      for (const user of dispatchers) {
        // Find report for today
        const [report] = await db.select()
          .from(dispatchReports)
          .where(
            and(
              eq(dispatchReports.dispatcherId, user.users.id),
              gte(dispatchReports.date, startOfDay(today)),
              lte(dispatchReports.date, endOfDay(today))
            )
          )
          .limit(1);

        if (report && report.status === 'Pending') {
          // Send reminder notification via socket
          io.to(`user:${user.users.id}`).emit('reportReminder', {
            reportId: report.id,
            message: 'Please complete your daily dispatch report',
            date: format(today, 'yyyy-MM-dd')
          });
          
          // Also create a notification in the database
          try {
            await db.insert(notifications).values({
              userId: user.users.id,
              type: 'reminder',
              message: 'Your daily dispatch report is due',
              entityType: 'dispatch_report',
              entityId: report.id,
              read: false
            });
          } catch (error) {
            console.error('Error creating notification:', error);
          }
        } else if (!report) {
          // No report found, generate one
          const newReport = await storage.generateDailyDispatchReport(user.users.id, today);
          
          // Send notification
          io.to(`user:${user.users.id}`).emit('reportReminder', {
            reportId: newReport.id,
            message: 'Your daily dispatch report has been generated and needs review',
            date: format(today, 'yyyy-MM-dd')
          });
          
          // Create notification in database
          try {
            await db.insert(notifications).values({
              userId: user.users.id,
              type: 'reminder',
              message: 'Your daily dispatch report needs review and submission',
              entityType: 'dispatch_report',
              entityId: newReport.id,
              read: false
            });
          } catch (error) {
            console.error('Error creating notification:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error in daily report reminder cron job:', error);
    }
  }, null, true, 'America/New_York');
}

/**
 * Archives dispatch reports older than 30 days
 * This runs once per week (Sunday at midnight)
 */
export function scheduleReportArchiving() {
  // Run at midnight on Sunday
  return new CronJob('0 0 * * 0', async () => {
    console.log('Running report archiving job');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get reports older than 30 days
      const oldReports = await db.select()
        .from(dispatchReports)
        .where(lte(dispatchReports.date, thirtyDaysAgo));
      
      console.log(`Found ${oldReports.length} reports to archive`);
      
      // In the future, archive these reports to a data warehouse or export them
      
    } catch (error) {
      console.error('Error in report archiving job:', error);
    }
  }, null, true, 'America/New_York');
}

/**
 * Initializes all dispatch report automation jobs
 */
export function initializeDispatchReportAutomation() {
  const reportGenerationJob = scheduleDailyReportGeneration();
  const reportReminderJob = scheduleDailyReportReminder();
  const reportArchivingJob = scheduleReportArchiving();
  
  console.log('Dispatch Report Automation initialized with the following jobs:');
  console.log('- Daily Report Generation: runs at 18:00 daily');
  console.log('- Daily Report Reminder: runs at 16:45 daily');
  console.log('- Report Archiving: runs at 00:00 on Sundays');
  
  return {
    reportGenerationJob,
    reportReminderJob,
    reportArchivingJob
  };
}