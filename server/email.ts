import nodemailer from 'nodemailer';

// Define email types for the system
export enum EmailType {
  INVOICE = 'invoice',
  LEAD_NOTIFICATION = 'lead_notification',
  LOAD_NOTIFICATION = 'load_notification',
  DAILY_REPORT = 'daily_report',
  PASSWORD_RESET = 'password_reset',
  WELCOME = 'welcome'
}

// Configuration for sending emails
interface EmailConfig {
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  footerText?: string;
}

const defaultConfig: EmailConfig = {
  fromEmail: 'shahrukh@metasysltd.com',
  fromName: 'MetaSys ERP',
  replyToEmail: 'shahrukh@metasysltd.com',
  footerText: 'This is an automated message from MetaSys ERP. For support, please contact shahrukh@metasysltd.com'
};

// Create a transporter for SMTP using Google Workspace
let transporter: nodemailer.Transporter | null = null;

// Initialize the transporter if credentials are available
export function initializeTransporter(options: {
  email: string;
  password: string;
  host?: string;
  port?: number;
}) {
  try {
    // Create reusable transporter object using SMTP transport optimized for Google Workspace
    transporter = nodemailer.createTransport({
      service: 'gmail', // Use Gmail service for better compatibility
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: options.email,
        pass: options.password,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('Email transporter initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
    return false;
  }
}

// Initialize with environment variables
if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
  console.log('Initializing email transporter with environment credentials...');
  const result = initializeTransporter({
    email: process.env.SMTP_EMAIL,
    password: process.env.SMTP_PASSWORD,
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
  });
  console.log('Email transporter initialization result:', result);
} else {
  console.warn('SMTP_EMAIL and SMTP_PASSWORD environment variables are not set. Email functionality will be disabled.');
}

/**
 * Sends an email using Google Workspace SMTP
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param text - Plain text content
 * @param html - HTML content
 * @param config - Optional email configuration
 * @returns Promise resolving to success status
 */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html: string,
  config: Partial<EmailConfig> = {}
): Promise<boolean> {
  try {
    if (!transporter) {
      console.warn("Email not sent: Email transporter not initialized");
      return false;
    }

    // Merge the default config with any provided overrides
    const emailConfig = { ...defaultConfig, ...config };
    
    // Prepare message options
    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to,
      subject,
      text,
      html,
      replyTo: emailConfig.replyToEmail
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Sends an invoice email to a client
 * @param invoiceInfo - Information about the invoice
 * @returns Promise resolving to success status
 */
export async function sendInvoiceEmail(invoiceInfo: {
  id: number;
  invoiceNumber: string;
  companyName: string;
  contactEmail: string;
  contactName: string;
  totalAmount: number;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  notes?: string;
  paymentLink?: string;
}): Promise<boolean> {
  const { 
    invoiceNumber, 
    companyName, 
    contactEmail,
    contactName,
    totalAmount, 
    dueDate,
    items,
    notes,
    paymentLink
  } = invoiceInfo;
  
  // Format the amount as currency
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(totalAmount);

  // Format the due date
  const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Generate the email subject
  const subject = `Invoice #${invoiceNumber} from MetaSys Logistics`;
  
  // Generate the plain text version
  let text = `
Invoice #${invoiceNumber}
For: ${companyName}
Amount: ${formattedAmount}
Due Date: ${formattedDueDate}

Dear ${contactName},

Please find your invoice details below:

`;

  // Add invoice items to text
  items.forEach(item => {
    const itemAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(item.amount);
    
    text += `- ${item.description}: ${item.quantity} x ${item.unitPrice} = ${itemAmount}\n`;
  });
  
  // Add total
  text += `\nTotal Amount: ${formattedAmount}`;
  
  // Add notes if provided
  if (notes) {
    text += `\n\nNotes: ${notes}`;
  }
  
  // Add payment link if provided
  if (paymentLink) {
    text += `\n\nTo make a payment, please visit: ${paymentLink}`;
  }
  
  // Add footer
  text += `\n\nThank you for your business.
This is an automated message from MetaSys ERP. Please contact support@metasyserp.com if you have any questions.`;

  // Generate the HTML version with better formatting
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4a6cf7;
      color: white;
      padding: 15px;
      border-radius: 5px 5px 0 0;
    }
    .content {
      border: 1px solid #ddd;
      border-top: none;
      padding: 20px;
      border-radius: 0 0 5px 5px;
    }
    .invoice-details {
      margin-bottom: 20px;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .invoice-table th, .invoice-table td {
      padding: 10px;
      border: 1px solid #ddd;
      text-align: left;
    }
    .invoice-table th {
      background-color: #f5f5f5;
    }
    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    .notes {
      margin-top: 20px;
      padding: 10px;
      background-color: #f9f9f9;
      border-radius: 5px;
    }
    .payment-button {
      display: inline-block;
      background-color: #4a6cf7;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 15px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoice #${invoiceNumber}</h1>
    </div>
    <div class="content">
      <div class="invoice-details">
        <p><strong>For:</strong> ${companyName}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Due Date:</strong> ${formattedDueDate}</p>
      </div>
      
      <p>Dear ${contactName},</p>
      
      <p>Please find your invoice details below:</p>
      
      <table class="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
`;

  // Add invoice items to HTML
  items.forEach(item => {
    const unitPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(item.unitPrice);
    
    const itemAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(item.amount);
    
    html += `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>${unitPrice}</td>
            <td>${itemAmount}</td>
          </tr>
    `;
  });
  
  // Add total row
  html += `
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="3">Total Amount</td>
            <td>${formattedAmount}</td>
          </tr>
        </tfoot>
      </table>
  `;
  
  // Add notes if provided
  if (notes) {
    html += `
      <div class="notes">
        <strong>Notes:</strong>
        <p>${notes}</p>
      </div>
    `;
  }
  
  // Add payment link if provided
  if (paymentLink) {
    html += `
      <p>
        <a href="${paymentLink}" class="payment-button">Pay Now</a>
      </p>
    `;
  }
  
  // Add footer
  html += `
      <div class="footer">
        <p>Thank you for your business.</p>
        <p>This is an automated message from MetaSys ERP. Please contact <a href="mailto:support@metasyserp.com">support@metasyserp.com</a> if you have any questions.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  // Send the email
  return sendEmail(
    contactEmail,
    subject,
    text,
    html,
    {
      fromName: "MetaSys Logistics"
    }
  );
}

/**
 * Sends a lead notification email to a sales representative
 * @param leadInfo - Information about the lead
 * @returns Promise resolving to success status
 */
export async function sendLeadNotificationEmail(leadInfo: {
  id: number;
  companyName: string;
  status: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  equipmentType: string;
  notes?: string;
  userEmail: string;
  userName: string;
}): Promise<boolean> {
  const { 
    id, 
    companyName, 
    status, 
    contactName,
    contactEmail,
    contactPhone,
    equipmentType,
    notes,
    userEmail,
    userName
  } = leadInfo;
  
  // Generate the email subject
  const subject = `New Lead Assigned: ${companyName}`;
  
  // Generate the plain text version
  let text = `
Lead ID: #${id}
Company: ${companyName}
Status: ${status}
Contact: ${contactName}
Contact Email: ${contactEmail}
Contact Phone: ${contactPhone}
Equipment Type: ${equipmentType}
`;

  if (notes) {
    text += `\nNotes: ${notes}`;
  }
  
  text += `\n\nPlease log in to MetaSys ERP to view and update this lead.`;
  
  // Generate the HTML version with better formatting
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4a6cf7;
      color: white;
      padding: 15px;
      border-radius: 5px 5px 0 0;
    }
    .content {
      border: 1px solid #ddd;
      border-top: none;
      padding: 20px;
      border-radius: 0 0 5px 5px;
    }
    .lead-details {
      margin-bottom: 20px;
    }
    .detail-row {
      margin-bottom: 10px;
    }
    .label {
      font-weight: bold;
    }
    .notes {
      margin-top: 20px;
      padding: 10px;
      background-color: #f9f9f9;
      border-radius: 5px;
    }
    .action-button {
      display: inline-block;
      background-color: #4a6cf7;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 15px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Lead Assigned</h1>
    </div>
    <div class="content">
      <p>Hello ${userName},</p>
      
      <p>A new lead has been assigned to you in the MetaSys ERP system:</p>
      
      <div class="lead-details">
        <div class="detail-row">
          <span class="label">Lead ID:</span> #${id}
        </div>
        <div class="detail-row">
          <span class="label">Company:</span> ${companyName}
        </div>
        <div class="detail-row">
          <span class="label">Status:</span> ${status}
        </div>
        <div class="detail-row">
          <span class="label">Contact:</span> ${contactName}
        </div>
        <div class="detail-row">
          <span class="label">Contact Email:</span> <a href="mailto:${contactEmail}">${contactEmail}</a>
        </div>
        <div class="detail-row">
          <span class="label">Contact Phone:</span> ${contactPhone}
        </div>
        <div class="detail-row">
          <span class="label">Equipment Type:</span> ${equipmentType}
        </div>
      </div>
      
`;

  // Add notes if provided
  if (notes) {
    html += `
      <div class="notes">
        <span class="label">Notes:</span>
        <p>${notes}</p>
      </div>
    `;
  }
  
  // Add action button and footer
  html += `
      <p>
        <a href="https://metasyserp.com/leads/${id}" class="action-button">View Lead</a>
      </p>
      
      <div class="footer">
        <p>This is an automated message from MetaSys ERP. Please log in to the system to view and update this lead.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  // Send the email
  return sendEmail(
    userEmail,
    subject,
    text,
    html
  );
}

/**
 * Sends a daily summary report via email
 * @param summaryInfo - Summary information
 * @returns Promise resolving to success status
 */
export async function sendDailySummaryEmail(summaryInfo: {
  date: string;
  recipientEmail: string;
  recipientName: string;
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
  };
  topPerformers?: {
    salesReps: Array<{ name: string; leadsConverted: number }>;
    dispatchReps: Array<{ name: string; loadsCompleted: number }>;
  };
}): Promise<boolean> {
  const { 
    date, 
    recipientEmail, 
    recipientName,
    newLeads, 
    qualifiedLeads, 
    activeLoads, 
    completedLoads, 
    pendingInvoices, 
    totalRevenue,
    commissions,
    topPerformers
  } = summaryInfo;
  
  // Format the revenue as currency
  const formattedRevenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(totalRevenue);
  
  // Generate the email subject
  const subject = `Daily Summary Report: ${date}`;
  
  // Generate the plain text version
  let text = `
Daily Summary Report: ${date}

Key Metrics:
- New Leads: ${newLeads}
- Qualified Leads: ${qualifiedLeads}
- Active Loads: ${activeLoads}
- Completed Loads: ${completedLoads}
- Pending Invoices: ${pendingInvoices}
- Total Revenue: ${formattedRevenue}
`;

  // Add commission information if available
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
    
    text += `
Commission Summary:
- Total Commissions: ${formattedTotalCommission}
- Sales Team: ${formattedSalesCommission}
- Dispatch Team: ${formattedDispatchCommission}
`;
  }
  
  // Add top performers if available
  if (topPerformers) {
    text += `\nTop Sales Representatives:`;
    topPerformers.salesReps.forEach((rep, index) => {
      text += `\n${index + 1}. ${rep.name} - ${rep.leadsConverted} leads converted`;
    });
    
    text += `\n\nTop Dispatch Representatives:`;
    topPerformers.dispatchReps.forEach((rep, index) => {
      text += `\n${index + 1}. ${rep.name} - ${rep.loadsCompleted} loads completed`;
    });
  }
  
  text += `\n\nPlease log in to MetaSys ERP for more detailed information.`;

  // Generate the HTML version with better formatting
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4a6cf7;
      color: white;
      padding: 15px;
      border-radius: 5px 5px 0 0;
    }
    .content {
      border: 1px solid #ddd;
      border-top: none;
      padding: 20px;
      border-radius: 0 0 5px 5px;
    }
    .metrics-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .metrics-table th, .metrics-table td {
      padding: 10px;
      border: 1px solid #ddd;
      text-align: left;
    }
    .metrics-table th {
      background-color: #f5f5f5;
    }
    .section-header {
      margin-top: 20px;
      padding-bottom: 5px;
      border-bottom: 2px solid #4a6cf7;
      color: #4a6cf7;
    }
    .performance-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .performance-table th, .performance-table td {
      padding: 8px;
      border: 1px solid #ddd;
      text-align: left;
    }
    .performance-table th {
      background-color: #f5f5f5;
    }
    .action-button {
      display: inline-block;
      background-color: #4a6cf7;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 15px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Daily Summary Report</h1>
      <h2>${date}</h2>
    </div>
    <div class="content">
      <p>Hello ${recipientName},</p>
      
      <p>Here is your daily summary report for MetaSys ERP:</p>
      
      <h3 class="section-header">Key Metrics</h3>
      <table class="metrics-table">
        <tbody>
          <tr>
            <td><strong>New Leads</strong></td>
            <td>${newLeads}</td>
            <td><strong>Qualified Leads</strong></td>
            <td>${qualifiedLeads}</td>
          </tr>
          <tr>
            <td><strong>Active Loads</strong></td>
            <td>${activeLoads}</td>
            <td><strong>Completed Loads</strong></td>
            <td>${completedLoads}</td>
          </tr>
          <tr>
            <td><strong>Pending Invoices</strong></td>
            <td>${pendingInvoices}</td>
            <td><strong>Total Revenue</strong></td>
            <td>${formattedRevenue}</td>
          </tr>
        </tbody>
      </table>
`;

  // Add commission information if available
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
    
    html += `
      <h3 class="section-header">Commission Summary</h3>
      <table class="metrics-table">
        <tbody>
          <tr>
            <td><strong>Total Commissions</strong></td>
            <td>${formattedTotalCommission}</td>
          </tr>
          <tr>
            <td><strong>Sales Team</strong></td>
            <td>${formattedSalesCommission}</td>
          </tr>
          <tr>
            <td><strong>Dispatch Team</strong></td>
            <td>${formattedDispatchCommission}</td>
          </tr>
        </tbody>
      </table>
    `;
  }
  
  // Add top performers if available
  if (topPerformers && topPerformers.salesReps.length > 0) {
    html += `
      <h3 class="section-header">Top Sales Representatives</h3>
      <table class="performance-table">
        <thead>
          <tr>
            <th>Representative</th>
            <th>Leads Converted</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    topPerformers.salesReps.forEach(rep => {
      html += `
          <tr>
            <td>${rep.name}</td>
            <td>${rep.leadsConverted}</td>
          </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    `;
  }
  
  if (topPerformers && topPerformers.dispatchReps.length > 0) {
    html += `
      <h3 class="section-header">Top Dispatch Representatives</h3>
      <table class="performance-table">
        <thead>
          <tr>
            <th>Representative</th>
            <th>Loads Completed</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    topPerformers.dispatchReps.forEach(rep => {
      html += `
          <tr>
            <td>${rep.name}</td>
            <td>${rep.loadsCompleted}</td>
          </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    `;
  }
  
  // Add action button and footer
  html += `
      <p>
        <a href="https://metasyserp.com/reports/daily" class="action-button">View Detailed Report</a>
      </p>
      
      <div class="footer">
        <p>This is an automated message from MetaSys ERP. Please log in to the system for more detailed information.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  // Send the email
  return sendEmail(
    recipientEmail,
    subject,
    text,
    html
  );
}

/**
 * Sends a password reset email
 * @param to - Recipient email address
 * @param userName - User's name for personalization
 * @param resetUrl - Password reset URL with token
 * @param resetToken - Reset token for reference
 * @returns Promise resolving to success status
 */
export async function sendPasswordResetEmail(
  to: string,
  userName: string,
  resetUrl: string,
  resetToken: string
): Promise<boolean> {
  const subject = "Reset Your MetaSys ERP Password";
  
  const text = `
Hello ${userName},

You requested a password reset for your MetaSys ERP account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this reset, please ignore this email.

Best regards,
MetaSys ERP Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #025E73;">Reset Your Password</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>You requested a password reset for your MetaSys ERP account.</p>
      
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #025E73; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <p>This link will expire in <strong>1 hour</strong> for security reasons.</p>
      <p>If you didn't request this reset, please ignore this email.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        Best regards,<br>
        MetaSys ERP Team
      </p>
    </div>
  `;

  return await sendEmail(to, subject, text, html);
}

// Export default functions for easier imports
export default {
  sendEmail,
  sendInvoiceEmail,
  sendLeadNotificationEmail,
  sendDailySummaryEmail,
  sendPasswordResetEmail
};