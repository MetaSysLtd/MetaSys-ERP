/**
 * Format a date object into a string using the specified format
 * @param date - The date to format
 * @param format - The format string (e.g., "YYYY-MM-DD", "MMM D, YYYY")
 * @returns Formatted date string
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Month names
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Day names
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return format
    .replace(/YYYY/g, year.toString())
    .replace(/YY/g, year.toString().slice(-2))
    .replace(/MMMM/g, monthNames[month])
    .replace(/MMM/g, shortMonthNames[month])
    .replace(/MM/g, (month + 1).toString().padStart(2, '0'))
    .replace(/M/g, (month + 1).toString())
    .replace(/DDDD/g, dayNames[date.getDay()])
    .replace(/DDD/g, shortDayNames[date.getDay()])
    .replace(/DD/g, day.toString().padStart(2, '0'))
    .replace(/D/g, day.toString())
    .replace(/HH/g, hours.toString().padStart(2, '0'))
    .replace(/H/g, hours.toString())
    .replace(/hh/g, (hours % 12 || 12).toString().padStart(2, '0'))
    .replace(/h/g, (hours % 12 || 12).toString())
    .replace(/mm/g, minutes.toString().padStart(2, '0'))
    .replace(/m/g, minutes.toString())
    .replace(/ss/g, seconds.toString().padStart(2, '0'))
    .replace(/s/g, seconds.toString())
    .replace(/a/g, hours >= 12 ? 'pm' : 'am')
    .replace(/A/g, hours >= 12 ? 'PM' : 'AM');
}

/**
 * Format a number as currency
 * @param amount - The number to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale to use (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with thousands separators
 * @param number - The number to format
 * @param locale - Locale to use (default: 'en-US')
 * @returns Formatted number string
 */
export function formatNumber(number: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(number);
}

/**
 * Format a percentage
 * @param value - The decimal value (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places to include (default: 0)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a date to a relative time string (e.g., "2 days ago")
 * @param date - The date to format
 * @returns Human-readable relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSecs < 60) {
    return 'just now';
  } else if (diffInMins < 60) {
    return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return formatDate(date, 'MMM D, YYYY');
  }
}

/**
 * Format a date range as a string
 * @param startDate - The start date
 * @param endDate - The end date
 * @param format - Format for individual dates (default: 'MMM D, YYYY')
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: Date, endDate: Date, format = 'MMM D, YYYY'): string {
  if (!startDate || !endDate) return '';
  
  const start = formatDate(startDate, format);
  const end = formatDate(endDate, format);
  
  return `${start} - ${end}`;
}

/**
 * Format a phone number to a standard format
 * @param phone - The phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  }
  
  // Return original if not a standard format
  return phone;
}