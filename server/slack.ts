import { WebClient } from "@slack/web-api";
import type { ChatPostMessageArguments, Block } from "@slack/web-api";

// Define custom block types that include context with elements
interface ContextBlock {
  type: "context";
  elements: {
    type: "mrkdwn";
    text: string;
  }[];
}

// Create a union type that includes all possible block types
type SlackBlock = Block | ContextBlock;

// Validate that required environment variables are set
if (!process.env.SLACK_BOT_TOKEN) {
  console.warn("SLACK_BOT_TOKEN environment variable is not set. Slack notifications will not work.");
}

// Define channel type for team-specific notifications
export enum SlackChannelType {
  GENERAL = 'general',
  SALES = 'sales',
  DISPATCH = 'dispatch',
  ADMIN = 'admin'
}

// Channel ID mapping
export const SLACK_CHANNELS = {
  [SlackChannelType.GENERAL]: process.env.SLACK_CHANNEL_ID,
  [SlackChannelType.SALES]: process.env.SLACK_SALES_CHANNEL_ID,
  [SlackChannelType.DISPATCH]: process.env.SLACK_DISPATCH_CHANNEL_ID,
  [SlackChannelType.ADMIN]: process.env.SLACK_ADMIN_CHANNEL_ID
};

// Log channel configuration status
Object.entries(SLACK_CHANNELS).forEach(([type, id]) => {
  if (!id) {
    console.warn(`Slack channel ID for ${type} is not set. Notifications to this channel will not work.`);
  }
});

// Initialize the Slack Web API client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

/**
 * Sends a message to a specific Slack channel
 * @param message - The text message to send
 * @param channelType - The channel type to send the message to
 * @returns Promise resolving to success status
 */
