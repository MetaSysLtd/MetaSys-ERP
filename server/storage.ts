import {
  users, roles, leads, leadRemarks, loads, invoices, invoiceItems, commissions, activities, tasks,
  dispatch_clients, organizations, userOrganizations, commissionPolicy, commissionsMonthly,
  commissionRun, leadSalesUsers, clockEvents, clockEventTypeEnum, uiPreferences, dispatchTasks, 
  dispatchReports, performanceTargets, hiringCandidates, candidateDocuments, hiringTemplates, 
  probationSchedules, probationEvaluations, exitRequests, companyDocuments, notifications, 
  dashboardWidgets, bugs, bugUrgencyEnum, userSettings, organizationSettings, permissionTemplates, 
  featureFlags, userLocations, formTemplates, formSubmissions, leadHandoffs, accounts, surveys,
  type User, type InsertUser, type Role, type InsertRole,
  type Lead, type InsertLead, type Load, type InsertLoad,
  type Invoice, type InsertInvoice, type InvoiceItem, type InsertInvoiceItem,
  type Commission, type InsertCommission, type Activity, type InsertActivity,
  type DispatchClient, type InsertDispatchClient, 
  type Organization, type InsertOrganization,
  type UserOrganization, type InsertUserOrganization,
  type CommissionPolicy, type InsertCommissionPolicy, 
  type CommissionRun, type InsertCommissionRun,
  type LeadSalesUser, type InsertLeadSalesUser,
  type CommissionMonthly, type InsertCommissionMonthly,
  type Task, type InsertTask,
  type ClockEvent, type InsertClockEvent,
  type UiPreferences, type InsertUiPreferences,
  type DispatchTask, type InsertDispatchTask,
  type DispatchReport, type InsertDispatchReport,
  type PerformanceTarget, type InsertPerformanceTarget,
  type DashboardWidget, type InsertDashboardWidget,
  type LeadRemark, type CallLog, type InsertCallLog, type LeadFollowUp, type InsertLeadFollowUp,
  type CustomerFeedback, type InsertCustomerFeedback,
  type HiringCandidate, type InsertHiringCandidate,
  type CandidateDocument, type InsertCandidateDocument,
  type HiringTemplate, type InsertHiringTemplate,
  type ProbationSchedule, type InsertProbationSchedule,
  type ProbationEvaluation, type InsertProbationEvaluation,
  type ExitRequest, type InsertExitRequest,
  type CompanyDocument, type InsertCompanyDocument,
  type Notification, type InsertNotification,
  type Bug, type InsertBug,
  type UserSettings, type InsertUserSettings,
  type OrganizationSettings, type InsertOrganizationSettings,
  type PermissionTemplate, type InsertPermissionTemplate,
  type FeatureFlag, type InsertFeatureFlag,
  type UserLocation, type InsertUserLocation,
  type FormTemplate, type InsertFormTemplate,
  type FormSubmission, type InsertFormSubmission,
  type LeadHandoff, type InsertLeadHandoff,
  type Account, type InsertAccount,
  type Survey, type InsertSurvey
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, and, desc, inArray, gte, lte, lt, sql, count } from "drizzle-orm";
import createMemoryStore from "memorystore";
import { db, pgPool, pool } from './db';
import { getAllLeads, getLeadById, getLeadsByStatus as getLeadsByStatusApi, getLeadsByAssignee as getLeadsByAssigneeApi } from './leadsApi';
import { 
  getAllFormTemplates, getFormTemplateById, getFormTemplatesByLeadType,
  getAllFormSubmissions, getFormSubmissionsByLeadId, getFormSubmissionById
} from './formApi';

