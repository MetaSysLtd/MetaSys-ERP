import { sendEmail } from './email';

// Define invoice email template types
export enum InvoiceTemplateType {
  STANDARD = 'standard',
  FRIENDLY_REMINDER = 'friendly_reminder',
  URGENT_PAYMENT = 'urgent_payment', 
  OVERDUE_NOTICE = 'overdue_notice'
}

interface InvoiceEmailData {
  id: number;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientContactName: string;
  totalAmount: number;
  issuedDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    amount: number;
    loadInfo?: {
      loadNumber: string;
      origin: string;
      destination: string;
      date: string;
    };
  }>;
  notes?: string;
  createdBy: {
    name: string;
    email: string;
    phone?: string;
  };
  customMessage?: string;
}

/**
 * Format a date string to a human-readable format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format an amount as currency
 * @param amount - Number to format
 * @returns Formatted currency string
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Generates the HTML content for a standard invoice email
 * @param data - Invoice data
 * @returns HTML content string
 */
function generateStandardTemplate(data: InvoiceEmailData): string {
  const {
    invoiceNumber,
    clientName,
    clientContactName,
    totalAmount,
    issuedDate,
    dueDate,
    items,
    notes,
    createdBy,
    customMessage
  } = data;

  // Format dates and amounts
  const formattedAmount = formatCurrency(totalAmount);
  const formattedIssuedDate = formatDate(issuedDate);
  const formattedDueDate = formatDate(dueDate);

  // Generate the HTML content
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
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
      }
      .header {
        background-color: #1D3557;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .content {
        padding: 20px;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 5px 5px;
      }
      .greeting {
        margin-bottom: 20px;
      }
      .invoice-details {
        margin-bottom: 20px;
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
      }
      .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      .invoice-table th,
      .invoice-table td {
        padding: 10px;
        border: 1px solid #ddd;
        text-align: left;
      }
      .invoice-table th {
        background-color: #f5f5f5;
      }
      .total-row {
        font-weight: bold;
        background-color: #f0f0f0;
      }
      .notes {
        margin-top: 20px;
        padding: 15px;
        background-color: #f9f9f9;
        border-radius: 5px;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 12px;
        color: #777;
        text-align: center;
      }
      .signature {
        margin-top: 30px;
      }
      .company-info {
        margin-top: 15px;
      }
      .button {
        display: inline-block;
        background-color: #1D3557;
        color: white;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 5px;
        margin-top: 15px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Invoice #${invoiceNumber}</h1>
      </div>
      <div class="content">
        <div class="greeting">
          <p>Dear ${clientContactName},</p>
          ${customMessage ? `<p>${customMessage}</p>` : `<p>Please find attached your invoice #${invoiceNumber} for services provided. We appreciate your business and prompt payment.</p>`}
        </div>
        
        <div class="invoice-details">
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Issue Date:</strong> ${formattedIssuedDate}</p>
          <p><strong>Due Date:</strong> ${formattedDueDate}</p>
          <p><strong>Total Amount:</strong> ${formattedAmount}</p>
        </div>
        
        <h3>Invoice Items</h3>
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
  `;

  // Add invoice items
  items.forEach(item => {
    const itemAmount = formatCurrency(item.amount);
    
    html += `
            <tr>
              <td>${item.description}</td>
              <td>${itemAmount}</td>
            </tr>
    `;
  });

  // Add total row
  html += `
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td><strong>Total</strong></td>
              <td><strong>${formattedAmount}</strong></td>
            </tr>
          </tfoot>
        </table>
  `;

  // Add notes if provided
  if (notes) {
    html += `
        <div class="notes">
          <h4>Notes</h4>
          <p>${notes}</p>
        </div>
    `;
  }

  // Add signature and footer
  html += `
        <div class="signature">
          <p>Thank you for your business,</p>
          <p><strong>${createdBy.name}</strong></p>
          <div class="company-info">
            <p>MetaSys ERP</p>
            ${createdBy.email ? `<p>Email: <a href="mailto:${createdBy.email}">${createdBy.email}</a></p>` : ''}
            ${createdBy.phone ? `<p>Phone: ${createdBy.phone}</p>` : ''}
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated message from MetaSys ERP. Please do not reply directly to this email.</p>
          <p>If you have any questions, please contact your account manager.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  return html;
}

