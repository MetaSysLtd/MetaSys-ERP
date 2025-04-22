import { pgTable, text, serial, integer, boolean, date, timestamp, real, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Clock event types enum
export const clockEventTypeEnum = pgEnum('clock_event_type', ['IN', 'OUT']);

// CRM Lead enums
export const leadSourceEnum = pgEnum('lead_source', ['SQL', 'MQL']);
export const leadStatusEnum = pgEnum('lead_status', ['New', 'InProgress', 'FollowUp', 'HandToDispatch', 'Active', 'Lost']);

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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User and Role Management
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  department: text("department").notNull(), // "sales", "dispatch", "admin"
  level: integer("level").notNull(), // 1 = Rep, 2 = Team Lead, 3 = Manager, 4 = Head, 5 = Super Admin
  permissions: text("permissions").array().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number"),
  roleId: integer("role_id").notNull().references(() => roles.id),
  orgId: integer("org_id").references(() => organizations.id),
  active: boolean("active").notNull().default(true),
  profileImageUrl: text("profile_image_url"),
});

// User-organization relationships (many-to-many)
export const userOrganizations = pgTable("user_organizations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  
  assignedTo: integer("assigned_to").notNull(),
  orgId: integer("org_id").references(() => organizations.id),
  notes: text("notes"),
  
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
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "info", "success", "warning", "error"
  read: boolean("read").default(false),
  entityType: text("entity_type"), // "lead", "load", "invoice", "task", etc.
  entityId: integer("entity_id"),
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

// Schema validation
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true, firstContactAt: true });
export const insertLeadRemarkSchema = createInsertSchema(leadRemarks).omit({ id: true, createdAt: true });
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
export const insertUserOrganizationSchema = createInsertSchema(userOrganizations).omit({ id: true, createdAt: true });
export const insertClockEventSchema = createInsertSchema(clockEvents).omit({ id: true, timestamp: true });
export const insertCommissionRuleSchema = createInsertSchema(commissionRules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCommissionMonthlySchema = createInsertSchema(commissionsMonthly).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = z.infer<typeof insertUserOrganizationSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type LeadRemark = typeof leadRemarks.$inferSelect;
export type InsertLeadRemark = z.infer<typeof insertLeadRemarkSchema>;

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

export type ClockEvent = typeof clockEvents.$inferSelect;
export type InsertClockEvent = z.infer<typeof insertClockEventSchema>;

export type CommissionRule = typeof commissionRules.$inferSelect;
export type InsertCommissionRule = z.infer<typeof insertCommissionRuleSchema>;

export type CommissionMonthly = typeof commissionsMonthly.$inferSelect;
export type InsertCommissionMonthly = z.infer<typeof insertCommissionMonthlySchema>;