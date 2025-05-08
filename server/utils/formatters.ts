/**
 * Server-side formatters for data manipulation
 */

/**
 * Format a date to a friendly readable format
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(d);
}

/**
 * Format a date to show time as well
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(d);
}

/**
 * Format a number as currency with dollar sign and proper commas
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format a number with commas for thousands
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * Format a decimal as a percentage with specified decimal places
 */
export function formatPercent(value: number, decimalPlaces: number = 1): string {
  return `${(value * 100).toFixed(decimalPlaces)}%`;
}

/**
 * Format a date to ISO string with only the date portion (YYYY-MM-DD)
 */
export function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get the first day of the month for a given date
 */
export function firstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of the month for a given date
 */
export function lastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get the first day of the quarter for a given date
 */
export function firstDayOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1);
}

/**
 * Get the last day of the quarter for a given date
 */
export function lastDayOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3 + 3, 0);
}

/**
 * Get the first day of the year for a given date
 */
export function firstDayOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

/**
 * Get the last day of the year for a given date
 */
export function lastDayOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31);
}

/**
 * Get a list of month names
 */
export function getMonthNames(short: boolean = false): string[] {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return short ? months.map(month => month.substring(0, 3)) : months;
}

/**
 * Format a date to just the month name
 */
export function formatMonthName(date: Date, short: boolean = false): string {
  const monthNames = getMonthNames(short);
  return monthNames[date.getMonth()];
}