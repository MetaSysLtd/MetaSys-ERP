import { format } from "date-fns";

/**
 * Format a number as currency (USD)
 * @param value Number to format
 * @param locale Locale to use for formatting (default: "en-US")
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/**
 * Format a number as a percentage
 * @param value Number to format (e.g. 0.75 for 75%)
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a date using date-fns
 * @param date Date to format
 * @param formatStr Format string (default: "MMM d, yyyy")
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, formatStr = "MMM d, yyyy"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Format a number with thousand separators
 * @param value Number to format
 * @param locale Locale to use for formatting (default: "en-US")
 * @returns Formatted number string
 */
export function formatNumber(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a duration in seconds to a human readable string (e.g. "2h 30m")
 * @param seconds Duration in seconds
 * @param verbose Whether to include all units or just the two most significant
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number, verbose = false): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return verbose ? `${minutes}m ${seconds % 60}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return verbose 
      ? `${hours}h ${minutes % 60}m ${seconds % 60}s` 
      : `${hours}h ${minutes % 60}m`;
  }

  const days = Math.floor(hours / 24);
  return verbose 
    ? `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s` 
    : `${days}d ${hours % 24}h`;
}

/**
 * Truncate a string to a maximum length and add ellipsis if needed
 * @param str String to truncate
 * @param maxLength Maximum length (default: 50)
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength = 50): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - 3)}...`;
}

/**
 * Format a phone number to a standard format (e.g. "(123) 456-7890")
 * @param phoneNumber Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");
  
  // Check if the input is of correct length
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phoneNumber;
}