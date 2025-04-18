import { WebClient } from "@slack/web-api";
import type { ChatPostMessageArguments } from "@slack/web-api";

// Validate that required environment variables are set
if (!process.env.SLACK_BOT_TOKEN) {
  console.warn("SLACK_BOT_TOKEN environment variable is not set. Slack notifications will not work.");
}

if (!process.env.SLACK_CHANNEL_ID) {
  console.warn("SLACK_CHANNEL_ID environment variable is not set. Slack notifications will not work.");
}

// Initialize the Slack Web API client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

/**
 * Sends a message to the configured Slack channel
 * @param message - The text message to send
 * @returns Promise resolving to success status
 */
export async function sendSlackMessage(message: string): Promise<boolean> {
  try {
    if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_CHANNEL_ID) {
      console.warn("Slack notification not sent: Missing configuration");
      return false;
    }

    // Send the message to the configured channel
    await slack.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_ID,
      text: message
    });

    return true;
  } catch (error) {
    console.error("Error sending Slack message:", error);
    return false;
  }
}

/**
 * Sends a structured message to Slack with blocks
 * @param params - Message parameters including blocks
 * @returns Promise resolving to success status
 */
export async function sendStructuredSlackMessage(params: ChatPostMessageArguments): Promise<boolean> {
  try {
    if (!process.env.SLACK_BOT_TOKEN) {
      console.warn("Slack notification not sent: Missing SLACK_BOT_TOKEN");
      return false;
    }

    // Use the channel from params or fall back to the default channel
    const channel = params.channel || process.env.SLACK_CHANNEL_ID;
    
    if (!channel) {
      console.warn("Slack notification not sent: No channel specified");
      return false;
    }

    // Send the structured message
    await slack.chat.postMessage({
      ...params,
      channel
    });

    return true;
  } catch (error) {
    console.error("Error sending structured Slack message:", error);
    return false;
  }
}

/**
 * Sends a lead notification to Slack
 * @param leadInfo - Information about the lead
 * @returns Promise resolving to success status
 */
export async function sendLeadNotification(leadInfo: {
  id: number;
  companyName: string;
  status: string;
  contactName: string;
  equipmentType: string;
  assignedTo: string;
  action: 'created' | 'updated' | 'status_changed';
}): Promise<boolean> {
  const { id, companyName, status, contactName, equipmentType, assignedTo, action } = leadInfo;
  
  let emoji = '📋';
  let actionText = 'updated';
  
  switch (action) {
    case 'created':
      emoji = '🆕';
      actionText = 'created';
      break;
    case 'status_changed':
      emoji = '🔄';
      actionText = 'changed status to';
      break;
  }

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} Lead ${actionText}: ${companyName}`
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*ID:*\n#${id}`
        },
        {
          type: "mrkdwn",
          text: `*Status:*\n${status}`
        },
        {
          type: "mrkdwn",
          text: `*Contact:*\n${contactName}`
        },
        {
          type: "mrkdwn",
          text: `*Equipment:*\n${equipmentType}`
        },
        {
          type: "mrkdwn",
          text: `*Assigned To:*\n${assignedTo}`
        }
      ]
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `View lead details in MetaSys ERP`
        }
      ]
    },
    {
      type: "divider"
    }
  ];

  return sendStructuredSlackMessage({
    channel: process.env.SLACK_CHANNEL_ID,
    blocks
  });
}

/**
 * Sends a load notification to Slack
 * @param loadInfo - Information about the load
 * @returns Promise resolving to success status
 */
export async function sendLoadNotification(loadInfo: {
  id: number;
  leadId: number;
  companyName: string;
  origin: string;
  destination: string;
  status: string;
  freightAmount: number;
  pickupDate: string;
  action: 'created' | 'updated' | 'status_changed';
}): Promise<boolean> {
  const { id, leadId, companyName, origin, destination, status, freightAmount, pickupDate, action } = loadInfo;
  
  let emoji = '🚚';
  let actionText = 'updated';
  
  switch (action) {
    case 'created':
      emoji = '🚚';
      actionText = 'created';
      break;
    case 'status_changed':
      emoji = '🔄';
      actionText = 'changed status to';
      break;
  }
  
  // Format the freight amount as currency
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(freightAmount);

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} Load ${actionText}: ${origin} to ${destination}`
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Load ID:*\n#${id}`
        },
        {
          type: "mrkdwn",
          text: `*Client:*\n${companyName}`
        },
        {
          type: "mrkdwn",
          text: `*Status:*\n${status}`
        },
        {
          type: "mrkdwn",
          text: `*Freight:*\n${formattedAmount}`
        },
        {
          type: "mrkdwn",
          text: `*Pickup Date:*\n${new Date(pickupDate).toLocaleDateString()}`
        }
      ]
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `View load details in MetaSys ERP`
        }
      ]
    },
    {
      type: "divider"
    }
  ];

  return sendStructuredSlackMessage({
    channel: process.env.SLACK_CHANNEL_ID,
    blocks
  });
}

/**
 * Sends a daily summary to Slack
 * @param summary - Summary data
 * @returns Promise resolving to success status
 */
export async function sendDailySummary(summary: {
  date: string;
  newLeads: number;
  qualifiedLeads: number;
  activeLoads: number;
  completedLoads: number;
  pendingInvoices: number;
  totalRevenue: number;
}): Promise<boolean> {
  const { date, newLeads, qualifiedLeads, activeLoads, completedLoads, pendingInvoices, totalRevenue } = summary;
  
  // Format the revenue as currency
  const formattedRevenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(totalRevenue);

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📊 Daily Summary: ${date}`
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*New Leads:*\n${newLeads}`
        },
        {
          type: "mrkdwn",
          text: `*Qualified Leads:*\n${qualifiedLeads}`
        },
        {
          type: "mrkdwn",
          text: `*Active Loads:*\n${activeLoads}`
        },
        {
          type: "mrkdwn",
          text: `*Completed Loads:*\n${completedLoads}`
        },
        {
          type: "mrkdwn",
          text: `*Pending Invoices:*\n${pendingInvoices}`
        },
        {
          type: "mrkdwn",
          text: `*Total Revenue:*\n${formattedRevenue}`
        }
      ]
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `View detailed reports in MetaSys ERP`
        }
      ]
    }
  ];

  return sendStructuredSlackMessage({
    channel: process.env.SLACK_CHANNEL_ID,
    blocks
  });
}

// Export default functions for easier imports
export default {
  sendSlackMessage,
  sendStructuredSlackMessage,
  sendLeadNotification,
  sendLoadNotification,
  sendDailySummary
};