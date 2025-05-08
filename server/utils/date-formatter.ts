/**
 * Utility functions for date formatting and range calculations.
 */

// Get the start and end dates for a given timeframe
export function getDateRangeByTimeframe(timeframe: string): { startDate: string; endDate: string } {
  const now = new Date();
  let startDate = new Date();
  const endDate = new Date();
  
  // Set time to end of day for endDate
  endDate.setHours(23, 59, 59, 999);
  
  // Set time to start of day for startDate
  startDate.setHours(0, 0, 0, 0);
  
  switch (timeframe) {
    case 'day':
      // For today, startDate is already set to start of today
      break;
      
    case 'week':
      // For this week, go back to Monday (or 7 days if week starts on Sunday)
      const dayOfWeek = startDate.getDay(); // 0 is Sunday, 1 is Monday
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days, otherwise go back to Monday
      startDate.setDate(startDate.getDate() - diffToMonday);
      break;
      
    case 'month':
      // For this month, go back to the 1st day of the month
      startDate.setDate(1);
      break;
      
    case 'quarter':
      // For this quarter, determine the quarter and set to the first day of the quarter
      const currentMonth = startDate.getMonth(); // 0-11
      const currentQuarter = Math.floor(currentMonth / 3); // 0-3
      startDate.setMonth(currentQuarter * 3, 1); // Set to first day of the quarter
      break;
      
    case 'year':
      // For this year, go back to January 1st
      startDate.setMonth(0, 1);
      break;
      
    default:
      // Default to last 30 days
      startDate.setDate(startDate.getDate() - 30);
  }
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}

// Get the start and end dates for the current month
export function getCurrentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}

// Format a date to YYYY-MM
export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  // Month is 0-indexed, so add 1 and pad with leading 0 if needed
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  return `${year}-${month}`;
}

// Get the month name from a date
export function getMonthName(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('default', { month: 'long' });
}

// Format a date string to human-readable format
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format a date range to human-readable format
export function formatDateRange(startDateStr: string, endDateStr: string): string {
  const startDate = formatDate(startDateStr);
  const endDate = formatDate(endDateStr);
  return `${startDate} - ${endDate}`;
}

// Get the first day of the current week
export function getFirstDayOfWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days, otherwise go back to Monday
  const firstDay = new Date(now);
  firstDay.setDate(now.getDate() - diff);
  firstDay.setHours(0, 0, 0, 0);
  return firstDay;
}

// Get the last day of the current week
export function getLastDayOfWeek(): Date {
  const firstDay = getFirstDayOfWeek();
  const lastDay = new Date(firstDay);
  lastDay.setDate(firstDay.getDate() + 6);
  lastDay.setHours(23, 59, 59, 999);
  return lastDay;
}

// Get the previous month's range
export function getPreviousMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  // First day of previous month
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // Last day of previous month
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
  endDate.setHours(23, 59, 59, 999);
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}

// Generate date labels for a line chart over time periods
export function generateDateLabels(timeframe: string, count: number = 6): string[] {
  const labels: string[] = [];
  const now = new Date();
  
  switch (timeframe) {
    case 'day':
      // Hours of the day
      for (let i = 0; i < count; i++) {
        const hour = (Math.floor(now.getHours() / (24 / count)) * (24 / count) + i * (24 / count)) % 24;
        labels.push(`${hour}:00`);
      }
      break;
      
    case 'week':
      // Days of the week
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = now.getDay(); // 0 is Sunday, 1 is Monday
      const adjustedToday = today === 0 ? 6 : today - 1; // Convert to 0 = Monday
      
      for (let i = 0; i < 7; i++) {
        // Wrap around for days beyond Saturday
        const dayIndex = (adjustedToday + i) % 7;
        labels.push(dayNames[dayIndex]);
      }
      break;
      
    case 'month':
      // Days of the month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const step = Math.ceil(daysInMonth / count);
      
      for (let i = 1; i <= daysInMonth; i += step) {
        labels.push(`${i}`);
        if (labels.length >= count) break;
      }
      break;
      
    case 'quarter':
      // Months in the quarter
      const currentMonth = now.getMonth(); // 0-11
      const currentQuarter = Math.floor(currentMonth / 3); // 0-3
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 0; i < 3; i++) {
        const monthIndex = currentQuarter * 3 + i;
        labels.push(monthNames[monthIndex]);
      }
      break;
      
    case 'year':
      // Months of the year
      const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        labels.push(monthNamesShort[i]);
      }
      break;
      
    default:
      // Default to last 30 days with weekly intervals
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i * 5);
        labels.push(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      }
  }
  
  return labels;
}

// Format a number with commas for thousands
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format a currency value
export function formatCurrency(value: number): string {
  return `$${formatNumber(Math.round(value))}`;
}

// Format a percentage value
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}