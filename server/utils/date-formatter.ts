/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Format a date to a standard string format
 * @param date - The date to format
 * @param format - The format to use (default: 'YYYY-MM-DD')
 * @returns Formatted date string
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * Get the start of the current week (Sunday)
 * @param date - The reference date
 * @returns Date object set to the beginning of the week
 */
export function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = date.getDay();
  result.setDate(date.getDate() - day); // Set to Sunday
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of the current week (Saturday)
 * @param date - The reference date
 * @returns Date object set to the end of the week
 */
export function getEndOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = date.getDay();
  result.setDate(date.getDate() + (6 - day)); // Set to Saturday
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get the start of the current month
 * @param date - The reference date
 * @returns Date object set to the beginning of the month
 */
export function getStartOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of the current month
 * @param date - The reference date
 * @returns Date object set to the end of the month
 */
export function getEndOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get the start of the current quarter
 * @param date - The reference date
 * @returns Date object set to the beginning of the quarter
 */
export function getStartOfQuarter(date: Date): Date {
  const result = new Date(date);
  const currentMonth = date.getMonth();
  const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
  result.setMonth(quarterStartMonth);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get an array of month names
 * @param short - Whether to return short month names
 * @returns Array of month names
 */
export function getMonthNames(short: boolean = false): string[] {
  if (short) {
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  }
  return [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
}

/**
 * Get formatted date ranges for reports
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Object with formatted date ranges
 */
export function getFormattedDateRange(startDate: Date, endDate: Date): {
  displayRange: string;
  sqlRange: { start: string; end: string };
} {
  const start = formatDate(startDate, 'MMM DD, YYYY');
  const end = formatDate(endDate, 'MMM DD, YYYY');
  
  return {
    displayRange: `${start} - ${end}`,
    sqlRange: {
      start: formatDate(startDate, 'YYYY-MM-DD'),
      end: formatDate(endDate, 'YYYY-MM-DD')
    }
  };
}

/**
 * Get date for "N" days ago
 * @param days - Number of days ago
 * @returns Date object set to N days ago
 */
export function getDaysAgo(days: number): Date {
  const result = new Date();
  result.setDate(result.getDate() - days);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Compare two dates to see if they're the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Boolean indicating if the dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Format a date to a human-readable relative string (e.g. "2 days ago")
 * @param date - The date to format
 * @returns Human-readable relative date string
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  } else if (diffInHours > 0) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  } else if (diffInMinutes > 0) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
}