export async function sendSlackMessage(
  message: string, 
  channelType: SlackChannelType = SlackChannelType.GENERAL
): Promise<boolean> {
  try {
    if (!process.env.SLACK_BOT_TOKEN) {
      console.warn("Slack notification not sent: Missing SLACK_BOT_TOKEN");
      return false;
    }

    const channelId = SLACK_CHANNELS[channelType];
    if (!channelId) {
      console.warn(`Slack notification not sent: Channel ID for ${channelType} not configured`);
      return false;
    }

    // Send the message to the configured channel
    await slack.chat.postMessage({
      channel: channelId,
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
 * @param channelType - The channel type to send the message to
 * @returns Promise resolving to success status
 */
export async function sendStructuredSlackMessage(
  params: Omit<ChatPostMessageArguments, 'blocks'> & { blocks?: SlackBlock[] },
  channelType: SlackChannelType = SlackChannelType.GENERAL
): Promise<boolean> {
  try {
    if (!process.env.SLACK_BOT_TOKEN) {
      console.warn("Slack notification not sent: Missing SLACK_BOT_TOKEN");
      return false;
    }

    // Use the channel from params or get it from the channel type
    const channelId = params.channel || SLACK_CHANNELS[channelType];
    
    if (!channelId) {
      console.warn(`Slack notification not sent: Channel ID for ${channelType} not configured`);
      return false;
    }

    // Send the structured message
    await slack.chat.postMessage({
      ...params,
      channel: channelId
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

  // Send to the Sales channel
  return sendStructuredSlackMessage({
    blocks,
    channel: SLACK_CHANNELS[SlackChannelType.SALES] || ''
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

  // Send to both Sales and Dispatch channels
  const dispatchResult = await sendStructuredSlackMessage({
    blocks,
    channel: SLACK_CHANNELS[SlackChannelType.DISPATCH] || ''
  });
  
  // Also send to Sales channel for lead-related updates
  const salesResult = await sendStructuredSlackMessage({
    blocks,
    channel: SLACK_CHANNELS[SlackChannelType.SALES] || ''
  });
  
  return dispatchResult && salesResult;
}

/**
 * Sends an invoice notification to Slack
 * @param invoiceInfo - Information about the invoice
 * @returns Promise resolving to success status
 */
export async function sendInvoiceNotification(invoiceInfo: {
  id: number;
  invoiceNumber: string;
  leadId: number;
  companyName: string;
  totalAmount: number;
  status: string;
  dueDate: string;
  action: 'created' | 'updated' | 'status_changed';
}): Promise<boolean> {
  const { id, invoiceNumber, leadId, companyName, totalAmount, status, dueDate, action } = invoiceInfo;
  
  let emoji = '📝';
  let actionText = 'updated';
  
  switch (action) {
    case 'created':
      emoji = '📄';
      actionText = 'created';
      break;
    case 'status_changed':
      emoji = '🔄';
      actionText = 'changed status to';
      break;
  }
  
  // Format the amount as currency
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(totalAmount);

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} Invoice ${actionText}: #${invoiceNumber}`
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Invoice ID:*\n#${id}`
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
          text: `*Amount:*\n${formattedAmount}`
        },
        {
          type: "mrkdwn",
          text: `*Due Date:*\n${new Date(dueDate).toLocaleDateString()}`
        }
      ]
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `View invoice details in MetaSys ERP`
        }
      ]
    },
    {
      type: "divider"
    }
  ];

  // Send to Dispatch channel
  return sendStructuredSlackMessage({
    blocks,
    channel: SLACK_CHANNELS[SlackChannelType.DISPATCH] || ''
  });
}

/**
 * Sends a daily summary to Slack
 * This sends a comprehensive report to the admin channel
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
  commissions?: {
    totalPaid: number;
    salesTeam: number;
    dispatchTeam: number;
  }
}): Promise<boolean> {
  const { 
    date, 
    newLeads, 
    qualifiedLeads, 
    activeLoads, 
    completedLoads, 
    pendingInvoices, 
    totalRevenue,
    commissions
  } = summary;
  
  // Format the revenue as currency
  const formattedRevenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(totalRevenue);
  
  // Base fields that are common for all channels
  const baseFields = [
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
  ];
  
  // Admin blocks include everything
  const adminBlocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📊 Daily Summary Report: ${date}`
      }
    },
    {
      type: "section",
      fields: baseFields
    }
  ];
  
  // Add commission information to admin report if available
  if (commissions) {
    const formattedTotalCommission = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(commissions.totalPaid);
    
    const formattedSalesCommission = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(commissions.salesTeam);
    
    const formattedDispatchCommission = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(commissions.dispatchTeam);
    
    adminBlocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Commission Summary*"
      }
    });
    
    adminBlocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Total Commissions:*\n${formattedTotalCommission}`
        },
        {
          type: "mrkdwn",
          text: `*Sales Team:*\n${formattedSalesCommission}`
        },
        {
          type: "mrkdwn",
          text: `*Dispatch Team:*\n${formattedDispatchCommission}`
        }
      ]
    });
  }
  
  // Add footer to admin report
  adminBlocks.push({
    type: "context" as const,
    elements: [
      {
        type: "mrkdwn",
        text: `View detailed reports in MetaSys ERP`
      }
    ]
  } as any);
  
  // Sales team blocks - focus on leads
  const salesBlocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📊 Sales Daily Summary: ${date}`
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
  
  // Dispatch team blocks - focus on loads and invoices
  const dispatchBlocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📊 Dispatch Daily Summary: ${date}`
      }
    },
    {
      type: "section",
      fields: [
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

  // Send to all three channels with appropriate content
  const adminResult = await sendStructuredSlackMessage({
    blocks: adminBlocks,
    channel: SLACK_CHANNELS[SlackChannelType.ADMIN] || ''
  });
  
  const salesResult = await sendStructuredSlackMessage({
    blocks: salesBlocks,
    channel: SLACK_CHANNELS[SlackChannelType.SALES] || ''
  });
  
  const dispatchResult = await sendStructuredSlackMessage({
    blocks: dispatchBlocks,
    channel: SLACK_CHANNELS[SlackChannelType.DISPATCH] || ''
  });
  
  return adminResult && salesResult && dispatchResult;
}

/**
 * Sends a dispatch client notification to Slack
 * @param dispatchClientInfo - Information about the dispatch client
 * @returns Promise resolving to success status
 */
export async function sendDispatchClientNotification(dispatchClientInfo: {
  id: number;
  leadId: number;
  companyName: string;
  status: string;
  createdBy: string;
  action: 'created' | 'updated' | 'status_changed';
}): Promise<boolean> {
  const { id, leadId, companyName, status, createdBy, action } = dispatchClientInfo;
  
  let emoji = '🚚';
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

  // Format message with custom blocks
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} Dispatch Client ${actionText.toUpperCase()}`,
        emoji: true
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Company:*\n${companyName}`
        },
        {
          type: "mrkdwn",
          text: `*ID:*\n${id}`
        }
      ]
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Status:*\n${status}`
        },
        {
          type: "mrkdwn",
          text: `*Created By:*\n${createdBy}`
        }
      ]
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Lead ID:*\n${leadId}`
        }
      ]
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${action} at ${new Date().toLocaleString()}`
        }
      ]
    },
    {
      type: "divider"
    }
  ];

  return await sendStructuredSlackMessage(
    {
      text: `Dispatch Client ${actionText}: ${companyName}`,
      blocks: blocks as any,
    },
    SlackChannelType.DISPATCH
  );
}

// Export default functions for easier imports
export default {
  sendSlackMessage,
  sendStructuredSlackMessage,
  sendLeadNotification,
  sendLoadNotification,
  sendInvoiceNotification,
  sendDailySummary,
  sendDispatchClientNotification
};