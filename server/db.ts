import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// For Drizzle ORM using postgres.js
const queryClient = postgres(process.env.DATABASE_URL, { 
  max: 10,
  connect_timeout: 10,
});

// Cannot use .on directly with postgres.js
// Set up an uncaughtException handler as a fallback
process.on('uncaughtException', (err) => {
  if (err.message.includes('database')) {
    console.error('Database connection error:', err);
  } else {
    throw err;
  }
});

export const db = drizzle(queryClient, { schema });
export const pool = queryClient;