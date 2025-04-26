import { CronJob } from 'cron';
import { db } from './db';
import { getIo, RealTimeEvents } from './socket';
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
          getIo().to(`user:${user.users.id}`).emit(RealTimeEvents.TASK_CREATED, {
            reportId: report.id,
            message: 'Please complete your daily dispatch report',
            date: format(today, 'yyyy-MM-dd')
          });
          
          // Also create a notification in the database
          try {
            await db.insert(notifications).values({
              userId: user.users.id,
              orgId: user.users.orgId || 1,
              title: 'Daily Report Reminder',
              type: 'reminder',
              message: 'Your daily dispatch report is due',
              entityType: 'dispatch_report',
              entityId: report.id,
              read: false,
              createdAt: new Date()
            });
          } catch (error) {
            console.error('Error creating notification:', error);
          }
        } else if (!report) {
          // No report found, generate one
          const newReport = await storage.generateDailyDispatchReport(user.users.id, today);
          
          // Send notification
          getIo().to(`user:${user.users.id}`).emit(RealTimeEvents.TASK_CREATED, {
            reportId: newReport.id,
            message: 'Your daily dispatch report has been generated and needs review',
            date: format(today, 'yyyy-MM-dd')
          });
          
          // Create notification in database
          try {
            await db.insert(notifications).values({
              userId: user.users.id,
              orgId: user.users.orgId || 1,
              title: 'Daily Report Generated',
              type: 'reminder',
              message: 'Your daily dispatch report needs review and submission',
              entityType: 'dispatch_report',
              entityId: newReport.id,
              read: false,
              createdAt: new Date()
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
 * Generates monthly summary reports for all dispatchers
 * This runs on the 1st of each month at 1:00 AM
 */
export function scheduleMonthlyReportGeneration() {
  // Run at 1:00 AM on the 1st of each month (0 1 1 * *)
  return new CronJob('0 1 1 * *', async () => {
    console.log('Running monthly dispatch report generation');
    try {
      // Calculate previous month's date range
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      
      // Format for logging
      const monthLabel = format(lastMonth, 'MMMM yyyy');
      console.log(`Generating monthly reports for ${monthLabel}`);
      
      // Get all dispatchers from users
      const dispatchers = await db.select()
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(eq(roles.department, 'dispatch'));
      
      if (dispatchers.length === 0) {
        console.log('No dispatchers found for monthly report');
        return;
      }
      
      // Stats to collect for each dispatcher
      const dispatcherStats = [];
      
      // For each dispatcher, get all their daily reports from last month
      for (const user of dispatchers) {
        try {
          const dispatcherId = user.users.id;
          
          // Get all reports for this dispatcher from last month
          const monthlyReports = await db.select()
            .from(dispatchReports)
            .where(
              and(
                eq(dispatchReports.dispatcherId, dispatcherId),
                gte(dispatchReports.date, startOfDay(lastMonth)),
                lte(dispatchReports.date, endOfDay(lastMonthEnd))
              )
            );
          
          if (monthlyReports.length === 0) {
            console.log(`No reports found for dispatcher ${dispatcherId} for ${monthLabel}`);
            continue;
          }
          
          // Calculate monthly totals
          const totalLoadsBooked = monthlyReports.reduce((sum, r) => sum + r.loadsBooked, 0);
          const totalInvoiceUsd = monthlyReports.reduce((sum, r) => sum + r.invoiceUsd, 0);
          const totalPaidInvoiceUsd = monthlyReports.reduce((sum, r) => sum + r.paidInvoiceUsd, 0);
          const avgActiveLeads = Math.round(
            monthlyReports.reduce((sum, r) => sum + r.activeLeads, 0) / monthlyReports.length
          );
          
          // Find highest single day invoice amount
          const highestDayInvoice = Math.max(...monthlyReports.map(r => r.invoiceUsd));
          
          // Count days where targets were met (if targets exist)
          const target = await storage.getPerformanceTargetByOrgAndType(user.users.orgId || 1, 'daily');
          let targetMetDays = 0;
          
          if (target) {
            targetMetDays = monthlyReports.filter(r => r.loadsBooked >= target.minPct).length;
          }
          
          // Store monthly stats
          dispatcherStats.push({
            dispatcherId,
            dispatcherName: `${user.users.firstName} ${user.users.lastName}`,
            totalLoadsBooked,
            totalInvoiceUsd,
            totalPaidInvoiceUsd,
            avgActiveLeads,
            highestDayInvoice,
            totalReportDays: monthlyReports.length,
            targetMetDays,
            month: lastMonth
          });
          
          console.log(`Generated monthly stats for ${user.users.firstName} ${user.users.lastName}`);
        } catch (error) {
          console.error(`Error generating monthly stats for dispatcher ${user.users.id}:`, error);
        }
      }
      
      if (dispatcherStats.length === 0) {
        console.log('No monthly stats generated for any dispatcher');
        return;
      }
      
      // Send monthly summary to Slack
      const { WebClient } = await import('@slack/web-api');
      
      if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_DISPATCH_CHANNEL_ID) {
        console.log('Slack credentials not found, skipping notification');
        return;
      }
      
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
      const dispatchChannel = process.env.SLACK_DISPATCH_CHANNEL_ID;
      
      // Sort dispatchers by total loads booked (highest first)
      dispatcherStats.sort((a, b) => b.totalLoadsBooked - a.totalLoadsBooked);
      
      // Format currency
      const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount);
      };
      
      // Generate dispatcher performance blocks
      const dispatcherBlocks = dispatcherStats.map(stat => ({
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*${stat.dispatcherName}*`
          },
          {
            type: "mrkdwn",
            text: `Loads: ${stat.totalLoadsBooked} | Revenue: ${formatCurrency(stat.totalInvoiceUsd)}`
          }
        ]
      }));
      
      // Calculate team totals
      const teamLoads = dispatcherStats.reduce((sum, s) => sum + s.totalLoadsBooked, 0);
      const teamRevenue = dispatcherStats.reduce((sum, s) => sum + s.totalInvoiceUsd, 0);
      const teamPaid = dispatcherStats.reduce((sum, s) => sum + s.totalPaidInvoiceUsd, 0);
      
      // Send the monthly summary to Slack
      await slack.chat.postMessage({
        channel: dispatchChannel,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `📊 Monthly Dispatch Report: ${monthLabel}`,
              emoji: true
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Total Team Loads:*\n${teamLoads}`
              },
              {
                type: "mrkdwn",
                text: `*Total Team Revenue:*\n${formatCurrency(teamRevenue)}`
              }
            ]
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Total Paid:*\n${formatCurrency(teamPaid)}`
              },
              {
                type: "mrkdwn",
                text: `*Dispatchers:*\n${dispatcherStats.length}`
              }
            ]
          },
          {
            type: "divider"
          },
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Dispatcher Performance",
              emoji: true
            }
          },
          ...dispatcherBlocks,
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `Monthly report generated by MetaSys ERP on ${format(new Date(), 'MMM d, yyyy h:mm a')}`
              }
            ]
          }
        ],
        attachments: [
          {
            color: "#025E73", // Brand navy color
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "For detailed monthly analytics, visit the Dispatch Reports dashboard in MetaSys ERP."
                }
              }
            ]
          }
        ]
      });
      
      console.log(`Monthly report for ${monthLabel} sent to Slack`);
      
    } catch (error) {
      console.error('Error in monthly dispatch report generation:', error);
    }
  }, null, true, 'America/New_York');
}

/**
 * Initializes all dispatch report automation jobs
 */
export function initializeDispatchReportAutomation() {
  const reportGenerationJob = scheduleDailyReportGeneration();
  const reportReminderJob = scheduleDailyReportReminder();
  const monthlyReportJob = scheduleMonthlyReportGeneration();
  
  console.log('Dispatch Report Automation initialized with the following jobs:');
  console.log('- Daily Report Generation: runs at 18:00 daily');
  console.log('- Daily Report Reminder: runs at 16:45 daily');
  console.log('- Monthly Report Generation: runs at 01:00 on the 1st of each month');
  
  return {
    reportGenerationJob,
    reportReminderJob,
    monthlyReportJob
  };
}