/**
 * Generates the HTML content for a friendly reminder invoice email
 * @param data - Invoice data
 * @returns HTML content string
 */
function generateFriendlyReminderTemplate(data: InvoiceEmailData): string {
  const {
    invoiceNumber,
    clientName,
    clientContactName,
    totalAmount,
    issuedDate,
    dueDate,
    items,
    notes,
    createdBy,
    customMessage
  } = data;

  // Format dates and amounts
  const formattedAmount = formatCurrency(totalAmount);
  const formattedIssuedDate = formatDate(issuedDate);
  const formattedDueDate = formatDate(dueDate);

  // Generate the HTML content
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
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
      }
      .header {
        background-color: #457B9D;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .content {
        padding: 20px;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 5px 5px;
      }
      .greeting {
        margin-bottom: 20px;
      }
      .reminder-box {
        background-color: #f0f7ff;
        border: 1px solid #c7e0ff;
        border-radius: 5px;
        padding: 15px;
        margin-bottom: 20px;
      }
      .invoice-details {
        margin-bottom: 20px;
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
      }
      .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      .invoice-table th,
      .invoice-table td {
        padding: 10px;
        border: 1px solid #ddd;
        text-align: left;
      }
      .invoice-table th {
        background-color: #f5f5f5;
      }
      .total-row {
        font-weight: bold;
        background-color: #f0f0f0;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 12px;
        color: #777;
        text-align: center;
      }
      .signature {
        margin-top: 30px;
      }
      .company-info {
        margin-top: 15px;
      }
      .button {
        display: inline-block;
        background-color: #457B9D;
        color: white;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 5px;
        margin-top: 15px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Friendly Payment Reminder</h1>
        <p>Invoice #${invoiceNumber}</p>
      </div>
      <div class="content">
        <div class="greeting">
          <p>Dear ${clientContactName},</p>
          ${customMessage ? `<p>${customMessage}</p>` : `<p>We hope this email finds you well. We'd like to kindly remind you about invoice #${invoiceNumber} that is due soon. We appreciate your prompt attention to this matter.</p>`}
        </div>
        
        <div class="reminder-box">
          <p><strong>Friendly Reminder:</strong> This invoice is due on ${formattedDueDate}.</p>
        </div>
        
        <div class="invoice-details">
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Issue Date:</strong> ${formattedIssuedDate}</p>
          <p><strong>Due Date:</strong> ${formattedDueDate}</p>
          <p><strong>Total Amount:</strong> ${formattedAmount}</p>
        </div>
        
        <h3>Invoice Summary</h3>
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
  `;

  // Add invoice items
  items.forEach(item => {
    const itemAmount = formatCurrency(item.amount);
    
    html += `
            <tr>
              <td>${item.description}</td>
              <td>${itemAmount}</td>
            </tr>
    `;
  });

  // Add total row
  html += `
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td><strong>Total</strong></td>
              <td><strong>${formattedAmount}</strong></td>
            </tr>
          </tfoot>
        </table>

        <p>Thank you for your attention to this matter. If you have already made the payment, please disregard this reminder.</p>
        
        <div class="signature">
          <p>Best regards,</p>
          <p><strong>${createdBy.name}</strong></p>
          <div class="company-info">
            <p>MetaSys ERP</p>
            ${createdBy.email ? `<p>Email: <a href="mailto:${createdBy.email}">${createdBy.email}</a></p>` : ''}
            ${createdBy.phone ? `<p>Phone: ${createdBy.phone}</p>` : ''}
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from MetaSys ERP. Please do not reply directly to this email.</p>
          <p>If you have any questions, please contact your account manager.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  return html;
}

