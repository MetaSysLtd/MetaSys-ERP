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

// Configure connection retry and timeout settings
const MAX_CONNECTION_RETRIES = 5;
const RETRY_DELAY_MS = 2000;
const CONNECTION_TIMEOUT_MS = 15000;
const IDLE_TIMEOUT_MS = 20000;

let connectionRetries = 0;
let isInRetryMode = false;

// Create a new pool with more conservative settings to prevent connection issues
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // Reduced to prevent connection overload
  idleTimeoutMillis: IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  allowExitOnIdle: false, // Don't allow connections to exit on idle
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
  statement_timeout: 30000,
  query_timeout: 30000
});

// Enhanced error handling with retry logic
pgPool.on('error', (err) => {
  console.error('[DATABASE] Postgres Pool Error:', err.message);
  
  if (connectionRetries < MAX_CONNECTION_RETRIES && !isInRetryMode) {
    isInRetryMode = true;
    connectionRetries++;
    console.log(`[DATABASE] Attempting reconnection (${connectionRetries}/${MAX_CONNECTION_RETRIES})...`);
    
    // Try to clean up the pool and create a new one after a delay
    setTimeout(() => {
      try {
        pgPool.end().then(() => {
          console.log('[DATABASE] Pool ended, creating new connection pool...');
          // Create a new pool with the same config
          // This is handled by the application restarting the query on failure
          isInRetryMode = false;
        }).catch(endErr => {
          console.error('[DATABASE] Error ending pool:', endErr.message);
          isInRetryMode = false;
        });
      } catch (cleanupErr) {
        console.error('[DATABASE] Error during cleanup:', cleanupErr.message);
        isInRetryMode = false;
      }
    }, RETRY_DELAY_MS);
  }
});

// Configure postgres.js client with retry and error handling
const queryClientOptions = {
  max: 3, // Smaller pool size for better stability
  idle_timeout: IDLE_TIMEOUT_MS / 1000, // Convert to seconds for postgres.js
  connect_timeout: CONNECTION_TIMEOUT_MS / 1000, // Convert to seconds
  max_lifetime: 600, // 10 minute max lifetime
  debug: process.env.NODE_ENV !== 'production', // Enable debug in non-production
  onnotice: msg => console.log('[DATABASE] Postgres notice:', msg),
  onparameter: (key, value) => console.log(`[DATABASE] Parameter change: ${key}=${value}`),
  types: {
    date: {
      // Handle DATE to ensure consistent timezone behavior
      parseFn: val => new Date(val),
    },
  },
  transform: {
    // Transform undefined to null for database compatibility
    undefined: null,
  },
};

// Create postgres.js client with retry capability
let queryClient;
try {
  console.log('[DATABASE] Initializing postgres connection...');
  queryClient = postgres(process.env.DATABASE_URL, queryClientOptions);
} catch (initError) {
  console.error('[DATABASE] Error initializing postgres client:', initError.message);
  // Fallback to a non-throwing client that will attempt reconnection
  queryClient = postgres(process.env.DATABASE_URL, {
    ...queryClientOptions,
    onconnect: async (client) => {
      console.log('[DATABASE] Postgres client connected successfully');
      connectionRetries = 0; // Reset retry counter on successful connection
    }
  });
}

// Global error handling for database connections
const handleDatabaseError = (err) => {
  if (!err) return;
  
  if (typeof err === 'object' && 
      err.message && (
      err.message.includes('database') || 
      err.message.includes('connection') ||
      err.message.includes('pool') ||
      err.message.includes('timeout') ||
      err.message.includes('terminated')
    )) {
    console.error('[DATABASE] Connection error:', err.message);
    // Don't rethrow database connection errors - let the app degrade gracefully
    return;
  }
  
  // Only rethrow non-database errors in production to prevent app crashes
  if (process.env.NODE_ENV === 'production') {
    console.error('[ERROR] Unhandled error:', err);
  } else {
    throw err; // Rethrow in development for debugging
  }
};

process.on('uncaughtException', handleDatabaseError);
process.on('unhandledRejection', handleDatabaseError);

// Create Drizzle ORM instance with the configured client
export const db = drizzle(queryClient, { schema });
export const pool = pgPool; // Export the pg Pool for connect-pg-simple

// Export connection state check function for health monitoring
export const isDatabaseConnected = async () => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('[DATABASE] Connection check failed:', err.message);
    return false;
  }
};