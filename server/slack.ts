import { WebClient, ChatPostMessageArguments } from "@slack/web-api";
import { DispatchReport } from "@shared/schema";
import { format } from "date-fns";

// Initialize the Slack Web Client
if (!process.env.SLACK_BOT_TOKEN) {
  console.warn("SLACK_BOT_TOKEN environment variable not set. Slack notifications will be disabled.");
}

if (!process.env.SLACK_DISPATCH_CHANNEL_ID) {
  console.warn("SLACK_DISPATCH_CHANNEL_ID environment variable not set. Using SLACK_CHANNEL_ID as fallback.");
}

if (!process.env.SLACK_CHANNEL_ID) {
  console.warn("SLACK_CHANNEL_ID environment variable not set. General notifications will be disabled.");
}

const slackClient = process.env.SLACK_BOT_TOKEN ? new WebClient(process.env.SLACK_BOT_TOKEN) : null;
const dispatchChannelId = process.env.SLACK_DISPATCH_CHANNEL_ID || process.env.SLACK_CHANNEL_ID;
const generalChannelId = process.env.SLACK_CHANNEL_ID;
const salesChannelId = process.env.SLACK_SALES_CHANNEL_ID || generalChannelId;
const adminChannelId = process.env.SLACK_ADMIN_CHANNEL_ID || generalChannelId;

/**
 * Send a message to Slack
 * @param message Message configuration
 * @returns Promise resolving to the timestamp of the sent message
 */
export async function sendSlackMessage(message: ChatPostMessageArguments): Promise<string | null> {
  if (!slackClient) {
    console.warn("Slack client not initialized. Message not sent.");
    return null;
  }

  try {
    const response = await slackClient.chat.postMessage(message);
    return response.ts || null;
  } catch (error) {
    console.error("Error sending Slack message:", error);
    return null;
  }
}

/**
 * Send a notification to the appropriate Slack channel
 * @param title Notification title
 * @param message Notification message
 * @param channel Optional channel override
 * @returns Promise resolving to the timestamp of the sent message
 */
export async function sendSlackNotification(
  title: string,
  message: string,
  channel?: string
): Promise<string | null> {
  if (!slackClient) {
    console.warn("Slack client not initialized. Notification not sent.");
    return null;
  }

  const targetChannel = channel || generalChannelId;
  
  if (!targetChannel) {
    console.warn("No target channel available for Slack notification. Message not sent.");
    return null;
  }

  const slackMessage: ChatPostMessageArguments = {
    channel: targetChannel,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: title,
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `*MetaSys ERP* | ${format(new Date(), 'MMM d, yyyy h:mm a')}`
          }
        ]
      }
    ]
  };

  return await sendSlackMessage(slackMessage);
}

/**
 * Format a number as currency
 * @param value Number to format
 * @returns Formatted string
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
}

/**
 * Generate a color based on performance metrics
 * Brand color standards:
 * - Red (#C93131) = critical/action needed
 * - Green (#2EC4B6) = achievement
 * - Yellow (#F2A71B) = neutral reminder
 * @param report Dispatch report
 * @param target Performance target (if available)
 * @returns Color hex code
 */
function getPerformanceColor(report: DispatchReport, targetLoads?: number): string {
  // Default colors based on brand guidelines
  const RED = "#C93131";
  const GREEN = "#2EC4B6";
  const YELLOW = "#F2A71B";
  const NAVY = "#025E73";

  if (!targetLoads) {
    // No target to compare against, use navy as default
    return NAVY;
  }

  // Performance threshold (percentage of target)
  const performance = (report.loadsBooked / targetLoads) * 100;

  if (performance < 40) {
    return RED; // Below 40% of target - critical
  } else if (performance < 80) {
    return YELLOW; // Between 40% and 80% - needs attention
  } else {
    return GREEN; // At or above 80% - good performance
  }
}

/**
 * Send a daily dispatch report to Slack
 * @param report Dispatch report to send
 * @param userName Name of the dispatcher
 * @param targetLoads Target number of loads (if available)
 * @returns Promise resolving to the timestamp of the sent message
 */
