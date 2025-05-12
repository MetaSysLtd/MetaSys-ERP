import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import pg from 'pg';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a new pool with more conservative settings to prevent connection issues
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Reduced to prevent connection overload
  idleTimeoutMillis: 30000, // Reduced to 30 seconds
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: false, // Don't allow connections to exit on idle
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
  statement_timeout: 30000,
  query_timeout: 30000
});

// Skip the health check during connection to prevent double release
pgPool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
  // Don't crash on connection errors - let the app handle gracefully
});

// For Drizzle ORM using postgres.js with more conservative settings
const queryClient = postgres(process.env.DATABASE_URL, { 
  max: 5, // Smaller pool size for better stability
  idle_timeout: 20, // Shorter idle timeout
  max_lifetime: 60 * 10, // 10 minute max lifetime
  connect_timeout: 15, // Shorter connect timeout (15 seconds)
  // Safe configuration to prevent connection issues
  debug: true, // Enable debug logging for connection issues
});

// Global error handling for database connections
const handleDatabaseError = (err) => {
  if (err && (
    err.message.includes('database') || 
    err.message.includes('connection') ||
    err.message.includes('pool')
  )) {
    console.error('[DATABASE] Connection error:', err.message);
    return; // Don't rethrow - allow app to continue with degraded service
  }
  throw err; // Rethrow non-database errors
};

process.on('uncaughtException', handleDatabaseError);
process.on('unhandledRejection', handleDatabaseError);

export const db = drizzle(queryClient, { schema });
export const pool = pgPool; // Export the pg Pool for connect-pg-simple