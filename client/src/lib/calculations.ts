/**
 * Calculate the percentage change between two values
 * @param current - The current value
 * @param previous - The previous value
 * @returns The percentage change (positive for increase, negative for decrease)
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate the trend change and determine if it's increasing, decreasing, or stable
 * @param current - The current value
 * @param previous - The previous value
 * @param thresholdPercent - The percentage threshold to consider a change significant (default: 2%)
 * @returns Object with the change direction and percentage
 */
export function calculateTrendChange(
  current: number, 
  previous: number, 
  thresholdPercent: number = 2
): { direction: 'up' | 'down' | 'stable'; percentChange: number } {
  const percentChange = calculatePercentageChange(current, previous);
  
  // Determine direction based on the threshold
  let direction: 'up' | 'down' | 'stable' = 'stable';
  
  if (percentChange > thresholdPercent) {
    direction = 'up';
  } else if (percentChange < -thresholdPercent) {
    direction = 'down';
  }
  
  return { direction, percentChange };
}

/**
 * Calculate the average value of an array of numbers
 * @param values - Array of numeric values
 * @returns The average value or 0 if empty array
 */
export function calculateAverage(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((total, val) => total + val, 0);
  return sum / values.length;
}

/**
 * Calculate the median value of an array of numbers
 * @param values - Array of numeric values
 * @returns The median value or 0 if empty array
 */
export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) return 0;
  
  // Sort the values
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  // If the array has an odd number of elements, return the middle element
  // Otherwise, return the average of the two middle elements
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  } else {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
}

/**
 * Calculate the conversion rate
 * @param conversions - Number of successful conversions
 * @param total - Total number of opportunities
 * @returns The conversion rate as a decimal between 0 and 1
 */
export function calculateConversionRate(conversions: number, total: number): number {
  if (total === 0) return 0;
  return conversions / total;
}

/**
 * Calculate the growth rate over a period
 * @param current - Current period value
 * @param previous - Previous period value
 * @param periodsCount - Number of periods (for annualized calculations)
 * @returns The growth rate as a decimal
 */
export function calculateGrowthRate(
  current: number, 
  previous: number, 
  periodsCount: number = 1
): number {
  if (previous === 0) return current > 0 ? 1 : 0;
  
  // Simple growth rate for a single period
  if (periodsCount === 1) {
    return (current - previous) / previous;
  }
  
  // Compound annual growth rate (CAGR) formula
  return Math.pow((current / previous), (1 / periodsCount)) - 1;
}