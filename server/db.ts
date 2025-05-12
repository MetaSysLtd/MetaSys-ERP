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

// Create a pg Pool for session store and direct queries
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
  statement_timeout: 30000,
  query_timeout: 30000
});

// Add health check query
pgPool.on('connect', (client) => {
  client.query('SELECT 1')
    .catch(err => {
      console.error('Error during connection health check:', err);
      client.release(true); // Release with error
    });
});

pgPool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
});

// For Drizzle ORM using postgres.js with improved connection handling
const queryClient = postgres(process.env.DATABASE_URL, { 
  max: 10,
  connect_timeout: 30,
  idle_timeout: 60,
  max_lifetime: 60 * 30, // 30 minutes
  connection_retry: true,
  connection_retry_delay: 5000,
});

// Set up an uncaughtException handler as a fallback
process.on('uncaughtException', (err) => {
  if (err.message.includes('database')) {
    console.error('Database connection error:', err);
  } else {
    throw err;
  }
});

export const db = drizzle(queryClient, { schema });
export const pool = pgPool; // Export the pg Pool for connect-pg-simple