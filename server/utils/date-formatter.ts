/**
 * Utility functions for handling date formatting and date range calculations
 * Used primarily by the CRM Dashboard for consistent date handling
 */

/**
 * Get the start and end date for today
 * @returns {Object} Object with startDate and endDate strings in ISO format
 */
export function getTodayRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const endDate = new Date(new Date(now).setHours(23, 59, 59, 999)).toISOString();
  
  return { startDate, endDate };
}

/**
 * Get the start and end date for current week
 * @returns {Object} Object with startDate and endDate strings in ISO format
 */
export function getCurrentWeekRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate start of week (Sunday)
  const startDay = new Date(now);
  startDay.setDate(now.getDate() - currentDay);
  startDay.setHours(0, 0, 0, 0);
  
  // Calculate end of week (Saturday)
  const endDay = new Date(now);
  endDay.setDate(now.getDate() + (6 - currentDay));
  endDay.setHours(23, 59, 59, 999);
  
  return { 
    startDate: startDay.toISOString(), 
    endDate: endDay.toISOString() 
  };
}

/**
 * Get the start and end date for current month
 * @returns {Object} Object with startDate and endDate strings in ISO format
 */
export function getCurrentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  
  // First day of current month
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  startDate.setHours(0, 0, 0, 0);
  
  // Last day of current month
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endDate.setHours(23, 59, 59, 999);
  
  return { 
    startDate: startDate.toISOString(), 
    endDate: endDate.toISOString() 
  };
}

/**
 * Get the start and end date for current quarter
 * @returns {Object} Object with startDate and endDate strings in ISO format
 */
export function getCurrentQuarterRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3);
  
  // First day of current quarter
  const startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
  startDate.setHours(0, 0, 0, 0);
  
  // Last day of current quarter
  const endDate = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0);
  endDate.setHours(23, 59, 59, 999);
  
  return { 
    startDate: startDate.toISOString(), 
    endDate: endDate.toISOString() 
  };
}

/**
 * Get date range based on timeframe string
 * @param {string} timeframe - One of 'day', 'week', 'month', or 'quarter'
 * @returns {Object} Object with startDate and endDate strings in ISO format
 */
export function getDateRangeByTimeframe(timeframe: string): { startDate: string; endDate: string } {
  switch (timeframe.toLowerCase()) {
    case 'day':
      return getTodayRange();
    case 'week':
      return getCurrentWeekRange();
    case 'month':
      return getCurrentMonthRange();
    case 'quarter':
      return getCurrentQuarterRange();
    default:
      return getTodayRange(); // Default to today if invalid timeframe
  }
}

/**
 * Format a date in YYYY-MM format for use with commission data
 * @param {Date} date - The date to format
 * @returns {string} Date in YYYY-MM format
 */
export function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get current month in YYYY-MM format
 * @returns {string} Current month in YYYY-MM format
 */
export function getCurrentYearMonth(): string {
  return formatYearMonth(new Date());
}