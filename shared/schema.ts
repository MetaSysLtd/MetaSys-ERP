import { pgTable, text, serial, integer, boolean, date, timestamp, real, jsonb, pgEnum, index, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Clock event types enum
export const clockEventTypeEnum = pgEnum('clock_event_type', ['IN', 'OUT']);

// Bug reporting enum
export const bugUrgencyEnum = pgEnum('bug_urgency', ['Low', 'Medium', 'High']);

// CRM Lead enums
export const leadSourceEnum = pgEnum('lead_source', ['SQL', 'MQL', 'Website', 'Referral', 'Cold Call', 'Event', 'Partner', 'Other']);
export const leadStatusEnum = pgEnum('lead_status', ['New', 'InProgress', 'FollowUp', 'HandToDispatch', 'Active', 'Lost']);
export const callOutcomeEnum = pgEnum('call_outcome', ['Answered', 'Voicemail', 'No Answer', 'Wrong Number', 'Not Interested', 'Interested', 'Follow Up', 'Booked']);
export const leadScoreEnum = pgEnum('lead_score', ['Low', 'Medium', 'High', 'Very High']);
export const leadValidationStatusEnum = pgEnum('lead_validation_status', ['Valid', 'Invalid', 'Pending']);
export const formStatusEnum = pgEnum('form_status', ['Sent', 'Viewed', 'Completed', 'Expired']);

// HR Hiring & Onboarding enums
export const hiringCandidateStatusEnum = pgEnum('hiring_candidate_status', ['applied', 'screening', 'interviewed', 'offered', 'onboarded']);
export const documentStatusEnum = pgEnum('document_status', ['uploaded', 'missing', 'awaiting_verification']);
export const probationStatusEnum = pgEnum('probation_status', ['pending', 'in_progress', 'completed', 'extended', 'terminated']);
export const probationRecommendationEnum = pgEnum('probation_recommendation', ['confirm', 'extend', 'terminate']);
export const exitStatusEnum = pgEnum('exit_status', ['pending', 'in_progress', 'completed']);
export const documentTypeEnum = pgEnum('document_type', ['offer_letter', 'nda', 'non_compete', 'background_check', 'cnic', 'education_certificate', 'bank_details', 'police_verification', 'experience_letter', 'probation_form']);

// HR Hiring & Onboarding tables
export const hiringCandidates = pgTable("hiring_candidates", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  appliedFor: text("applied_for").notNull(), // Position: "Sales Executive", "Dispatch Coordinator", etc.
  status: hiringCandidateStatusEnum("status").notNull().default("applied"),
  documentsReceived: boolean("documents_received").notNull().default(false),
  backgroundCheckPassed: boolean("background_check_passed").notNull().default(false),
  offerLetterSent: boolean("offer_letter_sent").notNull().default(false),
  notes: text("notes"),
  cvLink: text("cv_link"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
}, (table) => {
  return {
    orgIdIdx: index("hiring_candidates_org_id_idx").on(table.orgId),
    statusIdx: index("hiring_candidates_status_idx").on(table.status),
    createdAtIdx: index("hiring_candidates_created_at_idx").on(table.createdAt),
  };
});

export const candidateDocuments = pgTable("candidate_documents", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull().references(() => hiringCandidates.id),
  documentType: documentTypeEnum("document_type").notNull(),
  documentUrl: text("document_url").notNull(),
  status: documentStatusEnum("status").notNull().default("awaiting_verification"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => users.id),
  notes: text("notes"),
}, (table) => {
  return {
    candidateIdIdx: index("candidate_documents_candidate_id_idx").on(table.candidateId),
    documentTypeIdx: index("candidate_documents_document_type_idx").on(table.documentType),
    statusIdx: index("candidate_documents_status_idx").on(table.status),
  };
});

export const hiringTemplates = pgTable("hiring_templates", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  templateType: documentTypeEnum("template_type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isDefault: boolean("is_default").notNull().default(false),
}, (table) => {
  return {
    orgIdIdx: index("hiring_templates_org_id_idx").on(table.orgId),
    templateTypeIdx: index("hiring_templates_template_type_idx").on(table.templateType),
  };
});

export const probationSchedules = pgTable("probation_schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  status: probationStatusEnum("status").notNull().default("pending"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  checkpoint45Day: timestamp("checkpoint_45_day"),
  checkpoint45Complete: boolean("checkpoint_45_complete").notNull().default(false),
  checkpoint90Day: timestamp("checkpoint_90_day"),
  checkpoint90Complete: boolean("checkpoint_90_complete").notNull().default(false),
  managerNotes: text("manager_notes"),
  recommendation: probationRecommendationEnum("recommendation"),
  assignedManagerId: integer("assigned_manager_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("probation_schedules_user_id_idx").on(table.userId),
    orgIdIdx: index("probation_schedules_org_id_idx").on(table.orgId),
    statusIdx: index("probation_schedules_status_idx").on(table.status),
    managerIdIdx: index("probation_schedules_manager_id_idx").on(table.assignedManagerId),
  };
});

