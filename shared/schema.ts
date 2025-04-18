import { pgTable, text, serial, integer, boolean, date, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  roleId: integer("role_id").notNull(),
  active: boolean("active").notNull().default(true),
  profileImageUrl: text("profile_image_url"),
});

// Lead Management
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  mcNumber: text("mc_number").notNull(),
  dotNumber: text("dot_number"),
  equipmentType: text("equipment_type").notNull(),
  truckCategory: text("truck_category"),
  factoringStatus: text("factoring_status").notNull(),
  serviceCharges: real("service_charges").notNull(),
  contactName: text("contact_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  status: text("status").notNull(), // "unqualified", "qualified", "active", "lost", "won", "follow-up", "nurture"
  assignedTo: integer("assigned_to").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
});

// Dispatch Management
export const loads = pgTable("loads", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
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
});

// Invoicing
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  leadId: integer("lead_id").notNull(),
  totalAmount: real("total_amount").notNull(),
  status: text("status").notNull(), // "draft", "sent", "paid", "overdue"
  issuedDate: date("issued_date").notNull(),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  loadId: integer("load_id").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
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

// Schema validation
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLoadSchema = createInsertSchema(loads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
export const insertCommissionSchema = createInsertSchema(commissions).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, timestamp: true });

// Types
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

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