/**
 * Generates the HTML content for an urgent payment invoice email
 * @param data - Invoice data
 * @returns HTML content string
 */
function generateUrgentPaymentTemplate(data: InvoiceEmailData): string {
  const {
    invoiceNumber,
    clientName,
    clientContactName,
    totalAmount,
    issuedDate,
    dueDate,
    items,
    notes,
    createdBy,
    customMessage
  } = data;

  // Format dates and amounts
  const formattedAmount = formatCurrency(totalAmount);
  const formattedIssuedDate = formatDate(issuedDate);
  const formattedDueDate = formatDate(dueDate);

  // Generate the HTML content
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
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
      }
      .header {
        background-color: #E63946;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .content {
        padding: 20px;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 5px 5px;
      }
      .greeting {
        margin-bottom: 20px;
      }
      .urgent-box {
        background-color: #ffeeee;
        border: 1px solid #ffcccc;
        border-radius: 5px;
        padding: 15px;
        margin-bottom: 20px;
        text-align: center;
      }
      .invoice-details {
        margin-bottom: 20px;
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
      }
      .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      .invoice-table th,
      .invoice-table td {
        padding: 10px;
        border: 1px solid #ddd;
        text-align: left;
      }
      .invoice-table th {
        background-color: #f5f5f5;
      }
      .total-row {
        font-weight: bold;
        background-color: #f0f0f0;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 12px;
        color: #777;
        text-align: center;
      }
      .signature {
        margin-top: 30px;
      }
      .company-info {
        margin-top: 15px;
      }
      .button {
        display: inline-block;
        background-color: #E63946;
        color: white;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 5px;
        margin-top: 15px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>URGENT: Payment Required</h1>
        <p>Invoice #${invoiceNumber}</p>
      </div>
      <div class="content">
        <div class="greeting">
          <p>Dear ${clientContactName},</p>
          ${customMessage ? `<p>${customMessage}</p>` : `<p>This is an urgent reminder regarding invoice #${invoiceNumber} which requires your immediate attention. The payment is now due or will be due very soon.</p>`}
        </div>
        
        <div class="urgent-box">
          <h2>PAYMENT DUE: ${formattedDueDate}</h2>
          <p>Please arrange for payment as soon as possible to avoid any service interruptions or late fees.</p>
        </div>
        
        <div class="invoice-details">
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Issue Date:</strong> ${formattedIssuedDate}</p>
          <p><strong>Due Date:</strong> ${formattedDueDate}</p>
          <p><strong>Total Amount:</strong> ${formattedAmount}</p>
        </div>
        
        <h3>Invoice Summary</h3>
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
  `;

  // Add invoice items
  items.forEach(item => {
    const itemAmount = formatCurrency(item.amount);
    
    html += `
            <tr>
              <td>${item.description}</td>
              <td>${itemAmount}</td>
            </tr>
    `;
  });

  // Add total row
  html += `
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td><strong>Total Due</strong></td>
              <td><strong>${formattedAmount}</strong></td>
            </tr>
          </tfoot>
        </table>

        <p>If you have already made the payment, please disregard this notice and accept our thanks.</p>
        
        <div class="signature">
          <p>Regards,</p>
          <p><strong>${createdBy.name}</strong></p>
          <div class="company-info">
            <p>MetaSys ERP</p>
            ${createdBy.email ? `<p>Email: <a href="mailto:${createdBy.email}">${createdBy.email}</a></p>` : ''}
            ${createdBy.phone ? `<p>Phone: ${createdBy.phone}</p>` : ''}
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated urgent payment notice from MetaSys ERP. Please do not reply directly to this email.</p>
          <p>If you have any questions or need to discuss payment arrangements, please contact your account manager immediately.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  return html;
}