export const probationEvaluations = pgTable("probation_evaluations", {
  id: serial("id").primaryKey(),
  probationId: integer("probation_id").notNull().references(() => probationSchedules.id),
  evaluationType: text("evaluation_type").notNull(), // "45-day" or "90-day"
  performanceRating: integer("performance_rating").notNull(), // 1-5 scale
  teamworkRating: integer("teamwork_rating").notNull(), // 1-5 scale
  confidentialityRating: integer("confidentiality_rating").notNull(), // 1-5 scale
  overallRating: integer("overall_rating").notNull(), // 1-5 scale
  strengths: text("strengths"),
  areasForImprovement: text("areas_for_improvement"),
  recommendation: probationRecommendationEnum("recommendation").notNull(),
  evaluatedBy: integer("evaluated_by").notNull().references(() => users.id),
  evaluatedAt: timestamp("evaluated_at").notNull().defaultNow(),
  acknowledgedBy: integer("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  comments: text("comments"),
}, (table) => {
  return {
    probationIdIdx: index("probation_evaluations_probation_id_idx").on(table.probationId),
    evaluationTypeIdx: index("probation_evaluations_evaluation_type_idx").on(table.evaluationType),
    recommendationIdx: index("probation_evaluations_recommendation_idx").on(table.recommendation),
  };
});

export const exitRequests = pgTable("exit_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  requestDate: timestamp("request_date").notNull().defaultNow(),
  exitDate: timestamp("exit_date").notNull(),
  reason: text("reason").notNull(),
  status: exitStatusEnum("status").notNull().default("pending"),
  assignedTo: integer("assigned_to").notNull().references(() => users.id),
  assetsReturned: boolean("assets_returned").notNull().default(false),
  systemAccessRevoked: boolean("system_access_revoked").notNull().default(false),
  finalSalaryClearance: boolean("final_salary_clearance").notNull().default(false),
  experienceLetterIssued: boolean("experience_letter_issued").notNull().default(false),
  exitInterviewNotes: text("exit_interview_notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("exit_requests_user_id_idx").on(table.userId),
    orgIdIdx: index("exit_requests_org_id_idx").on(table.orgId),
    statusIdx: index("exit_requests_status_idx").on(table.status),
    assignedToIdx: index("exit_requests_assigned_to_idx").on(table.assignedTo),
  };
});

export const companyDocuments = pgTable("company_documents", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "policy", "contract_template", "form", "legal"
  documentUrl: text("document_url").notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
}, (table) => {
  return {
    orgIdIdx: index("company_documents_org_id_idx").on(table.orgId),
    categoryIdx: index("company_documents_category_idx").on(table.category),
  };
});

// Insert schemas for HR tables
export const insertHiringCandidateSchema = createInsertSchema(hiringCandidates).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertCandidateDocumentSchema = createInsertSchema(candidateDocuments).omit({ 
  id: true, 
  uploadedAt: true, 
  verifiedAt: true 
});

export const insertHiringTemplateSchema = createInsertSchema(hiringTemplates).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertProbationScheduleSchema = createInsertSchema(probationSchedules).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertProbationEvaluationSchema = createInsertSchema(probationEvaluations).omit({ 
  id: true, 
  evaluatedAt: true, 
  acknowledgedAt: true 
});

