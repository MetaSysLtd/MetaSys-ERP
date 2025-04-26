/**
 * Performs comprehensive database health check and attempts recovery for known issues
 * @returns Promise resolving to health check success status
 */
export function performDatabaseHealthCheck(): Promise<boolean>;