/**
 * Generates the HTML content for an overdue notice invoice email
 * @param data - Invoice data
 * @returns HTML content string
 */
function generateOverdueNoticeTemplate(data: InvoiceEmailData): string {
  const {
    invoiceNumber,
    clientName,
    clientContactName,
    totalAmount,
    issuedDate,
    dueDate,
    items,
    notes,
    createdBy,
    customMessage
  } = data;

  // Format dates and amounts
  const formattedAmount = formatCurrency(totalAmount);
  const formattedIssuedDate = formatDate(issuedDate);
  const formattedDueDate = formatDate(dueDate);
  const daysPastDue = Math.ceil((new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 3600 * 24));

  // Generate the HTML content
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
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
      }
      .header {
        background-color: #000000;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .content {
        padding: 20px;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 5px 5px;
      }
      .greeting {
        margin-bottom: 20px;
      }
      .overdue-box {
        background-color: #000000;
        color: white;
        border-radius: 5px;
        padding: 15px;
        margin-bottom: 20px;
        text-align: center;
      }
      .invoice-details {
        margin-bottom: 20px;
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
      }
      .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      .invoice-table th,
      .invoice-table td {
        padding: 10px;
        border: 1px solid #ddd;
        text-align: left;
      }
      .invoice-table th {
        background-color: #f5f5f5;
      }
      .total-row {
        font-weight: bold;
        background-color: #f0f0f0;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 12px;
        color: #777;
        text-align: center;
      }
      .signature {
        margin-top: 30px;
      }
      .company-info {
        margin-top: 15px;
      }
      .button {
        display: inline-block;
        background-color: #000000;
        color: white;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 5px;
        margin-top: 15px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>PAYMENT OVERDUE</h1>
        <p>Invoice #${invoiceNumber}</p>
      </div>
      <div class="content">
        <div class="greeting">
          <p>Dear ${clientContactName},</p>
          ${customMessage ? `<p>${customMessage}</p>` : `<p>Despite our previous communications, we have not yet received payment for invoice #${invoiceNumber}. This payment is now overdue and requires your immediate attention.</p>`}
        </div>
        
        <div class="overdue-box">
          <h2>PAYMENT OVERDUE: ${daysPastDue} DAYS PAST DUE</h2>
          <p>Please remit payment immediately to avoid further action</p>
        </div>
        
        <div class="invoice-details">
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Issue Date:</strong> ${formattedIssuedDate}</p>
          <p><strong>Due Date:</strong> ${formattedDueDate}</p>
          <p><strong>Total Amount Due:</strong> ${formattedAmount}</p>
          <p><strong>Days Overdue:</strong> ${daysPastDue}</p>
        </div>
        
        <h3>Invoice Summary</h3>
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
  `;

  // Add invoice items
  items.forEach(item => {
    const itemAmount = formatCurrency(item.amount);
    
    html += `
            <tr>
              <td>${item.description}</td>
              <td>${itemAmount}</td>
            </tr>
    `;
  });

  // Add total row
  html += `
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td><strong>Total Overdue</strong></td>
              <td><strong>${formattedAmount}</strong></td>
            </tr>
          </tfoot>
        </table>

        <p>Please arrange for immediate payment. If you are experiencing difficulties making this payment, please contact us immediately to discuss possible payment arrangements.</p>
        
        <p>If you have already made the payment, please disregard this notice and provide us with the payment details so we can update our records.</p>
        
        <div class="signature">
          <p>Sincerely,</p>
          <p><strong>${createdBy.name}</strong></p>
          <div class="company-info">
            <p>MetaSys ERP</p>
            ${createdBy.email ? `<p>Email: <a href="mailto:${createdBy.email}">${createdBy.email}</a></p>` : ''}
            ${createdBy.phone ? `<p>Phone: ${createdBy.phone}</p>` : ''}
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated overdue notice from MetaSys ERP. Please do not reply directly to this email.</p>
          <p>If payment is not received within 7 days, further action may be taken including suspension of services and collection proceedings.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  return html;
}