export const insertExitRequestSchema = createInsertSchema(exitRequests).omit({ 
  id: true, 
  requestDate: true, 
  completedAt: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertCompanyDocumentSchema = createInsertSchema(companyDocuments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Dashboard Widget System
export const widgetTypeEnum = pgEnum('widget_type', [
  'performance',
  'stats',
  'chart',
  'tasks',
  'notifications',
  'calendar',
  'leads',
  'clients',
  'invoices',
  'dispatch',
  'messages'
]);

export const widgetSizeEnum = pgEnum('widget_size', [
  'full',
  'half',
  'third'
]);

export const widgetHeightEnum = pgEnum('widget_height', [
  'small',
  'normal',
  'large'
]);

// Dashboard widget system - defined above to avoid duplicate definition

// Type definitions
export type HiringCandidate = typeof hiringCandidates.$inferSelect;
export type InsertHiringCandidate = z.infer<typeof insertHiringCandidateSchema>;

export type CandidateDocument = typeof candidateDocuments.$inferSelect;
export type InsertCandidateDocument = z.infer<typeof insertCandidateDocumentSchema>;

export type HiringTemplate = typeof hiringTemplates.$inferSelect;
export type InsertHiringTemplate = z.infer<typeof insertHiringTemplateSchema>;

export type ProbationSchedule = typeof probationSchedules.$inferSelect;
export type InsertProbationSchedule = z.infer<typeof insertProbationScheduleSchema>;

export type ProbationEvaluation = typeof probationEvaluations.$inferSelect;
export type InsertProbationEvaluation = z.infer<typeof insertProbationEvaluationSchema>;

export type ExitRequest = typeof exitRequests.$inferSelect;
export type InsertExitRequest = z.infer<typeof insertExitRequestSchema>;

export type CompanyDocument = typeof companyDocuments.$inferSelect;
export type InsertCompanyDocument = z.infer<typeof insertCompanyDocumentSchema>;

// Organization Management
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  active: boolean("active").notNull().default(true),
  address: text("address"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  logoUrl: text("logo_url"),
  // Module configuration for organization
  enabledModules: jsonb("enabled_modules").notNull().default({
    sales: true,
    dispatch: true,
    hr: true,
    finance: true,
    marketing: true
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User and Role Management
export const roleEnum = pgEnum('role_type', ['agent', 'TL', 'manager', 'head', 'admin']);
export const departmentEnum = pgEnum('department_type', ['sales', 'dispatch', 'hr', 'finance', 'marketing', 'accounting', 'admin']);
export const userStatusEnum = pgEnum('user_status', ['active', 'invited', 'inactive']);
export const permissionActionEnum = pgEnum('permission_action', ['view', 'create', 'edit', 'delete', 'approve']);

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  department: text("department").notNull(), // Text in DB: "sales", "dispatch", "hr", "finance", "marketing", "accounting", "admin"
  level: integer("level").notNull(), // 1 = Rep, 2 = Team Lead, 3 = Manager, 4 = Head, 5 = Super Admin
  permissions: text("permissions").array().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  roleId: integer("role_id").notNull().references(() => roles.id),
  orgId: integer("org_id").references(() => organizations.id),
  
  // Extended fields
  active: boolean("active").notNull().default(true),
  profileImageUrl: text("profile_image_url"),
  
  // Permission fields that DO exist in the actual database
  isSystemAdmin: boolean("is_system_admin").notNull().default(false),
  canManageRoles: boolean("can_manage_roles").notNull().default(false),
  canAccessAllOrgs: boolean("can_access_all_orgs").notNull().default(false),
  canManageSettings: boolean("can_manage_settings").notNull().default(false),
  canViewAuditLog: boolean("can_view_audit_log").notNull().default(false),
  canManageLeadAssignments: boolean("can_manage_lead_assignments").notNull().default(false),
  canDeleteLeads: boolean("can_delete_leads").notNull().default(false),
  canExportLeads: boolean("can_export_leads").notNull().default(false),
  canCreateInvoices: boolean("can_create_invoices").notNull().default(false),
  canApproveInvoices: boolean("can_approve_invoices").notNull().default(false),
  canManageAccounting: boolean("can_manage_accounting").notNull().default(false),
  canManageLoads: boolean("can_manage_loads").notNull().default(false),
  canManageCarriers: boolean("can_manage_carriers").notNull().default(false),
  canApproveDispatchReports: boolean("can_approve_dispatch_reports").notNull().default(false),
  canManageUsers: boolean("can_manage_users").notNull().default(false),
});

// Team management
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  department: text("department").notNull(),  // Text in DB
  teamLeadId: integer("team_lead_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    orgIdIdx: index("teams_org_id_idx").on(table.orgId),
    departmentIdx: index("teams_department_idx").on(table.department),
    teamLeadIdx: index("teams_team_lead_idx").on(table.teamLeadId),
  };
});

// Update user table with team reference after teams is defined
export const userTeamForeignKey = pgTable("user_team_fk", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  teamId: integer("team_id").notNull().references(() => teams.id), 
});

// User-organization relationships (many-to-many)
export const userOrganizations = pgTable("user_organizations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    userOrgIdx: index("user_organizations_user_org_idx").on(table.userId, table.organizationId),
  };
});

// Team members (many-to-many)
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    teamUserIdx: index("team_members_team_user_idx").on(table.teamId, table.userId),
  };
});

// Lead Management (CRM)
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  mcNumber: text("mc_number").notNull(),
  dotNumber: text("dot_number"),
  equipmentType: text("equipment_type").notNull(),
  truckCategory: text("truck_category"),
  factoringStatus: text("factoring_status").notNull(),
  serviceCharges: real("service_charges"),
  contactName: text("contact_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  
  // Enhanced status values as per requirements
  status: leadStatusEnum("status").notNull().default("New"),
  
  // Enhanced lead source tracking
  source: leadSourceEnum("source").notNull().default("SQL"),
  
  // Lead qualification and scoring
  qualificationScore: leadScoreEnum("qualification_score").default("Medium"),
  validationStatus: leadValidationStatusEnum("validation_status").default("Pending"),
  
  // Fields for tracking sales activity
  lastContactedAt: timestamp("last_contacted_at"),
  callAttempts: integer("call_attempts").default(0),
  formsSent: integer("forms_sent").default(0),
  formsCompleted: integer("forms_completed").default(0),
  
  // Status change history tracking
  inProgressAt: timestamp("in_progress_at"),
  handToDispatchAt: timestamp("hand_to_dispatch_at"),
  activatedAt: timestamp("activated_at"),
  
  // Dispatch handoff tracking
  dispatchRejectionCount: integer("dispatch_rejection_count").default(0),
  dispatchRejectionReason: text("dispatch_rejection_reason"),
  dispatchHandoverNotes: text("dispatch_handover_notes"),
  
  // Standard fields
  assignedTo: integer("assigned_to").notNull(),
  orgId: integer("org_id").references(() => organizations.id),
  notes: text("notes"),
  
  // JSON field for storing custom fields and arbitrary data
  customFields: jsonb("custom_fields"),
  
  // Tags for better categorization 
  tags: text("tags").array(),
  
  // Timestamps for better lead tracking
  firstContactAt: timestamp("first_contact_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
}, (table) => {
  return {
    // Indexes for optimized queries
    orgIdIdx: index("leads_org_id_idx").on(table.orgId),
    statusIdx: index("leads_status_idx").on(table.status),
    ownerIdx: index("leads_owner_idx").on(table.assignedTo),
    createdAtIdx: index("leads_created_at_idx").on(table.createdAt),
    scoreIdx: index("leads_score_idx").on(table.qualificationScore),
    lastContactedIdx: index("leads_last_contacted_idx").on(table.lastContactedAt),
    // Combined index for frequently filtered queries
    orgStatusOwnerIdx: index("leads_org_status_owner_idx").on(table.orgId, table.status, table.assignedTo)
  };
});

