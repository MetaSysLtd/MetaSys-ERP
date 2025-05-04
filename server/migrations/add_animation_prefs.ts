import { sql } from "drizzle-orm";
import { db } from "../db";

/**
 * Migration to add animation preference columns to the ui_preferences table
 */
async function main() {
  console.log("Running migration: add animation preference columns to ui_preferences table");
  
  try {
    // Add columns directly using IF NOT EXISTS
    const columns = [
      { name: 'animations_enabled', sql: sql`ALTER TABLE ui_preferences ADD COLUMN IF NOT EXISTS animations_enabled BOOLEAN NOT NULL DEFAULT true` },
      { name: 'transition_speed', sql: sql`ALTER TABLE ui_preferences ADD COLUMN IF NOT EXISTS transition_speed TEXT NOT NULL DEFAULT 'normal'` },
      { name: 'page_transition', sql: sql`ALTER TABLE ui_preferences ADD COLUMN IF NOT EXISTS page_transition TEXT NOT NULL DEFAULT 'gradient'` },
      { name: 'reduced_motion', sql: sql`ALTER TABLE ui_preferences ADD COLUMN IF NOT EXISTS reduced_motion BOOLEAN NOT NULL DEFAULT false` },
      { name: 'theme', sql: sql`ALTER TABLE ui_preferences ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'light'` }
    ];
    
    for (const column of columns) {
      console.log(`Adding column ${column.name} to ui_preferences table (if not exists)`);
      await db.execute(column.sql);
    }
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Execute migration
main().catch(console.error);