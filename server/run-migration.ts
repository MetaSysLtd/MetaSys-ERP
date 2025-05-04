import { pool } from './db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run a migration file
async function runMigration(filename: string) {
  console.log(`Running migration: ${filename}`);
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(
      path.join(__dirname, 'migrations', filename),
      'utf8'
    );
    
    // Execute the SQL
    await pool.query(sqlContent);
    console.log(`✅ Migration ${filename} executed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error executing migration ${filename}:`, error);
    return false;
  }
}

// Main function to run all migrations
async function runMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // Run specific migrations
    await runMigration('add_missing_columns.sql');
    await runMigration('fix_lead_columns.sql');
    await runMigration('fix_form_templates.sql');
    
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration process failed:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migrations
runMigrations().catch(console.error);