// Lead remarks/history for tracking interactions
export const leadRemarks = pgTable("lead_remarks", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  userId: integer("user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    // Indexes for faster querying
    leadIdIdx: index("lead_remarks_lead_id_idx").on(table.leadId),
    userIdIdx: index("lead_remarks_user_id_idx").on(table.userId),
    createdAtIdx: index("lead_remarks_created_at_idx").on(table.createdAt),
    // Combined index for timeline queries
    leadTimelineIdx: index("lead_remarks_timeline_idx").on(table.leadId, table.createdAt)
  };
});

// Call logs for tracking phone interactions with leads
export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  userId: integer("user_id").notNull().references(() => users.id),
  duration: integer("duration").notNull(), // in seconds
  outcome: callOutcomeEnum("outcome").notNull(),
  notes: text("notes"),
  scheduledFollowUp: boolean("scheduled_follow_up").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    leadIdIdx: index("call_logs_lead_id_idx").on(table.leadId),
    userIdIdx: index("call_logs_user_id_idx").on(table.userId),
    createdAtIdx: index("call_logs_created_at_idx").on(table.createdAt),
    outcomeIdx: index("call_logs_outcome_idx").on(table.outcome),
  };
});

// Form templates for sending to leads
export const formTemplates = pgTable("form_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "onboarding", "credit", "service", "rate_agreement", etc.
  content: text("content").notNull(), // JSON or HTML form content
  orgId: integer("org_id").references(() => organizations.id),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    orgIdIdx: index("form_templates_org_id_idx").on(table.orgId),
    categoryIdx: index("form_templates_category_idx").on(table.category),
    activeIdx: index("form_templates_active_idx").on(table.isActive),
  };
});

// Form submissions tracking
export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  formTemplateId: integer("form_template_id").notNull().references(() => formTemplates.id),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  sentBy: integer("sent_by").notNull().references(() => users.id),
  deliveryMethod: text("delivery_method").notNull(), // "email", "text", "portal", etc.
  status: formStatusEnum("status").notNull().default("Sent"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  viewedAt: timestamp("viewed_at"),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  customMessage: text("custom_message"),
  responseData: jsonb("response_data"), // JSON response data
  followUpScheduled: boolean("follow_up_scheduled").notNull().default(false),
  followUpDate: timestamp("follow_up_date"),
}, (table) => {
  return {
    templateIdIdx: index("form_submissions_template_id_idx").on(table.formTemplateId),
    leadIdIdx: index("form_submissions_lead_id_idx").on(table.leadId),
    statusIdx: index("form_submissions_status_idx").on(table.status),
    sentAtIdx: index("form_submissions_sent_at_idx").on(table.sentAt),
    followUpIdx: index("form_submissions_follow_up_idx").on(table.followUpScheduled, table.followUpDate),
  };
});

// Follow-up scheduler for leads
export const leadFollowUps = pgTable("lead_follow_ups", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  createdBy: integer("created_by").notNull().references(() => users.id),
  assignedTo: integer("assigned_to").notNull().references(() => users.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    leadIdIdx: index("lead_follow_ups_lead_id_idx").on(table.leadId),
    assigneeIdx: index("lead_follow_ups_assignee_idx").on(table.assignedTo),
    createdByIdx: index("lead_follow_ups_created_by_idx").on(table.createdBy),
    scheduledDateIdx: index("lead_follow_ups_scheduled_date_idx").on(table.scheduledDate),
    completedIdx: index("lead_follow_ups_completed_idx").on(table.completed),
  };
});

// Customer feedback system for tracking satisfaction
export const customerFeedback = pgTable("customer_feedback", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  rating: integer("rating").notNull(), // 1-5 scale
  feedback: text("feedback"),
  surveyDate: timestamp("survey_date").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    leadIdIdx: index("customer_feedback_lead_id_idx").on(table.leadId),
    ratingIdx: index("customer_feedback_rating_idx").on(table.rating),
    surveyDateIdx: index("customer_feedback_survey_date_idx").on(table.surveyDate),
  };
});

