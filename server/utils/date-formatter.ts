/**
 * Utility functions for formatting dates in the server-side code
 */

/**
 * Format a Date object to a MySQL/PostgreSQL compatible datetime string (YYYY-MM-DD HH:MM:SS)
 * 
 * @param date - The Date object to format
 * @returns A database-compatible datetime string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format a Date object to a simple date string (YYYY-MM-DD)
 * 
 * @param date - The Date object to format
 * @returns A simple date string
 */
export function formatSimpleDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get the first day of the current month
 * 
 * @returns The first day of the current month as a Date object
 */
export function getFirstDayOfMonth(date?: Date): Date {
  const targetDate = date || new Date();
  return new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
}

/**
 * Get the last day of the current month
 * 
 * @returns The last day of the current month as a Date object
 */
export function getLastDayOfMonth(date?: Date): Date {
  const targetDate = date || new Date();
  return new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
}

/**
 * Get the first day of the current week (Sunday)
 * 
 * @returns The first day of the current week as a Date object
 */
export function getFirstDayOfWeek(date?: Date): Date {
  const targetDate = date || new Date();
  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = targetDate.getDate() - dayOfWeek;
  return new Date(targetDate.setDate(diff));
}

/**
 * Get the last day of the current week (Saturday)
 * 
 * @returns The last day of the current week as a Date object
 */
export function getLastDayOfWeek(date?: Date): Date {
  const firstDay = getFirstDayOfWeek(date);
  const lastDay = new Date(firstDay);
  lastDay.setDate(lastDay.getDate() + 6);
  return lastDay;
}

/**
 * Get a date from a specified number of days ago
 * 
 * @param days - The number of days to go back
 * @returns A Date object from the specified number of days ago
 */
export function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Format a date to a human-readable string (e.g., "May 8, 2025")
 * 
 * @param date - The Date object to format
 * @returns A human-readable date string
 */
export function formatReadableDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date to a relative time string (e.g., "5 minutes ago", "2 days ago")
 * 
 * @param date - The Date object to format
 * @returns A relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}