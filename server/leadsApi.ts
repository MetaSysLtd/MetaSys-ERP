// Modified API call for leads to handle fields that may not exist in all rows
import { db } from './db';
import { leads } from '../shared/schema';
import { sql } from 'drizzle-orm';

// Get all leads with a more robust query that handles potential missing columns
export async function getAllLeads() {
  // Using a safer SQL approach that accounts for potential schema issues
  const result = await db.execute(sql`
    SELECT 
      id, company_name, mc_number, dot_number, equipment_type, 
      truck_category, factoring_status, service_charges, contact_name, 
      phone_number, email, status, assigned_to, org_id,
      notes, created_at, updated_at, created_by, source,
      COALESCE(forms_sent, 0) as forms_sent,
      COALESCE(forms_completed, 0) as forms_completed,
      COALESCE(call_attempts, 0) as call_attempts,
      qualification_score, validation_status,
      last_contacted_at, first_contact_at,
      in_progress_at, hand_to_dispatch_at, activated_at
    FROM leads
  `);
  
  return result;
}

// Get a single lead by ID
export async function getLeadById(id: number) {
  const [lead] = await db.execute(sql`
    SELECT 
      id, company_name, mc_number, dot_number, equipment_type, 
      truck_category, factoring_status, service_charges, contact_name, 
      phone_number, email, status, assigned_to, org_id,
      notes, created_at, updated_at, created_by, source,
      COALESCE(forms_sent, 0) as forms_sent,
      COALESCE(forms_completed, 0) as forms_completed,
      COALESCE(call_attempts, 0) as call_attempts,
      qualification_score, validation_status,
      last_contacted_at, first_contact_at,
      in_progress_at, hand_to_dispatch_at, activated_at
    FROM leads
    WHERE id = ${id}
  `);
  
  return lead;
}

// Get leads by status
export async function getLeadsByStatus(status: string) {
  const result = await db.execute(sql`
    SELECT 
      id, company_name, mc_number, dot_number, equipment_type, 
      truck_category, factoring_status, service_charges, contact_name, 
      phone_number, email, status, assigned_to, org_id,
      notes, created_at, updated_at, created_by, source,
      COALESCE(forms_sent, 0) as forms_sent,
      COALESCE(forms_completed, 0) as forms_completed,
      COALESCE(call_attempts, 0) as call_attempts,
      qualification_score, validation_status,
      last_contacted_at, first_contact_at,
      in_progress_at, hand_to_dispatch_at, activated_at
    FROM leads
    WHERE status = ${status}
  `);
  
  return result;
}

// Get leads by assignee
export async function getLeadsByAssignee(userId: number) {
  const result = await db.execute(sql`
    SELECT 
      id, company_name, mc_number, dot_number, equipment_type, 
      truck_category, factoring_status, service_charges, contact_name, 
      phone_number, email, status, assigned_to, org_id,
      notes, created_at, updated_at, created_by, source,
      COALESCE(forms_sent, 0) as forms_sent,
      COALESCE(forms_completed, 0) as forms_completed,
      COALESCE(call_attempts, 0) as call_attempts,
      qualification_score, validation_status,
      last_contacted_at, first_contact_at,
      in_progress_at, hand_to_dispatch_at, activated_at
    FROM leads
    WHERE assigned_to = ${userId}
  `);
  
  return result;
}