// Lead to Dispatch Handoff
export const leadHandoffs = pgTable("lead_handoffs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  salesRepId: integer("sales_rep_id").notNull().references(() => users.id),
  dispatcherId: integer("dispatcher_id").references(() => users.id),
  handoffDate: timestamp("handoff_date").notNull().defaultNow(),
  status: text("status").notNull(), // "pending", "accepted", "rejected", "returned"
  rejectionReason: text("rejection_reason"),
  qualityRating: integer("quality_rating"), // 1-5 scale
  feedbackNotes: text("feedback_notes"),
  responseDate: timestamp("response_date"),
  autoRejected: boolean("auto_rejected").default(false),
  callsVerified: boolean("calls_verified").default(false),
  requiredFormsFilled: boolean("required_forms_filled").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    leadIdIdx: index("lead_handoffs_lead_id_idx").on(table.leadId),
    salesRepIdx: index("lead_handoffs_sales_rep_idx").on(table.salesRepId),
    dispatcherIdx: index("lead_handoffs_dispatcher_idx").on(table.dispatcherId),
    statusIdx: index("lead_handoffs_status_idx").on(table.status),
    handoffDateIdx: index("lead_handoffs_handoff_date_idx").on(table.handoffDate),
  };
});

// Dispatch Management
export const dispatch_clients = pgTable("dispatch_clients", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  orgId: integer("org_id").notNull(),
  status: text("status").notNull(), // "Pending Onboard", "Active", "Inactive", "Suspended"
  onboardingDate: timestamp("onboarding_date"),
  approvedBy: integer("approved_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const loads = pgTable("loads", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  orgId: integer("org_id").references(() => organizations.id),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  pickupDate: date("pickup_date").notNull(),
  deliveryDate: date("delivery_date").notNull(),
  status: text("status").notNull(), // "booked", "in_transit", "delivered", "invoiced", "paid"
  freightAmount: real("freight_amount").notNull(),
  serviceCharge: real("service_charge").notNull(),
  rateConfirmationUrl: text("rate_confirmation_url"),
  podUrl: text("pod_url"),
  assignedTo: integer("assigned_to").notNull(),
  dispatcherId: integer("dispatcher_id").references(() => users.id), // Added for leaderboard functionality
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
});