/**
 * Sends an invoice email using the specified template
 * @param templateType - Type of template to use
 * @param invoiceData - Invoice data to include in the email
 * @param customMessage - Optional custom message to include
 * @returns Promise resolving to success status
 */
export async function sendInvoiceEmailWithTemplate(
  templateType: InvoiceTemplateType,
  invoiceData: InvoiceEmailData,
  customMessage?: string
): Promise<boolean> {
  // Add the custom message to the invoice data if provided
  const data = {
    ...invoiceData,
    customMessage
  };
  
  // Generate email subject based on template type
  let subject: string;
  let templateHtml: string;
  let templateText: string;
  
  // Determine which template to use and generate content
  switch (templateType) {
    case InvoiceTemplateType.FRIENDLY_REMINDER:
      subject = `Payment Reminder: Invoice #${invoiceData.invoiceNumber} - ${invoiceData.clientName}`;
      templateHtml = generateFriendlyReminderTemplate(data);
      templateText = `Dear ${invoiceData.clientContactName},\n\nThis is a friendly reminder that Invoice #${invoiceData.invoiceNumber} for ${formatCurrency(invoiceData.totalAmount)} is due on ${formatDate(invoiceData.dueDate)}. Please arrange for payment at your earliest convenience.\n\nIf you have already made the payment, please disregard this reminder.\n\nThank you for your business.\n\nBest regards,\n${invoiceData.createdBy.name}\nMetaSys ERP`;
      break;
    
    case InvoiceTemplateType.URGENT_PAYMENT:
      subject = `URGENT: Payment Required for Invoice #${invoiceData.invoiceNumber}`;
      templateHtml = generateUrgentPaymentTemplate(data);
      templateText = `Dear ${invoiceData.clientContactName},\n\nThis is an urgent reminder that Invoice #${invoiceData.invoiceNumber} for ${formatCurrency(invoiceData.totalAmount)} requires your immediate attention. The payment is due on ${formatDate(invoiceData.dueDate)}.\n\nPlease arrange for payment as soon as possible to avoid any service interruptions.\n\nThank you for your prompt attention to this matter.\n\nRegards,\n${invoiceData.createdBy.name}\nMetaSys ERP`;
      break;
    
    case InvoiceTemplateType.OVERDUE_NOTICE:
      subject = `OVERDUE: Invoice #${invoiceData.invoiceNumber} - Payment Required Immediately`;
      templateHtml = generateOverdueNoticeTemplate(data);
      templateText = `Dear ${invoiceData.clientContactName},\n\nDespite our previous communications, we have not yet received payment for Invoice #${invoiceData.invoiceNumber} for ${formatCurrency(invoiceData.totalAmount)}. This payment is now overdue.\n\nPlease arrange for immediate payment. If you are experiencing difficulties, please contact us to discuss payment arrangements.\n\nSincerely,\n${invoiceData.createdBy.name}\nMetaSys ERP`;
      break;
    
    case InvoiceTemplateType.STANDARD:
    default:
      subject = `Invoice #${invoiceData.invoiceNumber} from MetaSys ERP`;
      templateHtml = generateStandardTemplate(data);
      templateText = `Dear ${invoiceData.clientContactName},\n\nPlease find attached your invoice #${invoiceData.invoiceNumber} for ${formatCurrency(invoiceData.totalAmount)}. The payment is due on ${formatDate(invoiceData.dueDate)}.\n\nThank you for your business.\n\nSincerely,\n${invoiceData.createdBy.name}\nMetaSys ERP`;
      break;
  }
  
  // Send the email
  return sendEmail(
    invoiceData.clientEmail,
    subject,
    templateText,
    templateHtml,
    {
      fromName: "MetaSys ERP",
      fromEmail: invoiceData.createdBy.email || "noreply@metasyserp.com"
    }
  );
}