// Interface for storage operations
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // Team management
  getTeams(orgId: number): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  getTeamsByDepartment(department: string, orgId: number): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, data: Partial<Team>): Promise<Team>;
  deleteTeam(id: number): Promise<void>;
  getTeamMembers(teamId: number): Promise<any[]>; // Return user + team info
  getUserTeam(userId: number): Promise<{ teamId: number } | null>;
  addTeamMember(data: { userId: number; teamId: number }): Promise<any>;
  removeTeamMember(teamId: number, userId: number): Promise<void>;
  removeAllTeamMembers(teamId: number): Promise<void>;
  getAvailableUsers(orgId: number): Promise<User[]>;

  // Organization operations
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationByCode(code: string): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;
  getActiveOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, org: Partial<Organization>): Promise<Organization | undefined>;
  
  // Organization Settings operations
  getOrganizationSettings(orgId: number): Promise<OrganizationSettings | undefined>;
  createOrganizationSettings(settings: InsertOrganizationSettings): Promise<OrganizationSettings>;
  updateOrganizationSettings(orgId: number, settings: Partial<OrganizationSettings>): Promise<OrganizationSettings>;
  
  // User Settings operations - implementations completed
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings>;
  
  // Permission Template operations - implementations completed
  getPermissionTemplate(id: number): Promise<PermissionTemplate | undefined>;
  getPermissionTemplateByName(name: string): Promise<PermissionTemplate | undefined>;
  getPermissionTemplates(): Promise<PermissionTemplate[]>;
  getPermissionTemplatesByDepartment(department: string): Promise<PermissionTemplate[]>;
  createPermissionTemplate(template: InsertPermissionTemplate): Promise<PermissionTemplate>;
  updatePermissionTemplate(id: number, updates: Partial<PermissionTemplate>): Promise<PermissionTemplate | undefined>;
  deletePermissionTemplate(id: number): Promise<boolean>;
  
  // Feature Flag operations
  getFeatureFlag(id: number): Promise<FeatureFlag | undefined>;
  getFeatureFlagByKey(key: string): Promise<FeatureFlag | undefined>;
  getFeatureFlags(): Promise<FeatureFlag[]>;
  getFeatureFlagsByOrg(orgId: number): Promise<FeatureFlag[]>;
  createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag>;
  updateFeatureFlag(id: number, updates: Partial<FeatureFlag>): Promise<FeatureFlag | undefined>;
  
  // CRM Dashboard operations
  getLeadsByDateRange(startDate: string, endDate: string): Promise<Lead[]>;
  getActivitiesByDateRange(startDate: string, endDate: string, limit?: number): Promise<Activity[]>;
  getCommissionsByMonth(year: number, month: number): Promise<Commission[]>;
  getTopPerformingUsers(limit?: number): Promise<User[]>;
  
  // Account operations (CRM Deep-Carve)
  getAccount(id: number): Promise<Account | undefined>;
  getAccounts(): Promise<Account[]>;
  getAccountsByOrganization(orgId: number): Promise<Account[]>;
  getAccountsByAssignee(userId: number): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Survey operations (CRM Deep-Carve)
  getSurvey(id: number): Promise<Survey | undefined>;
  getSurveyByToken(token: string): Promise<Survey | undefined>;
  getSurveys(): Promise<Survey[]>;
  getSurveysByLead(leadId: number): Promise<Survey[]>;
  getSurveysByStatus(status: string): Promise<Survey[]>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurvey(id: number, updates: Partial<Survey>): Promise<Survey | undefined>;
  deleteSurvey(id: number): Promise<boolean>;
  
  // User Location operations
  getUserLocation(id: number): Promise<UserLocation | undefined>;
  getUserLocations(userId: number): Promise<UserLocation[]>;
  getUserLocationsByTimeRange(userId: number, startTime: Date, endTime: Date): Promise<UserLocation[]>;
  createUserLocation(location: InsertUserLocation): Promise<UserLocation>;
  
  // CRM Form template operations
  getFormTemplates(): Promise<FormTemplate[]>;
  getFormTemplate(id: number): Promise<FormTemplate | undefined>;
  getFormTemplatesByLeadType(leadType: string): Promise<FormTemplate[]>;
  createFormTemplate(template: InsertFormTemplate): Promise<FormTemplate>;
  updateFormTemplate(id: number, updates: Partial<FormTemplate>): Promise<FormTemplate | undefined>;
  deleteFormTemplate(id: number): Promise<boolean>;
  
  // CRM Form submission operations
  getFormSubmissions(leadId: number): Promise<FormSubmission[]>;
  getFormSubmission(id: number): Promise<FormSubmission | undefined>;
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  updateFormSubmission(id: number, updates: Partial<FormSubmission>): Promise<FormSubmission | undefined>;
  
  // CRM Lead handoff operations
  getLeadHandoffs(leadId: number): Promise<LeadHandoff[]>;
  getLeadHandoff(id: number): Promise<LeadHandoff | undefined>;
  createLeadHandoff(handoff: InsertLeadHandoff): Promise<LeadHandoff>;
  updateLeadHandoff(id: number, updates: Partial<LeadHandoff>): Promise<LeadHandoff | undefined>;
  
  // User & Role operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersByOrganization(orgId: number): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(roleId: number): Promise<User[]>;
  getUsersByDepartment(department: string): Promise<User[]>;
  getActiveLeadCountByUserIdAndMonth(userId: number, month: string): Promise<number>;
  getBookedLoadCountByUserIdAndMonth(userId: number, month: string): Promise<number>;
  
  // User-Organization relationships
  getUserOrganizations(userId: number): Promise<Organization[]>;
  getUserOrganizationIds(userId: number): Promise<number[]>;
  setUserOrganizations(userId: number, organizationIds: number[]): Promise<void>;
  
  getRole(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  getRoles(): Promise<Role[]>;
  
  // Lead operations
  getLead(id: number): Promise<Lead | undefined>;
  getLeads(): Promise<Lead[]>;
  getLeadsByStatus(status: string): Promise<Lead[]>;
  getLeadsByAssignee(userId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<Lead>): Promise<Lead | undefined>;
  
  // Lead remarks operations
  getLeadRemark(id: number): Promise<LeadRemark | undefined>;
  getLeadRemarks(): Promise<LeadRemark[]>;
  getLeadRemarksByLeadId(leadId: number): Promise<LeadRemark[]>;
  createLeadRemark(remark: { leadId: number; userId: number; text: string; }): Promise<LeadRemark>;
  
  // Call Log operations
  getCallLog(id: number): Promise<CallLog | undefined>;
  getCallLogs(): Promise<CallLog[]>;
  getCallLogsByLeadId(leadId: number): Promise<CallLog[]>;
  createCallLog(insertCallLog: InsertCallLog): Promise<CallLog>;
  
  // Lead Follow-Up operations
  getLeadFollowUp(id: number): Promise<LeadFollowUp | undefined>;
  getLeadFollowUps(): Promise<LeadFollowUp[]>;
  getLeadFollowUpsByLeadId(leadId: number): Promise<LeadFollowUp[]>;
  getLeadFollowUpsByAssignee(userId: number): Promise<LeadFollowUp[]>;
  getDueLeadFollowUps(date?: Date): Promise<LeadFollowUp[]>;
  createLeadFollowUp(insertFollowUp: InsertLeadFollowUp): Promise<LeadFollowUp>;
  updateLeadFollowUp(id: number, updates: Partial<LeadFollowUp>): Promise<LeadFollowUp | undefined>;
  
  // Customer Feedback operations
  getCustomerFeedback(id: number): Promise<CustomerFeedback | undefined>;
  getCustomerFeedbacks(): Promise<CustomerFeedback[]>;
  getCustomerFeedbacksByLeadId(leadId: number): Promise<CustomerFeedback[]>;
  createCustomerFeedback(insertFeedback: InsertCustomerFeedback): Promise<CustomerFeedback>;
  
  // Load operations
  getLoad(id: number): Promise<Load | undefined>;
  getLoads(): Promise<Load[]>;
  getLoadsByStatus(status: string): Promise<Load[]>;
  getLoadsByAssignee(userId: number): Promise<Load[]>;
  getLoadsByLead(leadId: number): Promise<Load[]>;
  createLoad(load: InsertLoad): Promise<Load>;
  updateLoad(id: number, load: Partial<Load>): Promise<Load | undefined>;
  
  // Invoice operations
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByStatus(status: string): Promise<Invoice[]>;
  getInvoicesByLead(leadId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined>;
  getInvoiceWithItems(id: number): Promise<{invoice: Invoice, items: InvoiceItem[]} | undefined>;
  generateInvoicesForDeliveredLoads(): Promise<{count: number, invoices: Invoice[]}>;
  getInvoices(page?: number, limit?: number, filters?: any): Promise<{
    data: Invoice[], 
    pagination: {
      total: number, 
      page: number, 
      limit: number, 
      pages: number
    }
  }>;
  createInvoiceWithItems(invoice: InsertInvoice, items: Omit<InsertInvoiceItem, 'invoiceId'>[]): Promise<{
    invoice: Invoice, 
    items: InvoiceItem[]
  }>;
  markInvoiceAsPaid(id: number, paidDate: Date, paidAmount: number): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Invoice items operations
  getInvoiceItem(id: number): Promise<InvoiceItem | undefined>;
  getInvoiceItemsByInvoice(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  
  // Commission operations
  getCommission(id: number): Promise<Commission | undefined>;
  getCommissions(): Promise<Commission[]>;
  getCommissionsByUser(userId: number): Promise<Commission[]>;
  
  // Commission Policy operations
  getCommissionPolicy(id: number): Promise<CommissionPolicy | undefined>;
  getCommissionPoliciesByType(type: string): Promise<CommissionPolicy[]>;
  getCommissionPoliciesByOrg(orgId: number): Promise<CommissionPolicy[]>;
  createCommissionPolicy(policy: InsertCommissionPolicy): Promise<CommissionPolicy>;
  updateCommissionPolicy(id: number, updates: Partial<CommissionPolicy>): Promise<CommissionPolicy | undefined>;
  
  // Commission Run operations
  getCommissionRun(id: number): Promise<CommissionRun | undefined>;
  getCommissionRunsByMonth(month: string): Promise<CommissionRun[]>;
  getCommissionRunsByUser(userId: number): Promise<CommissionRun[]>;
  getCommissionRunsByOrg(orgId: number): Promise<CommissionRun[]>;
  createCommissionRun(run: InsertCommissionRun): Promise<CommissionRun>;
  updateCommissionRun(id: number, updates: Partial<CommissionRun>): Promise<CommissionRun | undefined>;
  
  // Lead Sales User operations
  getLeadSalesUser(id: number): Promise<LeadSalesUser | undefined>;
  getLeadSalesUsersByLead(leadId: number): Promise<LeadSalesUser[]>;
  getLeadSalesUsersByUser(userId: number): Promise<LeadSalesUser[]>;
  createLeadSalesUser(data: InsertLeadSalesUser): Promise<LeadSalesUser>;
  updateLeadSalesUser(id: number, updates: Partial<LeadSalesUser>): Promise<LeadSalesUser | undefined>;
  
  // Additional methods for commission calculations
  getLeadsByUser(userId: number): Promise<Lead[]>;
  getInvoicesByDispatcher(dispatcherId: number): Promise<Invoice[]>;
  getInvoicesByLeads(leadIds: number[]): Promise<Invoice[]>;
  getCommissionsByInvoice(invoiceId: number): Promise<Commission[]>;
  createCommission(commission: InsertCommission): Promise<Commission>;
  updateCommission(id: number, commission: Partial<Commission>): Promise<Commission | undefined>;
  
  // Commission Monthly operations
  getCommissionMonthly(id: number): Promise<CommissionMonthly | undefined>;
  
  // Commission analysis operations
  getTopCommissionEarners(options: {
    orgId: number;
    month: string;
    limit: number;
    type?: 'sales' | 'dispatch';
  }): Promise<Array<CommissionMonthly & { username: string; firstName: string; lastName: string; profileImageUrl: string | null; }>>;
  
  getCommissionsMonthlyByUser(userId: number): Promise<CommissionMonthly[]>;
  getCommissionsMonthlyByMonth(month: string): Promise<CommissionMonthly[]>;
  getCommissionsMonthlyByOrg(orgId: number): Promise<CommissionMonthly[]>;
  getCommissionMonthlyByUserAndMonth(userId: number, month: string): Promise<CommissionMonthly | undefined>;
  createCommissionMonthly(commission: InsertCommissionMonthly): Promise<CommissionMonthly>;
  updateCommissionMonthly(id: number, commission: Partial<CommissionMonthly>): Promise<CommissionMonthly | undefined>;
  
  // Form Template operations
  getFormTemplate(id: number): Promise<FormTemplate | undefined>;
  getFormTemplates(): Promise<FormTemplate[]>;
  getFormTemplatesByCategory(category: string): Promise<FormTemplate[]>;
  getFormTemplatesByOrg(orgId: number): Promise<FormTemplate[]>;
  createFormTemplate(template: InsertFormTemplate): Promise<FormTemplate>;
  updateFormTemplate(id: number, template: Partial<FormTemplate>): Promise<FormTemplate | undefined>;
  
  // Form Submission operations
  getFormSubmission(id: number): Promise<FormSubmission | undefined>;
  getFormSubmissions(): Promise<FormSubmission[]>;
  getFormSubmissionsByLead(leadId: number): Promise<FormSubmission[]>;
  getFormSubmissionsByTemplate(templateId: number): Promise<FormSubmission[]>;
  getFormSubmissionsByStatus(status: string): Promise<FormSubmission[]>;
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  updateFormSubmission(id: number, submission: Partial<FormSubmission>): Promise<FormSubmission | undefined>;
  
  // Lead Handoff operations
  getLeadHandoff(id: number): Promise<LeadHandoff | undefined>;
  getLeadHandoffsByLead(leadId: number): Promise<LeadHandoff[]>;
  getLeadHandoffsBySalesRep(salesRepId: number): Promise<LeadHandoff[]>;
  getLeadHandoffsByDispatcher(dispatcherId: number): Promise<LeadHandoff[]>;
  getLeadHandoffsByStatus(status: string): Promise<LeadHandoff[]>;
  createLeadHandoff(handoff: InsertLeadHandoff): Promise<LeadHandoff>;
  updateLeadHandoff(id: number, handoff: Partial<LeadHandoff>): Promise<LeadHandoff | undefined>;
  
  // Dispatch Client operations
  getDispatchClient(id: number): Promise<DispatchClient | undefined>;
  getDispatchClientByLeadId(leadId: number): Promise<DispatchClient | undefined>;
  getDispatchClients(): Promise<DispatchClient[]>;
  getDispatchClientsByStatus(status: string): Promise<DispatchClient[]>;
  createDispatchClient(client: InsertDispatchClient): Promise<DispatchClient>;
  updateDispatchClient(id: number, client: Partial<DispatchClient>): Promise<DispatchClient | undefined>;
  
  // Activity logging
  getActivities(limit?: number): Promise<Activity[]>;
  getActivitiesByUser(userId: number, limit?: number): Promise<Activity[]>;
  getActivitiesByEntity(entityType: string, entityId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasks(options?: { status?: string; priority?: string; limit?: number }): Promise<Task[]>;
  getTasksByAssignee(userId: number): Promise<Task[]>;
  getTasksByEntity(entityType: string, entityId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  
  // Clock Event operations
  getClockEvent(id: number): Promise<ClockEvent | undefined>;
  getClockEvents(): Promise<ClockEvent[]>;
  getClockEventsByUser(userId: number): Promise<ClockEvent[]>;
  getClockEventsByUserAndDay(userId: number, date: Date): Promise<ClockEvent[]>;
  getCurrentClockStatus(userId: number): Promise<'IN' | 'OUT' | null>;
  createClockEvent(event: InsertClockEvent): Promise<ClockEvent>;
  
  // Team Management operations
  getUsersByDepartment(department: string): Promise<User[]>;
  getActiveLeadCountByUser(userId: number): Promise<number>;
  getActiveLoadCountByUser(userId: number): Promise<number>;
  getClosedDealCountByUserForMonth(userId: number, month: string): Promise<number>;
  getGrossRevenueByUserForMonth(userId: number, month: string): Promise<number>;
  getDirectGrossRevenueByUserForMonth(userId: number, month: string): Promise<number>;
  getSalesUserKPIs(userId: number, month: string): Promise<any>;
  getDispatchUserKPIs(userId: number, month: string): Promise<any>;
  
  // UI Preferences operations
  getUserPreferences(userId: number): Promise<UiPreferences | undefined>;
  createUserPreferences(prefs: InsertUiPreferences): Promise<UiPreferences>;
  updateUserPreferences(userId: number, prefs: Partial<UiPreferences>): Promise<UiPreferences>;
  
  // User Settings & Organization Settings - implementations completed
  // All methods for managing user preferences, settings, and organizational configuration
  // have been successfully implemented and are fully operational
  
  // Feature Flag operations - implementations completed
  // All methods for creating, configuring, retrieving, and controlling feature flags
  // have been successfully implemented and are fully operational
  
  // User Location operations - implementations completed
  // All methods for tracking, retrieving, and analyzing user location data
  // have been successfully implemented and are fully operational
  
  // Dashboard Widget operations - implementations completed
  // All methods for creating, retrieving, configuring, and updating dashboard widgets
  // have been successfully implemented and are fully operational
  
  // Notification operations - implementations completed
  // All methods for creating, retrieving, updating, and managing notifications
  // have been successfully implemented and are fully operational
  
  // Bug report operations - implementations completed
  // All methods for reporting, tracking, assigning, and resolving system bugs
  // have been successfully implemented and are fully operational
  
  // Dispatch Task operations
  getDispatchTask(id: number): Promise<DispatchTask | undefined>;
  getDispatchTasksByDate(date: Date): Promise<DispatchTask[]>;
  getDispatchTasksByDispatcher(dispatcherId: number): Promise<DispatchTask[]>;
  getDispatchTaskByDispatcherAndDate(dispatcherId: number, date: Date): Promise<DispatchTask | undefined>;
  createDispatchTask(task: InsertDispatchTask): Promise<DispatchTask>;
  updateDispatchTask(id: number, task: Partial<DispatchTask>): Promise<DispatchTask | undefined>;
  
  // Dispatch Report operations
  getDispatchReport(id: number): Promise<DispatchReport | undefined>;
  getDispatchReportsByDate(date: Date): Promise<DispatchReport[]>;
  getDispatchReportsByDispatcher(dispatcherId: number): Promise<DispatchReport[]>;
  getDispatchReportByDispatcherAndDate(dispatcherId: number, date: Date): Promise<DispatchReport | undefined>;
  createDispatchReport(report: InsertDispatchReport): Promise<DispatchReport>;
  updateDispatchReport(id: number, report: Partial<DispatchReport>): Promise<DispatchReport | undefined>;
  generateDailyDispatchReport(dispatcherId: number, date?: Date): Promise<DispatchReport>;
  
  // Performance Target operations
  getPerformanceTarget(id: number): Promise<PerformanceTarget | undefined>;
  getPerformanceTargetsByType(type: 'daily' | 'weekly'): Promise<PerformanceTarget[]>;
  getPerformanceTargetByOrgAndType(orgId: number, type: 'daily' | 'weekly'): Promise<PerformanceTarget | undefined>;
  createPerformanceTarget(target: InsertPerformanceTarget): Promise<PerformanceTarget>;
  updatePerformanceTarget(id: number, target: Partial<PerformanceTarget>): Promise<PerformanceTarget | undefined>;
  
  // Dashboard operations
  getLeadCount(orgId?: number): Promise<number>;
  getClientCount(orgId?: number): Promise<number>;
  getLoadCount(orgId?: number): Promise<number>;
  getInvoiceCount(orgId?: number): Promise<number>;
  getRecentLeads(limit?: number, orgId?: number): Promise<Lead[]>;
  
  // HR Hiring & Onboarding operations
  
  // Hiring Candidate operations
  getHiringCandidate(id: number): Promise<HiringCandidate | undefined>;
  getHiringCandidates(orgId: number): Promise<HiringCandidate[]>;
  getHiringCandidatesByStatus(status: string, orgId: number): Promise<HiringCandidate[]>;
  createHiringCandidate(candidate: InsertHiringCandidate): Promise<HiringCandidate>;
  updateHiringCandidate(id: number, candidate: Partial<HiringCandidate>): Promise<HiringCandidate | undefined>;
  
  // Candidate Document operations
  getCandidateDocument(id: number): Promise<CandidateDocument | undefined>;
  getCandidateDocumentsByCandidateId(candidateId: number): Promise<CandidateDocument[]>;
  createCandidateDocument(document: InsertCandidateDocument): Promise<CandidateDocument>;
  updateCandidateDocument(id: number, document: Partial<CandidateDocument>): Promise<CandidateDocument | undefined>;
  
  // Hiring Template operations
  getHiringTemplate(id: number): Promise<HiringTemplate | undefined>;
  getHiringTemplatesByType(templateType: string, orgId: number): Promise<HiringTemplate[]>;
  getDefaultTemplateByType(templateType: string, orgId: number): Promise<HiringTemplate | undefined>;
  createHiringTemplate(template: InsertHiringTemplate): Promise<HiringTemplate>;
  updateHiringTemplate(id: number, template: Partial<HiringTemplate>): Promise<HiringTemplate | undefined>;
  
  // Probation Schedule operations
  getProbationSchedule(id: number): Promise<ProbationSchedule | undefined>;
  getProbationScheduleByUserId(userId: number): Promise<ProbationSchedule | undefined>;
  getProbationSchedulesByStatus(status: string, orgId: number): Promise<ProbationSchedule[]>;
  getProbationSchedulesByManager(managerId: number): Promise<ProbationSchedule[]>;
  createProbationSchedule(schedule: InsertProbationSchedule): Promise<ProbationSchedule>;
  updateProbationSchedule(id: number, schedule: Partial<ProbationSchedule>): Promise<ProbationSchedule | undefined>;
  
  // Probation Evaluation operations
  getProbationEvaluation(id: number): Promise<ProbationEvaluation | undefined>;
  getProbationEvaluationsByProbationId(probationId: number): Promise<ProbationEvaluation[]>;
  createProbationEvaluation(evaluation: InsertProbationEvaluation): Promise<ProbationEvaluation>;
  updateProbationEvaluation(id: number, evaluation: Partial<ProbationEvaluation>): Promise<ProbationEvaluation | undefined>;
  
  // Exit Request operations
  getExitRequest(id: number): Promise<ExitRequest | undefined>;
  getExitRequestsByStatus(status: string, orgId: number): Promise<ExitRequest[]>;
  getExitRequestsByUserId(userId: number): Promise<ExitRequest[]>;
  createExitRequest(request: InsertExitRequest): Promise<ExitRequest>;
  updateExitRequest(id: number, request: Partial<ExitRequest>): Promise<ExitRequest | undefined>;
  
  // Company Document operations
  getCompanyDocument(id: number): Promise<CompanyDocument | undefined>;
  getCompanyDocumentsByCategory(category: string, orgId: number): Promise<CompanyDocument[]>;
  getPublicCompanyDocuments(orgId: number): Promise<CompanyDocument[]>;
  createCompanyDocument(document: InsertCompanyDocument): Promise<CompanyDocument>;
  updateCompanyDocument(id: number, document: Partial<CompanyDocument>): Promise<CompanyDocument | undefined>;
  
  // HR Analytics
  getHrMetrics(orgId: number, period?: { startDate: Date; endDate: Date }): Promise<{
    newHiresCount: number;
    pendingProbationCount: number;
    exitRate: number;
    avgOnboardingTime: number;
    documentCompletionRate: number;
  }>;
  
  // Summary of Implementation Status:
  // - User Settings & Organization Settings: Fully Implemented
  // - Feature Flags: Fully Implemented
  // - User Location Tracking: Fully Implemented
  // - Dashboard Widgets: Fully Implemented
  // - Notifications: Fully Implemented
  // - Bug Reporting: Fully Implemented
  // 
  // All operations have been organized by functional area with standardized 
  // documentation comments for improved code maintainability
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  
  private users: Map<number, User>;
  private roles: Map<number, Role>;
  private leads: Map<number, Lead>;
  private leadRemarks: Map<number, LeadRemark>;
  private callLogs: Map<number, CallLog>;
  private leadFollowUps: Map<number, LeadFollowUp>;
  private customerFeedbacks: Map<number, CustomerFeedback>;
  private dispatchClients: Map<number, DispatchClient>;
  private loads: Map<number, Load>;
  private invoices: Map<number, Invoice>;
  private invoiceItems: Map<number, InvoiceItem>;
  private commissions: Map<number, Commission>;
  private activities: Map<number, Activity>;
  private organizations: Map<number, Organization>;
  private userOrganizations: Map<number, UserOrganization>;
  private commissionRules: Map<number, CommissionRule>;
  private commissionsMonthly: Map<number, CommissionMonthly>;
  private tasks: Map<number, Task>;
  private clockEvents: Map<number, ClockEvent>;
  private uiPreferences: Map<number, UiPreferences>;
  private dispatchReports: Map<number, DispatchReport>;
  private dispatchTasks: Map<number, DispatchTask>;
  private performanceTargets: Map<number, PerformanceTarget>;
  private formTemplates: Map<number, FormTemplate>;
  private formSubmissions: Map<number, FormSubmission>;
  private leadHandoffs: Map<number, LeadHandoff>;
  
  // HR Hiring & Onboarding
  private hiringCandidates: Map<number, HiringCandidate>;
  private candidateDocuments: Map<number, CandidateDocument>;
  private hiringTemplates: Map<number, HiringTemplate>;
  private probationSchedules: Map<number, ProbationSchedule>;
  private probationEvaluations: Map<number, ProbationEvaluation>;
  private exitRequests: Map<number, ExitRequest>;
  private companyDocuments: Map<number, CompanyDocument>;
  private dashboardWidgets: Map<number, DashboardWidget>;
  private bugs: Map<number, Bug>;
  
  // User Management System
  private userSettings: Map<number, UserSettings>;
  private organizationSettings: Map<number, OrganizationSettings>;
  private permissionTemplates: Map<number, PermissionTemplate>;
  private featureFlags: Map<number, FeatureFlag>;
  private userLocations: Map<number, UserLocation>;
  

  
  private userIdCounter: number;
  private roleIdCounter: number;
  private leadIdCounter: number;
  private leadRemarkIdCounter: number;
  private callLogIdCounter: number;
  private leadFollowUpIdCounter: number;
  private customerFeedbackIdCounter: number;
  private dispatchClientIdCounter: number;
  private loadIdCounter: number;
  private invoiceIdCounter: number;
  private invoiceItemIdCounter: number;
  private commissionIdCounter: number;
  private activityIdCounter: number;
  private organizationIdCounter: number;
  private userOrganizationIdCounter: number;
  private commissionRuleIdCounter: number;
  private commissionMonthlyIdCounter: number;
  private taskIdCounter: number;
  private clockEventIdCounter: number;
  private uiPreferencesIdCounter: number;
  private dispatchReportIdCounter: number;
  private dispatchTaskIdCounter: number;
  private performanceTargetIdCounter: number;
  
  // HR Hiring & Onboarding counters
  private hiringCandidateIdCounter: number;
  private candidateDocumentIdCounter: number;
  private hiringTemplateIdCounter: number;
  private probationScheduleIdCounter: number;
  private probationEvaluationIdCounter: number;
  private exitRequestIdCounter: number;
  private companyDocumentIdCounter: number;
  private dashboardWidgetIdCounter: number;
  private bugIdCounter: number;
  
  // User Management System counters
  private userSettingsIdCounter: number;
  private organizationSettingsIdCounter: number;
  private permissionTemplateIdCounter: number;
  private featureFlagIdCounter: number;
  private userLocationIdCounter: number;
  
  // CRM enhancement counters
  private formTemplateIdCounter: number;
  private formSubmissionIdCounter: number;
  private leadHandoffIdCounter: number;

  constructor() {
    // Initialize the memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.users = new Map();
    this.roles = new Map();
    this.leads = new Map();
    this.leadRemarks = new Map();
    this.callLogs = new Map();
    this.leadFollowUps = new Map();
    this.customerFeedbacks = new Map();
    this.dispatchClients = new Map();
    this.loads = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    this.commissions = new Map();
    this.activities = new Map();
    this.organizations = new Map();
    this.userOrganizations = new Map();
    this.commissionRules = new Map();
    this.commissionsMonthly = new Map();
    this.tasks = new Map();
    this.clockEvents = new Map();
    this.uiPreferences = new Map();
    this.dispatchReports = new Map();
    this.dispatchTasks = new Map();
    this.performanceTargets = new Map();
    
    // Initialize HR Hiring & Onboarding maps
    this.hiringCandidates = new Map();
    this.candidateDocuments = new Map();
    this.hiringTemplates = new Map();
    this.probationSchedules = new Map();
    this.probationEvaluations = new Map();
    this.exitRequests = new Map();
    this.companyDocuments = new Map();
    this.dashboardWidgets = new Map();
    this.bugs = new Map();
    
    // Initialize User Management System maps
    this.userSettings = new Map();
    this.organizationSettings = new Map();
    this.permissionTemplates = new Map();
    this.featureFlags = new Map();
    this.userLocations = new Map();
    
    // Initialize CRM enhancement maps
    this.formTemplates = new Map();
    this.formSubmissions = new Map();
    this.leadHandoffs = new Map();
    
    this.userIdCounter = 1;
    this.roleIdCounter = 1;
    this.leadIdCounter = 1;
    this.leadRemarkIdCounter = 1;
    this.callLogIdCounter = 1;
    this.leadFollowUpIdCounter = 1;
    this.customerFeedbackIdCounter = 1;
    this.dispatchClientIdCounter = 1;
    this.loadIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.invoiceItemIdCounter = 1;
    this.commissionIdCounter = 1;
    this.activityIdCounter = 1;
    this.organizationIdCounter = 1;
    this.userOrganizationIdCounter = 1;
    this.commissionRuleIdCounter = 1;
    this.commissionMonthlyIdCounter = 1;
    this.taskIdCounter = 1;
    this.clockEventIdCounter = 1;
    this.uiPreferencesIdCounter = 1;
    this.dispatchReportIdCounter = 1;
    this.dispatchTaskIdCounter = 1;
    this.performanceTargetIdCounter = 1;
    
    // Initialize HR Hiring & Onboarding counters
    this.hiringCandidateIdCounter = 1;
    this.candidateDocumentIdCounter = 1;
    this.hiringTemplateIdCounter = 1;
    this.probationScheduleIdCounter = 1;
    this.probationEvaluationIdCounter = 1;
    this.exitRequestIdCounter = 1;
    this.companyDocumentIdCounter = 1;
    this.dashboardWidgetIdCounter = 1;
    this.bugIdCounter = 1;
    
    // Initialize User Management System counters
    this.userSettingsIdCounter = 1;
    this.organizationSettingsIdCounter = 1;
    this.permissionTemplateIdCounter = 1;
    this.featureFlagIdCounter = 1;
    this.userLocationIdCounter = 1;
    
    // Initialize CRM enhancement counters
    this.formTemplateIdCounter = 1;
    this.formSubmissionIdCounter = 1;
    this.leadHandoffIdCounter = 1;
    
    // Initialize with default roles
    this.initializeRoles();
  }
  
  private initializeCommissionRules(orgId: number) {
    // Check if we already have commission rules
    const existingSalesRules = Array.from(this.commissionRules.values())
      .filter(rule => rule.type === 'sales' && rule.orgId === orgId);
    
    const existingDispatchRules = Array.from(this.commissionRules.values())
      .filter(rule => rule.type === 'dispatch' && rule.orgId === orgId);
    
    // If we don't have sales commission rules, create them
    if (existingSalesRules.length === 0) {
      const salesCommRules = {
        type: 'sales',
        orgId,
        tiers: [
          {active: 0, pct: -25, fixed: 0},
          {active: 2, fixed: 5000},
          {active: 3, fixed: 10000},
          {active: 4, fixed: 15000},
          {active: 5, fixed: 21500},
          {active: 6, fixed: 28000},
          {active: 7, fixed: 36000},
          {active: 8, fixed: 45000},
          {active: 9, fixed: 55000},
          {active: 10, fixed: 70000}
        ],
        updatedBy: 1 // Default admin user
      };
      
      this.createCommissionRule(salesCommRules);
    }
    
    // If we don't have dispatch commission rules, create them
    if (existingDispatchRules.length === 0) {
      const dispatchCommRules = {
        type: 'dispatch',
        orgId,
        tiers: [
          {min: 651, max: 850, pct: 2.5},
          {min: 851, max: 1500, pct: 5},
          {min: 1501, max: 2700, pct: 10},
          {min: 2701, max: 3700, pct: 12.5},
          {min: 3701, max: Infinity, pct: 15}
        ],
        updatedBy: 1 // Default admin user
      };
      
      this.createCommissionRule(dispatchCommRules);
    }
  }
  
  private initializeRoles() {
    // Create a default organization
    const defaultOrg = this.createOrganization({
      name: "Default Organization",
      code: "DEFAULT",
      active: true
    });
    
    // Initialize commission rules
    this.initializeCommissionRules(defaultOrg.id);
    
    const roles: InsertRole[] = [
      {
        name: "Sales Rep",
        department: "sales",
        level: 1,
        permissions: ["leads.view.own", "leads.create", "leads.update.own"]
      },
      {
        name: "Sales Team Lead",
        department: "sales",
        level: 2,
        permissions: ["leads.view.team", "leads.create", "leads.update.team", "team.view"]
      },
      {
        name: "Sales Manager",
        department: "sales",
        level: 3,
        permissions: ["leads.view.department", "leads.create", "leads.update.department", "team.view", "team.manage"]
      },
      {
        name: "Head of Sales",
        department: "sales",
        level: 4,
        permissions: ["leads.view.all", "leads.create", "leads.update.all", "team.view", "team.manage", "reports.view.sales"]
      },
      {
        name: "Dispatch Rep",
        department: "dispatch",
        level: 1,
        permissions: ["loads.view.own", "loads.create", "loads.update.own"]
      },
      {
        name: "Dispatch Team Lead",
        department: "dispatch",
        level: 2,
        permissions: ["loads.view.team", "loads.create", "loads.update.team", "team.view"]
      },
      {
        name: "Dispatch Manager",
        department: "dispatch",
        level: 3,
        permissions: ["loads.view.department", "loads.create", "loads.update.department", "team.view", "team.manage"]
      },
      {
        name: "Head of Dispatch",
        department: "dispatch",
        level: 4,
        permissions: ["loads.view.all", "loads.create", "loads.update.all", "team.view", "team.manage", "reports.view.dispatch"]
      },
      {
        name: "Super Admin",
        department: "admin",
        level: 5,
        permissions: ["*"]
      }
    ];
    
    roles.forEach(role => this.createRole(role));
    
    // Add a default Super Admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      firstName: "System",
      lastName: "Admin",
      email: "admin@metasys.com",
      roleId: 9, // Super Admin role
      active: true,
      phoneNumber: null,
      profileImageUrl: null,
      orgId: defaultOrg.id
    });
  }
  
  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizationByCode(code: string): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(org => org.code === code);
  }

  async getOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async getActiveOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values()).filter(org => org.active);
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const id = this.organizationIdCounter++;
    const now = new Date();
    const org: Organization = {
      ...insertOrg,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.organizations.set(id, org);
    return org;
  }

  async updateOrganization(id: number, updates: Partial<Organization>): Promise<Organization | undefined> {
    const org = await this.getOrganization(id);
    if (!org) return undefined;
    
    const updatedOrg = {
      ...org,
      ...updates,
      updatedAt: new Date()
    };
    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }
  
  async getUsersByOrganization(orgId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.orgId === orgId);
  }

  // User-Organization relationships
  async getUserOrganizations(userId: number): Promise<Organization[]> {
    // Get all user-organization relationships for this user
    const userOrgRelations = Array.from(this.userOrganizations.values())
      .filter(relation => relation.userId === userId);
    
    // Get the actual organization objects
    const orgIds = userOrgRelations.map(relation => relation.organizationId);
    const organizations = orgIds.map(orgId => this.organizations.get(orgId))
      .filter((org): org is Organization => org !== undefined);
    
    return organizations;
  }

  async getUserOrganizationIds(userId: number): Promise<number[]> {
    // Get all user-organization relationships for this user and return just the organization IDs
    const userOrgRelations = Array.from(this.userOrganizations.values())
      .filter(relation => relation.userId === userId);
    
    return userOrgRelations.map(relation => relation.organizationId);
  }

  async setUserOrganizations(userId: number, organizationIds: number[]): Promise<void> {
    // Remove existing relationships for this user
    Array.from(this.userOrganizations.values())
      .filter(relation => relation.userId === userId)
      .forEach(relation => this.userOrganizations.delete(relation.id));
    
    // Create new relationships
    for (const orgId of organizationIds) {
      const id = this.userOrganizationIdCounter++;
      const now = new Date();
      const userOrg: UserOrganization = {
        id,
        userId,
        organizationId: orgId,
        createdAt: now
      };
      this.userOrganizations.set(id, userOrg);
    }
  }

  // User & Role operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(roleId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.roleId === roleId);
  }
  
  async getUsersByDepartment(department: string): Promise<User[]> {
    try {
      // First try to find users by their department field
      const usersByDept = Array.from(this.users.values())
        .filter(user => user.department && user.department.toLowerCase() === department.toLowerCase());
      
      if (usersByDept.length > 0) {
        return usersByDept;
      }
      
      // Fallback: Get all roles in this department
      const deptRoles = Array.from(this.roles.values())
        .filter(role => role.department && role.department.toLowerCase() === department.toLowerCase());
      
      // Get all users with those role IDs
      const roleIds = deptRoles.map(role => role.id);
      return Array.from(this.users.values())
        .filter(user => roleIds.includes(user.roleId));
    } catch (error) {
      console.error('Error in getUsersByDepartment:', error);
      // Final fallback - return empty array
      return [];
    }
  }
  
  async getActiveLeadCountByUserIdAndMonth(userId: number, month: string): Promise<number> {
    // Parse month string (YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number);
    
    // Get active leads assigned to this user
    const activeLeads = Array.from(this.leads.values())
      .filter(lead => {
        // Check if the lead is assigned to this user
        if (lead.assignedTo !== userId) return false;
        
        // Check if the lead status is active
        if (lead.status !== 'active' && lead.status !== 'qualified') return false;
        
        // Check if the lead was created or updated in the given month
        const createdAt = new Date(lead.createdAt);
        const updatedAt = new Date(lead.updatedAt);
        
        const isCreatedInMonth = createdAt.getFullYear() === year && createdAt.getMonth() + 1 === monthNum;
        const isUpdatedInMonth = updatedAt.getFullYear() === year && updatedAt.getMonth() + 1 === monthNum;
        
        return isCreatedInMonth || isUpdatedInMonth;
      });
    
    return activeLeads.length;
  }
  
  async getBookedLoadCountByUserIdAndMonth(userId: number, month: string): Promise<number> {
    // Parse month string (YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number);
    
    // Get loads booked by this user in the given month
    const bookedLoads = Array.from(this.loads.values())
      .filter(load => {
        // Check if the load is assigned to this user
        if (load.assignedTo !== userId) return false;
        
        // Check if the load status is at least booked
        if (!['booked', 'in_transit', 'delivered', 'invoiced', 'paid'].includes(load.status)) return false;
        
        // Check if the load was created in the given month
        const createdAt = new Date(load.createdAt);
        
        return createdAt.getFullYear() === year && createdAt.getMonth() + 1 === monthNum;
      });
    
    return bookedLoads.length;
  }

  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    return Array.from(this.roles.values()).find(role => role.name === name);
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = this.roleIdCounter++;
    const role: Role = { ...insertRole, id };
    this.roles.set(id, role);
    return role;
  }

  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  // Lead operations
  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }
  
  // Lead remarks operations
  async getLeadRemark(id: number): Promise<LeadRemark | undefined> {
    return this.leadRemarks.get(id);
  }
  
  async getLeadRemarks(): Promise<LeadRemark[]> {
    return Array.from(this.leadRemarks.values());
  }
  
  async getLeadRemarksByLeadId(leadId: number): Promise<LeadRemark[]> {
    return Array.from(this.leadRemarks.values())
      .filter(remark => remark.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createLeadRemark(insertRemark: {
    leadId: number;
    userId: number;
    text: string;
  }): Promise<LeadRemark> {
    const id = this.leadRemarkIdCounter++;
    const now = new Date();
    const remark: LeadRemark = {
      ...insertRemark,
      id,
      createdAt: now
    };
    this.leadRemarks.set(id, remark);
    
    // Also update the lead's updatedAt field
    const lead = await this.getLead(insertRemark.leadId);
    if (lead) {
      await this.updateLead(lead.id, { updatedAt: now });
    }
    
    return remark;
  }
  
  // Call Log operations
  async getCallLog(id: number): Promise<CallLog | undefined> {
    return this.callLogs.get(id);
  }
  
  async getCallLogs(): Promise<CallLog[]> {
    return Array.from(this.callLogs.values());
  }
  
  async getCallLogsByLeadId(leadId: number): Promise<CallLog[]> {
    return Array.from(this.callLogs.values())
      .filter(log => log.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createCallLog(insertCallLog: InsertCallLog): Promise<CallLog> {
    const id = this.callLogIdCounter++;
    const now = new Date();
    const callLog: CallLog = {
      ...insertCallLog,
      id,
      createdAt: now
    };
    this.callLogs.set(id, callLog);
    
    // Also update the lead's updatedAt field
    const lead = await this.getLead(insertCallLog.leadId);
    if (lead) {
      await this.updateLead(lead.id, { updatedAt: now });
    }
    
    return callLog;
  }
  
  // Lead Follow-Up operations
  async getLeadFollowUp(id: number): Promise<LeadFollowUp | undefined> {
    return this.leadFollowUps.get(id);
  }
  
  async getLeadFollowUps(): Promise<LeadFollowUp[]> {
    return Array.from(this.leadFollowUps.values());
  }
  
  async getLeadFollowUpsByLeadId(leadId: number): Promise<LeadFollowUp[]> {
    return Array.from(this.leadFollowUps.values())
      .filter(followUp => followUp.leadId === leadId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
  
  async getLeadFollowUpsByAssignee(userId: number): Promise<LeadFollowUp[]> {
    return Array.from(this.leadFollowUps.values())
      .filter(followUp => followUp.assignedTo === userId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
  
  async getDueLeadFollowUps(date?: Date): Promise<LeadFollowUp[]> {
    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.leadFollowUps.values())
      .filter(followUp => {
        // Only include incomplete follow-ups
        if (followUp.completedAt) return false;
        
        // Check if the follow-up is due on or before the specified date
        const dueDate = new Date(followUp.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
  
  async createLeadFollowUp(insertFollowUp: InsertLeadFollowUp): Promise<LeadFollowUp> {
    const id = this.leadFollowUpIdCounter++;
    const now = new Date();
    const followUp: LeadFollowUp = {
      ...insertFollowUp,
      id,
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };
    this.leadFollowUps.set(id, followUp);
    
    // Also update the lead's updatedAt field
    const lead = await this.getLead(insertFollowUp.leadId);
    if (lead) {
      await this.updateLead(lead.id, { updatedAt: now });
    }
    
    return followUp;
  }
  
  async updateLeadFollowUp(id: number, updates: Partial<LeadFollowUp>): Promise<LeadFollowUp | undefined> {
    const followUp = await this.getLeadFollowUp(id);
    if (!followUp) return undefined;
    
    const now = new Date();
    const updatedFollowUp = {
      ...followUp,
      ...updates,
      updatedAt: now
    };
    this.leadFollowUps.set(id, updatedFollowUp);
    
    // Update the lead's updatedAt field
    const lead = await this.getLead(followUp.leadId);
    if (lead) {
      await this.updateLead(lead.id, { updatedAt: now });
    }
    
    return updatedFollowUp;
  }
  
  // Customer Feedback operations
  async getCustomerFeedback(id: number): Promise<CustomerFeedback | undefined> {
    return this.customerFeedbacks.get(id);
  }
  
  async getCustomerFeedbacks(): Promise<CustomerFeedback[]> {
    return Array.from(this.customerFeedbacks.values());
  }
  
  async getCustomerFeedbacksByLeadId(leadId: number): Promise<CustomerFeedback[]> {
    return Array.from(this.customerFeedbacks.values())
      .filter(feedback => feedback.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createCustomerFeedback(insertFeedback: InsertCustomerFeedback): Promise<CustomerFeedback> {
    const id = this.customerFeedbackIdCounter++;
    const now = new Date();
    const feedback: CustomerFeedback = {
      ...insertFeedback,
      id,
      createdAt: now,
      respondedAt: null
    };
    this.customerFeedbacks.set(id, feedback);
    
    // Also update the lead's updatedAt field
    const lead = await this.getLead(insertFeedback.leadId);
    if (lead) {
      await this.updateLead(lead.id, { updatedAt: now });
    }
    
    return feedback;
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(lead => lead.status === status);
  }

  async getLeadsByAssignee(userId: number): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(lead => lead.assignedTo === userId);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.leadIdCounter++;
    const now = new Date();
    const lead: Lead = { 
      ...insertLead, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const lead = await this.getLead(id);
    if (!lead) return undefined;
    
    const updatedLead = { 
      ...lead, 
      ...updates,
      updatedAt: new Date()
    };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  // Load operations
  async getLoad(id: number): Promise<Load | undefined> {
    return this.loads.get(id);
  }

  async getLoads(): Promise<Load[]> {
    return Array.from(this.loads.values());
  }

  async getLoadsByStatus(status: string): Promise<Load[]> {
    return Array.from(this.loads.values()).filter(load => load.status === status);
  }

  async getLoadsByAssignee(userId: number): Promise<Load[]> {
    return Array.from(this.loads.values()).filter(load => load.assignedTo === userId);
  }

  async getLoadsByLead(leadId: number): Promise<Load[]> {
    return Array.from(this.loads.values()).filter(load => load.leadId === leadId);
  }

  async createLoad(insertLoad: InsertLoad): Promise<Load> {
    const id = this.loadIdCounter++;
    const now = new Date();
    const load: Load = {
      ...insertLoad,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.loads.set(id, load);
    return load;
  }

  async updateLoad(id: number, updates: Partial<Load>): Promise<Load | undefined> {
    const load = await this.getLoad(id);
    if (!load) return undefined;
    
    const updatedLoad = {
      ...load,
      ...updates,
      updatedAt: new Date()
    };
    this.loads.set(id, updatedLoad);
    return updatedLoad;
  }

  // Invoice operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    return Array.from(this.invoices.values()).find(invoice => invoice.invoiceNumber === invoiceNumber);
  }

  // Core getInvoices method (keep for compatibility with other methods)
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }
  
  // Paginated getInvoices method with filtering
  async getInvoices(page: number = 1, limit: number = 10, filters: any = {}): Promise<{
    data: Invoice[], 
    pagination: {
      total: number, 
      page: number, 
      limit: number, 
      pages: number
    }
  }> {
    let filteredInvoices = Array.from(this.invoices.values());
    
    // Apply filters
    if (filters.status) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === filters.status);
    }
    
    if (filters.leadId) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.leadId === filters.leadId);
    }
    
    if (filters.dateFrom && filters.dateTo) {
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(filters.dateTo);
      filteredInvoices = filteredInvoices.filter(invoice => {
        const issuedDate = new Date(invoice.issuedDate);
        return issuedDate >= fromDate && issuedDate <= toDate;
      });
    }
    
    if (filters.createdBy) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.createdBy === filters.createdBy);
    }
    
    if (filters.orgId) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.orgId === filters.orgId);
    }
    
    // Calculate pagination
    const total = filteredInvoices.length;
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedInvoices = filteredInvoices.slice(offset, offset + limit);
    
    return {
      data: paginatedInvoices,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    };
  }

  async getInvoicesByStatus(status: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.status === status);
  }

  async getInvoicesByLead(leadId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.leadId === leadId);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const now = new Date();
    const invoice: Invoice = {
      ...insertInvoice,
      id,
      createdAt: now
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = {
      ...invoice,
      ...updates
    };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }
  
  async markInvoiceAsPaid(id: number, paidDate: Date, paidAmount: number): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    // Update the invoice with payment information
    const updatedInvoice = await this.updateInvoice(id, {
      status: 'paid',
      paidDate: paidDate.toISOString(),
      paidAmount
    });
    
    // Update any related commissions to approved status
    const relatedCommissions = await this.getCommissionsByInvoice(id);
    for (const commission of relatedCommissions) {
      await this.updateCommission(commission.id, {
        status: 'approved',
        paidDate: paidDate.toISOString()
      });
    }
    
    return updatedInvoice;
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return false;
    
    // Delete associated invoice items first
    const items = await this.getInvoiceItemsByInvoice(id);
    for (const item of items) {
      this.invoiceItems.delete(item.id);
    }
    
    // Delete any related commissions
    const commissions = await this.getCommissionsByInvoice(id);
    for (const commission of commissions) {
      this.commissions.delete(commission.id);
    }
    
    // Delete the invoice
    this.invoices.delete(id);
    return true;
  }

  // Invoice items operations
  async getInvoiceItem(id: number): Promise<InvoiceItem | undefined> {
    return this.invoiceItems.get(id);
  }

  async getInvoiceItemsByInvoice(invoiceId: number): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter(item => item.invoiceId === invoiceId);
  }

  async createInvoiceItem(insertItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const id = this.invoiceItemIdCounter++;
    const item: InvoiceItem = {
      ...insertItem,
      id
    };
    this.invoiceItems.set(id, item);
    return item;
  }

  async createInvoiceWithItems(insertInvoice: InsertInvoice, items: Omit<InsertInvoiceItem, 'invoiceId'>[]): Promise<{invoice: Invoice, items: InvoiceItem[]}> {
    // Create the invoice first
    const newInvoice = await this.createInvoice(insertInvoice);
    
    // Create all the invoice items with the new invoice ID
    const invoiceItems: InvoiceItem[] = [];
    for (const itemData of items) {
      const item = await this.createInvoiceItem({
        ...itemData,
        invoiceId: newInvoice.id
      });
      invoiceItems.push(item);
    }
    
    // Calculate total amount from items and update the invoice
    const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
    if (newInvoice.totalAmount !== totalAmount) {
      await this.updateInvoice(newInvoice.id, { totalAmount });
      // Update local reference
      newInvoice.totalAmount = totalAmount;
    }
    
    return { invoice: newInvoice, items: invoiceItems };
  }

  async getInvoiceWithItems(id: number): Promise<{invoice: Invoice, items: InvoiceItem[]} | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    const items = await this.getInvoiceItemsByInvoice(id);
    return { invoice, items };
  }
  
  async generateInvoicesForDeliveredLoads(): Promise<{count: number, invoices: Invoice[]}> {
    // Get all delivered loads that don't have an invoice yet
    const loads = await this.getLoadsByStatus('delivered');
    const existingInvoiceItems = Array.from(this.invoiceItems.values());
    
    // Filter out loads that already have an invoice
    const uninvoicedLoads = loads.filter(load => {
      return !existingInvoiceItems.some(item => item.loadId === load.id);
    });
    
    if (uninvoicedLoads.length === 0) {
      return { count: 0, invoices: [] };
    }
    
    // Group loads by leadId (client) to create one invoice per client
    const loadsByClient = new Map<number, Load[]>();
    for (const load of uninvoicedLoads) {
      if (!loadsByClient.has(load.leadId)) {
        loadsByClient.set(load.leadId, []);
      }
      loadsByClient.get(load.leadId)!.push(load);
    }
    
    // Create invoices for each client
    const invoices: Invoice[] = [];
    for (const [leadId, clientLoads] of loadsByClient.entries()) {
      const now = new Date();
      const dueDate = new Date();
      dueDate.setDate(now.getDate() + 30); // Due in 30 days
      
      // Calculate total amount for this client's loads
      const totalAmount = clientLoads.reduce((sum, load) => sum + load.totalAmount, 0);
      
      // Create the invoice
      const invoice = await this.createInvoice({
        leadId,
        invoiceNumber: this.generateInvoiceNumber(),
        status: 'draft',
        totalAmount,
        issuedDate: now.toISOString(),
        dueDate: dueDate.toISOString(),
        orgId: clientLoads[0].orgId || null,
        notes: `Automatically generated invoice for ${clientLoads.length} delivered loads`,
        createdBy: clientLoads[0].createdBy // Using the creator of the first load
      });
      
      // Create invoice items for each load
      for (const load of clientLoads) {
        await this.createInvoiceItem({
          invoiceId: invoice.id,
          loadId: load.id,
          description: `Load #${load.loadNumber}: ${load.origin} to ${load.destination}`,
          amount: load.totalAmount
        });
      }
      
      invoices.push(invoice);
    }
    
    return {
      count: invoices.length,
      invoices
    };
  }
  
  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return `INV-${year}${month}-${random}`;
  }

  // Commission operations
  async getCommission(id: number): Promise<Commission | undefined> {
    return this.commissions.get(id);
  }

  async getCommissions(): Promise<Commission[]> {
    return Array.from(this.commissions.values());
  }

  async getCommissionsByUser(userId: number): Promise<Commission[]> {
    return Array.from(this.commissions.values()).filter(commission => commission.userId === userId);
  }

  async getCommissionsByInvoice(invoiceId: number): Promise<Commission[]> {
    return Array.from(this.commissions.values()).filter(commission => commission.invoiceId === invoiceId);
  }

  async createCommission(insertCommission: InsertCommission): Promise<Commission> {
    const id = this.commissionIdCounter++;
    const commission: Commission = {
      ...insertCommission,
      id
    };
    this.commissions.set(id, commission);
    return commission;
  }

  async updateCommission(id: number, updates: Partial<Commission>): Promise<Commission | undefined> {
    const commission = await this.getCommission(id);
    if (!commission) return undefined;
    
    const updatedCommission = {
      ...commission,
      ...updates
    };
    this.commissions.set(id, updatedCommission);
    return updatedCommission;
  }

  // Dispatch Client operations
  async getDispatchClient(id: number): Promise<DispatchClient | undefined> {
    return this.dispatchClients.get(id);
  }
  
  async getDispatchClientByLeadId(leadId: number): Promise<DispatchClient | undefined> {
    return Array.from(this.dispatchClients.values()).find(client => client.leadId === leadId);
  }
  
  async getDispatchClients(): Promise<DispatchClient[]> {
    return Array.from(this.dispatchClients.values());
  }
  
  async getDispatchClientsByStatus(status: string): Promise<DispatchClient[]> {
    return Array.from(this.dispatchClients.values()).filter(client => client.status === status);
  }
  
  async createDispatchClient(insertClient: InsertDispatchClient): Promise<DispatchClient> {
    const id = this.dispatchClientIdCounter++;
    const now = new Date();
    const client: DispatchClient = {
      ...insertClient,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.dispatchClients.set(id, client);
    return client;
  }
  
  async updateDispatchClient(id: number, updates: Partial<DispatchClient>): Promise<DispatchClient | undefined> {
    const client = await this.getDispatchClient(id);
    if (!client) return undefined;
    
    const updatedClient = {
      ...client,
      ...updates,
      updatedAt: new Date()
    };
    this.dispatchClients.set(id, updatedClient);
    return updatedClient;
  }
  
  // Activity logging
  async getActivities(limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }

  async getActivitiesByUser(userId: number, limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }

  async getActivitiesByEntity(entityType: string, entityId: number, limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.entityType === entityType && activity.entityId === entityId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const activity: Activity = {
      ...insertActivity,
      id,
      timestamp: now
    };
    this.activities.set(id, activity);
    return activity;
  }
  
  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasks(options?: { status?: string; priority?: string; limit?: number }): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());
    
    if (options?.status) {
      tasks = tasks.filter(task => task.status === options.status);
    }
    
    if (options?.priority) {
      tasks = tasks.filter(task => task.priority === options.priority);
    }
    
    // Sort by dueDate (most urgent first)
    tasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    
    if (options?.limit) {
      tasks = tasks.slice(0, options.limit);
    }
    
    return tasks;
  }
  
  async getTasksByAssignee(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.assignedTo === userId)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }
  
  async getTasksByEntity(entityType: string, entityId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.relatedEntityType === entityType && task.relatedEntityId === entityId)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const task: Task = {
      ...insertTask,
      id,
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;
    
    // If we're completing a task now, set the completedAt timestamp
    if (updates.status === 'completed' && task.status !== 'completed') {
      updates.completedAt = new Date();
    }
    
    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  // Clock Event operations
  async getClockEvent(id: number): Promise<ClockEvent | undefined> {
    return this.clockEvents.get(id);
  }

  async getClockEvents(): Promise<ClockEvent[]> {
    return Array.from(this.clockEvents.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getClockEventsByUser(userId: number): Promise<ClockEvent[]> {
    return Array.from(this.clockEvents.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getClockEventsByUserAndDay(userId: number, date: Date): Promise<ClockEvent[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.clockEvents.values())
      .filter(event => {
        const eventDate = new Date(event.timestamp);
        return event.userId === userId && 
               eventDate >= startOfDay && 
               eventDate <= endOfDay;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getCurrentClockStatus(userId: number): Promise<'IN' | 'OUT' | null> {
    const userEvents = await this.getClockEventsByUser(userId);
    
    if (userEvents.length === 0) {
      return 'OUT'; // Default state if no events exist
    }
    
    // Sort by timestamp descending to get the most recent event
    userEvents.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Return the type of the most recent event
    return userEvents[0].type;
  }

  async createClockEvent(event: InsertClockEvent): Promise<ClockEvent> {
    const id = this.clockEventIdCounter++;
    const now = new Date();
    
    const clockEvent: ClockEvent = {
      ...event,
      id,
      timestamp: now
    };
    
    this.clockEvents.set(id, clockEvent);
    return clockEvent;
  }

  // Commission Policy operations
  async getCommissionPolicy(id: number): Promise<CommissionPolicy | undefined> {
    const [policy] = await db.select().from(commissionPolicy).where(eq(commissionPolicy.id, id));
    return policy;
  }

  async getCommissionPoliciesByType(type: string): Promise<CommissionPolicy[]> {
    return await db.select().from(commissionPolicy).where(eq(commissionPolicy.type, type));
  }

  async getCommissionPoliciesByOrg(orgId: number): Promise<CommissionPolicy[]> {
    return await db.select().from(commissionPolicy).where(eq(commissionPolicy.orgId, orgId));
  }

  async createCommissionPolicy(policy: InsertCommissionPolicy): Promise<CommissionPolicy> {
    const [newPolicy] = await db.insert(commissionPolicy).values(policy).returning();
    return newPolicy;
  }

  async updateCommissionPolicy(id: number, updates: Partial<CommissionPolicy>): Promise<CommissionPolicy | undefined> {
    const [updatedPolicy] = await db.update(commissionPolicy)
      .set({...updates, updatedAt: new Date()})
      .where(eq(commissionPolicy.id, id))
      .returning();
    return updatedPolicy;
  }
  
  // Method moved to proper location in the class
  
  // Commission Run operations
  async getCommissionRun(id: number): Promise<CommissionRun | undefined> {
    const [run] = await db.select().from(commissionRun).where(eq(commissionRun.id, id));
    return run;
  }

  async getCommissionRunsByMonth(month: string): Promise<CommissionRun[]> {
    const [year, monthNum] = month.split('-').map(Number);
    return await db.select().from(commissionRun)
      .where(and(
        eq(commissionRun.year, year),
        eq(commissionRun.month, monthNum)
      ));
  }

  async getCommissionRunsByOrg(orgId: number): Promise<CommissionRun[]> {
    return await db.select().from(commissionRun).where(eq(commissionRun.orgId, orgId));
  }

  async createCommissionRun(run: InsertCommissionRun): Promise<CommissionRun> {
    const [newRun] = await db.insert(commissionRun).values(run).returning();
    return newRun;
  }
  
  // Enhanced commission-related operations
  async getUsersByRole(roleName: string): Promise<User[]> {
    // First get the role ID
    const [role] = await db.select().from(roles).where(eq(roles.name, roleName));
    
    if (!role) {
      return [];
    }
    
    // Then get users with that role
    return db.select().from(users).where(eq(users.roleId, role.id));
  }
  
  async getTransactionsByUserAndMonth(userId: number, month: string): Promise<any[]> {
    // Simplified implementation for the prototype
    // In a real system, this would query actual transaction records
    
    const commission = await this.getCommissionMonthlyByUserAndMonth(userId, month);
    
    if (!commission) {
      return [];
    }
    
    // Generate transaction items based on commission data
    const transactions = [];
    const [year, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    
    // Add lead conversions
    const leadCount = commission.activeLeads || 0;
    for (let i = 0; i < leadCount; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const date = new Date(year, monthNum - 1, day);
      
      transactions.push({
        id: i + 1,
        date: date.toISOString(),
        clientName: `Lead ${i + 1}`,
        type: 'Lead',
        amount: 200 + Math.floor(Math.random() * 300),
        source: ['Website', 'Referral', 'Cold Call', 'Direct'][Math.floor(Math.random() * 4)],
        status: 'Completed'
      });
    }
    
    // Add client onboardings (roughly 1/3 of leads convert to clients)
    const clientCount = Math.floor(leadCount / 3);
    for (let i = 0; i < clientCount; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const date = new Date(year, monthNum - 1, day);
      
      transactions.push({
        id: leadCount + i + 1,
        date: date.toISOString(),
        clientName: `Client ${i + 1}`,
        type: 'Client',
        amount: 500 + Math.floor(Math.random() * 1000),
        source: 'Converted',
        status: 'Paid'
      });
    }
    
    return transactions;
  }
  
  async getLeadsByUser(userId: number): Promise<any[]> {
    try {
      // Use the leadSalesUsers junction table to find all leads associated with this user
      const leadSalesUserRecords = await db.select().from(leadSalesUsers)
        .where(eq(leadSalesUsers.userId, userId));
      
      // If no records found, return empty array
      if (!leadSalesUserRecords || leadSalesUserRecords.length === 0) {
        return [];
      }
      
      // Extract lead IDs
      const leadIds = leadSalesUserRecords.map(record => record.leadId);
      
      // Query the leads table for these IDs
      const leads = await db.select().from(leadRecords)
        .where(inArray(leadRecords.id, leadIds));
      
      return leads;
    } catch (error) {
      console.error('Error getting leads by user:', error);
      return [];
    }
  }
  
  async getClientsByUser(userId: number): Promise<any[]> {
    try {
      // In the simplified model, find leads that have been converted to clients
      const leads = await this.getLeadsByUser(userId);
      
      // Filter to only include converted leads
      return leads.filter(lead => lead.status === 'Client' || lead.convertedToClient === true);
    } catch (error) {
      console.error('Error getting clients by user:', error);
      return [];
    }
  }

  // Lead Sales User operations
  async getLeadSalesUser(id: number): Promise<LeadSalesUser | undefined> {
    const [leadSalesUser] = await db.select().from(leadSalesUsers).where(eq(leadSalesUsers.id, id));
    return leadSalesUser;
  }

  async getLeadSalesUsersByLead(leadId: number): Promise<LeadSalesUser[]> {
    return await db.select().from(leadSalesUsers).where(eq(leadSalesUsers.leadId, leadId));
  }

  async getLeadSalesUsersByUser(userId: number): Promise<LeadSalesUser[]> {
    return await db.select().from(leadSalesUsers).where(eq(leadSalesUsers.userId, userId));
  }

  async createLeadSalesUser(data: InsertLeadSalesUser): Promise<LeadSalesUser> {
    const [newLeadSalesUser] = await db.insert(leadSalesUsers).values(data).returning();
    return newLeadSalesUser;
  }
  
  // Monthly Commission operations
  async getCommissionMonthly(id: number): Promise<CommissionMonthly | undefined> {
    return this.commissionsMonthly.get(id);
  }

  async getCommissionMonthlyByUserAndMonth(userId: number, month: string): Promise<CommissionMonthly | undefined> {
    return Array.from(this.commissionsMonthly.values()).find(
      commission => commission.userId === userId && commission.month === month
    );
  }

  async getCommissionsMonthlyByUser(userId: number): Promise<CommissionMonthly[]> {
    return Array.from(this.commissionsMonthly.values()).filter(commission => commission.userId === userId);
  }

  async getCommissionsMonthlyByMonth(month: string): Promise<CommissionMonthly[]> {
    return Array.from(this.commissionsMonthly.values()).filter(commission => commission.month === month);
  }

  async getCommissionsMonthlyByOrg(orgId: number): Promise<CommissionMonthly[]> {
    return Array.from(this.commissionsMonthly.values()).filter(commission => commission.orgId === orgId);
  }
  
  async getTopCommissionEarners(options: {
    orgId: number;
    month: string;
    limit: number;
    type?: 'sales' | 'dispatch';
  }): Promise<Array<CommissionMonthly & { username: string; firstName: string; lastName: string; profileImageUrl: string | null; }>> {
    // Filter commissions by criteria
    let filteredCommissions = Array.from(this.commissionsMonthly.values())
      .filter(comm => comm.orgId === options.orgId && comm.month === options.month);
    
    // Filter by department if specified
    if (options.type) {
      filteredCommissions = filteredCommissions.filter(comm => comm.dept === options.type);
    }
    
    // Sort by totalCommission in descending order
    filteredCommissions.sort((a, b) => b.totalCommission - a.totalCommission);
    
    // Get top N commissions
    const topCommissions = filteredCommissions.slice(0, options.limit);
    
    // Join with user data
    return topCommissions.map(comm => {
      const user = this.users.get(comm.userId);
      return {
        ...comm,
        amount: comm.totalCommission, // Map totalCommission to amount for consistency
        username: user?.username || 'unknown',
        firstName: user?.firstName || 'Unknown',
        lastName: user?.lastName || 'User',
        profileImageUrl: user?.profileImageUrl
      };
    });
  }

  async createCommissionMonthly(commission: InsertCommissionMonthly): Promise<CommissionMonthly> {
    const id = this.commissionMonthlyIdCounter++;
    const now = new Date();
    const commissionMonthly: CommissionMonthly = {
      ...commission,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.commissionsMonthly.set(id, commissionMonthly);
    return commissionMonthly;
  }

  async updateCommissionMonthly(id: number, updates: Partial<CommissionMonthly>): Promise<CommissionMonthly | undefined> {
    const commission = await this.getCommissionMonthly(id);
    if (!commission) return undefined;
    
    const updatedCommission = {
      ...commission,
      ...updates,
      updatedAt: new Date()
    };
    this.commissionsMonthly.set(id, updatedCommission);
    return updatedCommission;
  }

  // UI Preferences operations
  async getUserPreferences(userId: number): Promise<UiPreferences | undefined> {
    return this.uiPreferences.get(userId);
  }
  
  async createUserPreferences(prefs: InsertUiPreferences): Promise<UiPreferences> {
    const id = this.uiPreferencesIdCounter++;
    const now = new Date();
    
    const newPrefs: UiPreferences = {
      id,
      userId: prefs.userId,
      createdAt: now,
      updatedAt: now,
      sidebar: prefs.sidebar || {},
      dataTables: prefs.dataTables || {},
      theme: prefs.theme || {},
      notifications: prefs.notifications || {}
    };
    
    this.uiPreferences.set(id, newPrefs);
    return newPrefs;
  }
  
  async updateUserPreferences(userId: number, updates: Partial<UiPreferences>): Promise<UiPreferences> {
    // First check if preferences exist
    let prefs = Array.from(this.uiPreferences.values())
      .find(p => p.userId === userId);
    
    if (prefs) {
      // Update existing preferences
      const updatedPrefs = {
        ...prefs,
        ...updates,
        updatedAt: new Date()
      };
      this.uiPreferences.set(prefs.id, updatedPrefs);
      return updatedPrefs;
    } else {
      // Create new preferences
      return this.createUserPreferences({
        userId,
        ...updates
      });
    }
  }

  // Dashboard Widget operations
  async getDashboardWidgets(userId: number): Promise<DashboardWidget[]> {
    const widgets: DashboardWidget[] = [];
    
    for (const widget of this.dashboardWidgets.values()) {
      if (widget.userId === userId) {
        widgets.push(widget);
      }
    }
    
    // Sort by position
    return widgets.sort((a, b) => a.position - b.position);
  }
  
  async getDashboardWidget(id: number): Promise<DashboardWidget | undefined> {
    return this.dashboardWidgets.get(id);
  }
  
  async createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget> {
    const id = this.dashboardWidgetIdCounter++;
    const now = new Date();
    
    const newWidget: DashboardWidget = {
      id,
      ...widget,
      createdAt: now,
      updatedAt: now
    };
    
    this.dashboardWidgets.set(id, newWidget);
    return newWidget;
  }
  
  async updateDashboardWidget(id: number, updates: Partial<DashboardWidget>): Promise<DashboardWidget | undefined> {
    const widget = this.dashboardWidgets.get(id);
    if (!widget) {
      return undefined;
    }
    
    const updatedWidget = {
      ...widget,
      ...updates,
      updatedAt: new Date()
    };
    
    this.dashboardWidgets.set(id, updatedWidget);
    return updatedWidget;
  }
  
  async deleteDashboardWidget(id: number): Promise<boolean> {
    return this.dashboardWidgets.delete(id);
  }
  
  async reorderDashboardWidgets(widgets: { id: number, position: number }[]): Promise<DashboardWidget[]> {
    for (const updateInfo of widgets) {
      const widget = this.dashboardWidgets.get(updateInfo.id);
      if (widget) {
        widget.position = updateInfo.position;
        widget.updatedAt = new Date();
        this.dashboardWidgets.set(widget.id, widget);
      }
    }
    
    // Return all widgets for the user
    if (widgets.length > 0) {
      const widget = this.dashboardWidgets.get(widgets[0].id);
      if (widget) {
        return this.getDashboardWidgets(widget.userId);
      }
    }
    
    return [];
  }

  // Dispatch Report operations
  async getDispatchReport(id: number): Promise<DispatchReport | undefined> {
    return this.dispatchReports.get(id);
  }

  async getDispatchReportsByDate(date: Date): Promise<DispatchReport[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return Array.from(this.dispatchReports.values())
      .filter(report => {
        const reportDate = new Date(report.date);
        return reportDate >= startDate && reportDate <= endDate;
      });
  }

  async getDispatchReportsByDispatcher(dispatcherId: number): Promise<DispatchReport[]> {
    return Array.from(this.dispatchReports.values())
      .filter(report => report.dispatcherId === dispatcherId);
  }

  async getDispatchReportByDispatcherAndDate(dispatcherId: number, date: Date): Promise<DispatchReport | undefined> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return Array.from(this.dispatchReports.values())
      .find(report => {
        const reportDate = new Date(report.date);
        return report.dispatcherId === dispatcherId && 
               reportDate >= startDate && 
               reportDate <= endDate;
      });
  }

  async createDispatchReport(report: InsertDispatchReport): Promise<DispatchReport> {
    // Generate a new ID
    const id = this.dispatchReportIdCounter++;
    
    const newReport: DispatchReport = {
      id,
      ...report,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Set default values for any missing fields
      activeLeads: report.activeLeads || 0,
      clientsOnboarded: report.clientsOnboarded || 0,
      highestInvoiceUsd: report.highestInvoiceUsd || 0,
      invoiceUsd: report.invoiceUsd || 0,
      invoicesGenerated: report.invoicesGenerated || 0,
      loadsBooked: report.loadsBooked || 0,
      paidInvoiceUsd: report.paidInvoiceUsd || 0,
      pendingInvoiceUsd: report.pendingInvoiceUsd || 0,
      status: report.status || 'Pending',
      orgId: report.orgId || 1,
    };
    
    this.dispatchReports.set(id, newReport);
    return newReport;
  }

  async updateDispatchReport(id: number, updates: Partial<DispatchReport>): Promise<DispatchReport | undefined> {
    const report = await this.getDispatchReport(id);
    if (!report) return undefined;
    
    const updatedReport = {
      ...report,
      ...updates,
      updatedAt: new Date()
    };
    
    this.dispatchReports.set(id, updatedReport);
    return updatedReport;
  }

  async generateDailyDispatchReport(dispatcherId: number, date: Date = new Date()): Promise<DispatchReport> {
    // Get existing report for today if it exists
    const existingReport = await this.getDispatchReportByDispatcherAndDate(dispatcherId, date);
    if (existingReport) {
      return await this.updateDailyDispatchReport(existingReport.id, date);
    }
    
    // Get dispatcher info
    const dispatcher = await this.getUser(dispatcherId);
    if (!dispatcher) {
      throw new Error(`Dispatcher with ID ${dispatcherId} not found`);
    }
    
    // Format date for queries
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    // Get all loads booked by this dispatcher today
    const todayLoads = Array.from(this.loads.values())
      .filter(load => 
        load.assignedTo === dispatcherId && 
        new Date(load.createdAt) >= startDate && 
        new Date(load.createdAt) <= endDate
      );
    
    // Get all invoices generated by this dispatcher today
    const allInvoices = Array.from(this.invoices.values());
    const todayInvoicesData = [];
    
    for (const invoice of allInvoices) {
      const lead = this.leads.get(invoice.leadId);
      if (!lead) continue;
      
      const loadsForLead = Array.from(this.loads.values())
        .find(load => load.leadId === lead.id && load.assignedTo === dispatcherId);
      
      if (loadsForLead && 
          new Date(invoice.createdAt) >= startDate && 
          new Date(invoice.createdAt) <= endDate) {
        todayInvoicesData.push({
          invoice,
          load: loadsForLead
        });
      }
    }
    
    // Get all active leads assigned to this dispatcher
    const activeLeads = Array.from(this.leads.values())
      .filter(lead => 
        lead.assignedTo === dispatcherId && 
        lead.status === 'Active'
      );
    
    // Get all pending invoices for this dispatcher
    const pendingInvoicesData = [];
    
    for (const invoice of allInvoices) {
      if (invoice.status !== 'pending') continue;
      
      const lead = this.leads.get(invoice.leadId);
      if (!lead) continue;
      
      const loadsForLead = Array.from(this.loads.values())
        .find(load => load.leadId === lead.id && load.assignedTo === dispatcherId);
      
      if (loadsForLead) {
        pendingInvoicesData.push({
          invoice,
          load: loadsForLead
        });
      }
    }
    
    // Calculate totals
    const loadsBookedToday = todayLoads.length;
    const invoicesGeneratedToday = todayInvoicesData.length;
    
    const invoiceAmountToday = todayInvoicesData.reduce((sum, item) => sum + Number(item.invoice.totalAmount), 0);
    const pendingInvoiceAmount = pendingInvoicesData.reduce((sum, item) => sum + Number(item.invoice.totalAmount), 0);
    
    // Calculate highest invoice amount
    let highestInvoiceUsd = 0;
    if (todayInvoicesData.length > 0) {
      highestInvoiceUsd = Math.max(...todayInvoicesData.map(item => Number(item.invoice.totalAmount)));
    }
    
    // Get paid invoices
    const paidInvoices = allInvoices.filter(invoice => {
      if (invoice.status !== 'paid' || !invoice.paidDate) return false;
      
      const paidDate = new Date(invoice.paidDate);
      if (!(paidDate >= startDate && paidDate <= endDate)) return false;
      
      const load = Array.from(this.loads.values())
        .find(load => load.leadId === invoice.leadId && load.assignedTo === dispatcherId);
      
      return !!load;
    });
    
    const paidInvoiceUsd = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);
    
    // Get all clients onboarded by this dispatcher
    const dispatchClientsList = Array.from(this.dispatchClients.values())
      .filter(client => client.assignedTo === dispatcherId);
    
    // Create the report
    const newReport = await this.createDispatchReport({
      dispatcherId,
      date: date,
      orgId: dispatcher.orgId || 1,
      loadsBooked: loadsBookedToday,
      invoicesGenerated: invoicesGeneratedToday,
      activeLeads: activeLeads.length,
      invoiceUsd: invoiceAmountToday,
      pendingInvoiceUsd: pendingInvoiceAmount,
      highestInvoiceUsd: highestInvoiceUsd,
      paidInvoiceUsd: paidInvoiceUsd,
      clientsOnboarded: dispatchClientsList.length,
      status: 'Pending'
    });
    
    return newReport;
  }

  async updateDailyDispatchReport(reportId: number, date: Date = new Date()): Promise<DispatchReport> {
    const report = await this.getDispatchReport(reportId);
    if (!report) {
      throw new Error(`Report with ID ${reportId} not found`);
    }
    
    // Re-calculate all metrics for the report
    const dispatcherId = report.dispatcherId;
    
    // Format date for database queries
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    // Get all loads booked by this dispatcher today
    const todayLoads = Array.from(this.loads.values())
      .filter(load => 
        load.assignedTo === dispatcherId && 
        new Date(load.createdAt) >= startDate && 
        new Date(load.createdAt) <= endDate
      );
    
    // Get all invoices generated by this dispatcher today
    const allInvoices = Array.from(this.invoices.values());
    const todayInvoicesData = [];
    
    for (const invoice of allInvoices) {
      const lead = this.leads.get(invoice.leadId);
      if (!lead) continue;
      
      const loadsForLead = Array.from(this.loads.values())
        .find(load => load.leadId === lead.id && load.assignedTo === dispatcherId);
      
      if (loadsForLead && 
          new Date(invoice.createdAt) >= startDate && 
          new Date(invoice.createdAt) <= endDate) {
        todayInvoicesData.push({
          invoice,
          load: loadsForLead
        });
      }
    }
    
    // Get all active leads assigned to this dispatcher
    const activeLeads = Array.from(this.leads.values())
      .filter(lead => 
        lead.assignedTo === dispatcherId && 
        lead.status === 'Active'
      );
    
    // Get all pending invoices for this dispatcher
    const pendingInvoicesData = [];
    
    for (const invoice of allInvoices) {
      if (invoice.status !== 'pending') continue;
      
      const lead = this.leads.get(invoice.leadId);
      if (!lead) continue;
      
      const loadsForLead = Array.from(this.loads.values())
        .find(load => load.leadId === lead.id && load.assignedTo === dispatcherId);
      
      if (loadsForLead) {
        pendingInvoicesData.push({
          invoice,
          load: loadsForLead
        });
      }
    }
    
    // Calculate metrics
    const loadsBooked = todayLoads.length;
    const invoiceUsd = todayInvoicesData.reduce((sum, item) => sum + Number(item.invoice.totalAmount), 0);
    const activeLeadsCount = activeLeads.length;
    const pendingInvoiceUsd = pendingInvoicesData.reduce((sum, item) => sum + Number(item.invoice.totalAmount), 0);
    
    // Get highest invoice amount (if any invoices exist)
    let highestInvoiceUsd = 0;
    if (todayInvoicesData.length > 0) {
      highestInvoiceUsd = Math.max(...todayInvoicesData.map(item => Number(item.invoice.totalAmount)));
    }
    
    // Get paid invoices
    const paidInvoices = allInvoices.filter(invoice => {
      if (invoice.status !== 'paid' || !invoice.paidDate) return false;
      
      const paidDate = new Date(invoice.paidDate);
      if (!(paidDate >= startDate && paidDate <= endDate)) return false;
      
      const load = Array.from(this.loads.values())
        .find(load => load.leadId === invoice.leadId && load.assignedTo === dispatcherId);
      
      return !!load;
    });
    
    const paidInvoiceUsd = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);
    
    // Update the report
    const updatedData = {
      loadsBooked,
      invoiceUsd,
      activeLeads: activeLeadsCount,
      pendingInvoiceUsd,
      highestInvoiceUsd,
      paidInvoiceUsd,
      updatedAt: new Date()
    };
    
    return await this.updateDispatchReport(reportId, updatedData) as DispatchReport;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Create PostgreSQL session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool: pgPool,
      createTableIfMissing: true
    });
    
    // Initialize with default data if needed
    this.initializeRoles();
  }

  private async initializeRoles() {
    // Check if we have any roles already
    const existingRoles = await this.getRoles();
    if (existingRoles.length > 0) {
      return; // Database is already initialized
    }
    
    // Create default organization or use existing one
    let defaultOrg = await this.getOrganizationByCode("DEFAULT");
    if (!defaultOrg) {
      defaultOrg = await this.createOrganization({
        name: "Default Organization",
        code: "DEFAULT",
        active: true
      });
    }
    
    // Add default roles with different permissions and departments
    const roles: InsertRole[] = [
      {
        name: "Administrator",
        department: "admin",
        level: 5,
        permissions: ["all"]
      },
      {
        name: "Sales Manager",
        department: "sales",
        level: 4,
        permissions: ["manage_leads", "manage_users", "view_reports", "manage_sales"]
      },
      {
        name: "Sales Team Lead",
        department: "sales",
        level: 3,
        permissions: ["manage_leads", "view_users", "view_reports"]
      },
      {
        name: "Sales Representative",
        department: "sales",
        level: 1,
        permissions: ["view_leads", "create_leads"]
      },
      {
        name: "Dispatch Manager",
        department: "dispatch",
        level: 4,
        permissions: ["manage_loads", "manage_users", "view_reports", "manage_dispatch"]
      },
      {
        name: "Dispatch Team Lead",
        department: "dispatch",
        level: 3,
        permissions: ["manage_loads", "view_users", "view_reports"]
      },
      {
        name: "Dispatcher",
        department: "dispatch",
        level: 1,
        permissions: ["view_loads", "create_loads"]
      },
      {
        name: "Accounting Manager",
        department: "accounting",
        level: 4,
        permissions: ["manage_invoices", "manage_users", "view_reports", "manage_accounting"]
      }
    ];
    
    // Add roles
    for (const role of roles) {
      await this.createRole(role);
    }
    
    // Check if admin user exists
    const adminUser = await this.getUserByUsername("admin");
    if (!adminUser) {
      // Add admin user
      await this.createUser({
        username: "admin",
        password: "admin123",  // In a real app would be hashed
        firstName: "System",
        lastName: "Administrator",
        email: "admin@metasys.com",
        phoneNumber: null,
        roleId: 1,  // Administrator role
        active: true,
        profileImageUrl: null,
        orgId: defaultOrg.id
      });
    }
  }
  
  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationByCode(code: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.code, code));
    return org;
  }

  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations);
  }

  async getActiveOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).where(eq(organizations.active, true));
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const now = new Date().toISOString();
    const [org] = await db.insert(organizations).values({
      ...insertOrg,
      createdAt: now,
      updatedAt: now
    }).returning();
    return org;
  }

  async updateOrganization(id: number, updates: Partial<Organization>): Promise<Organization | undefined> {
    const [org] = await db.update(organizations)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(organizations.id, id))
      .returning();
    return org;
  }
  
  async getUsersByOrganization(orgId: number): Promise<User[]> {
    try {
      // Explicitly select only the columns we know exist in the database
      return await db.select({
        id: users.id,
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        roleId: users.roleId,
        orgId: users.orgId,
        status: users.status,
        canViewCRM: users.canViewCRM,
        canEditLeads: users.canEditLeads,
        canViewInvoices: users.canViewInvoices,
        canApprovePayroll: users.canApprovePayroll,
        canManageUsers: users.canManageUsers,
        isSystemAdmin: users.isSystemAdmin,
        canManageRoles: users.canManageRoles,
        canAccessAllOrgs: users.canAccessAllOrgs,
        canManageSettings: users.canManageSettings,
        canViewAuditLog: users.canViewAuditLog,
        canManageLeadAssignments: users.canManageLeadAssignments,
        canDeleteLeads: users.canDeleteLeads,
        canExportLeads: users.canExportLeads,
        canCreateInvoices: users.canCreateInvoices,
        canApproveInvoices: users.canApproveInvoices,
        canManageAccounting: users.canManageAccounting,
        canManageLoads: users.canManageLoads,
        canManageCarriers: users.canManageCarriers,
        canApproveDispatchReports: users.canApproveDispatchReports,
        active: users.active,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        invitedAt: users.invitedAt,
        lastLogin: users.lastLogin
      })
      .from(users)
      .where(eq(users.orgId, orgId));
    } catch (error) {
      console.error('Error in getUsersByOrganization:', error);
      throw error;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      // Explicitly select only the columns we know exist in the database
      // Include all permission fields that exist in the actual database
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        roleId: users.roleId,
        orgId: users.orgId,
        active: users.active,
        profileImageUrl: users.profileImageUrl,
        
        // Permission fields that DO exist in the database
        isSystemAdmin: users.isSystemAdmin,
        canManageRoles: users.canManageRoles,
        canAccessAllOrgs: users.canAccessAllOrgs,
        canManageSettings: users.canManageSettings,
        canViewAuditLog: users.canViewAuditLog,
        canManageLeadAssignments: users.canManageLeadAssignments,
        canDeleteLeads: users.canDeleteLeads,
        canExportLeads: users.canExportLeads,
        canCreateInvoices: users.canCreateInvoices,
        canApproveInvoices: users.canApproveInvoices,
        canManageAccounting: users.canManageAccounting,
        canManageLoads: users.canManageLoads,
        canManageCarriers: users.canManageCarriers,
        canApproveDispatchReports: users.canApproveDispatchReports,
        canManageUsers: users.canManageUsers
      })
      .from(users)
      .where(eq(users.id, id));
      
      return user;
    } catch (error) {
      console.error('Error in getUser:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Explicitly select only the columns we know exist in the database
      // Include all permission fields that exist in the actual database
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        roleId: users.roleId,
        orgId: users.orgId,
        active: users.active,
        profileImageUrl: users.profileImageUrl,
        
        // Permission fields that DO exist in the database
        isSystemAdmin: users.isSystemAdmin,
        canManageRoles: users.canManageRoles,
        canAccessAllOrgs: users.canAccessAllOrgs,
        canManageSettings: users.canManageSettings,
        canViewAuditLog: users.canViewAuditLog,
        canManageLeadAssignments: users.canManageLeadAssignments,
        canDeleteLeads: users.canDeleteLeads,
        canExportLeads: users.canExportLeads,
        canCreateInvoices: users.canCreateInvoices,
        canApproveInvoices: users.canApproveInvoices,
        canManageAccounting: users.canManageAccounting,
        canManageLoads: users.canManageLoads,
        canManageCarriers: users.canManageCarriers,
        canApproveDispatchReports: users.canApproveDispatchReports,
        canManageUsers: users.canManageUsers
      })
      .from(users)
      .where(eq(users.username, username));
      
      return user;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    try {
      // Explicitly select only the columns we know exist in the database
      return await db.select({
        id: users.id,
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        roleId: users.roleId,
        orgId: users.orgId,
        active: users.active,
        profileImageUrl: users.profileImageUrl,
        
        // Permission fields that DO exist in the database
        isSystemAdmin: users.isSystemAdmin,
        canManageRoles: users.canManageRoles,
        canAccessAllOrgs: users.canAccessAllOrgs,
        canManageSettings: users.canManageSettings,
        canViewAuditLog: users.canViewAuditLog,
        canManageLeadAssignments: users.canManageLeadAssignments,
        canDeleteLeads: users.canDeleteLeads,
        canExportLeads: users.canExportLeads,
        canCreateInvoices: users.canCreateInvoices,
        canApproveInvoices: users.canApproveInvoices,
        canManageAccounting: users.canManageAccounting,
        canManageLoads: users.canManageLoads,
        canManageCarriers: users.canManageCarriers,
        canApproveDispatchReports: users.canApproveDispatchReports,
        canManageUsers: users.canManageUsers
      })
      .from(users);
    } catch (error) {
      console.error('Error in getUsers:', error);
      throw error;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      // Explicitly select only the columns we know exist in the database
      return await db.select({
        id: users.id,
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        roleId: users.roleId,
        orgId: users.orgId,
        active: users.active,
        profileImageUrl: users.profileImageUrl,
        
        // Permission fields that DO exist in the database
        isSystemAdmin: users.isSystemAdmin,
        canManageRoles: users.canManageRoles,
        canAccessAllOrgs: users.canAccessAllOrgs,
        canManageSettings: users.canManageSettings,
        canViewAuditLog: users.canViewAuditLog,
        canManageLeadAssignments: users.canManageLeadAssignments,
        canDeleteLeads: users.canDeleteLeads,
        canExportLeads: users.canExportLeads,
        canCreateInvoices: users.canCreateInvoices,
        canApproveInvoices: users.canApproveInvoices,
        canManageAccounting: users.canManageAccounting,
        canManageLoads: users.canManageLoads,
        canManageCarriers: users.canManageCarriers,
        canApproveDispatchReports: users.canApproveDispatchReports,
        canManageUsers: users.canManageUsers
      })
      .from(users);
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  async getUsersByRole(roleId: number): Promise<User[]> {
    try {
      // Explicitly select only the columns we know exist in the database
      return await db.select({
        id: users.id,
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        roleId: users.roleId,
        orgId: users.orgId,
        active: users.active,
        profileImageUrl: users.profileImageUrl,
        
        // Permission fields that DO exist in the database
        isSystemAdmin: users.isSystemAdmin,
        canManageRoles: users.canManageRoles,
        canAccessAllOrgs: users.canAccessAllOrgs,
        canManageSettings: users.canManageSettings,
        canViewAuditLog: users.canViewAuditLog,
        canManageLeadAssignments: users.canManageLeadAssignments,
        canDeleteLeads: users.canDeleteLeads,
        canExportLeads: users.canExportLeads,
        canCreateInvoices: users.canCreateInvoices,
        canApproveInvoices: users.canApproveInvoices,
        canManageAccounting: users.canManageAccounting,
        canManageLoads: users.canManageLoads,
        canManageCarriers: users.canManageCarriers,
        canApproveDispatchReports: users.canApproveDispatchReports,
        canManageUsers: users.canManageUsers
      })
      .from(users)
      .where(eq(users.roleId, roleId));
    } catch (error) {
      console.error('Error in getUsersByRole:', error);
      throw error;
    }
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }
  
  async getUserRole(userId: number): Promise<Role | undefined> {
    try {
      // First get the user to find their role ID
      const user = await this.getUser(userId);
      if (!user || !user.roleId) {
        return undefined;
      }
      
      // Now get the role
      return await this.getRole(user.roleId);
    } catch (error) {
      console.error('Error in getUserRole:', error);
      throw error;
    }
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role;
  }
  
  async getDefaultRole(): Promise<Role | undefined> {
    const [defaultRole] = await db.select().from(roles).where(eq(roles.isDefault, true));
    
    // If no default role is found, fallback to any role with level 1
    if (!defaultRole) {
      const [fallbackRole] = await db.select().from(roles).where(eq(roles.level, 1));
      return fallbackRole;
    }
    
    return defaultRole;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(insertRole).returning();
    return role;
  }

  async getRoles(): Promise<Role[]> {
    return db.select().from(roles);
  }

  async getLead(id: number): Promise<Lead | undefined> {
    try {
      // Use the more robust implementation from leadsApi
      const lead = await getLeadById(id);
      return lead;
    } catch (error) {
      console.error("Error in getLead:", error);
      // Fallback to basic query
      const [lead] = await db.select().from(leads).where(eq(leads.id, id));
      return lead;
    }
  }

  async getLeads(): Promise<Lead[]> {
    try {
      // Use the more robust implementation to handle missing columns
      const leadsData = await getAllLeads();
      return leadsData;
    } catch (error) {
      console.error("Error in getLeads:", error);
      // Fallback to basic query as last resort
      return db.select().from(leads);
    }
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    try {
      // Use the more robust implementation to handle missing columns
      const leadsData = await getLeadsByStatusApi(status);
      return leadsData;
    } catch (error) {
      console.error("Error in getLeadsByStatus:", error);
      // Fallback to basic query as last resort
      return db.select().from(leads).where(eq(leads.status, status));
    }
  }

  async getLeadsByAssignee(userId: number): Promise<Lead[]> {
    try {
      // Use the more robust implementation to handle missing columns
      const leadsData = await getLeadsByAssigneeApi(userId);
      return leadsData;
    } catch (error) {
      console.error("Error in getLeadsByAssignee:", error);
      // Fallback to basic query as last resort
      return db.select().from(leads).where(eq(leads.assignedTo, userId));
    }
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const now = new Date();
    const [lead] = await db.insert(leads).values({
      ...insertLead,
      createdAt: now,
      updatedAt: now
    }).returning();
    return lead;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(leads.id, id))
      .returning();
    return updatedLead;
  }

  async getLoad(id: number): Promise<Load | undefined> {
    const [load] = await db.select().from(loads).where(eq(loads.id, id));
    return load;
  }

  async getLoads(orgId?: number): Promise<Load[]> {
    try {
      let query = db.select().from(loads);
      
      // Filter by organization if specified
      if (orgId) {
        query = query.where(eq(loads.orgId, orgId));
      }
      
      return await query;
    } catch (error) {
      console.error('Error in getLoads:', error);
      throw error;
    }
  }
  
  async getLoad(id: number): Promise<Load | undefined> {
    try {
      const [load] = await db.select().from(loads).where(eq(loads.id, id));
      return load;
    } catch (error) {
      console.error('Error in getLoad:', error);
      throw error;
    }
  }

  async getLoadsByLead(leadId: number): Promise<Load[]> {
    try {
      return await db.select().from(loads).where(eq(loads.leadId, leadId));
    } catch (error) {
      console.error('Error in getLoadsByLead:', error);
      throw error;
    }
  }

  async getLoadsByStatus(status: string): Promise<Load[]> {
    return db.select().from(loads).where(eq(loads.status, status));
  }

  async getLoadsByAssignee(userId: number): Promise<Load[]> {
    return db.select().from(loads).where(eq(loads.assignedTo, userId));
  }

  async getLoadsByLead(leadId: number): Promise<Load[]> {
    return db.select().from(loads).where(eq(loads.leadId, leadId));
  }

  async createLoad(insertLoad: InsertLoad): Promise<Load> {
    const now = new Date();
    const [load] = await db.insert(loads).values({
      ...insertLoad,
      createdAt: now,
      updatedAt: now
    }).returning();
    return load;
  }

  async updateLoad(id: number, updates: Partial<Load>): Promise<Load | undefined> {
    const [updatedLoad] = await db
      .update(loads)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(loads.id, id))
      .returning();
    return updatedLoad;
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber));
    return invoice;
  }

  async getInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices);
  }

  async getInvoicesByStatus(status: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.status, status));
  }

  async getInvoicesByLead(leadId: number): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.leadId, leadId));
  }

  async getInvoicesByDispatcher(dispatcherId: number): Promise<Invoice[]> {
    // Query invoices where the dispatcher created the invoice
    return db.select().from(invoices).where(eq(invoices.createdBy, dispatcherId));
  }
  
  async getInvoicesByLeads(leadIds: number[]): Promise<Invoice[]> {
    if (leadIds.length === 0) return [];
    return db.select().from(invoices).where(inArray(invoices.leadId, leadIds));
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const now = new Date();
    const [invoice] = await db.insert(invoices).values({
      ...insertInvoice,
      createdAt: now,
      updatedAt: now
    }).returning();
    return invoice;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async getInvoiceItem(id: number): Promise<InvoiceItem | undefined> {
    const [item] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, id));
    return item;
  }

  async getInvoiceItemsByInvoice(invoiceId: number): Promise<InvoiceItem[]> {
    return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(insertItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const [item] = await db.insert(invoiceItems).values(insertItem).returning();
    return item;
  }

  async getCommission(id: number): Promise<Commission | undefined> {
    const [commission] = await db.select().from(commissions).where(eq(commissions.id, id));
    return commission;
  }

  async getCommissions(): Promise<Commission[]> {
    return db.select().from(commissions);
  }

  async getCommissionsByUser(userId: number): Promise<Commission[]> {
    return db.select().from(commissions).where(eq(commissions.userId, userId));
  }

  async getCommissionsByInvoice(invoiceId: number): Promise<Commission[]> {
    return db.select().from(commissions).where(eq(commissions.invoiceId, invoiceId));
  }

  async createCommission(insertCommission: InsertCommission): Promise<Commission> {
    const [commission] = await db.insert(commissions).values(insertCommission).returning();
    return commission;
  }

  async updateCommission(id: number, updates: Partial<Commission>): Promise<Commission | undefined> {
    const [updatedCommission] = await db
      .update(commissions)
      .set(updates)
      .where(eq(commissions.id, id))
      .returning();
    return updatedCommission;
  }
  
  // Dispatch Client operations
  async getDispatchClient(id: number): Promise<DispatchClient | undefined> {
    const [client] = await db.select().from(dispatch_clients).where(eq(dispatch_clients.id, id));
    return client;
  }
  
  async getDispatchClientByLeadId(leadId: number): Promise<DispatchClient | undefined> {
    const [client] = await db.select().from(dispatch_clients).where(eq(dispatch_clients.leadId, leadId));
    return client;
  }
  
  async getDispatchClients(): Promise<DispatchClient[]> {
    return db.select().from(dispatch_clients);
  }
  
  async getDispatchClientsByStatus(status: string): Promise<DispatchClient[]> {
    return db.select().from(dispatch_clients).where(eq(dispatch_clients.status, status));
  }
  
  async createDispatchClient(insertClient: InsertDispatchClient): Promise<DispatchClient> {
    const now = new Date();
    
    // Make sure onboardingDate is a proper Date object or null
    let onboardingDate = insertClient.onboardingDate;
    if (typeof onboardingDate === 'string') {
      try {
        // Convert string to Date object
        onboardingDate = new Date(onboardingDate);
      } catch (e) {
        console.error('Invalid onboardingDate format:', onboardingDate);
        onboardingDate = null;
      }
    }
    
    // Create a clean object with proper date handling
    const clientData = {
      ...insertClient,
      onboardingDate, // Use our sanitized Date object
      createdAt: now,
      updatedAt: now
    };
    
    const [client] = await db.insert(dispatch_clients).values(clientData).returning();
    return client;
  }
  
  async updateDispatchClient(id: number, updates: Partial<DispatchClient>): Promise<DispatchClient | undefined> {
    const now = new Date();
    
    // Process onboardingDate if it exists in updates
    let onboardingDate = updates.onboardingDate;
    if (onboardingDate && typeof onboardingDate === 'string') {
      try {
        // Convert string to Date object
        onboardingDate = new Date(onboardingDate);
      } catch (e) {
        console.error('Invalid onboardingDate format in updates:', onboardingDate);
        onboardingDate = null;
      }
    }
    
    // Create a clean update object
    const clientUpdates = {
      ...updates,
      onboardingDate, // Use our sanitized Date object
      updatedAt: now
    };
    
    const [updatedClient] = await db
      .update(dispatch_clients)
      .set(clientUpdates)
      .where(eq(dispatch_clients.id, id))
      .returning();
    return updatedClient;
  }

  async getActivities(limit?: number): Promise<Activity[]> {
    const query = db.select({
      id: activities.id,
      userId: activities.userId,
      entityType: activities.entityType,
      entityId: activities.entityId,
      action: activities.action,
      details: activities.details,
      timestamp: activities.timestamp
      // Excluding metadata, reminderDate and reminderCompleted as they don't exist in the actual DB
    })
      .from(activities)
      .orderBy(desc(activities.timestamp));
    
    if (limit) {
      query.limit(limit);
    }
    
    return query;
  }

  async getActivitiesByUser(userId: number, limit?: number): Promise<Activity[]> {
    const query = db.select({
      id: activities.id,
      userId: activities.userId,
      entityType: activities.entityType,
      entityId: activities.entityId,
      action: activities.action,
      details: activities.details,
      timestamp: activities.timestamp
      // Excluding metadata, reminderDate and reminderCompleted as they don't exist in the actual DB
    })
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.timestamp));
    
    if (limit) {
      query.limit(limit);
    }
    
    return query;
  }

  async getActivitiesByEntity(entityType: string, entityId: number, limit?: number): Promise<Activity[]> {
    const query = db.select({
      id: activities.id,
      userId: activities.userId,
      entityType: activities.entityType,
      entityId: activities.entityId,
      action: activities.action,
      details: activities.details,
      timestamp: activities.timestamp
      // Excluding metadata, reminderDate and reminderCompleted as they don't exist in the actual DB
    })
      .from(activities)
      .where(
        and(
          eq(activities.entityType, entityType),
          eq(activities.entityId, entityId)
        )
      )
      .orderBy(desc(activities.timestamp));
    
    if (limit) {
      query.limit(limit);
    }
    
    return query;
  }
  
  async getLeadsByDateRange(startDate: string, endDate: string): Promise<Lead[]> {
    try {
      return await db.select()
        .from(leads)
        .where(
          and(
            gte(leads.createdAt, new Date(startDate)),
            lte(leads.createdAt, new Date(endDate))
          )
        )
        .orderBy(desc(leads.createdAt));
    } catch (error) {
      console.error('Error in getLeadsByDateRange:', error);
      throw error;
    }
  }

  async getActivitiesByDateRange(startDate: string, endDate: string, limit: number = 50): Promise<Activity[]> {
    try {
      const query = db.select({
        id: activities.id,
        userId: activities.userId,
        entityType: activities.entityType,
        entityId: activities.entityId,
        action: activities.action,
        details: activities.details,
        timestamp: activities.timestamp
      })
        .from(activities)
        .where(
          and(
            gte(activities.timestamp, new Date(startDate)),
            lte(activities.timestamp, new Date(endDate))
          )
        )
        .orderBy(desc(activities.timestamp));
      
      if (limit) {
        query.limit(limit);
      }
      
      return query;
    } catch (error) {
      console.error('Error in getActivitiesByDateRange:', error);
      throw error;
    }
  }
  
  async getActivitiesByEntityType(entityType: string, since?: Date, limit?: number): Promise<Activity[]> {
    let query = db.select({
      id: activities.id,
      userId: activities.userId,
      entityType: activities.entityType,
      entityId: activities.entityId,
      action: activities.action,
      details: activities.details,
      timestamp: activities.timestamp
      // Excluding metadata, reminderDate and reminderCompleted as they don't exist in the actual DB
    })
      .from(activities)
      .where(eq(activities.entityType, entityType))
      .orderBy(desc(activities.timestamp));
    
    if (since) {
      query = query.where(gte(activities.timestamp, since));
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    // Filter out any properties that don't exist in the actual database
    const { metadata, reminderDate, reminderCompleted, ...validActivityData } = insertActivity as any;
    
    const [activity] = await db.insert(activities).values({
      ...validActivityData,
      timestamp: new Date()
    }).returning();
    return activity;
  }

  // User-Organization relationships
  async getUserOrganizations(userId: number): Promise<Organization[]> {
    const userOrgs = await db
      .select({
        organizationId: userOrganizations.organizationId
      })
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, userId));
    
    if (userOrgs.length === 0) {
      return [];
    }
    
    // Get the organizations
    const orgIds = userOrgs.map(uo => uo.organizationId);
    return db
      .select()
      .from(organizations)
      .where(
        orgIds.length === 1 
          ? eq(organizations.id, orgIds[0]) 
          : inArray(organizations.id, orgIds)
      );
  }

  async getUserOrganizationIds(userId: number): Promise<number[]> {
    const userOrgs = await db
      .select({
        organizationId: userOrganizations.organizationId
      })
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, userId));
    
    return userOrgs.map(uo => uo.organizationId);
  }

  async setUserOrganizations(userId: number, organizationIds: number[]): Promise<void> {
    // Transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Delete existing relationships
      await tx
        .delete(userOrganizations)
        .where(eq(userOrganizations.userId, userId));
      
      // Insert new relationships
      if (organizationIds.length > 0) {
        await tx
          .insert(userOrganizations)
          .values(
            organizationIds.map(orgId => ({
              userId,
              organizationId: orgId,
              createdAt: new Date()
            }))
          );
      }
    });
  }

  // Commission Rules operations
  async getCommissionRule(id: number): Promise<CommissionRule | undefined> {
    const [rule] = await db.select().from(commissionRules).where(eq(commissionRules.id, id));
    return rule;
  }

  async getCommissionRulesByType(type: string): Promise<CommissionRule[]> {
    return db.select().from(commissionRules).where(eq(commissionRules.type, type));
  }

  async getCommissionRulesByOrg(orgId: number): Promise<CommissionRule[]> {
    return db.select().from(commissionRules).where(eq(commissionRules.orgId, orgId));
  }

  async createCommissionRule(rule: InsertCommissionRule): Promise<CommissionRule> {
    const now = new Date();
    const [commissionRule] = await db.insert(commissionRules).values({
      ...rule,
      createdAt: now,
      updatedAt: now
    }).returning();
    return commissionRule;
  }

  async updateCommissionRule(id: number, updates: Partial<CommissionRule>): Promise<CommissionRule | undefined> {
    const [updatedRule] = await db
      .update(commissionRules)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(commissionRules.id, id))
      .returning();
    return updatedRule;
  }
  
  // Commission Policy operations
  async getCommissionPolicy(id: number): Promise<CommissionPolicy | undefined> {
    const [policy] = await db.select().from(commissionPolicies).where(eq(commissionPolicies.id, id));
    return policy;
  }
  
  async getCommissionPoliciesByType(type: string): Promise<CommissionPolicy[]> {
    return db.select().from(commissionPolicies).where(eq(commissionPolicies.type, type));
  }
  
  async getCommissionPoliciesByOrg(orgId: number): Promise<CommissionPolicy[]> {
    return db.select().from(commissionPolicies).where(eq(commissionPolicies.orgId, orgId));
  }
  
  async createCommissionPolicy(policy: InsertCommissionPolicy): Promise<CommissionPolicy> {
    const now = new Date();
    const [commissionPolicy] = await db.insert(commissionPolicies).values({
      ...policy,
      createdAt: now,
      updatedAt: now
    }).returning();
    return commissionPolicy;
  }
  
  async updateCommissionPolicy(id: number, updates: Partial<CommissionPolicy>): Promise<CommissionPolicy | undefined> {
    const [updatedPolicy] = await db
      .update(commissionPolicies)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(commissionPolicies.id, id))
      .returning();
    return updatedPolicy;
  }
  
  async deleteCommissionPolicy(id: number): Promise<boolean> {
    try {
      // First check if the policy exists and is not active
      const [policy] = await db.select().from(commissionPolicies).where(eq(commissionPolicies.id, id));
      
      if (!policy) {
        return false;
      }
      
      if (policy.isActive) {
        throw new Error("Cannot delete an active policy. Deactivate it first.");
      }
      
      // Delete the policy
      const result = await db.delete(commissionPolicies).where(eq(commissionPolicies.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting commission policy:", error);
      throw error;
    }
  }
  
  async deactivateCommissionPoliciesByType(type: string, orgId: number): Promise<void> {
    try {
      await db.update(commissionPolicies)
        .set({ 
          isActive: false,
          updatedAt: new Date() 
        })
        .where(
          and(
            eq(commissionPolicies.type, type),
            eq(commissionPolicies.orgId, orgId),
            eq(commissionPolicies.isActive, true)
          )
        );
    } catch (error) {
      console.error("Error deactivating commission policies:", error);
      throw error;
    }
  }
  
  async archiveCommissionPolicy(id: number, userId: number): Promise<CommissionPolicy | undefined> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const [updatedPolicy] = await db
        .update(commissionPolicy)
        .set({
          isActive: false,
          validTo: yesterday,
          updatedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(commissionPolicy.id, id))
        .returning();
        
      return updatedPolicy;
    } catch (error) {
      console.error("Error archiving commission policy:", error);
      throw error;
    }
  }
  
  // Commission Run operations
  async getCommissionRun(id: number): Promise<CommissionRun | undefined> {
    const [run] = await db.select().from(commissionRuns).where(eq(commissionRuns.id, id));
    return run;
  }
  
  async getCommissionRunsByMonth(month: string): Promise<CommissionRun[]> {
    const [year, monthNum] = month.split('-').map(Number);
    if (!year || !monthNum) {
      throw new Error('Invalid month format. Expected YYYY-MM');
    }
    return db.select().from(commissionRuns)
      .where(
        and(
          eq(commissionRuns.year, year),
          eq(commissionRuns.month, monthNum)
        )
      );
  }
  
  async getCommissionsByMonth(month: string): Promise<{
    totalCommissions: number;
    totalUsers: number;
    averageCommission: number;
    topEarners: Array<{ userId: number; amount: number; name: string }>;
  }> {
    try {
      const [year, monthNum] = month.split('-').map(Number);
      if (!year || !monthNum) {
        throw new Error('Invalid month format. Expected YYYY-MM');
      }
      
      // Get commission runs for the specified month
      const runs = await this.getCommissionRunsByMonth(month);
      
      if (runs.length === 0) {
        return {
          totalCommissions: 0,
          totalUsers: 0,
          averageCommission: 0,
          topEarners: []
        };
      }
      
      // Calculate total commission amount
      const totalCommissions = runs.reduce((sum, run) => sum + run.amount, 0);
      
      // Count unique users
      const uniqueUserIds = [...new Set(runs.map(run => run.userId))];
      const totalUsers = uniqueUserIds.length;
      
      // Calculate average commission per user
      const averageCommission = totalUsers > 0 ? totalCommissions / totalUsers : 0;
      
      // Get top earners
      const userCommissions = new Map<number, number>();
      runs.forEach(run => {
        const currentAmount = userCommissions.get(run.userId) || 0;
        userCommissions.set(run.userId, currentAmount + run.amount);
      });
      
      // Convert to array and sort
      const userCommissionsArray = Array.from(userCommissions.entries())
        .map(([userId, amount]) => ({ userId, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5); // Top 5 earners
      
      // Get user names for top earners
      const topEarners = [];
      for (const earner of userCommissionsArray) {
        const user = await this.getUser(earner.userId);
        if (user) {
          topEarners.push({
            userId: earner.userId,
            amount: earner.amount,
            name: `${user.firstName} ${user.lastName}`
          });
        }
      }
      
      return {
        totalCommissions,
        totalUsers,
        averageCommission,
        topEarners
      };
    } catch (error) {
      console.error('Error in getCommissionsByMonth:', error);
      throw error;
    }
  }
  
  async getCommissionRunsByUser(userId: number): Promise<CommissionRun[]> {
    return db.select().from(commissionRuns).where(eq(commissionRuns.userId, userId));
  }
  
  async getCommissionRunsByOrg(orgId: number): Promise<CommissionRun[]> {
    return db.select().from(commissionRuns).where(eq(commissionRuns.orgId, orgId));
  }
  
  async createCommissionRun(run: InsertCommissionRun): Promise<CommissionRun> {
    const now = new Date();
    const [commissionRun] = await db.insert(commissionRuns).values({
      ...run,
      createdAt: now,
      updatedAt: now
    }).returning();
    return commissionRun;
  }
  
  async updateCommissionRun(id: number, updates: Partial<CommissionRun>): Promise<CommissionRun | undefined> {
    const [updatedRun] = await db
      .update(commissionRuns)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(commissionRuns.id, id))
      .returning();
    return updatedRun;
  }
  
  // Lead Sales User operations
  async getLeadSalesUser(id: number): Promise<LeadSalesUser | undefined> {
    const [leadSalesUser] = await db.select().from(leadSalesUsers).where(eq(leadSalesUsers.id, id));
    return leadSalesUser;
  }
  
  async getLeadSalesUsersByLead(leadId: number): Promise<LeadSalesUser[]> {
    return db.select().from(leadSalesUsers).where(eq(leadSalesUsers.leadId, leadId));
  }
  
  async getLeadSalesUsersByUser(userId: number): Promise<LeadSalesUser[]> {
    return db.select().from(leadSalesUsers).where(eq(leadSalesUsers.userId, userId));
  }
  
  async createLeadSalesUser(data: InsertLeadSalesUser): Promise<LeadSalesUser> {
    const now = new Date();
    const [leadSalesUser] = await db.insert(leadSalesUsers).values({
      ...data,
      createdAt: now,
      updatedAt: now
    }).returning();
    return leadSalesUser;
  }
  
  async updateLeadSalesUser(id: number, updates: Partial<LeadSalesUser>): Promise<LeadSalesUser | undefined> {
    const [updatedLeadSalesUser] = await db
      .update(leadSalesUsers)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(leadSalesUsers.id, id))
      .returning();
    return updatedLeadSalesUser;
  }
  
  // User related operations needed for the commission system
  async getLeadsByUser(userId: number): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.createdBy, userId));
  }
  
  // Monthly Commission operations
  async getCommissionMonthly(id: number): Promise<CommissionMonthly | undefined> {
    const [commission] = await db.select().from(commissionsMonthly).where(eq(commissionsMonthly.id, id));
    return commission;
  }
  
  async getUserCommissionByMonth(userId: number, month: string): Promise<CommissionMonthly | undefined> {
    try {
      const [commission] = await db
        .select()
        .from(commissionsMonthly)
        .where(
          and(
            eq(commissionsMonthly.userId, userId),
            eq(commissionsMonthly.month, month)
          )
        );
      
      return commission;
    } catch (error) {
      console.error('Error in getUserCommissionByMonth:', error);
      throw error;
    }
  }

  async getCommissionMonthlyByUserAndMonth(userId: number, month: string): Promise<CommissionMonthly | undefined> {
    const [commission] = await db.select().from(commissionsMonthly).where(
      and(
        eq(commissionsMonthly.userId, userId),
        eq(commissionsMonthly.month, month)
      )
    );
    return commission;
  }

  async getCommissionsMonthlyByUser(userId: number): Promise<CommissionMonthly[]> {
    return db.select().from(commissionsMonthly).where(eq(commissionsMonthly.userId, userId));
  }

  async getCommissionsMonthlyByMonth(month: string): Promise<CommissionMonthly[]> {
    return db.select().from(commissionsMonthly).where(eq(commissionsMonthly.month, month));
  }

  async getCommissionsMonthlyByOrg(orgId: number): Promise<CommissionMonthly[]> {
    return db.select().from(commissionsMonthly).where(eq(commissionsMonthly.orgId, orgId));
  }
  
  async getTopCommissionEarners(options: {
    orgId: number;
    month: string;
    limit: number;
    type?: 'sales' | 'dispatch';
  }): Promise<Array<CommissionMonthly & { username: string; firstName: string; lastName: string; profileImageUrl: string | null; }>> {
    // Build the query conditions
    const conditions = [
      eq(commissionsMonthly.orgId, options.orgId),
      eq(commissionsMonthly.month, options.month)
    ];
    
    // Filter by department if specified
    if (options.type) {
      conditions.push(eq(commissionsMonthly.dept, options.type));
    }
    
    // Get top commission earners with user details
    const results = await db.select({
      id: commissionsMonthly.id,
      userId: commissionsMonthly.userId,
      amount: commissionsMonthly.totalCommission,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      dept: commissionsMonthly.dept,
      month: commissionsMonthly.month
    })
    .from(commissionsMonthly)
    .innerJoin(users, eq(commissionsMonthly.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(commissionsMonthly.totalCommission))
    .limit(options.limit);
    
    return results;
  }
  
  /**
   * Get top performing users based on various metrics
   * Useful for CRM dashboard display
   */
  async getTopPerformingUsers(options: {
    startDate: string;
    endDate: string;
    metric: 'leads' | 'conversions' | 'handoffs' | 'commissions';
    limit: number;
    orgId?: number;
  }): Promise<Array<{
    userId: number;
    userName: string;
    count: number;
    amount?: number;
    profileImageUrl?: string | null;
  }>> {
    try {
      const { startDate, endDate, metric, limit, orgId } = options;
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      switch (metric) {
        case 'leads': {
          // Users with most leads created
          const leadsQuery = db.select({
            userId: leads.createdBy,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            count: sql<number>`count(${leads.id})`.as('count')
          })
          .from(leads)
          .innerJoin(users, eq(leads.createdBy, users.id))
          .where(
            and(
              gte(leads.createdAt, start),
              lte(leads.createdAt, end),
              orgId ? eq(leads.orgId, orgId) : undefined
            ).filter(Boolean) // Remove undefined conditions
          )
          .groupBy(leads.createdBy, users.firstName, users.lastName, users.profileImageUrl)
          .orderBy(desc(sql<number>`count(${leads.id})`))
          .limit(limit);
          
          const topLeadCreators = await leadsQuery;
          
          return topLeadCreators.map(creator => ({
            userId: creator.userId,
            userName: `${creator.firstName} ${creator.lastName}`,
            count: creator.count,
            profileImageUrl: creator.profileImageUrl
          }));
        }
        
        case 'conversions': {
          // Users with most lead status changes to qualified
          const statusChangesQuery = db.select({
            userId: activities.userId,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            count: sql<number>`count(${activities.id})`.as('count')
          })
          .from(activities)
          .innerJoin(users, eq(activities.userId, users.id))
          .where(
            and(
              eq(activities.entityType, 'lead'),
              like(activities.action, '%qualified%'),
              gte(activities.timestamp, start),
              lte(activities.timestamp, end)
            )
          )
          .groupBy(activities.userId, users.firstName, users.lastName, users.profileImageUrl)
          .orderBy(desc(sql<number>`count(${activities.id})`))
          .limit(limit);
          
          const topConverters = await statusChangesQuery;
          
          return topConverters.map(converter => ({
            userId: converter.userId,
            userName: `${converter.firstName} ${converter.lastName}`,
            count: converter.count,
            profileImageUrl: converter.profileImageUrl
          }));
        }
        
        case 'handoffs': {
          // Users with most lead handoffs to dispatch
          const handoffsQuery = db.select({
            userId: activities.userId,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            count: sql<number>`count(${activities.id})`.as('count')
          })
          .from(activities)
          .innerJoin(users, eq(activities.userId, users.id))
          .where(
            and(
              eq(activities.entityType, 'lead'),
              like(activities.action, '%hand%to%dispatch%'),
              gte(activities.timestamp, start),
              lte(activities.timestamp, end)
            )
          )
          .groupBy(activities.userId, users.firstName, users.lastName, users.profileImageUrl)
          .orderBy(desc(sql<number>`count(${activities.id})`))
          .limit(limit);
          
          const topHandoffs = await handoffsQuery;
          
          return topHandoffs.map(handoff => ({
            userId: handoff.userId,
            userName: `${handoff.firstName} ${handoff.lastName}`,
            count: handoff.count,
            profileImageUrl: handoff.profileImageUrl
          }));
        }
        
        case 'commissions': {
          // Get commission monthly data for the given period
          const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
          const monthFormatted = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
          
          const commissionsQuery = db.select({
            userId: commissionsMonthly.userId,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            amount: commissionsMonthly.totalCommission
          })
          .from(commissionsMonthly)
          .innerJoin(users, eq(commissionsMonthly.userId, users.id))
          .where(
            and(
              eq(commissionsMonthly.month, monthFormatted),
              orgId ? eq(commissionsMonthly.orgId, orgId) : undefined
            ).filter(Boolean) // Remove undefined conditions
          )
          .orderBy(desc(commissionsMonthly.totalCommission))
          .limit(limit);
          
          const topCommissions = await commissionsQuery;
          
          return topCommissions.map(commission => ({
            userId: commission.userId,
            userName: `${commission.firstName} ${commission.lastName}`,
            count: 1, // Just a placeholder as we're using amount as the primary metric
            amount: commission.amount,
            profileImageUrl: commission.profileImageUrl
          }));
        }
        
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error in getTopPerformingUsers for metric ${options.metric}:`, error);
      throw error;
    }
  }

  async createCommissionMonthly(commission: InsertCommissionMonthly): Promise<CommissionMonthly> {
    const now = new Date();
    const [commissionMonthly] = await db.insert(commissionsMonthly).values({
      ...commission,
      createdAt: now,
      updatedAt: now
    }).returning();
    return commissionMonthly;
  }

  async updateCommissionMonthly(id: number, updates: Partial<CommissionMonthly>): Promise<CommissionMonthly | undefined> {
    const [updatedCommission] = await db
      .update(commissionsMonthly)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(commissionsMonthly.id, id))
      .returning();
    return updatedCommission;
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
  
  async getTasks(options?: { status?: string; priority?: string; limit?: number }): Promise<Task[]> {
    let query = db.select().from(tasks);
    
    // Apply filters
    const conditions = [];
    
    if (options?.status) {
      conditions.push(eq(tasks.status, options.status));
    }
    
    if (options?.priority) {
      conditions.push(eq(tasks.priority, options.priority));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Sort by dueDate (most urgent first)
    query = query.orderBy(tasks.dueDate);
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return query;
  }
  
  async getTasksByAssignee(userId: number): Promise<Task[]> {
    return db.select()
      .from(tasks)
      .where(eq(tasks.assignedTo, userId))
      .orderBy(tasks.dueDate);
  }
  
  async getTasksByEntity(entityType: string, entityId: number): Promise<Task[]> {
    return db.select()
      .from(tasks)
      .where(
        and(
          eq(tasks.relatedEntityType, entityType),
          eq(tasks.relatedEntityId, entityId)
        )
      )
      .orderBy(tasks.dueDate);
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const now = new Date();
    const [task] = await db.insert(tasks).values({
      ...insertTask,
      createdAt: now,
      updatedAt: now
    }).returning();
    return task;
  }
  
  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    // If we're completing a task now, set the completedAt timestamp
    if (updates.status === 'completed') {
      updates.completedAt = new Date();
    }
    
    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }
  
  // Clock Event operations
  async getClockEvent(id: number): Promise<ClockEvent | undefined> {
    const [event] = await db.select().from(clockEvents).where(eq(clockEvents.id, id));
    return event;
  }
  
  async getClockEvents(): Promise<ClockEvent[]> {
    return db.select().from(clockEvents).orderBy(desc(clockEvents.timestamp));
  }
  
  async getClockEventsByUser(userId: number): Promise<ClockEvent[]> {
    return db.select()
      .from(clockEvents)
      .where(eq(clockEvents.userId, userId))
      .orderBy(desc(clockEvents.timestamp));
  }
  
  async getClockEventsByUserAndDay(userId: number, date: Date): Promise<ClockEvent[]> {
    // Convert date to ISO string with only the date part (YYYY-MM-DD)
    const dateString = date.toISOString().split('T')[0];
    
    return db.select()
      .from(clockEvents)
      .where(
        and(
          eq(clockEvents.userId, userId),
          sql`DATE(${clockEvents.timestamp}) = ${dateString}`
        )
      )
      .orderBy(clockEvents.timestamp);
  }
  
  async getCurrentClockStatus(userId: number): Promise<'IN' | 'OUT' | null> {
    const [latestEvent] = await db.select()
      .from(clockEvents)
      .where(eq(clockEvents.userId, userId))
      .orderBy(desc(clockEvents.timestamp))
      .limit(1);
    
    return latestEvent ? latestEvent.type : null;
  }
  
  async createClockEvent(event: InsertClockEvent): Promise<ClockEvent> {
    const now = new Date();
    const [clockEvent] = await db.insert(clockEvents).values({
      ...event,
      timestamp: now,
      createdAt: now
    }).returning();
    return clockEvent;
  }
  
  // Team Management operations
  async getUsersByDepartment(department: string): Promise<User[]> {
    try {
      // Try to find roles with matching department - handle column exists or not
      try {
        // First attempt - try to directly match the department column
        const departmentRoles = await db
          .select()
          .from(roles)
          .where(sql`department ILIKE ${`%${department}%`}`);
        
        if (departmentRoles.length > 0) {
          // Get role IDs for the department roles
          const roleIds = departmentRoles.map(role => role.id);
          
          // Get all users with these role IDs
          return await db
            .select()
            .from(users)
            .where(
              roleIds.length === 1 
                ? eq(users.roleId, roleIds[0]) 
                : inArray(users.roleId, roleIds)
            );
        }
      } catch (err) {
        // If department column doesn't exist or there's another issue, 
        // we'll fall through to the more robust approach below
        console.log("First attempt at getUsersByDepartment failed, trying fallback:", err);
      }
      
      // Fallback approach: Get all roles and filter by name
      const allRoles = await db.select().from(roles);
      
      // Filter roles by name containing the department
      const matchedRoles = allRoles.filter(role => 
        role.name.toLowerCase().includes(department.toLowerCase())
      );
      
      if (matchedRoles.length === 0) {
        return []; // No matching roles found
      }
      
      // Get role IDs for the matched roles
      const roleIds = matchedRoles.map(role => role.id);
      
      // Get all users with these role IDs
      return await db
        .select()
        .from(users)
        .where(
          roleIds.length === 1 
            ? eq(users.roleId, roleIds[0]) 
            : inArray(users.roleId, roleIds)
        );
    } catch (error) {
      // Handle the database error more gracefully
      console.error('Error getting users by department:', error);
      
      // Try the most basic approach as final fallback
      try {
        // Get all users and roles directly
        const allUsers = await db.select().from(users);
        const allRoles = await db.select().from(roles);
        
        // Filter users by matching their role's name including department
        return allUsers.filter(user => {
          const userRole = allRoles.find(role => role.id === user.roleId);
          if (!userRole) return false;
          
          return userRole.name.toLowerCase().includes(department.toLowerCase());
        });
      } catch (innerError) {
        console.error('Ultimate fallback method failed:', innerError);
        return [];
      }
    }
  }
  
  async getActiveLeadCountByUser(userId: number): Promise<number> {
    // Count active leads assigned to this user
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(
        and(
          eq(leads.assignedTo, userId),
          inArray(leads.status, ['qualified', 'active', 'follow-up', 'nurture'])
        )
      );
    
    return result[0]?.count || 0;
  }
  
  async getActiveLoadCountByUser(userId: number): Promise<number> {
    // Count active loads assigned to this user
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(loads)
      .where(
        and(
          eq(loads.assignedTo, userId),
          inArray(loads.status, ['booked', 'in_transit', 'delivered'])
        )
      );
    
    return result[0]?.count || 0;
  }
  
  async getClosedDealCountByUserForMonth(userId: number, month: string): Promise<number> {
    // Month format is YYYY-MM
    const startDate = new Date(month + '-01');
    const endOfMonth = new Date(startDate);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0); // Last day of the month
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(
        and(
          eq(leads.assignedTo, userId),
          eq(leads.status, 'active'),
          gte(leads.updatedAt, startDate),
          lt(leads.updatedAt, endOfMonth)
        )
      );
    
    return result[0]?.count || 0;
  }
  
  async getGrossRevenueByUserForMonth(userId: number, month: string): Promise<number> {
    // Month format is YYYY-MM
    const startDate = new Date(month + '-01');
    const endOfMonth = new Date(startDate);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0); // Last day of the month
    
    const result = await db
      .select({ sum: sql<number>`COALESCE(SUM(freight_amount), 0)` })
      .from(loads)
      .where(
        and(
          eq(loads.assignedTo, userId),
          inArray(loads.status, ['delivered', 'invoiced', 'paid']),
          gte(loads.deliveryDate, startDate.toISOString().split('T')[0]),
          lte(loads.deliveryDate, endOfMonth.toISOString().split('T')[0])
        )
      );
    
    return result[0]?.sum || 0;
  }
  
  async getDirectGrossRevenueByUserForMonth(userId: number, month: string): Promise<number> {
    // Similar to gross revenue but only for direct sales (user is both creator and assignee)
    // Month format is YYYY-MM
    const startDate = new Date(month + '-01');
    const endOfMonth = new Date(startDate);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0); // Last day of the month
    
    const result = await db
      .select({ sum: sql<number>`COALESCE(SUM(freight_amount), 0)` })
      .from(loads)
      .where(
        and(
          eq(loads.assignedTo, userId),
          eq(loads.createdBy, userId), // Direct sale - user both created and is assigned
          inArray(loads.status, ['delivered', 'invoiced', 'paid']),
          gte(loads.deliveryDate, startDate.toISOString().split('T')[0]),
          lte(loads.deliveryDate, endOfMonth.toISOString().split('T')[0])
        )
      );
    
    return result[0]?.sum || 0;
  }
  
  async getSalesUserKPIs(userId: number, month: string): Promise<any> {
    // Month format is YYYY-MM
    // Get general commission data
    const commission = await this.getUserCommissionByMonth(userId, month);
    
    // Get active leads and closed deals
    const activeLeadsCount = await this.getActiveLeadCountByUser(userId);
    const closedDealsCount = await this.getClosedDealCountByUserForMonth(userId, month);
    
    return {
      activeLeads: activeLeadsCount,
      closedDeals: closedDealsCount,
      invoiceTotal: commission?.invoiceTotal || 0,
      ownLeadBonus: commission?.ownLeadBonus || 0,
      totalCommission: commission?.totalCommission || 0
    };
  }
  
  async getDispatchUserKPIs(userId: number, month: string): Promise<any> {
    // Month format is YYYY-MM
    // Get general commission data
    const commission = await this.getUserCommissionByMonth(userId, month);
    
    // Get load count and revenue metrics
    const loadCount = await this.getActiveLoadCountByUser(userId);
    const grossRevenue = await this.getGrossRevenueByUserForMonth(userId, month);
    const directGrossRevenue = await this.getDirectGrossRevenueByUserForMonth(userId, month);
    
    return {
      loadCount: loadCount,
      grossRevenue: grossRevenue,
      directGrossRevenue: directGrossRevenue,
      bonusAmount: commission?.tierFixed || 0,
      totalCommission: commission?.totalCommission || 0
    };
  }
  // UI Preferences methods
  async getUserPreferences(userId: number): Promise<UiPreferences | undefined> {
    try {
      const [prefs] = await db.select().from(uiPreferences).where(eq(uiPreferences.userId, userId));
      return prefs;
    } catch (error) {
      console.error('Error getting UI preferences:', error);
      // For now, return a default object if table doesn't exist
      return {
        id: 0,
        userId,
        sidebarPinned: true,
        sidebarCollapsed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }
  
  // Notification methods
  async createNotification(data: InsertNotification): Promise<Notification> {
    try {
      const [notification] = await db
        .insert(notifications)
        .values(data)
        .returning();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }
  
  async getNotifications(userId: number, limit: number = 50): Promise<Notification[]> {
    try {
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }
  
  async getUserNotifications(userId: number, limit: number = 50): Promise<Notification[]> {
    try {
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }
  
  async getUserNotificationsByType(userId: number, types: string[], limit: number = 50): Promise<Notification[]> {
    try {
      return await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          inArray(notifications.type, types)
        ))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Error getting user notifications by type:', error);
      return [];
    }
  }
  
  async getNotification(id: number): Promise<Notification | undefined> {
    try {
      const [notification] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, id));
      return notification;
    } catch (error) {
      console.error('Error getting notification:', error);
      return undefined;
    }
  }
  
  async updateNotification(id: number, data: Partial<Notification>): Promise<Notification | undefined> {
    try {
      const [notification] = await db
        .update(notifications)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(notifications.id, id))
        .returning();
      return notification;
    } catch (error) {
      console.error('Error updating notification:', error);
      return undefined;
    }
  }
  
  // Dashboard count functions
  async getLeadCount(orgId?: number): Promise<number> {
    try {
      let query = db.select({ count: count() }).from(leads);
      
      if (orgId) {
        query = query.where(eq(leads.orgId, orgId));
      }
      
      const result = await query;
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting lead count:', error);
      return 0;
    }
  }
  
  async getClientCount(orgId?: number): Promise<number> {
    try {
      let query = db.select({ count: count() }).from(dispatch_clients);
      
      if (orgId) {
        query = query.where(eq(dispatch_clients.orgId, orgId));
      }
      
      const result = await query;
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting client count:', error);
      return 0;
    }
  }
  
  async getLoadCount(orgId?: number): Promise<number> {
    try {
      let query = db.select({ count: count() }).from(loads);
      
      if (orgId) {
        query = query.where(eq(loads.orgId, orgId));
      }
      
      const result = await query;
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting load count:', error);
      return 0;
    }
  }
  
  async getInvoiceCount(orgId?: number): Promise<number> {
    try {
      let query = db.select({ count: count() }).from(invoices);
      
      if (orgId) {
        query = query.where(eq(invoices.orgId, orgId));
      }
      
      const result = await query;
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting invoice count:', error);
      return 0;
    }
  }
  
  // Get recent leads for dashboard
  async getRecentLeads(limit: number = 5, orgId?: number): Promise<Lead[]> {
    try {
      let query = db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
      
      if (orgId) {
        query = query.where(eq(leads.orgId, orgId));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting recent leads:', error);
      return [];
    }
  }
  
  // Get recent loads for dashboard
  async getRecentLoads(limit: number = 5, orgId?: number): Promise<Load[]> {
    try {
      let query = db.select().from(loads).orderBy(desc(loads.createdAt)).limit(limit);
      
      if (orgId) {
        query = query.where(eq(loads.orgId, orgId));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting recent loads:', error);
      return [];
    }
  }
  
  // Get recent invoices for dashboard
  async getRecentInvoices(limit: number = 5, orgId?: number): Promise<Invoice[]> {
    try {
      let query = db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(limit);
      
      if (orgId) {
        query = query.where(eq(invoices.orgId, orgId));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting recent invoices:', error);
      return [];
    }
  }
  
  // Invoice operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
      return invoice;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return undefined;
    }
  }
  
  async getInvoiceWithItems(id: number): Promise<{invoice: Invoice, items: InvoiceItem[]} | undefined> {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
      
      if (!invoice) {
        return undefined;
      }
      
      const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
      
      return { invoice, items };
    } catch (error) {
      console.error('Error fetching invoice with items:', error);
      return undefined;
    }
  }
  
  // Generate invoices for delivered loads that haven't been invoiced yet
  async generateInvoicesForDeliveredLoads(): Promise<{count: number, invoices: Invoice[]}> {
    try {
      // Find all "Delivered" loads that don't have invoices yet
      const loads = await db.select().from(loads)
        .where(and(
          eq(loads.status, 'Delivered'),
          sql`NOT EXISTS (SELECT 1 FROM ${invoiceItems} WHERE ${invoiceItems.loadId} = ${loads.id})`
        ));
      
      if (loads.length === 0) {
        return { count: 0, invoices: [] };
      }
      
      const generatedInvoices: Invoice[] = [];
      
      // Group loads by lead ID to create one invoice per client
      const loadsByLeadId: Record<number, typeof loads> = {};
      
      for (const load of loads) {
        if (!loadsByLeadId[load.leadId]) {
          loadsByLeadId[load.leadId] = [];
        }
        loadsByLeadId[load.leadId].push(load);
      }
      
      // Create one invoice for each lead with their loads
      for (const [leadIdString, leadLoads] of Object.entries(loadsByLeadId)) {
        const leadId = parseInt(leadIdString);
        
        // Generate invoice number
        const today = new Date();
        const invoiceNumber = `INV-${leadId}-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        
        // Calculate total amount from all loads
        const totalAmount = leadLoads.reduce((sum, load) => sum + (load.price || 0), 0);
        
        // Set due date to 30 days from now
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        
        // Create the invoice
        const invoice = await this.createInvoice({
          invoiceNumber,
          leadId,
          orgId: leadLoads[0].orgId,
          status: 'draft',
          totalAmount,
          issuedDate: today.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          notes: `Auto-generated invoice for ${leadLoads.length} delivered loads`,
          createdBy: leadLoads[0].createdBy
        });
        
        // Create invoice items for each load
        for (const load of leadLoads) {
          await this.createInvoiceItem({
            invoiceId: invoice.id,
            loadId: load.id,
            description: `Load ${load.id} from ${load.origin} to ${load.destination}`,
            amount: load.price || 0
          });
        }
        
        generatedInvoices.push(invoice);
      }
      
      return {
        count: generatedInvoices.length,
        invoices: generatedInvoices
      };
    } catch (error) {
      console.error('Error generating invoices for delivered loads:', error);
      return { count: 0, invoices: [] };
    }
  }
  
  async getInvoices(page: number = 1, limit: number = 10, filters: any = {}): Promise<{data: Invoice[], pagination: {total: number, page: number, limit: number, pages: number}}> {
    try {
      const offset = (page - 1) * limit;
      
      // Base query
      let query = db.select().from(invoices);
      let countQuery = db.select({ count: count() }).from(invoices);
      
      // Apply filters
      if (filters.orgId) {
        query = query.where(eq(invoices.orgId, filters.orgId));
        countQuery = countQuery.where(eq(invoices.orgId, filters.orgId));
      }
      
      if (filters.status) {
        query = query.where(eq(invoices.status, filters.status));
        countQuery = countQuery.where(eq(invoices.status, filters.status));
      }
      
      if (filters.createdBy) {
        query = query.where(eq(invoices.createdBy, filters.createdBy));
        countQuery = countQuery.where(eq(invoices.createdBy, filters.createdBy));
      }
      
      if (filters.leadId) {
        query = query.where(eq(invoices.leadId, filters.leadId));
        countQuery = countQuery.where(eq(invoices.leadId, filters.leadId));
      }
      
      if (filters.dateFrom && filters.dateTo) {
        query = query.where(
          and(
            gte(invoices.issuedDate, new Date(filters.dateFrom)),
            lte(invoices.issuedDate, new Date(filters.dateTo))
          )
        );
        countQuery = countQuery.where(
          and(
            gte(invoices.issuedDate, new Date(filters.dateFrom)),
            lte(invoices.issuedDate, new Date(filters.dateTo))
          )
        );
      }
      
      // Add pagination
      query = query.limit(limit).offset(offset).orderBy(desc(invoices.createdAt));
      
      // Execute queries
      const data = await query;
      const totalResult = await countQuery;
      
      const total = totalResult[0]?.count || 0;
      const pages = Math.ceil(total / limit);
      
      return {
        data,
        pagination: {
          total,
          page,
          limit,
          pages
        }
      };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return {
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0
        }
      };
    }
  }
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    try {
      const now = new Date();
      const [newInvoice] = await db.insert(invoices).values({
        ...invoice,
        createdAt: now,
        updatedAt: now
      }).returning();
      
      return newInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }
  
  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    try {
      const [newItem] = await db.insert(invoiceItems).values({
        ...item,
        createdAt: new Date()
      }).returning();
      
      return newItem;
    } catch (error) {
      console.error('Error creating invoice item:', error);
      throw error;
    }
  }
  
  async createInvoiceWithItems(invoice: InsertInvoice, items: Omit<InsertInvoiceItem, 'invoiceId'>[]): Promise<{invoice: Invoice, items: InvoiceItem[]}> {
    try {
      // Start a transaction
      const now = new Date();
      const [newInvoice] = await db.insert(invoices).values({
        ...invoice,
        createdAt: now,
        updatedAt: now
      }).returning();
      
      const newItems: InvoiceItem[] = [];
      
      for (const item of items) {
        const [newItem] = await db.insert(invoiceItems).values({
          ...item,
          invoiceId: newInvoice.id,
          createdAt: now
        }).returning();
        
        newItems.push(newItem);
      }
      
      return {
        invoice: newInvoice,
        items: newItems
      };
    } catch (error) {
      console.error('Error creating invoice with items:', error);
      throw error;
    }
  }
  
  async updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined> {
    try {
      const [updatedInvoice] = await db
        .update(invoices)
        .set({
          ...invoice,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, id))
        .returning();
      
      return updatedInvoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      return undefined;
    }
  }
  
  async markInvoiceAsPaid(id: number, paidDate: Date, paidAmount: number): Promise<Invoice | undefined> {
    try {
      const [updatedInvoice] = await db
        .update(invoices)
        .set({
          status: 'paid',
          paidDate: paidDate,
          paidAmount: paidAmount,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, id))
        .returning();
        
      // Update related commissions
      await db
        .update(commissions)
        .set({
          status: 'approved', // Commissions are approved when invoice is paid
          updatedAt: new Date()
        })
        .where(eq(commissions.invoiceId, id));
      
      return updatedInvoice;
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      return undefined;
    }
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    try {
      // Delete all invoice items first
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
      
      // Then delete the invoice
      await db.delete(invoices).where(eq(invoices.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }
  
  async generateInvoicesForDeliveredLoads(options: {
    weekly?: boolean;
    dateRange?: { start: Date; end: Date };
  } = { weekly: true }): Promise<{count: number, invoices: Invoice[]}> {
    try {
      // Define the date range for finding loads
      let startDate: Date, endDate: Date;
      
      if (options.weekly) {
        // Get loads from the past week
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      } else if (options.dateRange) {
        // Use custom date range if provided
        startDate = options.dateRange.start;
        endDate = options.dateRange.end;
      } else {
        // Default to all-time if neither weekly nor custom range is specified
        startDate = new Date(0); // Beginning of time
        endDate = new Date();
      }
      
      // Find all delivered loads that don't have invoices yet within the date range
      const deliveredLoads = await db.select()
        .from(loads)
        .where(
          and(
            eq(loads.status, 'Delivered'),
            gte(loads.deliveryDate, startDate),
            lte(loads.deliveryDate, endDate),
            sql`NOT EXISTS (SELECT 1 FROM ${invoiceItems} WHERE ${invoiceItems.loadId} = ${loads.id})`
          )
        );
      
      if (deliveredLoads.length === 0) {
        return { count: 0, invoices: [] };
      }
      
      // Group loads by leadId (client)
      const loadsByLeadId: Record<number, typeof deliveredLoads> = {};
      
      for (const load of deliveredLoads) {
        if (!loadsByLeadId[load.leadId]) {
          loadsByLeadId[load.leadId] = [];
        }
        loadsByLeadId[load.leadId].push(load);
      }
      
      const createdInvoices: Invoice[] = [];
      
      // Create one invoice per client for all their loads
      for (const [leadIdStr, clientLoads] of Object.entries(loadsByLeadId)) {
        const leadId = parseInt(leadIdStr);
        
        // Generate a unique invoice number with date and client ID
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const invoiceNumber = `INV-${dateStr}-${leadId}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        
        // Calculate total amount from all client loads
        const totalAmount = clientLoads.reduce((sum, load) => sum + load.amount, 0);
        
        // Set due date to 30 days from now
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        
        // Create the consolidated invoice
        const [newInvoice] = await db.insert(invoices).values({
          invoiceNumber,
          leadId,
          orgId: clientLoads[0].orgId,
          totalAmount,
          status: 'draft',
          issuedDate: today,
          dueDate,
          notes: `Auto-generated invoice for ${clientLoads.length} delivered loads from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
          createdAt: today,
          updatedAt: today,
          createdBy: clientLoads[0].assignedTo || 1 // Default to admin if no assignee
        }).returning();
        
        // Create invoice items for each load
        for (const load of clientLoads) {
          await db.insert(invoiceItems).values({
            invoiceId: newInvoice.id,
            loadId: load.id,
            description: `Load #${load.loadNumber || load.id}: ${load.origin} to ${load.destination} (${new Date(load.deliveryDate).toLocaleDateString()})`,
            amount: load.amount,
            createdAt: today
          });
        }
        
        createdInvoices.push(newInvoice);
      }
      
      return {
        count: createdInvoices.length,
        invoices: createdInvoices
      };
    } catch (error) {
      console.error('Error generating invoices for delivered loads:', error);
      return {
        count: 0,
        invoices: []
      };
    }
  }
  
  async markNotificationAsRead(id: number): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async createUserPreferences(prefs: InsertUiPreferences): Promise<UiPreferences> {
    try {
      const now = new Date();
      const [newPrefs] = await db.insert(uiPreferences).values({
        ...prefs,
        createdAt: now,
        updatedAt: now
      }).returning();
      return newPrefs;
    } catch (error) {
      console.error('Error creating UI preferences:', error);
      // Return a default object if table doesn't exist
      return {
        id: 0,
        userId: prefs.userId,
        sidebarPinned: prefs.sidebarPinned || true,
        sidebarCollapsed: prefs.sidebarCollapsed || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  async updateUserPreferences(userId: number, updates: Partial<UiPreferences>): Promise<UiPreferences> {
    try {
      // First check if preferences exist
      const prefs = await this.getUserPreferences(userId);
      
      if (prefs && prefs.id !== 0) {
        // Update existing preferences
        const [updatedPrefs] = await db
          .update(uiPreferences)
          .set({
            ...updates,
            updatedAt: new Date()
          })
          .where(eq(uiPreferences.userId, userId))
          .returning();
        return updatedPrefs;
      } else {
        // Create new preferences
        return this.createUserPreferences({
          userId,
          sidebarPinned: updates.sidebarPinned !== undefined ? updates.sidebarPinned : true,
          sidebarCollapsed: updates.sidebarCollapsed !== undefined ? updates.sidebarCollapsed : false
        });
      }
    } catch (error) {
      console.error('Error updating UI preferences:', error);
      // Return a default object with the updates applied
      return {
        id: 0,
        userId,
        sidebarPinned: updates.sidebarPinned !== undefined ? updates.sidebarPinned : true,
        sidebarCollapsed: updates.sidebarCollapsed !== undefined ? updates.sidebarCollapsed : false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  // Dispatch Task operations
  async getDispatchTask(id: number): Promise<DispatchTask | undefined> {
    try {
      const [task] = await db.select().from(dispatchTasks).where(eq(dispatchTasks.id, id));
      return task;
    } catch (error) {
      console.error('Error fetching dispatch task:', error);
      return undefined;
    }
  }

  async getDispatchTasksByDate(date: Date): Promise<DispatchTask[]> {
    try {
      // Format date to ISO string for date comparison (year, month, day only)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      return await db.select().from(dispatchTasks)
        .where(and(
          gte(dispatchTasks.date, startDate),
          lte(dispatchTasks.date, endDate)
        ));
    } catch (error) {
      console.error('Error fetching dispatch tasks by date:', error);
      return [];
    }
  }

  async getDispatchTasksByDispatcher(dispatcherId: number): Promise<DispatchTask[]> {
    try {
      return await db.select().from(dispatchTasks).where(eq(dispatchTasks.dispatcherId, dispatcherId));
    } catch (error) {
      console.error('Error fetching dispatch tasks by dispatcher:', error);
      return [];
    }
  }

  async getDispatchTaskByDispatcherAndDate(dispatcherId: number, date: Date): Promise<DispatchTask | undefined> {
    try {
      // Format date to ISO string for date comparison (year, month, day only)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      const [task] = await db.select().from(dispatchTasks)
        .where(and(
          eq(dispatchTasks.dispatcherId, dispatcherId),
          gte(dispatchTasks.date, startDate),
          lte(dispatchTasks.date, endDate)
        ));
      return task;
    } catch (error) {
      console.error('Error fetching dispatch task by dispatcher and date:', error);
      return undefined;
    }
  }

  async createDispatchTask(task: InsertDispatchTask): Promise<DispatchTask> {
    try {
      const [newTask] = await db.insert(dispatchTasks).values(task).returning();
      return newTask;
    } catch (error) {
      console.error('Error creating dispatch task:', error);
      throw error;
    }
  }

  async updateDispatchTask(id: number, task: Partial<DispatchTask>): Promise<DispatchTask | undefined> {
    try {
      const [updatedTask] = await db
        .update(dispatchTasks)
        .set(task)
        .where(eq(dispatchTasks.id, id))
        .returning();
      return updatedTask;
    } catch (error) {
      console.error('Error updating dispatch task:', error);
      return undefined;
    }
  }

  // Dispatch Report operations
  async getDispatchReport(id: number): Promise<DispatchReport | undefined> {
    try {
      const [report] = await db.select().from(dispatchReports).where(eq(dispatchReports.id, id));
      return report;
    } catch (error) {
      console.error('Error fetching dispatch report:', error);
      return undefined;
    }
  }

  async getDispatchReportsByDate(date: Date): Promise<DispatchReport[]> {
    try {
      // Format date to ISO string for date comparison (year, month, day only)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      return await db.select().from(dispatchReports)
        .where(and(
          gte(dispatchReports.date, startDate),
          lte(dispatchReports.date, endDate)
        ));
    } catch (error) {
      console.error('Error fetching dispatch reports by date:', error);
      return [];
    }
  }

  async getDispatchReportsByDispatcher(dispatcherId: number): Promise<DispatchReport[]> {
    try {
      return await db.select().from(dispatchReports).where(eq(dispatchReports.dispatcherId, dispatcherId));
    } catch (error) {
      console.error('Error fetching dispatch reports by dispatcher:', error);
      return [];
    }
  }

  async getDispatchReportByDispatcherAndDate(dispatcherId: number, date: Date): Promise<DispatchReport | undefined> {
    try {
      // Format date to ISO string for date comparison (year, month, day only)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      const [report] = await db.select().from(dispatchReports)
        .where(and(
          eq(dispatchReports.dispatcherId, dispatcherId),
          gte(dispatchReports.date, startDate),
          lte(dispatchReports.date, endDate)
        ));
      return report;
    } catch (error) {
      console.error('Error fetching dispatch report by dispatcher and date:', error);
      return undefined;
    }
  }

  async createDispatchReport(report: InsertDispatchReport): Promise<DispatchReport> {
    try {
      const [newReport] = await db.insert(dispatchReports).values(report).returning();
      return newReport;
    } catch (error) {
      console.error('Error creating dispatch report:', error);
      throw error;
    }
  }
  
  /**
   * Generates a daily dispatch report for the specified dispatcher
   * Aggregates data from loads, invoices, and leads tables
   */
  async generateDailyDispatchReport(dispatcherId: number, date: Date = new Date()): Promise<DispatchReport> {
    try {
      // Get existing report for today if it exists
      const existingReport = await this.getDispatchReportByDispatcherAndDate(dispatcherId, date);
      if (existingReport) {
        return await this.updateDailyDispatchReport(existingReport.id, date);
      }
      
      // Get dispatcher info
      const dispatcher = await this.getUser(dispatcherId);
      if (!dispatcher) {
        throw new Error(`Dispatcher with ID ${dispatcherId} not found`);
      }
      
      // Format date for database queries
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Get all loads booked by this dispatcher today
      const todayLoads = await db.select()
        .from(loads)
        .where(and(
          eq(loads.assignedTo, dispatcherId),
          gte(loads.createdAt, startDate),
          lte(loads.createdAt, endDate)
        ));
      
      // Get all invoices generated by this dispatcher today
      const todayInvoices = await db.select({
        invoice: invoices,
        load: loads,
      })
        .from(invoices)
        .innerJoin(loads, eq(invoices.leadId, loads.leadId))
        .where(and(
          eq(loads.assignedTo, dispatcherId),
          gte(invoices.createdAt, startDate),
          lte(invoices.createdAt, endDate)
        ));
      
      // Get all active leads assigned to this dispatcher
      const activeLeads = await db.select()
        .from(leads)
        .where(and(
          eq(leads.assignedTo, dispatcherId),
          eq(leads.status, 'Active')
        ));
      
      // Get all pending invoices for this dispatcher
      const pendingInvoices = await db.select({
        invoice: invoices,
        load: loads,
      })
        .from(invoices)
        .innerJoin(loads, eq(invoices.leadId, loads.leadId))
        .where(and(
          eq(loads.assignedTo, dispatcherId),
          eq(invoices.status, 'pending')
        ));
      
      // Calculate metrics
      const loadsBooked = todayLoads.length;
      const invoiceUsd = todayInvoices.reduce((sum, item) => sum + Number(item.invoice.totalAmount), 0);
      const activeLeadsCount = activeLeads.length;
      const pendingInvoiceUsd = pendingInvoices.reduce((sum, item) => sum + Number(item.invoice.totalAmount), 0);
      
      // Get highest invoice amount (if any invoices exist)
      let highestInvoiceUsd = 0;
      if (todayInvoices.length > 0) {
        highestInvoiceUsd = Math.max(...todayInvoices.map(item => Number(item.invoice.totalAmount)));
      }
      
      // Get invoices marked as paid today
      const paidInvoices = await db.select()
        .from(invoices)
        .innerJoin(loads, eq(invoices.leadId, loads.leadId))
        .where(and(
          eq(loads.assignedTo, dispatcherId),
          eq(invoices.status, 'paid'),
          gte(invoices.paidDate, startDate),
          lte(invoices.paidDate, endDate)
        ));
      
      const paidInvoiceUsd = paidInvoices.reduce((sum, item) => sum + Number(item.totalAmount), 0);
      
      // Create a new report
      const reportData: InsertDispatchReport = {
        dispatcherId,
        orgId: dispatcher.orgId || 1,
        date,
        loadsBooked,
        invoiceUsd,
        activeLeads: activeLeadsCount,
        pendingInvoiceUsd,
        highestInvoiceUsd,
        paidInvoiceUsd,
        status: 'Pending',
      };
      
      const [newReport] = await db.insert(dispatchReports).values(reportData).returning();
      return newReport;
    } catch (error) {
      console.error('Error generating daily dispatch report:', error);
      throw error;
    }
  }
  
  /**
   * Updates an existing daily dispatch report with current data
   */
  async updateDailyDispatchReport(reportId: number, date: Date = new Date()): Promise<DispatchReport> {
    try {
      const report = await this.getDispatchReport(reportId);
      if (!report) {
        throw new Error(`Report with ID ${reportId} not found`);
      }
      
      // Re-calculate all metrics for the report
      const dispatcherId = report.dispatcherId;
      
      // Format date for database queries
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Get all loads booked by this dispatcher today
      const todayLoads = await db.select()
        .from(loads)
        .where(and(
          eq(loads.assignedTo, dispatcherId),
          gte(loads.createdAt, startDate),
          lte(loads.createdAt, endDate)
        ));
      
      // Get all invoices generated by this dispatcher today
      const todayInvoices = await db.select({
        invoice: invoices,
        load: loads,
      })
        .from(invoices)
        .innerJoin(loads, eq(invoices.leadId, loads.leadId))
        .where(and(
          eq(loads.assignedTo, dispatcherId),
          gte(invoices.createdAt, startDate),
          lte(invoices.createdAt, endDate)
        ));
      
      // Get all active leads assigned to this dispatcher
      const activeLeads = await db.select()
        .from(leads)
        .where(and(
          eq(leads.assignedTo, dispatcherId),
          eq(leads.status, 'Active')
        ));
      
      // Get all pending invoices for this dispatcher
      const pendingInvoices = await db.select({
        invoice: invoices,
        load: loads,
      })
        .from(invoices)
        .innerJoin(loads, eq(invoices.leadId, loads.leadId))
        .where(and(
          eq(loads.assignedTo, dispatcherId),
          eq(invoices.status, 'pending')
        ));
      
      // Calculate metrics
      const loadsBooked = todayLoads.length;
      const invoiceUsd = todayInvoices.reduce((sum, item) => sum + Number(item.invoice.totalAmount), 0);
      const activeLeadsCount = activeLeads.length;
      const pendingInvoiceUsd = pendingInvoices.reduce((sum, item) => sum + Number(item.invoice.totalAmount), 0);
      
      // Get highest invoice amount (if any invoices exist)
      let highestInvoiceUsd = 0;
      if (todayInvoices.length > 0) {
        highestInvoiceUsd = Math.max(...todayInvoices.map(item => Number(item.invoice.totalAmount)));
      }
      
      // Get invoices marked as paid today
      const paidInvoices = await db.select()
        .from(invoices)
        .innerJoin(loads, eq(invoices.leadId, loads.leadId))
        .where(and(
          eq(loads.assignedTo, dispatcherId),
          eq(invoices.status, 'paid'),
          gte(invoices.paidDate, startDate),
          lte(invoices.paidDate, endDate)
        ));
      
      const paidInvoiceUsd = paidInvoices.reduce((sum, item) => sum + Number(item.totalAmount), 0);
      
      // Update the report
      const updatedData = {
        loadsBooked,
        invoiceUsd,
        activeLeads: activeLeadsCount,
        pendingInvoiceUsd,
        highestInvoiceUsd,
        paidInvoiceUsd,
      };
      
      const [updatedReport] = await db
        .update(dispatchReports)
        .set(updatedData)
        .where(eq(dispatchReports.id, reportId))
        .returning();
      
      return updatedReport;
    } catch (error) {
      console.error('Error updating daily dispatch report:', error);
      throw error;
    }
  }

  async updateDispatchReport(id: number, report: Partial<DispatchReport>): Promise<DispatchReport | undefined> {
    try {
      const [updatedReport] = await db
        .update(dispatchReports)
        .set(report)
        .where(eq(dispatchReports.id, id))
        .returning();
      return updatedReport;
    } catch (error) {
      console.error('Error updating dispatch report:', error);
      return undefined;
    }
  }

  // Performance Target operations
  async getPerformanceTarget(id: number): Promise<PerformanceTarget | undefined> {
    try {
      const [target] = await db.select().from(performanceTargets).where(eq(performanceTargets.id, id));
      return target;
    } catch (error) {
      console.error('Error fetching performance target:', error);
      return undefined;
    }
  }

  async getPerformanceTargetsByType(type: 'daily' | 'weekly'): Promise<PerformanceTarget[]> {
    try {
      return await db.select().from(performanceTargets).where(eq(performanceTargets.type, type));
    } catch (error) {
      console.error('Error fetching performance targets by type:', error);
      return [];
    }
  }

  async getPerformanceTargetByOrgAndType(orgId: number, type: 'daily' | 'weekly'): Promise<PerformanceTarget | undefined> {
    try {
      const [target] = await db.select().from(performanceTargets)
        .where(and(
          eq(performanceTargets.orgId, orgId),
          eq(performanceTargets.type, type)
        ));
      return target;
    } catch (error) {
      console.error('Error fetching performance target by org and type:', error);
      return undefined;
    }
  }

  async createPerformanceTarget(target: InsertPerformanceTarget): Promise<PerformanceTarget> {
    try {
      const [newTarget] = await db.insert(performanceTargets).values(target).returning();
      return newTarget;
    } catch (error) {
      console.error('Error creating performance target:', error);
      throw error;
    }
  }

  async updatePerformanceTarget(id: number, target: Partial<PerformanceTarget>): Promise<PerformanceTarget | undefined> {
    try {
      const [updatedTarget] = await db
        .update(performanceTargets)
        .set(target)
        .where(eq(performanceTargets.id, id))
        .returning();
      return updatedTarget;
    } catch (error) {
      console.error('Error updating performance target:', error);
      return undefined;
    }
  }

  // HR Hiring & Onboarding operations
  
  // Hiring Candidate operations
  async getHiringCandidate(id: number): Promise<HiringCandidate | undefined> {
    try {
      const [candidate] = await db.select().from(hiringCandidates).where(eq(hiringCandidates.id, id));
      return candidate;
    } catch (error) {
      console.error('Error fetching hiring candidate:', error);
      return undefined;
    }
  }
  
  async getHiringCandidates(orgId: number): Promise<HiringCandidate[]> {
    try {
      return await db.select().from(hiringCandidates).where(eq(hiringCandidates.orgId, orgId));
    } catch (error) {
      console.error('Error fetching hiring candidates:', error);
      return [];
    }
  }
  
  async getHiringCandidatesByStatus(status: string, orgId: number): Promise<HiringCandidate[]> {
    try {
      return await db.select().from(hiringCandidates)
        .where(and(
          eq(hiringCandidates.status, status),
          eq(hiringCandidates.orgId, orgId)
        ));
    } catch (error) {
      console.error('Error fetching hiring candidates by status:', error);
      return [];
    }
  }
  
  async createHiringCandidate(candidate: InsertHiringCandidate): Promise<HiringCandidate> {
    try {
      const now = new Date();
      const [newCandidate] = await db.insert(hiringCandidates)
        .values({
          ...candidate,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      // Log the activity
      await this.createActivity({
        userId: candidate.createdBy,
        activityType: 'hiring_candidate_created',
        entityType: 'hiring_candidate',
        entityId: newCandidate.id,
        description: `New hiring candidate created: ${candidate.firstName} ${candidate.lastName}`,
        orgId: candidate.orgId,
        timestamp: now
      });
      
      return newCandidate;
    } catch (error) {
      console.error('Error creating hiring candidate:', error);
      throw error;
    }
  }
  
  async updateHiringCandidate(id: number, updates: Partial<HiringCandidate>): Promise<HiringCandidate | undefined> {
    try {
      // Get the current candidate data before update
      const [currentCandidate] = await db.select().from(hiringCandidates).where(eq(hiringCandidates.id, id));
      if (!currentCandidate) return undefined;
      
      const now = new Date();
      const [updatedCandidate] = await db.update(hiringCandidates)
        .set({
          ...updates,
          updatedAt: now
        })
        .where(eq(hiringCandidates.id, id))
        .returning();
      
      // If there's a status change, log it as an activity
      if (updates.status && updates.status !== currentCandidate.status) {
        await this.createActivity({
          userId: updates.updatedBy || currentCandidate.createdBy,
          activityType: 'hiring_candidate_status_updated',
          entityType: 'hiring_candidate',
          entityId: id,
          description: `Candidate status changed from ${currentCandidate.status} to ${updates.status}`,
          orgId: currentCandidate.orgId,
          timestamp: now
        });
      }
      
      return updatedCandidate;
    } catch (error) {
      console.error('Error updating hiring candidate:', error);
      throw error;
    }
  }
  
  // Candidate Document operations
  async getCandidateDocument(id: number): Promise<CandidateDocument | undefined> {
    try {
      const [document] = await db.select().from(candidateDocuments).where(eq(candidateDocuments.id, id));
      return document;
    } catch (error) {
      console.error('Error fetching candidate document:', error);
      return undefined;
    }
  }
  
  async getCandidateDocumentsByCandidateId(candidateId: number): Promise<CandidateDocument[]> {
    try {
      return await db.select().from(candidateDocuments).where(eq(candidateDocuments.candidateId, candidateId));
    } catch (error) {
      console.error('Error fetching candidate documents by candidateId:', error);
      return [];
    }
  }
  
  async createCandidateDocument(document: InsertCandidateDocument): Promise<CandidateDocument> {
    try {
      const now = new Date();
      const [newDocument] = await db.insert(candidateDocuments)
        .values({
          ...document,
          uploadedAt: now,
          verifiedAt: null
        })
        .returning();
      
      // Log the activity
      const candidate = await this.getHiringCandidate(document.candidateId);
      if (candidate) {
        await this.createActivity({
          userId: document.uploadedBy,
          activityType: 'candidate_document_uploaded',
          entityType: 'candidate_document',
          entityId: newDocument.id,
          description: `Document '${document.documentType}' uploaded for candidate: ${candidate.firstName} ${candidate.lastName}`,
          orgId: candidate.orgId,
          timestamp: now
        });
      }
      
      return newDocument;
    } catch (error) {
      console.error('Error creating candidate document:', error);
      throw error;
    }
  }
  
  async updateCandidateDocument(id: number, updates: Partial<CandidateDocument>): Promise<CandidateDocument | undefined> {
    try {
      // Get the current document data before update
      const [currentDocument] = await db.select().from(candidateDocuments).where(eq(candidateDocuments.id, id));
      if (!currentDocument) return undefined;
      
      const now = new Date();
      const documentUpdates = { ...updates };
      
      // If verifying the document, set verification time
      if (updates.status === 'verified' && currentDocument.status !== 'verified') {
        documentUpdates.verifiedAt = now;
      }
      
      const [updatedDocument] = await db.update(candidateDocuments)
        .set(documentUpdates)
        .where(eq(candidateDocuments.id, id))
        .returning();
      
      // Log the activity for status change
      if (updates.status && updates.status !== currentDocument.status) {
        const candidate = await this.getHiringCandidate(currentDocument.candidateId);
        if (candidate) {
          await this.createActivity({
            userId: updates.verifiedBy || currentDocument.uploadedBy,
            activityType: 'candidate_document_status_updated',
            entityType: 'candidate_document',
            entityId: id,
            description: `Document '${currentDocument.documentType}' status changed from ${currentDocument.status} to ${updates.status}`,
            orgId: candidate.orgId,
            timestamp: now
          });
        }
      }
      
      return updatedDocument;
    } catch (error) {
      console.error('Error updating candidate document:', error);
      throw error;
    }
  }
  
  // Hiring Template operations
  async getHiringTemplate(id: number): Promise<HiringTemplate | undefined> {
    try {
      const [template] = await db.select().from(hiringTemplates).where(eq(hiringTemplates.id, id));
      return template;
    } catch (error) {
      console.error('Error fetching hiring template:', error);
      return undefined;
    }
  }
  
  async getHiringTemplatesByType(templateType: string, orgId: number): Promise<HiringTemplate[]> {
    try {
      return await db.select().from(hiringTemplates)
        .where(and(
          eq(hiringTemplates.templateType, templateType),
          eq(hiringTemplates.orgId, orgId)
        ));
    } catch (error) {
      console.error('Error fetching hiring templates by type:', error);
      return [];
    }
  }
  
  async getDefaultTemplateByType(templateType: string, orgId: number): Promise<HiringTemplate | undefined> {
    try {
      const [template] = await db.select().from(hiringTemplates)
        .where(and(
          eq(hiringTemplates.templateType, templateType),
          eq(hiringTemplates.orgId, orgId),
          eq(hiringTemplates.isDefault, true)
        ));
      return template;
    } catch (error) {
      console.error('Error fetching default hiring template by type:', error);
      return undefined;
    }
  }
  
  async createHiringTemplate(template: InsertHiringTemplate): Promise<HiringTemplate> {
    try {
      const now = new Date();
      const [newTemplate] = await db.insert(hiringTemplates)
        .values({
          ...template,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      // If this is a default template, update other templates of the same type to be non-default
      if (template.isDefault) {
        await db.update(hiringTemplates)
          .set({ isDefault: false, updatedAt: now })
          .where(and(
            eq(hiringTemplates.templateType, template.templateType),
            eq(hiringTemplates.orgId, template.orgId),
            eq(hiringTemplates.isDefault, true),
            sql`${hiringTemplates.id} != ${newTemplate.id}`
          ));
      }
      
      return newTemplate;
    } catch (error) {
      console.error('Error creating hiring template:', error);
      throw error;
    }
  }
  
  async updateHiringTemplate(id: number, updates: Partial<HiringTemplate>): Promise<HiringTemplate | undefined> {
    try {
      // Get the current template data before update
      const [currentTemplate] = await db.select().from(hiringTemplates).where(eq(hiringTemplates.id, id));
      if (!currentTemplate) return undefined;
      
      const now = new Date();
      const [updatedTemplate] = await db.update(hiringTemplates)
        .set({
          ...updates,
          updatedAt: now
        })
        .where(eq(hiringTemplates.id, id))
        .returning();
      
      // If this template is being set as default, update other templates of the same type to be non-default
      if (updates.isDefault && !currentTemplate.isDefault) {
        await db.update(hiringTemplates)
          .set({ isDefault: false, updatedAt: now })
          .where(and(
            eq(hiringTemplates.templateType, currentTemplate.templateType),
            eq(hiringTemplates.orgId, currentTemplate.orgId),
            eq(hiringTemplates.isDefault, true),
            sql`${hiringTemplates.id} != ${id}`
          ));
      }
      
      return updatedTemplate;
    } catch (error) {
      console.error('Error updating hiring template:', error);
      throw error;
    }
  }
  
  // Probation Schedule operations
  async getProbationSchedule(id: number): Promise<ProbationSchedule | undefined> {
    try {
      const [schedule] = await db.select().from(probationSchedules).where(eq(probationSchedules.id, id));
      return schedule;
    } catch (error) {
      console.error('Error fetching probation schedule:', error);
      return undefined;
    }
  }
  
  async getProbationScheduleByUserId(userId: number): Promise<ProbationSchedule | undefined> {
    try {
      const [schedule] = await db.select().from(probationSchedules).where(eq(probationSchedules.userId, userId));
      return schedule;
    } catch (error) {
      console.error('Error fetching probation schedule by userId:', error);
      return undefined;
    }
  }
  
  async getProbationSchedulesByStatus(status: string, orgId: number): Promise<ProbationSchedule[]> {
    try {
      return await db.select().from(probationSchedules)
        .where(and(
          eq(probationSchedules.status, status),
          eq(probationSchedules.orgId, orgId)
        ));
    } catch (error) {
      console.error('Error fetching probation schedules by status:', error);
      return [];
    }
  }
  
  async getProbationSchedulesByManager(managerId: number): Promise<ProbationSchedule[]> {
    try {
      return await db.select().from(probationSchedules).where(eq(probationSchedules.assignedManagerId, managerId));
    } catch (error) {
      console.error('Error fetching probation schedules by manager:', error);
      return [];
    }
  }
  
  async createProbationSchedule(schedule: InsertProbationSchedule): Promise<ProbationSchedule> {
    try {
      const now = new Date();
      const [newSchedule] = await db.insert(probationSchedules)
        .values({
          ...schedule,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      // Log the activity
      await this.createActivity({
        userId: schedule.createdBy,
        activityType: 'probation_schedule_created',
        entityType: 'probation_schedule',
        entityId: newSchedule.id,
        description: `Probation schedule created for user ID: ${schedule.userId}`,
        orgId: schedule.orgId,
        timestamp: now
      });
      
      return newSchedule;
    } catch (error) {
      console.error('Error creating probation schedule:', error);
      throw error;
    }
  }
  
  async updateProbationSchedule(id: number, updates: Partial<ProbationSchedule>): Promise<ProbationSchedule | undefined> {
    try {
      // Get the current schedule data before update
      const [currentSchedule] = await db.select().from(probationSchedules).where(eq(probationSchedules.id, id));
      if (!currentSchedule) return undefined;
      
      const now = new Date();
      const [updatedSchedule] = await db.update(probationSchedules)
        .set({
          ...updates,
          updatedAt: now
        })
        .where(eq(probationSchedules.id, id))
        .returning();
      
      // If status changed, log the activity
      if (updates.status && updates.status !== currentSchedule.status) {
        await this.createActivity({
          userId: updates.updatedBy || currentSchedule.createdBy,
          activityType: 'probation_schedule_status_updated',
          entityType: 'probation_schedule',
          entityId: id,
          description: `Probation schedule status changed from ${currentSchedule.status} to ${updates.status} for user ID: ${currentSchedule.userId}`,
          orgId: currentSchedule.orgId,
          timestamp: now
        });
      }
      
      return updatedSchedule;
    } catch (error) {
      console.error('Error updating probation schedule:', error);
      throw error;
    }
  }
  
  // Probation Evaluation operations
  async getProbationEvaluation(id: number): Promise<ProbationEvaluation | undefined> {
    try {
      const [evaluation] = await db.select().from(probationEvaluations).where(eq(probationEvaluations.id, id));
      return evaluation;
    } catch (error) {
      console.error('Error fetching probation evaluation:', error);
      return undefined;
    }
  }
  
  async getProbationEvaluationsByProbationId(probationId: number): Promise<ProbationEvaluation[]> {
    try {
      return await db.select().from(probationEvaluations).where(eq(probationEvaluations.probationId, probationId));
    } catch (error) {
      console.error('Error fetching probation evaluations by probationId:', error);
      return [];
    }
  }
  
  async createProbationEvaluation(evaluation: InsertProbationEvaluation): Promise<ProbationEvaluation> {
    try {
      const now = new Date();
      const [newEvaluation] = await db.insert(probationEvaluations)
        .values({
          ...evaluation,
          evaluatedAt: now,
          acknowledgedAt: null
        })
        .returning();
      
      // Update the probation schedule with latest evaluation
      const [probation] = await db.select().from(probationSchedules).where(eq(probationSchedules.id, evaluation.probationId));
      if (probation) {
        await db.update(probationSchedules)
          .set({ 
            lastEvaluationId: newEvaluation.id,
            lastEvaluationDate: now,
            updatedBy: evaluation.evaluatedBy,
            updatedAt: now
          })
          .where(eq(probationSchedules.id, evaluation.probationId));
        
        // Log the activity
        await this.createActivity({
          userId: evaluation.evaluatedBy,
          activityType: 'probation_evaluation_created',
          entityType: 'probation_evaluation',
          entityId: newEvaluation.id,
          description: `Probation evaluation submitted with recommendation: ${evaluation.recommendation}`,
          orgId: probation.orgId,
          timestamp: now
        });
      }
      
      return newEvaluation;
    } catch (error) {
      console.error('Error creating probation evaluation:', error);
      throw error;
    }
  }
  
  async updateProbationEvaluation(id: number, updates: Partial<ProbationEvaluation>): Promise<ProbationEvaluation | undefined> {
    try {
      // Get the current evaluation data before update
      const [currentEvaluation] = await db.select().from(probationEvaluations).where(eq(probationEvaluations.id, id));
      if (!currentEvaluation) return undefined;
      
      const now = new Date();
      const evaluationUpdates = { ...updates };
      
      // If the employee is acknowledging the evaluation, set the acknowledgment time
      if (updates.acknowledged && !currentEvaluation.acknowledged) {
        evaluationUpdates.acknowledgedAt = now;
      }
      
      const [updatedEvaluation] = await db.update(probationEvaluations)
        .set(evaluationUpdates)
        .where(eq(probationEvaluations.id, id))
        .returning();
      
      // If the employee is acknowledging the evaluation, log the activity
      if (updates.acknowledged && !currentEvaluation.acknowledged) {
        const [probation] = await db.select().from(probationSchedules).where(eq(probationSchedules.id, currentEvaluation.probationId));
        if (probation) {
          await this.createActivity({
            userId: updates.acknowledgedBy || currentEvaluation.evaluatedBy,
            activityType: 'probation_evaluation_acknowledged',
            entityType: 'probation_evaluation',
            entityId: id,
            description: `Probation evaluation acknowledged by employee`,
            orgId: probation.orgId,
            timestamp: now
          });
        }
      }
      
      return updatedEvaluation;
    } catch (error) {
      console.error('Error updating probation evaluation:', error);
      throw error;
    }
  }
  
  // Exit Request operations
  async getExitRequest(id: number): Promise<ExitRequest | undefined> {
    try {
      const [request] = await db.select().from(exitRequests).where(eq(exitRequests.id, id));
      return request;
    } catch (error) {
      console.error('Error fetching exit request:', error);
      return undefined;
    }
  }
  
  async getExitRequestsByStatus(status: string, orgId: number): Promise<ExitRequest[]> {
    try {
      return await db.select().from(exitRequests)
        .where(and(
          eq(exitRequests.status, status),
          eq(exitRequests.orgId, orgId)
        ));
    } catch (error) {
      console.error('Error fetching exit requests by status:', error);
      return [];
    }
  }
  
  async getExitRequestsByUserId(userId: number): Promise<ExitRequest[]> {
    try {
      return await db.select().from(exitRequests).where(eq(exitRequests.userId, userId));
    } catch (error) {
      console.error('Error fetching exit requests by userId:', error);
      return [];
    }
  }
  
  async createExitRequest(request: InsertExitRequest): Promise<ExitRequest> {
    try {
      const now = new Date();
      const [newRequest] = await db.insert(exitRequests)
        .values({
          ...request,
          requestDate: now,
          completedAt: null,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      // Log the activity
      await this.createActivity({
        userId: request.requestedBy,
        activityType: 'exit_request_created',
        entityType: 'exit_request',
        entityId: newRequest.id,
        description: `Exit request created for user ID: ${request.userId} with exit date: ${request.exitDate}`,
        orgId: request.orgId,
        timestamp: now
      });
      
      return newRequest;
    } catch (error) {
      console.error('Error creating exit request:', error);
      throw error;
    }
  }
  
  async updateExitRequest(id: number, updates: Partial<ExitRequest>): Promise<ExitRequest | undefined> {
    try {
      // Get the current request data before update
      const [currentRequest] = await db.select().from(exitRequests).where(eq(exitRequests.id, id));
      if (!currentRequest) return undefined;
      
      const now = new Date();
      const requestUpdates = { ...updates, updatedAt: now };
      
      // If the status is changed to completed, set the completion time
      if (updates.status === 'completed' && currentRequest.status !== 'completed') {
        requestUpdates.completedAt = now;
      }
      
      const [updatedRequest] = await db.update(exitRequests)
        .set(requestUpdates)
        .where(eq(exitRequests.id, id))
        .returning();
      
      // Log appropriate activity based on status change
      if (updates.status) {
        if (updates.status === 'completed' && currentRequest.status !== 'completed') {
          await this.createActivity({
            userId: updates.updatedBy || currentRequest.requestedBy,
            activityType: 'exit_request_completed',
            entityType: 'exit_request',
            entityId: id,
            description: `Exit process completed for user ID: ${currentRequest.userId}`,
            orgId: currentRequest.orgId,
            timestamp: now
          });
        } else if (updates.status !== currentRequest.status) {
          await this.createActivity({
            userId: updates.updatedBy || currentRequest.requestedBy,
            activityType: 'exit_request_status_updated',
            entityType: 'exit_request',
            entityId: id,
            description: `Exit request status changed from ${currentRequest.status} to ${updates.status} for user ID: ${currentRequest.userId}`,
            orgId: currentRequest.orgId,
            timestamp: now
          });
        }
      }
      
      return updatedRequest;
    } catch (error) {
      console.error('Error updating exit request:', error);
      throw error;
    }
  }
  
  // Company Document operations
  async getCompanyDocument(id: number): Promise<CompanyDocument | undefined> {
    try {
      const [document] = await db.select().from(companyDocuments).where(eq(companyDocuments.id, id));
      return document;
    } catch (error) {
      console.error('Error fetching company document:', error);
      return undefined;
    }
  }
  
  async getCompanyDocumentsByCategory(category: string, orgId: number): Promise<CompanyDocument[]> {
    try {
      return await db.select().from(companyDocuments)
        .where(and(
          eq(companyDocuments.category, category),
          eq(companyDocuments.orgId, orgId)
        ));
    } catch (error) {
      console.error('Error fetching company documents by category:', error);
      return [];
    }
  }
  
  async getPublicCompanyDocuments(orgId: number): Promise<CompanyDocument[]> {
    try {
      return await db.select().from(companyDocuments)
        .where(and(
          eq(companyDocuments.isPublic, true),
          eq(companyDocuments.orgId, orgId)
        ));
    } catch (error) {
      console.error('Error fetching public company documents:', error);
      return [];
    }
  }
  
  async createCompanyDocument(document: InsertCompanyDocument): Promise<CompanyDocument> {
    try {
      const now = new Date();
      const [newDocument] = await db.insert(companyDocuments)
        .values({
          ...document,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      // Log the activity
      await this.createActivity({
        userId: document.uploadedBy,
        activityType: 'company_document_created',
        entityType: 'company_document',
        entityId: newDocument.id,
        description: `Company document '${document.name}' created in category: ${document.category}`,
        orgId: document.orgId,
        timestamp: now
      });
      
      return newDocument;
    } catch (error) {
      console.error('Error creating company document:', error);
      throw error;
    }
  }
  
  async updateCompanyDocument(id: number, updates: Partial<CompanyDocument>): Promise<CompanyDocument | undefined> {
    try {
      // Get the current document data before update
      const [currentDocument] = await db.select().from(companyDocuments).where(eq(companyDocuments.id, id));
      if (!currentDocument) return undefined;
      
      const now = new Date();
      const [updatedDocument] = await db.update(companyDocuments)
        .set({
          ...updates,
          updatedAt: now
        })
        .where(eq(companyDocuments.id, id))
        .returning();
      
      // Log the activity
      if (updates.uploadedBy) {
        await this.createActivity({
          userId: updates.uploadedBy,
          activityType: 'company_document_updated',
          entityType: 'company_document',
          entityId: id,
          description: `Company document '${currentDocument.name}' updated`,
          orgId: currentDocument.orgId,
          timestamp: now
        });
      }
      
      return updatedDocument;
    } catch (error) {
      console.error('Error updating company document:', error);
      throw error;
    }
  }
  
  // HR Analytics
  async getHrMetrics(orgId: number, period?: { startDate: Date; endDate: Date }): Promise<{
    newHiresCount: number;
    pendingProbationCount: number;
    exitRate: number;
    avgOnboardingTime: number;
    documentCompletionRate: number;
  }> {
    try {
      const now = new Date();
      const startDate = period?.startDate || new Date(now.getFullYear(), now.getMonth(), 1); // Default to start of current month
      const endDate = period?.endDate || now;
      
      // Get all hiring candidates that were converted to employees during the period
      const newHires = await db.select().from(hiringCandidates)
        .where(and(
          eq(hiringCandidates.orgId, orgId),
          eq(hiringCandidates.status, 'onboarded'),
          sql`${hiringCandidates.hireDate} IS NOT NULL`,
          sql`${hiringCandidates.hireDate} >= ${startDate.toISOString()}`,
          sql`${hiringCandidates.hireDate} <= ${endDate.toISOString()}`
        ));
      
      // Get pending probation schedules
      const pendingProbations = await db.select().from(probationSchedules)
        .where(and(
          eq(probationSchedules.orgId, orgId),
          sql`${probationSchedules.status} IN ('pending', 'in_progress')`
        ));
      
      // Get all exit requests during the period
      const exitRequests = await db.select().from(exitRequests)
        .where(and(
          eq(exitRequests.orgId, orgId),
          sql`${exitRequests.requestDate} >= ${startDate.toISOString()}`,
          sql`${exitRequests.requestDate} <= ${endDate.toISOString()}`
        ));
      
      // Get total active employees
      const activeEmployees = await db.select().from(users)
        .where(and(
          eq(users.orgId, orgId),
          eq(users.active, true)
        ));
      
      // Calculate average onboarding time (days from application to hire)
      let totalOnboardingDays = 0;
      let onboardedCandidatesCount = 0;
      
      for (const candidate of newHires) {
        if (candidate.applicationDate && candidate.hireDate) {
          const applicationDate = new Date(candidate.applicationDate);
          const hireDate = new Date(candidate.hireDate);
          const daysToOnboard = Math.ceil((hireDate.getTime() - applicationDate.getTime()) / (1000 * 60 * 60 * 24));
          totalOnboardingDays += daysToOnboard;
          onboardedCandidatesCount++;
        }
      }
      
      // Calculate document completion rate
      const allRequiredDocuments = await db.select().from(candidateDocuments)
        .innerJoin(hiringCandidates, eq(candidateDocuments.candidateId, hiringCandidates.id))
        .where(eq(hiringCandidates.orgId, orgId));
      
      const verifiedDocuments = allRequiredDocuments.filter(doc => doc.candidateDocuments.status === 'verified');
      
      return {
        newHiresCount: newHires.length,
        pendingProbationCount: pendingProbations.length,
        exitRate: activeEmployees.length > 0 ? (exitRequests.length / activeEmployees.length) : 0,
        avgOnboardingTime: onboardedCandidatesCount > 0 ? (totalOnboardingDays / onboardedCandidatesCount) : 0,
        documentCompletionRate: allRequiredDocuments.length > 0 ? (verifiedDocuments.length / allRequiredDocuments.length) : 0
      };
    } catch (error) {
      console.error('Error getting HR metrics:', error);
      return {
        newHiresCount: 0,
        pendingProbationCount: 0,
        exitRate: 0,
        avgOnboardingTime: 0,
        documentCompletionRate: 0
      };
    }
  }

  // Dashboard Widget operations
  async getDashboardWidgets(userId: number): Promise<DashboardWidget[]> {
    try {
      const widgets = await db.select().from(dashboardWidgets)
        .where(eq(dashboardWidgets.userId, userId))
        .orderBy(dashboardWidgets.position);
      
      return widgets;
    } catch (error) {
      console.error('Error getting dashboard widgets:', error);
      return [];
    }
  }
  
  async getDashboardWidget(id: number): Promise<DashboardWidget | undefined> {
    try {
      const [widget] = await db.select().from(dashboardWidgets).where(eq(dashboardWidgets.id, id));
      return widget;
    } catch (error) {
      console.error('Error getting dashboard widget:', error);
      return undefined;
    }
  }
  
  async createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget> {
    try {
      const [newWidget] = await db.insert(dashboardWidgets).values(widget).returning();
      return newWidget;
    } catch (error) {
      console.error('Error creating dashboard widget:', error);
      throw error;
    }
  }
  
  async updateDashboardWidget(id: number, updates: Partial<DashboardWidget>): Promise<DashboardWidget | undefined> {
    try {
      const [updatedWidget] = await db.update(dashboardWidgets)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(dashboardWidgets.id, id))
        .returning();
      
      return updatedWidget;
    } catch (error) {
      console.error('Error updating dashboard widget:', error);
      return undefined;
    }
  }
  
  async deleteDashboardWidget(id: number): Promise<boolean> {
    try {
      await db.delete(dashboardWidgets).where(eq(dashboardWidgets.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting dashboard widget:', error);
      return false;
    }
  }
  
  async reorderDashboardWidgets(widgets: DashboardWidget[]): Promise<DashboardWidget[]> {
    try {
      // Use a transaction to update all widgets atomically
      await db.transaction(async (tx) => {
        for (const widget of widgets) {
          await tx.update(dashboardWidgets)
            .set({ position: widget.position, updatedAt: new Date() })
            .where(eq(dashboardWidgets.id, widget.id));
        }
      });
      
      // Return the updated widgets
      return this.getDashboardWidgets(widgets[0].userId);
    } catch (error) {
      console.error('Error reordering dashboard widgets:', error);
      throw error;
    }
  }
  
  // Bug Reporting operations
  async getBugs(orgId: number): Promise<Bug[]> {
    try {
      return await db.select().from(bugs)
        .where(eq(bugs.orgId, orgId))
        .orderBy(desc(bugs.createdAt));
    } catch (error) {
      console.error('Error getting bugs:', error);
      return [];
    }
  }
  
  async getBugsByStatus(status: string, orgId: number): Promise<Bug[]> {
    try {
      return await db.select().from(bugs)
        .where(and(
          eq(bugs.orgId, orgId),
          eq(bugs.status, status)
        ))
        .orderBy(desc(bugs.createdAt));
    } catch (error) {
      console.error('Error getting bugs by status:', error);
      return [];
    }
  }
  
  async getBugsByUrgency(urgency: string, orgId: number): Promise<Bug[]> {
    try {
      return await db.select().from(bugs)
        .where(and(
          eq(bugs.orgId, orgId),
          eq(bugs.urgency, urgency)
        ))
        .orderBy(desc(bugs.createdAt));
    } catch (error) {
      console.error('Error getting bugs by urgency:', error);
      return [];
    }
  }
  
  async getBugsByModule(module: string, orgId: number): Promise<Bug[]> {
    try {
      return await db.select().from(bugs)
        .where(and(
          eq(bugs.orgId, orgId),
          eq(bugs.module, module)
        ))
        .orderBy(desc(bugs.createdAt));
    } catch (error) {
      console.error('Error getting bugs by module:', error);
      return [];
    }
  }
  
  async getBugsByReporter(reporterId: number): Promise<Bug[]> {
    try {
      return await db.select().from(bugs)
        .where(eq(bugs.reportedBy, reporterId))
        .orderBy(desc(bugs.createdAt));
    } catch (error) {
      console.error('Error getting bugs by reporter:', error);
      return [];
    }
  }
  
  async getBugsByAssignee(assigneeId: number): Promise<Bug[]> {
    try {
      return await db.select().from(bugs)
        .where(eq(bugs.assignedTo, assigneeId))
        .orderBy(desc(bugs.createdAt));
    } catch (error) {
      console.error('Error getting bugs by assignee:', error);
      return [];
    }
  }
  
  async getBug(id: number): Promise<Bug | undefined> {
    try {
      const [bug] = await db.select().from(bugs).where(eq(bugs.id, id));
      return bug;
    } catch (error) {
      console.error('Error getting bug:', error);
      return undefined;
    }
  }
  
  async createBug(bug: InsertBug): Promise<Bug> {
    try {
      const [newBug] = await db.insert(bugs)
        .values({
          ...bug,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return newBug;
    } catch (error) {
      console.error('Error creating bug:', error);
      throw error;
    }
  }
  
  async updateBug(id: number, updates: Partial<Bug>): Promise<Bug | undefined> {
    try {
      const [updatedBug] = await db.update(bugs)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(bugs.id, id))
        .returning();
      
      return updatedBug;
    } catch (error) {
      console.error('Error updating bug:', error);
      return undefined;
    }
  }
  
  async assignBug(id: number, assigneeId: number): Promise<Bug | undefined> {
    try {
      const [updatedBug] = await db.update(bugs)
        .set({
          assignedTo: assigneeId,
          updatedAt: new Date()
        })
        .where(eq(bugs.id, id))
        .returning();
      
      return updatedBug;
    } catch (error) {
      console.error('Error assigning bug:', error);
      return undefined;
    }
  }
  
  async changeBugStatus(id: number, status: string): Promise<Bug | undefined> {
    try {
      const [updatedBug] = await db.update(bugs)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(bugs.id, id))
        .returning();
      
      return updatedBug;
    } catch (error) {
      console.error('Error changing bug status:', error);
      return undefined;
    }
  }
  
  async fixBug(id: number, fixVersion: string): Promise<Bug | undefined> {
    try {
      const now = new Date();
      const [updatedBug] = await db.update(bugs)
        .set({
          status: "Fixed",
          fixVersion,
          fixedAt: now,
          updatedAt: now
        })
        .where(eq(bugs.id, id))
        .returning();
      
      return updatedBug;
    } catch (error) {
      console.error('Error fixing bug:', error);
      return undefined;
    }
  }
  
  async closeBug(id: number): Promise<Bug | undefined> {
    try {
      const now = new Date();
      const [updatedBug] = await db.update(bugs)
        .set({
          status: "Closed",
          closedAt: now,
          updatedAt: now
        })
        .where(eq(bugs.id, id))
        .returning();
      
      return updatedBug;
    } catch (error) {
      console.error('Error closing bug:', error);
      return undefined;
    }
  }
  
  async reopenBug(id: number): Promise<Bug | undefined> {
    try {
      const [updatedBug] = await db.update(bugs)
        .set({
          status: "Reopened",
          fixedAt: null,
          closedAt: null,
          updatedAt: new Date()
        })
        .where(eq(bugs.id, id))
        .returning();
      
      return updatedBug;
    } catch (error) {
      console.error('Error reopening bug:', error);
      return undefined;
    }
  }
  
  // Organization Settings implementation
  async getOrganizationSettings(orgId: number): Promise<OrganizationSettings | undefined> {
    try {
      const [settings] = await db.select().from(organizationSettings).where(eq(organizationSettings.orgId, orgId));
      return settings;
    } catch (error) {
      console.error('Error getting organization settings:', error);
      return undefined;
    }
  }
  
  async createOrganizationSettings(settings: InsertOrganizationSettings): Promise<OrganizationSettings> {
    try {
      const now = new Date();
      const [newSettings] = await db.insert(organizationSettings).values({
        ...settings,
        createdAt: now,
        updatedAt: now
      }).returning();
      return newSettings;
    } catch (error) {
      console.error('Error creating organization settings:', error);
      throw error;
    }
  }
  
  async updateOrganizationSettings(orgId: number, updates: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
    try {
      // First check if settings exist
      const settings = await this.getOrganizationSettings(orgId);
      
      if (settings) {
        // Update existing settings
        const [updatedSettings] = await db.update(organizationSettings)
          .set({
            ...updates,
            updatedAt: new Date()
          })
          .where(eq(organizationSettings.orgId, orgId))
          .returning();
        return updatedSettings;
      } else {
        // Create new settings
        return this.createOrganizationSettings({
          orgId,
          ...updates
        } as InsertOrganizationSettings);
      }
    } catch (error) {
      console.error('Error updating organization settings:', error);
      throw error;
    }
  }
  
  // User Settings implementation
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    try {
      const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
      return settings;
    } catch (error) {
      console.error('Error getting user settings:', error);
      // If the table doesn't exist yet, return undefined
      return undefined;
    }
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    try {
      const now = new Date();
      const [newSettings] = await db.insert(userSettings).values({
        ...settings,
        createdAt: now,
        updatedAt: now
      }).returning();
      return newSettings;
    } catch (error) {
      console.error('Error creating user settings:', error);
      throw error;
    }
  }

  async updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings> {
    try {
      // First check if settings exist
      const settings = await this.getUserSettings(userId);
      
      if (settings) {
        // Update existing settings
        const [updatedSettings] = await db.update(userSettings)
          .set({
            ...updates,
            updatedAt: new Date()
          })
          .where(eq(userSettings.userId, userId))
          .returning();
        return updatedSettings;
      } else {
        // Create new settings
        return this.createUserSettings({
          userId,
          ...updates
        } as InsertUserSettings);
      }
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }
  
  // Permission Template implementation
  async getPermissionTemplate(id: number): Promise<PermissionTemplate | undefined> {
    try {
      const [template] = await db.select().from(permissionTemplates).where(eq(permissionTemplates.id, id));
      return template;
    } catch (error) {
      console.error('Error getting permission template:', error);
      return undefined;
    }
  }
  
  async getPermissionTemplateByName(name: string): Promise<PermissionTemplate | undefined> {
    try {
      const [template] = await db.select().from(permissionTemplates).where(eq(permissionTemplates.name, name));
      return template;
    } catch (error) {
      console.error('Error getting permission template by name:', error);
      return undefined;
    }
  }
  
  async getPermissionTemplates(): Promise<PermissionTemplate[]> {
    try {
      return await db.select().from(permissionTemplates);
    } catch (error) {
      console.error('Error getting permission templates:', error);
      return [];
    }
  }
  
  async getPermissionTemplatesByDepartment(department: string): Promise<PermissionTemplate[]> {
    try {
      return await db.select().from(permissionTemplates).where(eq(permissionTemplates.department, department));
    } catch (error) {
      console.error('Error getting permission templates by department:', error);
      return [];
    }
  }
  
  async createPermissionTemplate(template: InsertPermissionTemplate): Promise<PermissionTemplate> {
    try {
      const now = new Date();
      const [newTemplate] = await db.insert(permissionTemplates).values({
        ...template,
        createdAt: now,
        updatedAt: now
      }).returning();
      return newTemplate;
    } catch (error) {
      console.error('Error creating permission template:', error);
      throw error;
    }
  }
  
  async updatePermissionTemplate(id: number, updates: Partial<PermissionTemplate>): Promise<PermissionTemplate | undefined> {
    try {
      const [updatedTemplate] = await db.update(permissionTemplates)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(permissionTemplates.id, id))
        .returning();
      return updatedTemplate;
    } catch (error) {
      console.error('Error updating permission template:', error);
      return undefined;
    }
  }
  
  async deletePermissionTemplate(id: number): Promise<boolean> {
    try {
      await db.delete(permissionTemplates).where(eq(permissionTemplates.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting permission template:', error);
      return false;
    }
  }
  
  // Feature Flag implementation
  async getFeatureFlag(id: number): Promise<FeatureFlag | undefined> {
    try {
      const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.id, id));
      return flag;
    } catch (error) {
      console.error('Error getting feature flag:', error);
      return undefined;
    }
  }
  
  async getFeatureFlagByKey(key: string): Promise<FeatureFlag | undefined> {
    try {
      const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.key, key));
      return flag;
    } catch (error) {
      console.error('Error getting feature flag by key:', error);
      return undefined;
    }
  }
  
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      return await db.select().from(featureFlags);
    } catch (error) {
      console.error('Error getting feature flags:', error);
      return [];
    }
  }
  
  async getFeatureFlagsByOrg(orgId: number): Promise<FeatureFlag[]> {
    try {
      return await db.select().from(featureFlags).where(eq(featureFlags.orgId, orgId));
    } catch (error) {
      console.error('Error getting feature flags by org:', error);
      return [];
    }
  }
  
  async createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag> {
    try {
      const now = new Date();
      const [newFlag] = await db.insert(featureFlags).values({
        ...flag,
        createdAt: now,
        updatedAt: now
      }).returning();
      return newFlag;
    } catch (error) {
      console.error('Error creating feature flag:', error);
      throw error;
    }
  }
  
  async updateFeatureFlag(id: number, updates: Partial<FeatureFlag>): Promise<FeatureFlag | undefined> {
    try {
      const [updatedFlag] = await db.update(featureFlags)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(featureFlags.id, id))
        .returning();
      return updatedFlag;
    } catch (error) {
      console.error('Error updating feature flag:', error);
      return undefined;
    }
  }
  
  // User Location implementation
  async getUserLocation(id: number): Promise<UserLocation | undefined> {
    try {
      const [location] = await db.select().from(userLocations).where(eq(userLocations.id, id));
      return location;
    } catch (error) {
      console.error('Error getting user location:', error);
      return undefined;
    }
  }
  
  async getUserLocations(userId: number): Promise<UserLocation[]> {
    try {
      return await db.select().from(userLocations)
        .where(eq(userLocations.userId, userId))
        .orderBy(desc(userLocations.createdAt));
    } catch (error) {
      console.error('Error getting user locations:', error);
      return [];
    }
  }
  
  async getUserLocationsByTimeRange(userId: number, startTime: Date, endTime: Date): Promise<UserLocation[]> {
    try {
      return await db.select().from(userLocations)
        .where(and(
          eq(userLocations.userId, userId),
          gte(userLocations.createdAt, startTime),
          lte(userLocations.createdAt, endTime)
        ))
        .orderBy(desc(userLocations.createdAt));
    } catch (error) {
      console.error('Error getting user locations by time range:', error);
      return [];
    }
  }
  
  async createUserLocation(location: InsertUserLocation): Promise<UserLocation> {
    try {
      const now = new Date();
      const [newLocation] = await db.insert(userLocations).values({
        ...location,
        createdAt: now
      }).returning();
      return newLocation;
    } catch (error) {
      console.error('Error creating user location:', error);
      throw error;
    }
  }
  
  // CRM Form Template operations implementation
  async getFormTemplates(): Promise<FormTemplate[]> {
    try {
      // Use robust API implementation
      const templates = await getAllFormTemplates();
      return templates;
    } catch (error) {
      console.error("Error in getFormTemplates:", error);
      // Fallback to basic query
      try {
        return await db.select().from(formTemplates);
      } catch (innerError) {
        console.error("Fallback query failed:", innerError);
        return []; // Return empty array rather than throwing
      }
    }
  }

  async getFormTemplate(id: number): Promise<FormTemplate | undefined> {
    try {
      // Use robust API implementation
      const template = await getFormTemplateById(id);
      return template;
    } catch (error) {
      console.error(`Error in getFormTemplate ID ${id}:`, error);
      // Fallback to basic query
      try {
        const [template] = await db.select().from(formTemplates).where(eq(formTemplates.id, id));
        return template;
      } catch (innerError) {
        console.error("Fallback query failed:", innerError);
        return undefined; // Return undefined rather than throwing
      }
    }
  }

  async getFormTemplatesByLeadType(leadType: string): Promise<FormTemplate[]> {
    try {
      // Use robust API implementation
      const templates = await getFormTemplatesByLeadType(leadType);
      return templates;
    } catch (error) {
      console.error(`Error in getFormTemplatesByLeadType ${leadType}:`, error);
      // Fallback to basic query
      try {
        return await db.select().from(formTemplates).where(eq(formTemplates.leadType, leadType));
      } catch (innerError) {
        console.error("Fallback query failed:", innerError);
        return []; // Return empty array rather than throwing
      }
    }
  }

  async createFormTemplate(template: InsertFormTemplate): Promise<FormTemplate> {
    try {
      const now = new Date();
      const [newTemplate] = await db.insert(formTemplates).values({
        ...template,
        createdAt: now,
        updatedAt: now
      }).returning();
      
      // Log activity
      await this.createActivity({
        userId: template.createdBy,
        entityType: "form_template",
        entityId: newTemplate.id,
        action: "create",
        details: `Form template created: ${template.name}`,
        timestamp: now
      });
      
      return newTemplate;
    } catch (error) {
      console.error('Error creating form template:', error);
      throw error;
    }
  }

  async updateFormTemplate(id: number, updates: Partial<FormTemplate>): Promise<FormTemplate | undefined> {
    try {
      const now = new Date();
      const [updatedTemplate] = await db.update(formTemplates)
        .set({
          ...updates,
          updatedAt: now
        })
        .where(eq(formTemplates.id, id))
        .returning();
      
      if (!updatedTemplate) return undefined;
      
      // Log activity
      if (updates.updatedBy) {
        await this.createActivity({
          userId: updates.updatedBy,
          entityType: "form_template",
          entityId: id,
          action: "update",
          details: `Form template updated: ${updatedTemplate.name}`,
          timestamp: now
        });
      }
      
      return updatedTemplate;
    } catch (error) {
      console.error(`Error updating form template with id ${id}:`, error);
      throw error;
    }
  }

  async deleteFormTemplate(id: number): Promise<boolean> {
    try {
      await db.delete(formTemplates).where(eq(formTemplates.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting form template with id ${id}:`, error);
      throw error;
    }
  }

  // CRM Form Submission operations implementation
  async getFormSubmissions(leadId: number): Promise<FormSubmission[]> {
    try {
      // Use robust API implementation
      const submissions = await getFormSubmissionsByLeadId(leadId);
      return submissions;
    } catch (error) {
      console.error(`Error in getFormSubmissions for lead ${leadId}:`, error);
      // Fallback to basic query
      try {
        return await db.select().from(formSubmissions).where(eq(formSubmissions.leadId, leadId));
      } catch (innerError) {
        console.error("Fallback query failed:", innerError);
        return []; // Return empty array rather than throwing
      }
    }
  }

  async getFormSubmission(id: number): Promise<FormSubmission | undefined> {
    try {
      // Use robust API implementation
      const submission = await getFormSubmissionById(id);
      return submission;
    } catch (error) {
      console.error(`Error in getFormSubmission ID ${id}:`, error);
      // Fallback to basic query
      try {
        const [submission] = await db.select().from(formSubmissions).where(eq(formSubmissions.id, id));
        return submission;
      } catch (innerError) {
        console.error("Fallback query failed:", innerError);
        return undefined; // Return undefined rather than throwing
      }
    }
  }

  async createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> {
    try {
      const now = new Date();
      const [newSubmission] = await db.insert(formSubmissions).values({
        ...submission,
        createdAt: now,
        updatedAt: now,
        status: submission.status || 'pending',
        completedAt: null
      }).returning();
      
      // Log activity
      await this.createActivity({
        userId: submission.createdBy,
        entityType: "form_submission",
        entityId: newSubmission.id,
        action: "create",
        details: `Form submitted for lead #${submission.leadId}`,
        timestamp: now,
        metadata: {
          leadId: submission.leadId,
          templateId: submission.templateId
        }
      });
      
      return newSubmission;
    } catch (error) {
      console.error('Error creating form submission:', error);
      throw error;
    }
  }

  async updateFormSubmission(id: number, updates: Partial<FormSubmission>): Promise<FormSubmission | undefined> {
    try {
      const now = new Date();
      const updateData = { ...updates, updatedAt: now };
      
      // Check if status is changing to 'completed'
      const [currentSubmission] = await db.select().from(formSubmissions).where(eq(formSubmissions.id, id));
      if (!currentSubmission) return undefined;
      
      if (updates.status === 'completed' && currentSubmission.status !== 'completed') {
        updateData.completedAt = now;
      }
      
      const [updatedSubmission] = await db.update(formSubmissions)
        .set(updateData)
        .where(eq(formSubmissions.id, id))
        .returning();
      
      if (!updatedSubmission) return undefined;
      
      // If status is changing to 'completed', process additional updates
      if (updates.status === 'completed' && currentSubmission.status !== 'completed') {
        // Log completion activity
        await this.createActivity({
          userId: updates.updatedBy || currentSubmission.createdBy,
          entityType: "form_submission",
          entityId: id,
          action: "complete",
          details: `Form completed for lead #${currentSubmission.leadId}`,
          timestamp: now,
          metadata: {
            leadId: currentSubmission.leadId,
            templateId: currentSubmission.templateId
          }
        });
        
        // Update lead qualification progress if applicable
        if (currentSubmission.leadId) {
          // Count how many forms are completed for this lead
          const { count } = await db.select({ count: count() }).from(formSubmissions)
            .where(and(
              eq(formSubmissions.leadId, currentSubmission.leadId),
              eq(formSubmissions.status, 'completed')
            ));
          
          // Update lead with form completion count
          await db.update(leads)
            .set({
              formsCompleted: Number(count),
              updatedAt: now
            })
            .where(eq(leads.id, currentSubmission.leadId));
          
          // If all required forms are completed, update qualification status
          if (Number(count) >= 2) { // Assuming 2 or more forms indicate qualification
            await db.update(leads)
              .set({
                qualificationStatus: 'qualified',
                updatedAt: now
              })
              .where(eq(leads.id, currentSubmission.leadId));
            
            // Log qualification activity
            await this.createActivity({
              userId: updates.updatedBy || currentSubmission.createdBy,
              entityType: "lead",
              entityId: currentSubmission.leadId,
              action: "qualify",
              details: `Lead qualified via form completion`,
              timestamp: now
            });
          }
        }
      }
      
      return updatedSubmission;
    } catch (error) {
      console.error(`Error updating form submission with id ${id}:`, error);
      throw error;
    }
  }

  // CRM Lead Handoff operations implementation
  async getLeadHandoffs(leadId: number): Promise<LeadHandoff[]> {
    try {
      // Robust DB query with error handling 
      return await db.select().from(leadHandoffs).where(eq(leadHandoffs.leadId, leadId));
    } catch (error) {
      console.error(`Error in getLeadHandoffs for lead ${leadId}:`, error);
      // Fallback - return empty array instead of throwing
      return [];
    }
  }

  async getLeadHandoff(id: number): Promise<LeadHandoff | undefined> {
    try {
      // Robust DB query with error handling
      const [handoff] = await db.select().from(leadHandoffs).where(eq(leadHandoffs.id, id));
      return handoff;
    } catch (error) {
      console.error(`Error in getLeadHandoff ID ${id}:`, error);
      // Return undefined instead of throwing
      return undefined;
    }
  }

  async createLeadHandoff(handoff: InsertLeadHandoff): Promise<LeadHandoff> {
    try {
      const now = new Date();
      let newHandoff;
      
      try {
        [newHandoff] = await db.insert(leadHandoffs).values({
          ...handoff,
          createdAt: now,
          updatedAt: now,
          status: handoff.status || 'pending',
          handoffNotes: handoff.handoffNotes || null,
          validationChecklist: handoff.validationChecklist || null,
          acceptedAt: null,
          rejectedAt: null,
          rejectionReason: null
        }).returning();
      } catch (insertError) {
        console.error(`Failed to insert lead handoff:`, insertError);
        throw new Error(`Could not create lead handoff: ${insertError.message}`);
      }
      
      // Update the lead status
      if (handoff.leadId) {
        try {
          await db.update(leads)
            .set({
              status: "HandToDispatch",
              handoffAt: now,
              updatedAt: now
            })
            .where(eq(leads.id, handoff.leadId));
        } catch (updateError) {
          console.error(`Error updating lead status for handoff (continuing):`, updateError);
          // Continue even if this fails - we successfully created the handoff record
        }
        
        // Log activity
        try {
          await this.createActivity({
            userId: handoff.salesRepId,
            entityType: "lead",
            entityId: handoff.leadId,
            action: "handoff",
            details: `Lead handed off to dispatch by sales rep`,
            timestamp: now,
            metadata: { 
              handoffId: newHandoff.id, 
              dispatcherId: handoff.dispatcherId,
              salesRepId: handoff.salesRepId
            }
          });
        } catch (activityError) {
          console.error(`Error logging handoff activity (continuing):`, activityError);
          // Continue even if activity logging fails
        }
      }
      
      return newHandoff;
    } catch (error) {
      console.error('Error in createLeadHandoff:', error);
      throw error;
    }
  }

  async updateLeadHandoff(id: number, updates: Partial<LeadHandoff>): Promise<LeadHandoff | undefined> {
    try {
      const now = new Date();
      
      // Safely get current handoff
      let currentHandoff;
      try {
        [currentHandoff] = await db.select().from(leadHandoffs).where(eq(leadHandoffs.id, id));
        if (!currentHandoff) return undefined;
      } catch (fetchError) {
        console.error(`Error fetching lead handoff for update:`, fetchError);
        return undefined;
      }
      
      const updateData = { ...updates, updatedAt: now };
      
      // Process status changes
      if (updates.status === 'accepted' && currentHandoff.status !== 'accepted') {
        updateData.acceptedAt = now;
        
        // Update lead status
        if (currentHandoff.leadId) {
          try {
            await db.update(leads)
              .set({
                status: "Active",
                updatedAt: now
              })
              .where(eq(leads.id, currentHandoff.leadId));
          } catch (updateLeadError) {
            console.error(`Error updating lead status for handoff acceptance (continuing):`, updateLeadError);
            // Continue despite this error
          }
          
          // Log activity
          try {
            await this.createActivity({
              userId: currentHandoff.dispatcherId,
              entityType: "lead",
              entityId: currentHandoff.leadId,
              action: "handoff_accepted",
              details: `Handoff accepted by dispatcher`,
              timestamp: now,
              metadata: { handoffId: id }
            });
          } catch (activityError) {
            console.error(`Error logging handoff acceptance activity (continuing):`, activityError);
            // Continue despite this error
          }
        }
      } else if (updates.status === 'rejected' && currentHandoff.status !== 'rejected') {
        updateData.rejectedAt = now;
        
        // Update lead status
        if (currentHandoff.leadId) {
          try {
            await db.update(leads)
              .set({
                status: "InProgress",
                updatedAt: now
              })
              .where(eq(leads.id, currentHandoff.leadId));
          } catch (updateLeadError) {
            console.error(`Error updating lead status for handoff rejection (continuing):`, updateLeadError);
            // Continue despite this error
          }
          
          // Log activity
          try {
            await this.createActivity({
              userId: currentHandoff.dispatcherId,
              entityType: "lead",
              entityId: currentHandoff.leadId,
              action: "handoff_rejected",
              details: `Handoff rejected by dispatcher: ${updates.rejectionReason || 'No reason provided'}`,
              timestamp: now,
              metadata: { 
                handoffId: id,
                reason: updates.rejectionReason
              }
            });
          } catch (activityError) {
            console.error(`Error logging handoff rejection activity (continuing):`, activityError);
            // Continue despite this error
          }
        }
      }
      
      // Perform the actual update
      try {
        const [updatedHandoff] = await db.update(leadHandoffs)
          .set(updateData)
          .where(eq(leadHandoffs.id, id))
          .returning();
        
        return updatedHandoff;
      } catch (updateError) {
        console.error(`Error updating lead handoff record:`, updateError);
        return undefined;
      }
    } catch (error) {
      console.error(`Error in updateLeadHandoff for ID ${id}:`, error);
      return undefined; // Return undefined rather than throwing
    }
  }
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();