// Invoicing
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  leadId: integer("lead_id").notNull(),
  orgId: integer("org_id").references(() => organizations.id),
  totalAmount: real("total_amount").notNull(),
  status: text("status").notNull(), // "draft", "sent", "paid", "overdue"
  issuedDate: date("issued_date").notNull(),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  paidAmount: real("paid_amount"),
  invoicePdf: text("invoice_pdf"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  loadId: integer("load_id").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Commission Tracking
export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  invoiceId: integer("invoice_id").notNull(),
  leadId: integer("lead_id"),
  loadId: integer("load_id"),
  commissionType: text("commission_type").notNull(), // "sales_dispatch", "sales_factoring", "sales_direct", "sales_digital", "dispatch_tier"
  amount: real("amount").notNull(),
  status: text("status").notNull(), // "pending", "approved", "paid"
  calculationDate: date("calculation_date").notNull(),
  paidDate: date("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Activity logging
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  entityType: text("entity_type").notNull(), // "lead", "load", "invoice", etc.
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(), // "created", "updated", "status_changed", etc.
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Tasks module
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull(), // "todo", "in_progress", "completed", "cancelled"
  priority: text("priority").notNull(), // "low", "medium", "high", "urgent"
  dueDate: date("due_date"),
  orgId: integer("org_id").references(() => organizations.id),
  createdBy: integer("created_by").notNull(),
  assignedTo: integer("assigned_to"),
  relatedEntityType: text("related_entity_type"), // "lead", "load", "invoice", etc.
  relatedEntityId: integer("related_entity_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Comments for entities (tasks, leads, loads, etc.)
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), 
  entityType: text("entity_type").notNull(), // "task", "lead", "load", "invoice"
  entityId: integer("entity_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Time Tracking  
export const timeClockEntries = pgTable("time_clock_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  orgId: integer("org_id").references(() => organizations.id),
  clockInTime: timestamp("clock_in_time").notNull(),
  clockOutTime: timestamp("clock_out_time"),
  clockInLocation: text("clock_in_location"),
  clockOutLocation: text("clock_out_location"),
  clockInImage: text("clock_in_image"),
  clockOutImage: text("clock_out_image"),
  status: text("status").notNull(), // "active", "completed", "rejected", "modified"
  totalHours: real("total_hours"),
  notes: text("notes"),
  modifiedBy: integer("modified_by"),
  modifiedReason: text("modified_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Leave Management
export const leaveTypes = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  paidLeave: boolean("paid_leave").default(true).notNull(),
  color: text("color").default("#4CAF50"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  leaveTypeId: integer("leave_type_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").notNull(), // "pending", "approved", "rejected", "cancelled"
  totalDays: real("total_days").notNull(),
  reason: text("reason"),
  approvedBy: integer("approved_by"),
  approvalNotes: text("approval_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  orgId: integer("org_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "info", "success", "warning", "error", "hr"
  read: boolean("read").default(false),
  entityType: text("entity_type"), // "lead", "load", "invoice", "task", "hiring_candidate", etc.
  entityId: integer("entity_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Dashboard widgets configuration
export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  widgetType: text("widget_type").notNull(), // Sales, Dispatch, Commission, etc.
  widgetKey: text("widget_key").notNull(), // Unique identifier for the widget
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  width: text("width").notNull().default("full"), // "full", "half", "third"
  height: text("height").notNull().default("normal"), // "small", "normal", "large"
  isVisible: boolean("is_visible").notNull().default(true),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    userWidgetIdx: index("dashboard_widgets_user_widget_idx").on(table.userId, table.widgetKey),
  };
});

// Messages between users or from system to users
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
  subject: text("subject"),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  isSystemMessage: boolean("is_system_message").default(false),
  parentMessageId: integer("parent_message_id"),
  orgId: integer("org_id").references(() => organizations.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Commission Rules
export const commissionRules = pgTable("commission_rules", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  type: text("type").notNull(), // "sales", "dispatch"
  tiers: jsonb("tiers").notNull(), // Stores JSON array of tier objects
  updatedBy: integer("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Simple Clock Events (new implementation)
export const clockEvents = pgTable("clock_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: clockEventTypeEnum("type").notNull(), // IN or OUT
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  location: text("location"),
  notes: text("notes"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Dispatch tasks status enum
export const dispatchTaskStatusEnum = pgEnum('dispatch_task_status', ['Pending', 'Submitted']);

// Dispatch reports status enum
export const dispatchReportStatusEnum = pgEnum('dispatch_report_status', ['Pending', 'Submitted']);

// Performance target type enum
export const performanceTargetTypeEnum = pgEnum('performance_target_type', ['daily', 'weekly']);

// Dispatch Tasks for tracking daily tasks
export const dispatchTasks = pgTable("dispatch_tasks", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  dispatcherId: integer("dispatcher_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  carriersToUpdate: integer("carriers_to_update").notNull().default(0),
  newLeads: integer("new_leads").notNull().default(0),
  status: dispatchTaskStatusEnum("status").notNull().default("Pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    dispatcherIdIdx: index("dispatch_tasks_dispatcher_id_idx").on(table.dispatcherId),
    dateIdx: index("dispatch_tasks_date_idx").on(table.date),
    orgIdIdx: index("dispatch_tasks_org_id_idx").on(table.orgId),
  };
});

// Dispatch Reports for tracking daily performance
export const dispatchReports = pgTable("dispatch_reports", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  dispatcherId: integer("dispatcher_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  loadsBooked: integer("loads_booked").notNull().default(0),
  invoiceUsd: real("invoice_usd").notNull().default(0),
  activeLeads: integer("active_leads").notNull().default(0),
  pendingInvoiceUsd: real("pending_invoice_usd").notNull().default(0),
  highestInvoiceUsd: real("highest_invoice_usd").notNull().default(0),
  paidInvoiceUsd: real("paid_invoice_usd").notNull().default(0),
  status: dispatchReportStatusEnum("status").notNull().default("Pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    dispatcherIdIdx: index("dispatch_reports_dispatcher_id_idx").on(table.dispatcherId),
    dateIdx: index("dispatch_reports_date_idx").on(table.date),
    orgIdIdx: index("dispatch_reports_org_id_idx").on(table.orgId),
  };
});

// Performance Targets for tracking goals
export const performanceTargets = pgTable("performance_targets", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  type: performanceTargetTypeEnum("type").notNull(),
  minPct: integer("min_pct").notNull().default(40),
  maxPct: integer("max_pct").notNull().default(100),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    orgIdTypeIdx: index("performance_targets_org_id_type_idx").on(table.orgId, table.type),
  };
});

// Monthly Commissions
export const commissionsMonthly = pgTable("commissions_monthly", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  userId: integer("user_id").notNull().references(() => users.id),
  month: text("month").notNull(), // Format: "YYYY-MM"
  dept: text("dept").notNull(), // "sales", "dispatch"
  activeLeads: integer("active_leads").default(0),
  invoiceTotal: real("invoice_total").default(0),
  ownLeadBonus: real("own_lead_bonus").default(0),
  newLeadBonus: real("new_lead_bonus").default(0),
  first2wkPct: real("first_2wk_pct").default(0),
  bigTruckBonus: real("big_truck_bonus").default(0),
  tierFixed: real("tier_fixed").default(0),
  tierPct: real("tier_pct").default(0),
  penaltyPct: real("penalty_pct").default(0),
  totalCommission: real("total_commission").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Error Tracking and Bug Reporting
export const bugs = pgTable("bugs", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  reportedBy: integer("reported_by").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  urgency: bugUrgencyEnum("urgency").notNull().default("Medium"),
  status: text("status").notNull().default("New"), // "New", "In Progress", "Fixed", "Closed", "Reopened"
  module: text("module").notNull(), // The module where the bug was found: "sales", "dispatch", "hr", etc.
  page: text("page"), // The specific page/screen where the bug was encountered
  browser: text("browser"), // Browser information
  device: text("device"), // Device information
  os: text("os"), // Operating system information
  screenshotUrl: text("screenshot_url"), // URL to screenshot (if any)
  steps: text("steps"), // Steps to reproduce
  assignedTo: integer("assigned_to").references(() => users.id),
  fixVersion: text("fix_version"), // Version where the fix was implemented
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  fixedAt: timestamp("fixed_at"),
  closedAt: timestamp("closed_at"),
}, (table) => {
  return {
    orgIdIdx: index("bugs_org_id_idx").on(table.orgId),
    reportedByIdx: index("bugs_reported_by_idx").on(table.reportedBy),
    statusIdx: index("bugs_status_idx").on(table.status),
    urgencyIdx: index("bugs_urgency_idx").on(table.urgency),
    moduleIdx: index("bugs_module_idx").on(table.module),
    createdAtIdx: index("bugs_created_at_idx").on(table.createdAt),
  };
});

// Schema validation
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true, firstContactAt: true });
export const insertLeadRemarkSchema = createInsertSchema(leadRemarks).omit({ id: true, createdAt: true });
export const insertCallLogSchema = createInsertSchema(callLogs).omit({ id: true, createdAt: true });
export const insertLeadFollowUpSchema = createInsertSchema(leadFollowUps).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export const insertCustomerFeedbackSchema = createInsertSchema(customerFeedback).omit({ id: true, createdAt: true, respondedAt: true });
export const insertDispatchClientSchema = createInsertSchema(dispatch_clients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLoadSchema = createInsertSchema(loads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true, createdAt: true });
export const insertCommissionSchema = createInsertSchema(commissions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, timestamp: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTimeClockEntrySchema = createInsertSchema(timeClockEntries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeaveTypeSchema = createInsertSchema(leaveTypes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertUserOrganizationSchema = createInsertSchema(userOrganizations).omit({ id: true, createdAt: true });
export const insertClockEventSchema = createInsertSchema(clockEvents).omit({ id: true, timestamp: true });
export const insertCommissionRuleSchema = createInsertSchema(commissionRules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCommissionMonthlySchema = createInsertSchema(commissionsMonthly).omit({ id: true, createdAt: true, updatedAt: true });

// UI Preferences
export const uiPreferences = pgTable("ui_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sidebarPinned: boolean("sidebar_pinned").notNull().default(true),
  sidebarCollapsed: boolean("sidebar_collapsed").notNull().default(false),
  theme: text("theme").notNull().default("light"), // light, dark, system
  homeDashboard: text("home_dashboard"), // default landing page
  notificationPreferences: jsonb("notification_preferences").default({}),
  // Animation preferences
  animationsEnabled: boolean("animations_enabled").notNull().default(true),
  transitionSpeed: text("transition_speed").notNull().default("normal"), // fast, normal, slow
  pageTransition: text("page_transition").notNull().default("gradient"), // fade, slide, zoom, gradient
  reducedMotion: boolean("reduced_motion").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("ui_prefs_user_id_idx").on(table.userId),
  };
});

// User Settings (expanded settings beyond UI preferences)
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  timezone: text("timezone").default("UTC"),
  dateFormat: text("date_format").default("MM/DD/YYYY"),
  timeFormat: text("time_format").default("12h"), // 12h or 24h
  language: text("language").default("en"),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  smsNotifications: boolean("sms_notifications").notNull().default(false),
  slackNotifications: boolean("slack_notifications").notNull().default(false),
  modulePreferences: jsonb("module_preferences").default({}), // Per-module settings
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("user_settings_user_id_idx").on(table.userId),
  };
});

// Organization Settings
export const organizationSettings = pgTable("organization_settings", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  defaultTimezone: text("default_timezone").default("UTC"),
  defaultDateFormat: text("default_date_format").default("MM/DD/YYYY"),
  defaultLanguage: text("default_language").default("en"),
  requireLocationTracking: boolean("require_location_tracking").notNull().default(true),
  workingHours: jsonb("working_hours").default({
    monday: { start: "09:00", end: "17:00", enabled: true },
    tuesday: { start: "09:00", end: "17:00", enabled: true },
    wednesday: { start: "09:00", end: "17:00", enabled: true },
    thursday: { start: "09:00", end: "17:00", enabled: true },
    friday: { start: "09:00", end: "17:00", enabled: true },
    saturday: { start: "09:00", end: "17:00", enabled: false },
    sunday: { start: "09:00", end: "17:00", enabled: false }
  }),
  moduleSettings: jsonb("module_settings").default({}), // Settings for specific modules
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    orgIdIdx: index("org_settings_org_id_idx").on(table.orgId),
  };
});

// Permission Templates
export const permissionTemplates = pgTable("permission_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  roleLevel: integer("role_level").notNull(), // 1-5 matching role levels
  department: text("department").notNull(),
  permissions: jsonb("permissions").notNull(),
  isSystem: boolean("is_system").notNull().default(false), // True for built-in templates
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    orgIdIdx: index("perm_templates_org_id_idx").on(table.orgId),
    levelIdx: index("perm_templates_level_idx").on(table.roleLevel),
    deptIdx: index("perm_templates_dept_idx").on(table.department),
  };
});

// Feature Flags
export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  key: text("key").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  orgId: integer("org_id").references(() => organizations.id), // Null means system-wide
  restrictions: jsonb("restrictions").default({}), // Role or department restrictions
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    keyIdx: index("feature_flags_key_idx").on(table.key),
    orgIdIdx: index("feature_flags_org_id_idx").on(table.orgId),
  };
});