export async function sendDailyDispatchReportToSlack(
  report: DispatchReport,
  userName: string,
  targetLoads?: number
): Promise<string | null> {
  if (!slackClient || !dispatchChannelId) {
    console.warn("Slack client or channel ID not available. Report not sent.");
    return null;
  }

  const reportDate = format(new Date(report.date), 'MMMM d, yyyy');
  const performanceColor = getPerformanceColor(report, targetLoads);

  const message: ChatPostMessageArguments = {
    channel: dispatchChannelId,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `📊 Daily Dispatch Report: ${reportDate}`,
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Dispatcher:* ${userName}`
        }
      },
      {
        type: "divider"
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Loads Booked:*\n${report.loadsBooked} ${targetLoads ? `/ ${targetLoads}` : ''}`
          },
          {
            type: "mrkdwn",
            text: `*Total Invoice Amount:*\n${formatCurrency(report.invoiceUsd)}`
          }
        ]
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Active Leads:*\n${report.activeLeads}`
          },
          {
            type: "mrkdwn",
            text: `*Pending Invoices:*\n${formatCurrency(report.pendingInvoiceUsd)}`
          }
        ]
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Highest Invoice:*\n${formatCurrency(report.highestInvoiceUsd)}`
          },
          {
            type: "mrkdwn",
            text: `*Paid Invoices Today:*\n${formatCurrency(report.paidInvoiceUsd)}`
          }
        ]
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `*Status:* ${report.status} | Generated by MetaSys ERP on ${format(new Date(), 'MMM d, yyyy h:mm a')}`
          }
        ]
      }
    ],
    attachments: [
      {
        color: performanceColor,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: targetLoads 
                ? `*Performance Summary:* ${Math.round((report.loadsBooked / targetLoads) * 100)}% of daily target`
                : "*Performance Summary:* No targets set for evaluation"
            }
          }
        ]
      }
    ]
  };

  return await sendSlackMessage(message);
}

/**
 * Send a summary report of all dispatchers to Slack
 * @param reports Array of dispatch reports with dispatcher names
 * @returns Promise resolving to the timestamp of the sent message
 */
export async function sendDailyDispatchSummaryToSlack(
  reports: Array<{ report: DispatchReport; dispatcherName: string }>
): Promise<string | null> {
  if (!slackClient || !dispatchChannelId) {
    console.warn("Slack client or channel ID not available. Summary not sent.");
    return null;
  }

  const reportDate = format(new Date(), 'MMMM d, yyyy');
  const totalLoads = reports.reduce((sum, item) => sum + item.report.loadsBooked, 0);
  const totalInvoice = reports.reduce((sum, item) => sum + item.report.invoiceUsd, 0);
  const totalPending = reports.reduce((sum, item) => sum + item.report.pendingInvoiceUsd, 0);
  const totalPaid = reports.reduce((sum, item) => sum + item.report.paidInvoiceUsd, 0);
  
  // Sort dispatchers by loads booked (highest first)
  const sortedReports = [...reports].sort((a, b) => b.report.loadsBooked - a.report.loadsBooked);

  // Create report blocks
  const dispatcherBlocks = sortedReports.map(item => ({
    type: "section",
    fields: [
      {
        type: "mrkdwn",
        text: `*${item.dispatcherName}*`
      },
      {
        type: "mrkdwn",
        text: `Loads: ${item.report.loadsBooked} | Invoice: ${formatCurrency(item.report.invoiceUsd)}`
      }
    ]
  }));

  const message: ChatPostMessageArguments = {
    channel: dispatchChannelId,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `📈 Daily Dispatch Summary: ${reportDate}`,
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Total Loads:*\n${totalLoads}`
          },
          {
            type: "mrkdwn",
            text: `*Total Invoice:*\n${formatCurrency(totalInvoice)}`
          }
        ]
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Pending Invoices:*\n${formatCurrency(totalPending)}`
          },
          {
            type: "mrkdwn",
            text: `*Paid Today:*\n${formatCurrency(totalPaid)}`
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
            text: `Generated by MetaSys ERP on ${format(new Date(), 'MMM d, yyyy h:mm a')}`
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
              text: "For detailed breakdowns, please view the Dispatch Reports dashboard in MetaSys ERP."
            }
          }
        ]
      }
    ]
  };

  return await sendSlackMessage(message);
}