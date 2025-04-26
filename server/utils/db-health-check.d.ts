/**
 * Type declaration for the database health check utility
 */

/**
 * Performs a comprehensive database sanity check and attempts to fix common issues
 * @returns Promise resolving to true if the health check was successful or false if it failed
 */
export function performDatabaseHealthCheck(): Promise<boolean>;