// Location Tracking
export const userLocations = pgTable("user_locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  accuracy: real("accuracy"),
  deviceInfo: jsonb("device_info").default({}),
  ipAddress: text("ip_address"),
  batteryLevel: real("battery_level"),
  isOnClock: boolean("is_on_clock").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("user_locations_user_id_idx").on(table.userId),
    timeIdx: index("user_locations_time_idx").on(table.createdAt),
    userTimeIdx: index("user_locations_user_time_idx").on(table.userId, table.createdAt),
  };
});

// Insert schemas for new tables
export const insertUiPreferencesSchema = createInsertSchema(uiPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationSettingsSchema = createInsertSchema(organizationSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPermissionTemplateSchema = createInsertSchema(permissionTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserLocationSchema = createInsertSchema(userLocations).omit({ id: true, createdAt: true });

// Dashboard widgets schema
export const insertDashboardWidgetSchema = createInsertSchema(dashboardWidgets).omit({ id: true, createdAt: true, updatedAt: true });

// Dispatch automation schemas
export const insertDispatchTaskSchema = createInsertSchema(dispatchTasks).omit({ id: true, createdAt: true });
export const insertDispatchReportSchema = createInsertSchema(dispatchReports).omit({ id: true, createdAt: true });
export const insertPerformanceTargetSchema = createInsertSchema(performanceTargets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBugSchema = createInsertSchema(bugs).omit({ id: true, createdAt: true, updatedAt: true, fixedAt: true, closedAt: true });

// Form templates and submissions
export const insertFormTemplateSchema = createInsertSchema(formTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({ id: true });

// Lead handoffs
export const insertLeadHandoffSchema = createInsertSchema(leadHandoffs).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type UiPreferences = typeof uiPreferences.$inferSelect;
export type InsertUiPreferences = z.infer<typeof insertUiPreferencesSchema>;

export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = z.infer<typeof insertUserOrganizationSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type LeadRemark = typeof leadRemarks.$inferSelect;
export type InsertLeadRemark = z.infer<typeof insertLeadRemarkSchema>;

export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;

export type LeadFollowUp = typeof leadFollowUps.$inferSelect;
export type InsertLeadFollowUp = z.infer<typeof insertLeadFollowUpSchema>;

export type CustomerFeedback = typeof customerFeedback.$inferSelect;
export type InsertCustomerFeedback = z.infer<typeof insertCustomerFeedbackSchema>;

export type DispatchClient = typeof dispatch_clients.$inferSelect;
export type InsertDispatchClient = z.infer<typeof insertDispatchClientSchema>;

export type Load = typeof loads.$inferSelect;
export type InsertLoad = z.infer<typeof insertLoadSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type TimeClockEntry = typeof timeClockEntries.$inferSelect;
export type InsertTimeClockEntry = z.infer<typeof insertTimeClockEntrySchema>;

export type LeaveType = typeof leaveTypes.$inferSelect;
export type InsertLeaveType = z.infer<typeof insertLeaveTypeSchema>;

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type ClockEvent = typeof clockEvents.$inferSelect;
export type InsertClockEvent = z.infer<typeof insertClockEventSchema>;

export type CommissionRule = typeof commissionRules.$inferSelect;
export type InsertCommissionRule = z.infer<typeof insertCommissionRuleSchema>;

export type CommissionMonthly = typeof commissionsMonthly.$inferSelect;
export type InsertCommissionMonthly = z.infer<typeof insertCommissionMonthlySchema>;

// Dispatch automation types
export type DispatchTask = typeof dispatchTasks.$inferSelect;
export type InsertDispatchTask = z.infer<typeof insertDispatchTaskSchema>;

export type DispatchReport = typeof dispatchReports.$inferSelect;
export type InsertDispatchReport = z.infer<typeof insertDispatchReportSchema>;

export type PerformanceTarget = typeof performanceTargets.$inferSelect;
export type InsertPerformanceTarget = z.infer<typeof insertPerformanceTargetSchema>;

// Dashboard widgets types
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type InsertDashboardWidget = z.infer<typeof insertDashboardWidgetSchema>;

// Bug reporting types
export type Bug = typeof bugs.$inferSelect;
export type InsertBug = z.infer<typeof insertBugSchema>;

// User settings and preferences types
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export type OrganizationSettings = typeof organizationSettings.$inferSelect;
export type InsertOrganizationSettings = z.infer<typeof insertOrganizationSettingsSchema>;

export type PermissionTemplate = typeof permissionTemplates.$inferSelect;
export type InsertPermissionTemplate = z.infer<typeof insertPermissionTemplateSchema>;

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;

export type UserLocation = typeof userLocations.$inferSelect;
export type InsertUserLocation = z.infer<typeof insertUserLocationSchema>;

// Form templates and submissions types
export type FormTemplate = typeof formTemplates.$inferSelect;
export type InsertFormTemplate = z.infer<typeof insertFormTemplateSchema>;

export type FormSubmission = typeof formSubmissions.$inferSelect; 
export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;

// Lead handoff types
export type LeadHandoff = typeof leadHandoffs.$inferSelect;
export type InsertLeadHandoff = z.infer<typeof insertLeadHandoffSchema>;