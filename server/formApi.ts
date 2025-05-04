// API functions for form templates and submissions with robust error handling
import { db } from './db';
import { formTemplates, formSubmissions } from '../shared/schema';
import { sql } from 'drizzle-orm';

// Get all form templates with error handling for schema inconsistencies
export async function getAllFormTemplates() {
  try {
    // Using a safer SQL approach that handles potential schema issues
    const result = await db.execute(sql`
      SELECT 
        id, name, description, fields, created_at, updated_at, 
        COALESCE(category, 'general') as category,
        COALESCE(lead_type, 'carrier') as lead_type,
        COALESCE(is_active, true) as is_active,
        COALESCE(sort_order, 0) as sort_order
      FROM form_templates
      ORDER BY sort_order ASC, name ASC
    `);
    
    return result;
  } catch (error) {
    console.error("Error fetching form templates:", error);
    // Return a safe fallback
    return [];
  }
}

// Get form template by ID with error handling
export async function getFormTemplateById(id: number) {
  try {
    const [template] = await db.execute(sql`
      SELECT 
        id, name, description, fields, created_at, updated_at, 
        COALESCE(category, 'general') as category,
        COALESCE(lead_type, 'carrier') as lead_type,
        COALESCE(is_active, true) as is_active,
        COALESCE(sort_order, 0) as sort_order
      FROM form_templates
      WHERE id = ${id}
    `);
    
    return template;
  } catch (error) {
    console.error(`Error fetching form template ID ${id}:`, error);
    return null;
  }
}

// Get forms by lead type
export async function getFormTemplatesByLeadType(leadType: string) {
  try {
    const result = await db.execute(sql`
      SELECT 
        id, name, description, fields, created_at, updated_at, 
        COALESCE(category, 'general') as category,
        COALESCE(lead_type, 'carrier') as lead_type,
        COALESCE(is_active, true) as is_active,
        COALESCE(sort_order, 0) as sort_order
      FROM form_templates
      WHERE lead_type = ${leadType} OR lead_type IS NULL
      ORDER BY sort_order ASC, name ASC
    `);
    
    return result;
  } catch (error) {
    console.error(`Error fetching form templates for lead type ${leadType}:`, error);
    return [];
  }
}

// Get all form submissions
export async function getAllFormSubmissions() {
  try {
    const result = await db.execute(sql`
      SELECT 
        id, lead_id, template_id, submitted_by, data, 
        created_at, updated_at, status,
        COALESCE(completed_at, NULL) as completed_at,
        COALESCE(validated_by, NULL) as validated_by,
        COALESCE(qualification_result, NULL) as qualification_result
      FROM form_submissions
    `);
    
    return result;
  } catch (error) {
    console.error("Error fetching form submissions:", error);
    return [];
  }
}

// Get form submissions by lead ID
export async function getFormSubmissionsByLeadId(leadId: number) {
  try {
    const result = await db.execute(sql`
      SELECT 
        id, lead_id, template_id, submitted_by, data, 
        created_at, updated_at, status,
        COALESCE(completed_at, NULL) as completed_at,
        COALESCE(validated_by, NULL) as validated_by,
        COALESCE(qualification_result, NULL) as qualification_result
      FROM form_submissions
      WHERE lead_id = ${leadId}
    `);
    
    return result;
  } catch (error) {
    console.error(`Error fetching form submissions for lead ID ${leadId}:`, error);
    return [];
  }
}

// Get form submission by ID
export async function getFormSubmissionById(id: number) {
  try {
    const [submission] = await db.execute(sql`
      SELECT 
        id, lead_id, template_id, submitted_by, data, 
        created_at, updated_at, status,
        COALESCE(completed_at, NULL) as completed_at,
        COALESCE(validated_by, NULL) as validated_by,
        COALESCE(qualification_result, NULL) as qualification_result
      FROM form_submissions
      WHERE id = ${id}
    `);
    
    return submission;
  } catch (error) {
    console.error(`Error fetching form submission ID ${id}:`, error);
    return null;
  }
}