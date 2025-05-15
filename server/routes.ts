import express, { type Request, Response, NextFunction, Router } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import adminRouter from './routes/admin';
import timeOffRouter from './routes/time-off';
import hrPoliciesRouter from './routes/hr-policies';
import crmDashboardRouter from './routes/crm-dashboard';
import { registerTeamRoutes } from './routes/team-routes';
import { 
  insertUserSchema, insertRoleSchema, insertLeadSchema, 
  insertLoadSchema, insertInvoiceSchema, insertInvoiceItemSchema,
  insertCommissionSchema, insertActivitySchema, insertDispatchClientSchema,
  insertOrganizationSchema, insertCommissionRuleSchema, insertCommissionMonthlySchema,
  insertTaskSchema, users, roles, dispatch_clients, organizations
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import path from "path";
import * as slackNotifications from "./slack";
import * as notificationService from "./notifications";
import { NotificationPreferences, defaultNotificationPreferences } from "./notifications";
import { WebSocket, WebSocketServer } from "ws";
import errorLoggingRoutes from "./routes/error-logging";
import statusRoutes from "./routes/status";

// Helper function to handle date objects correctly for database insertion
function createDateObject(dateString?: string | null) {
  return dateString ? new Date(dateString) : null;
}
import { organizationMiddleware } from "./middleware/organizationMiddleware";

// Auth middleware function with enhanced guard clauses
const createAuthMiddleware = (requiredRoleLevel: number = 1) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated via session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        error: "Unauthorized: Please log in to access this resource",
        missing: ["session"] 
      });
    }

    try {
      // Fetch the user from storage
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ 
          error: "Unauthorized: User not found", 
          missing: ["user"] 
        });
      }

      // Check if user has necessary properties
      if (!user.orgId) {
        // Attempt to assign to default organization
        try {
          const orgs = await storage.getOrganizations();
          if (orgs && orgs.length > 0) {
            await storage.updateUser(user.id, { orgId: orgs[0].id });
            user.orgId = orgs[0].id;
            console.log(`Assigned user ${user.id} to default organization ${orgs[0].id}`);
          } else {
            return res.status(400).json({ 
              error: "Invalid user structure. Missing orgId and no default organization available.", 
              missing: ["orgId"] 
            });
          }
        } catch (orgError) {
          console.error("Error assigning default organization:", orgError);
          return res.status(400).json({ 
            error: "Failed to assign default organization", 
            missing: ["orgId"] 
          });
        }
      }

      // Fetch the user's role
      const role = await storage.getRole(user.roleId);
      if (!role) {
        // Try to assign default role
        try {
          const defaultRole = await storage.getDefaultRole();
          if (defaultRole) {
            await storage.updateUser(user.id, { roleId: defaultRole.id });
            user.roleId = defaultRole.id;
            console.log(`Assigned user ${user.id} to default role ${defaultRole.id}`);
            
            // Now fetch the role again
            const updatedRole = await storage.getRole(defaultRole.id);
            if (updatedRole) {
              req.user = user;
              req.userRole = updatedRole;
              
              // Check if the role level is sufficient after fixing
              if (updatedRole.level < requiredRoleLevel) {
                return res.status(403).json({ 
                  error: "Forbidden: Insufficient permissions", 
                  missing: ["permissions"],
                  details: `Required level: ${requiredRoleLevel}, Current level: ${updatedRole.level}`
                });
              }
              
              next();
              return;
            }
          }
        } catch (roleError) {
          console.error("Error assigning default role:", roleError);
        }
        
        return res.status(403).json({ 
          error: "User is not assigned to any role. Contact Admin.", 
          missing: ["role", "permissions"] 
        });
      }

      // Check if the user's role level is sufficient
      if (role.level < requiredRoleLevel) {
        return res.status(403).json({ 
          error: "Forbidden: Insufficient permissions", 
          missing: ["permissions"],
          details: `Required level: ${requiredRoleLevel}, Current level: ${role.level}`
        });
      }

      // Add user and role to the request object for use in route handlers
      req.user = user;
      req.userRole = role;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      next(error);
    }
  };
};

// Function to register HR routes
function registerHrRoutes(router: Router) {
  // Hiring Candidates routes
  const hiringCandidateRouter = express.Router();
  router.use("/hr/candidates", hiringCandidateRouter);

  hiringCandidateRouter.get("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const orgId = req.query.orgId ? Number(req.query.orgId) : (req.user?.orgId || 1);
      let candidates: HiringCandidate[] = [];
      
      // Filter by status if provided
      if (req.query.status) {
        candidates = await storage.getHiringCandidatesByStatus(req.query.status as string, orgId);
      } else {
        candidates = await storage.getHiringCandidates(orgId);
      }
      
      res.json(candidates);
    } catch (error) {
      next(error);
    }
  });

  hiringCandidateRouter.get("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const candidate = await storage.getHiringCandidate(Number(req.params.id));
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      res.json(candidate);
    } catch (error) {
      next(error);
    }
  });

  hiringCandidateRouter.post("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const candidateData = insertHiringCandidateSchema.parse({
        ...req.body,
        createdBy: req.user?.id || 1,
        updatedBy: req.user?.id || 1,
        applicationDate: req.body.applicationDate ? new Date(req.body.applicationDate) : new Date(),
        hireDate: req.body.hireDate ? new Date(req.body.hireDate) : null
      });
      
      const candidate = await storage.createHiringCandidate(candidateData);
      
      // Send notification if needed
      await notificationService.sendNotification({
        title: "New Hiring Candidate",
        message: `A new candidate (${candidate.firstName} ${candidate.lastName}) has been added for ${candidate.appliedFor} position.`,
        type: "hr",
        entityId: candidate.id,
        entityType: "hiring_candidate",
        orgId: candidate.orgId
      });
      
      res.status(201).json(candidate);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  hiringCandidateRouter.patch("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const candidateId = Number(req.params.id);
      const currentCandidate = await storage.getHiringCandidate(candidateId);
      
      if (!currentCandidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      // Process date fields
      const updates: Partial<HiringCandidate> = {
        ...req.body,
        updatedBy: req.user?.id || 1
      };
      
      if (req.body.applicationDate) {
        updates.applicationDate = new Date(req.body.applicationDate);
      }
      
      if (req.body.hireDate) {
        updates.hireDate = new Date(req.body.hireDate);
      }
      
      const updatedCandidate = await storage.updateHiringCandidate(candidateId, updates);
      
      // Send notification if status changed
      if (req.body.status && req.body.status !== currentCandidate.status) {
        await notificationService.sendNotification({
          title: "Candidate Status Changed",
          message: `Candidate ${currentCandidate.firstName} ${currentCandidate.lastName} status changed from ${currentCandidate.status} to ${req.body.status}.`,
          type: "hr",
          entityId: currentCandidate.id,
          entityType: "hiring_candidate",
          orgId: currentCandidate.orgId
        });
      }
      
      res.json(updatedCandidate);
    } catch (error) {
      next(error);
    }
  });

  // Candidate Documents routes
  const candidateDocumentRouter = express.Router();
  app.use("/api/hr/documents", candidateDocumentRouter);

  candidateDocumentRouter.get("/candidate/:candidateId", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const candidateId = Number(req.params.candidateId);
      const documents = await storage.getCandidateDocumentsByCandidateId(candidateId);
      res.json(documents);
    } catch (error) {
      next(error);
    }
  });

  candidateDocumentRouter.get("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const document = await storage.getCandidateDocument(Number(req.params.id));
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      next(error);
    }
  });

  candidateDocumentRouter.post("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const documentData = insertCandidateDocumentSchema.parse({
        ...req.body,
        uploadedBy: req.user?.id || 1,
        verifiedBy: null,
        uploadedAt: new Date(),
        verifiedAt: null
      });
      
      const document = await storage.createCandidateDocument(documentData);
      
      // Update candidate document status
      const candidate = await storage.getHiringCandidate(document.candidateId);
      if (candidate) {
        await storage.updateHiringCandidate(candidate.id, {
          documentsReceived: true,
          updatedBy: req.user?.id || 1
        });
      }
      
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  candidateDocumentRouter.patch("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const documentId = Number(req.params.id);
      const document = await storage.getCandidateDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // If verifying document, add verifier info
      const updates: Partial<CandidateDocument> = {
        ...req.body
      };
      
      if (req.body.status === 'verified' && document.status !== 'verified') {
        updates.verifiedBy = req.user?.id || 1;
        updates.verifiedAt = new Date();
      }
      
      const updatedDocument = await storage.updateCandidateDocument(documentId, updates);
      
      res.json(updatedDocument);
    } catch (error) {
      next(error);
    }
  });

  // Hiring Templates routes
  const hiringTemplateRouter = express.Router();
  app.use("/api/hr/templates", hiringTemplateRouter);

  hiringTemplateRouter.get("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const orgId = req.query.orgId ? Number(req.query.orgId) : (req.user?.orgId || 1);
      const templateType = req.query.type as string;
      
      let templates: HiringTemplate[] = [];
      
      if (templateType) {
        templates = await storage.getHiringTemplatesByType(templateType, orgId);
      } else {
        // Get all templates by querying for each type
        const offerTemplates = await storage.getHiringTemplatesByType('offer_letter', orgId);
        const probationTemplates = await storage.getHiringTemplatesByType('probation', orgId);
        const exitTemplates = await storage.getHiringTemplatesByType('exit', orgId);
        
        templates = [...offerTemplates, ...probationTemplates, ...exitTemplates];
      }
      
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  hiringTemplateRouter.get("/default/:type", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const orgId = req.query.orgId ? Number(req.query.orgId) : (req.user?.orgId || 1);
      const templateType = req.params.type;
      
      const template = await storage.getDefaultTemplateByType(templateType, orgId);
      
      if (!template) {
        return res.status(404).json({ message: "Default template not found" });
      }
      
      res.json(template);
    } catch (error) {
      next(error);
    }
  });

  hiringTemplateRouter.get("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const template = await storage.getHiringTemplate(Number(req.params.id));
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      next(error);
    }
  });

  hiringTemplateRouter.post("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const templateData = insertHiringTemplateSchema.parse({
        ...req.body,
        createdBy: req.user?.id || 1,
        updatedBy: req.user?.id || 1
      });
      
      const template = await storage.createHiringTemplate(templateData);
      
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  hiringTemplateRouter.patch("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const templateId = Number(req.params.id);
      const template = await storage.getHiringTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const updatedTemplate = await storage.updateHiringTemplate(templateId, {
        ...req.body,
        updatedBy: req.user?.id || 1
      });
      
      res.json(updatedTemplate);
    } catch (error) {
      next(error);
    }
  });

  // Probation Schedule routes
  const probationRouter = express.Router();
  app.use("/api/hr/probation", probationRouter);

  probationRouter.get("/schedules", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const orgId = req.query.orgId ? Number(req.query.orgId) : (req.user?.orgId || 1);
      const status = req.query.status as string;
      
      let schedules: ProbationSchedule[] = [];
      
      if (status) {
        schedules = await storage.getProbationSchedulesByStatus(status, orgId);
      } else if (req.query.managerId) {
        const managerId = Number(req.query.managerId);
        schedules = await storage.getProbationSchedulesByManager(managerId);
      } else {
        // Get all probation schedules for this org
        const pendingSchedules = await storage.getProbationSchedulesByStatus('pending', orgId);
        const inProgressSchedules = await storage.getProbationSchedulesByStatus('in_progress', orgId);
        const completedSchedules = await storage.getProbationSchedulesByStatus('completed', orgId);
        const extendedSchedules = await storage.getProbationSchedulesByStatus('extended', orgId);
        const terminatedSchedules = await storage.getProbationSchedulesByStatus('terminated', orgId);
        
        schedules = [
          ...pendingSchedules, 
          ...inProgressSchedules, 
          ...completedSchedules, 
          ...extendedSchedules, 
          ...terminatedSchedules
        ];
      }
      
      res.json(schedules);
    } catch (error) {
      next(error);
    }
  });

  probationRouter.get("/schedules/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const schedule = await storage.getProbationSchedule(Number(req.params.id));
      
      if (!schedule) {
        return res.status(404).json({ message: "Probation schedule not found" });
      }
      
      res.json(schedule);
    } catch (error) {
      next(error);
    }
  });

  probationRouter.get("/user/:userId", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const schedule = await storage.getProbationScheduleByUserId(userId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Probation schedule not found for this user" });
      }
      
      res.json(schedule);
    } catch (error) {
      next(error);
    }
  });

  probationRouter.post("/schedules", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const scheduleData = insertProbationScheduleSchema.parse({
        ...req.body,
        createdBy: req.user?.id || 1,
        updatedBy: req.user?.id || 1,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        lastEvaluationDate: null
      });
      
      const schedule = await storage.createProbationSchedule(scheduleData);
      
      // Send notification to the assigned manager
      if (schedule.assignedManagerId) {
        await notificationService.sendNotification({
          title: "New Probation Assigned",
          message: `You have been assigned to manage a probation period starting on ${new Date(schedule.startDate).toLocaleDateString()}.`,
          type: "hr",
          entityId: schedule.id,
          entityType: "probation_schedule",
          userId: schedule.assignedManagerId,
          orgId: schedule.orgId
        });
      }
      
      // Send notification to the employee
      await notificationService.sendNotification({
        title: "Probation Period Started",
        message: `Your probation period has been scheduled from ${new Date(schedule.startDate).toLocaleDateString()} to ${new Date(schedule.endDate).toLocaleDateString()}.`,
        type: "hr",
        entityId: schedule.id,
        entityType: "probation_schedule",
        userId: schedule.userId,
        orgId: schedule.orgId
      });
      
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  probationRouter.patch("/schedules/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const scheduleId = Number(req.params.id);
      const currentSchedule = await storage.getProbationSchedule(scheduleId);
      
      if (!currentSchedule) {
        return res.status(404).json({ message: "Probation schedule not found" });
      }
      
      // Process date fields
      const updates: Partial<ProbationSchedule> = {
        ...req.body,
        updatedBy: req.user?.id || 1
      };
      
      if (req.body.startDate) {
        updates.startDate = new Date(req.body.startDate);
      }
      
      if (req.body.endDate) {
        updates.endDate = new Date(req.body.endDate);
      }
      
      const updatedSchedule = await storage.updateProbationSchedule(scheduleId, updates);
      
      // Notify about status changes
      if (req.body.status && req.body.status !== currentSchedule.status) {
        // Notify employee
        await notificationService.sendNotification({
          title: "Probation Status Updated",
          message: `Your probation status has been updated from ${currentSchedule.status} to ${req.body.status}.`,
          type: "hr",
          entityId: currentSchedule.id,
          entityType: "probation_schedule",
          userId: currentSchedule.userId,
          orgId: currentSchedule.orgId
        });
        
        // Notify manager
        if (currentSchedule.assignedManagerId) {
          await notificationService.sendNotification({
            title: "Probation Status Updated",
            message: `Probation for user ID ${currentSchedule.userId} has been updated from ${currentSchedule.status} to ${req.body.status}.`,
            type: "hr",
            entityId: currentSchedule.id,
            entityType: "probation_schedule",
            userId: currentSchedule.assignedManagerId,
            orgId: currentSchedule.orgId
          });
        }
      }
      
      res.json(updatedSchedule);
    } catch (error) {
      next(error);
    }
  });

  // Probation Evaluation routes
  probationRouter.get("/evaluations/:probationId", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const probationId = Number(req.params.probationId);
      const evaluations = await storage.getProbationEvaluationsByProbationId(probationId);
      
      res.json(evaluations);
    } catch (error) {
      next(error);
    }
  });

  probationRouter.get("/evaluation/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const evaluation = await storage.getProbationEvaluation(Number(req.params.id));
      
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }
      
      res.json(evaluation);
    } catch (error) {
      next(error);
    }
  });

  probationRouter.post("/evaluations", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const evaluationData = insertProbationEvaluationSchema.parse({
        ...req.body,
        evaluatedBy: req.user?.id || 1,
        evaluatedAt: new Date(),
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null
      });
      
      const evaluation = await storage.createProbationEvaluation(evaluationData);
      
      // Fetch the probation schedule to get userId
      const probationSchedule = await storage.getProbationSchedule(evaluation.probationId);
      
      if (probationSchedule) {
        // Notify the employee about the evaluation
        await notificationService.sendNotification({
          title: "New Probation Evaluation",
          message: `A new evaluation has been submitted for your probation. Please review and acknowledge.`,
          type: "hr",
          entityId: evaluation.id,
          entityType: "probation_evaluation",
          userId: probationSchedule.userId,
          orgId: probationSchedule.orgId
        });
      }
      
      res.status(201).json(evaluation);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  probationRouter.patch("/evaluation/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const evaluationId = Number(req.params.id);
      const evaluation = await storage.getProbationEvaluation(evaluationId);
      
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }
      
      // If acknowledging, add acknowledger info
      const updates: Partial<ProbationEvaluation> = { ...req.body };
      
      if (req.body.acknowledged && !evaluation.acknowledged) {
        updates.acknowledgedBy = req.user?.id || 1;
        updates.acknowledgedAt = new Date();
      }
      
      const updatedEvaluation = await storage.updateProbationEvaluation(evaluationId, updates);
      
      // Notify evaluator if evaluation is acknowledged
      if (req.body.acknowledged && !evaluation.acknowledged) {
        await notificationService.sendNotification({
          title: "Evaluation Acknowledged",
          message: `Your evaluation has been acknowledged by the employee.`,
          type: "hr",
          entityId: evaluation.id,
          entityType: "probation_evaluation",
          userId: evaluation.evaluatedBy,
          orgId: (await storage.getProbationSchedule(evaluation.probationId))?.orgId || 1
        });
      }
      
      res.json(updatedEvaluation);
    } catch (error) {
      next(error);
    }
  });

  // Exit Request routes
  const exitRequestRouter = express.Router();
  app.use("/api/hr/exits", exitRequestRouter);

  exitRequestRouter.get("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const orgId = req.query.orgId ? Number(req.query.orgId) : (req.user?.orgId || 1);
      const status = req.query.status as string;
      
      let exitRequests: ExitRequest[] = [];
      
      if (status) {
        exitRequests = await storage.getExitRequestsByStatus(status, orgId);
      } else if (req.query.userId) {
        const userId = Number(req.query.userId);
        exitRequests = await storage.getExitRequestsByUserId(userId);
      } else {
        // Get all exit requests for this org
        const pendingRequests = await storage.getExitRequestsByStatus('pending', orgId);
        const inProgressRequests = await storage.getExitRequestsByStatus('in_progress', orgId);
        const completedRequests = await storage.getExitRequestsByStatus('completed', orgId);
        
        exitRequests = [...pendingRequests, ...inProgressRequests, ...completedRequests];
      }
      
      res.json(exitRequests);
    } catch (error) {
      next(error);
    }
  });

  exitRequestRouter.get("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const exitRequest = await storage.getExitRequest(Number(req.params.id));
      
      if (!exitRequest) {
        return res.status(404).json({ message: "Exit request not found" });
      }
      
      res.json(exitRequest);
    } catch (error) {
      next(error);
    }
  });

  exitRequestRouter.post("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const exitRequestData = insertExitRequestSchema.parse({
        ...req.body,
        requestedBy: req.user?.id || 1,
        updatedBy: req.user?.id || 1,
        requestDate: new Date(),
        exitDate: new Date(req.body.exitDate),
        completedAt: null,
        status: 'pending'
      });
      
      const exitRequest = await storage.createExitRequest(exitRequestData);
      
      // Notify HR manager and department head
      await notificationService.sendNotification({
        title: "New Exit Request",
        message: `A new exit request has been submitted for user ID ${exitRequest.userId} with exit date ${new Date(exitRequest.exitDate).toLocaleDateString()}.`,
        type: "hr",
        entityId: exitRequest.id,
        entityType: "exit_request",
        orgId: exitRequest.orgId,
        department: 'hr'
      });
      
      res.status(201).json(exitRequest);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  exitRequestRouter.patch("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const exitRequestId = Number(req.params.id);
      const currentExitRequest = await storage.getExitRequest(exitRequestId);
      
      if (!currentExitRequest) {
        return res.status(404).json({ message: "Exit request not found" });
      }
      
      // Process date fields
      const updates: Partial<ExitRequest> = {
        ...req.body,
        updatedBy: req.user?.id || 1
      };
      
      if (req.body.exitDate) {
        updates.exitDate = new Date(req.body.exitDate);
      }
      
      const updatedExitRequest = await storage.updateExitRequest(exitRequestId, updates);
      
      // Notify about status changes
      if (req.body.status && req.body.status !== currentExitRequest.status) {
        // Notify employee
        await notificationService.sendNotification({
          title: "Exit Request Status Updated",
          message: `Your exit request status has been updated from ${currentExitRequest.status} to ${req.body.status}.`,
          type: "hr",
          entityId: currentExitRequest.id,
          entityType: "exit_request",
          userId: currentExitRequest.userId,
          orgId: currentExitRequest.orgId
        });
        
        // If completed, update user status
        if (req.body.status === 'completed' && currentExitRequest.status !== 'completed') {
          await storage.updateUser(currentExitRequest.userId, { 
            active: false,
            updatedBy: req.user?.id || 1
          });
          
          // Notify HR department
          await notificationService.sendNotification({
            title: "Exit Process Completed",
            message: `The exit process for user ID ${currentExitRequest.userId} has been completed.`,
            type: "hr",
            entityId: currentExitRequest.id,
            entityType: "exit_request",
            orgId: currentExitRequest.orgId,
            department: 'hr'
          });
        }
      }
      
      res.json(updatedExitRequest);
    } catch (error) {
      next(error);
    }
  });

  // Company Document routes
  const companyDocumentRouter = express.Router();
  app.use("/api/hr/company-documents", companyDocumentRouter);

  companyDocumentRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const orgId = req.query.orgId ? Number(req.query.orgId) : (req.user?.orgId || 1);
      const category = req.query.category as string;
      
      let documents: CompanyDocument[] = [];
      
      if (category) {
        documents = await storage.getCompanyDocumentsByCategory(category, orgId);
      } else if (req.query.public === 'true') {
        documents = await storage.getPublicCompanyDocuments(orgId);
      } else {
        // Get all company documents
        documents = await storage.getCompanyDocumentsByCategory('policy', orgId);
        const formDocuments = await storage.getCompanyDocumentsByCategory('form', orgId);
        const templateDocuments = await storage.getCompanyDocumentsByCategory('template', orgId);
        const resourceDocuments = await storage.getCompanyDocumentsByCategory('resource', orgId);
        
        documents = [...documents, ...formDocuments, ...templateDocuments, ...resourceDocuments];
      }
      
      res.json(documents);
    } catch (error) {
      next(error);
    }
  });

  companyDocumentRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const document = await storage.getCompanyDocument(Number(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      next(error);
    }
  });

  companyDocumentRouter.post("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const documentData = insertCompanyDocumentSchema.parse({
        ...req.body,
        uploadedBy: req.user?.id || 1
      });
      
      const document = await storage.createCompanyDocument(documentData);
      
      // Notify all users if document is public and is a policy
      if (document.isPublic && document.category === 'policy') {
        await notificationService.sendNotification({
          title: "New Company Policy",
          message: `A new company policy document "${document.name}" has been published.`,
          type: "hr",
          entityId: document.id,
          entityType: "company_document",
          orgId: document.orgId,
          broadcastToOrg: true
        });
      }
      
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  companyDocumentRouter.patch("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const documentId = Number(req.params.id);
      const document = await storage.getCompanyDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const updatedDocument = await storage.updateCompanyDocument(documentId, {
        ...req.body,
        uploadedBy: req.user?.id || 1
      });
      
      res.json(updatedDocument);
    } catch (error) {
      next(error);
    }
  });

  // HR Analytics API
  app.get("/api/hr/metrics", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const orgId = req.query.orgId ? Number(req.query.orgId) : (req.user?.orgId || 1);
      
      // For date range filtering
      let period: { startDate: Date; endDate: Date } | undefined = undefined;
      
      if (req.query.startDate && req.query.endDate) {
        period = {
          startDate: new Date(req.query.startDate as string),
          endDate: new Date(req.query.endDate as string)
        };
      }
      
      const metrics = await storage.getHrMetrics(orgId, period);
      
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  });
}

// Socket.IO instance will be initialized in registerRoutes
let io: SocketIOServer;

// Add type extensions for Express
declare global {
  namespace Express {
    interface Request {
      user?: typeof users.$inferSelect;
      userRole?: typeof roles.$inferSelect;
    }
  }
  
  // Extend express-session
  namespace Express {
    interface Session {
      userId?: number;
    }
  }
}

const MemoryStore = createMemoryStore(session);;

// Add some seed data for testing
// Helper to safely create a date object
function createDate(dateString?: string | null): Date | null {
  if (!dateString) return null;
  try {
    return new Date(dateString);
  } catch (error) {
    console.error("Invalid date format:", dateString);
    return new Date(); // fallback to current date
  }
}

// Create a date string in ISO format for database compatibility
function createDateString(): string {
  return new Date().toISOString();
}

// Safe date handling - ensures any date value is processed correctly for db compatibility
function safeDate(date: Date | string | null): Date | null {
  if (!date) return null;
  
  // For Drizzle with PostgreSQL, we always want to return a proper Date object
  // This creates a consistent format regardless of storage implementation
  
  // If already a string, parse it to a Date
  if (typeof date === 'string') {
    try {
      return new Date(date);
    } catch (e) {
      console.error('Invalid date string:', date);
      return new Date(); // fallback
    }
  }
  
  // If it's already a Date object, return it as is
  return date;
}

/**
 * Ensures that the two required organizations (MetaSys Solutions and MetaSys Logistics)
 * exist in the database with their specific module configurations.
 */
async function ensureRequiredOrganizations() {
  try {
    console.log("Ensuring required organizations with correct module configurations...");

    // MetaSys Solutions - Needs all modules EXCEPT dispatch
    let metasysOrg = await storage.getOrganizationByCode("METASYS");
    
    if (!metasysOrg) {
      console.log("Creating MetaSys Solutions organization...");
      metasysOrg = await storage.createOrganization({
        name: "MetaSys Solutions",
        code: "METASYS",
        active: true,
        contactName: "John Wilson",
        contactEmail: "john.wilson@metasys.com",
        contactPhone: "+1 (555) 123-4567",
        enabledModules: {
          sales: true,
          dispatch: false, // Doesn't need dispatch
          hr: true,
          finance: true,
          marketing: true
        }
      });
      console.log("MetaSys Solutions organization created with ID:", metasysOrg.id);
    } else {
      // Update the organization to ensure the module configuration is correct
      console.log("Updating MetaSys Solutions organization module configuration...");
      metasysOrg = await storage.updateOrganization(metasysOrg.id, {
        enabledModules: {
          sales: true,
          dispatch: false, // Doesn't need dispatch
          hr: true,
          finance: true,
          marketing: true
        }
      });
    }
    
    // MetaSys Logistics - Needs all modules
    let logisticsOrg = await storage.getOrganizationByCode("LOGISTICS");
    
    if (!logisticsOrg) {
      console.log("Creating MetaSys Logistics organization...");
      logisticsOrg = await storage.createOrganization({
        name: "MetaSys Logistics",
        code: "LOGISTICS",
        active: true,
        contactName: "Sarah Johnson",
        contactEmail: "sarah.johnson@metasys-logistics.com",
        contactPhone: "+1 (555) 987-6543",
        enabledModules: {
          sales: true,
          dispatch: true, // Needs dispatch module
          hr: true,
          finance: true,
          marketing: true
        }
      });
      console.log("MetaSys Logistics organization created with ID:", logisticsOrg.id);
    } else {
      // Update the organization to ensure the module configuration is correct
      console.log("Updating MetaSys Logistics organization module configuration...");
      logisticsOrg = await storage.updateOrganization(logisticsOrg.id, {
        enabledModules: {
          sales: true,
          dispatch: true, // Needs dispatch module
          hr: true,
          finance: true,
          marketing: true
        }
      });
    }
    
    return { metasysOrg, logisticsOrg };
  } catch (error) {
    console.error("Error ensuring required organizations:", error);
    throw error;
  }
}

async function addSeedDataIfNeeded() {
  try {
    // Add or update required organizations with specific module configurations
    await ensureRequiredOrganizations();
    
    // Check if we already have some dispatch clients
    const clients = await storage.getDispatchClients();
    if (clients.length === 0) {
      console.log("Adding seed dispatch clients...");
      
      // First, make sure we have some leads
      const leads = await storage.getLeads();
      
      if (leads.length === 0) {
        // Create some test leads first
        const lead1 = await storage.createLead({
          companyName: "FastFreight Carriers",
          contactName: "John Smith",
          email: "john@fastfreight.example",
          phoneNumber: "555-123-4567",
          status: "Active",
          mcNumber: "MC-123456",
          dotNumber: "DOT-7890123",
          assignedTo: 1,
          orgId: 1,
          notes: "Large carrier with national routes",
          equipmentType: "Dry Van",
          factoringStatus: "approved",
          serviceCharges: 5,
          createdBy: 1 // Admin user
        });
        
        const lead2 = await storage.createLead({
          companyName: "Highway Express Logistics",
          contactName: "Maria Rodriguez",
          email: "maria@highway-express.example",
          phoneNumber: "555-987-6543",
          status: "Active",
          mcNumber: "MC-456789",
          dotNumber: "DOT-2345678",
          assignedTo: 1,
          orgId: 1,
          notes: "Mid-sized regional carrier",
          equipmentType: "Reefer",
          factoringStatus: "pending",
          serviceCharges: 6,
          createdBy: 1 // Admin user
        });
        
        const lead3 = await storage.createLead({
          companyName: "Mountain Trucking Co.",
          contactName: "Robert Chen",
          email: "robert@mountain-trucking.example",
          phoneNumber: "555-567-1234",
          status: "Active",
          mcNumber: "MC-789012",
          dotNumber: "DOT-3456789",
          assignedTo: 1,
          orgId: 1,
          notes: "Specialized in refrigerated freight",
          equipmentType: "Reefer",
          factoringStatus: "not_required",
          serviceCharges: 4,
          createdBy: 1 // Admin user
        });
        
        const lead4 = await storage.createLead({
          companyName: "Coastal Shipping LLC",
          contactName: "Sarah Johnson",
          email: "sarah@coastal-shipping.example",
          phoneNumber: "555-222-3333",
          status: "InProgress",
          mcNumber: "MC-345678",
          dotNumber: "DOT-9012345",
          assignedTo: 1,
          orgId: 1,
          notes: "Interested in long-term partnership",
          equipmentType: "Flatbed",
          factoringStatus: "pending",
          serviceCharges: 6,
          createdBy: 1 // Admin user
        });
        
        const lead5 = await storage.createLead({
          companyName: "Midwest Haulers Inc.",
          contactName: "Michael Brown",
          email: "michael@midwest-haulers.example",
          phoneNumber: "555-444-5555",
          status: "FollowUp",
          mcNumber: "MC-567890",
          dotNumber: "DOT-1234567",
          assignedTo: 1,
          orgId: 1,
          notes: "Family-owned business, established 1985",
          equipmentType: "Dry Van",
          factoringStatus: "approved",
          serviceCharges: 5,
          createdBy: 1 // Admin user
        });
        
        // Now create some dispatch clients linked to these leads
        await storage.createDispatchClient({
          leadId: lead1.id,
          status: "active",
          orgId: 1,
          notes: "Premium client, priority dispatch",
          // Don't pass a date object directly; the database handle will convert it properly
          onboardingDate: safeDate(new Date()),
          approvedBy: 1
        });
        
        await storage.createDispatchClient({
          leadId: lead2.id,
          status: "active",
          orgId: 1,
          notes: "Regular client with consistent loads",
          onboardingDate: safeDate(new Date()),
          approvedBy: 1
        });
        
        await storage.createDispatchClient({
          leadId: lead3.id,
          status: "pending_onboard",
          orgId: 1,
          notes: "Waiting for paperwork submission",
          onboardingDate: null,
          approvedBy: null
        });
        
        await storage.createDispatchClient({
          leadId: lead4.id,
          status: "pending_onboard",
          orgId: 1,
          notes: "Needs insurance verification",
          onboardingDate: null,
          approvedBy: null
        });
        
        await storage.createDispatchClient({
          leadId: lead5.id,
          status: "lost",
          orgId: 1,
          notes: "Went with competitor due to pricing",
          onboardingDate: safeDate(new Date()),
          approvedBy: 1
        });
        
        console.log("Seed data added successfully!");
      } else {
        // We have leads but no dispatch clients, create clients for existing leads
        for (const lead of leads.slice(0, 5)) {
          // Determine a status based on lead status
          let status = "pending_onboard";
          if (lead.status === "Active") {
            status = Math.random() > 0.3 ? "active" : "pending_onboard";
          } else if (lead.status === "Lost") {
            status = "lost";
          }
          
          await storage.createDispatchClient({
            leadId: lead.id,
            status,
            orgId: lead.orgId || 1,
            notes: `Client created from lead ${lead.companyName}`,
            onboardingDate: status === "active" ? safeDate(new Date()) : null,
            approvedBy: status === "active" ? 1 : null
          });
        }
        
        console.log("Created dispatch clients from existing leads");
      }
    }
  } catch (error) {
    console.error("Error adding seed data:", error);
  }
}

export async function registerRoutes(apiRouter: Router, server?: Server): Promise<Server> {
  // Express router to handle our API routes
  // All routes will be prefixed with /api due to the middleware in index.ts
  
  // Root API route - this will be accessible at /api
  // Root handler removed to allow frontend SPA to render properly
  
  // Note: Session setup is already done in index.ts
  
  // Setup for handling file uploads 
  apiRouter.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Apply organization middleware to all API routes
  apiRouter.use('/', organizationMiddleware);
  
  // Register error logging routes
  apiRouter.use('/', errorLoggingRoutes);
  
  // Register status routes
  apiRouter.use('/status', statusRoutes);
  
  // Register admin routes
  apiRouter.use('/admin', adminRouter);
  
  // Register Time Off and HR Policies routes
  apiRouter.use('/time-off', timeOffRouter);
  apiRouter.use('/hr-policies', hrPoliciesRouter);
  
  // Register CRM Dashboard routes
  apiRouter.use('/crm/dashboard', crmDashboardRouter);
  
  // Register team management routes
  registerTeamRoutes(apiRouter);
  
  // Add seed data if needed
  await addSeedDataIfNeeded();
  
  // Register HR routes
  registerHrRoutes(apiRouter);
  
  // Use provided server or create a new one
  let httpServer = server || createServer();
  
  // Do not create a new Socket.IO server here
  // Socket.IO is initialized only once in server/index.ts
  // and imported from server/socket.ts
  
  // Get the io instance from socket.ts or a global reference
  // We need to reference io from somewhere since it's used in other functions

  // Authentication routes
  const authRouter = express.Router();
  app.use("/api/auth", authRouter); // Using the full path to match frontend expectations

  // Login route with enhanced error handling and session management
  authRouter.post("/login", express.json(), async (req, res, next) => {
    try {
      // Explicitly set JSON content type
      res.setHeader('Content-Type', 'application/json');
      
      console.log("Login attempt received:", { 
        body: req.body,
        contentType: req.get('Content-Type'),
        method: req.method,
        path: req.path,
        url: req.url,
        originalUrl: req.originalUrl,
        sessionID: req.sessionID
      });
      
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          error: "Authentication failed",
          details: "Username and password are required",
          missing: ["credentials"]
        });
      }

      // Add verbose logging to debug the issue
      console.log(`Login attempt for username: ${username}`);
      
      let user;
      // Check database connectivity before querying
      try {
        user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`User not found: ${username}`);
          return res.status(401).json({ 
            error: "Authentication failed", 
            details: "Invalid username or password", 
            missing: ["user"] 
          });
        }
        
        // Simple password comparison - in a real app, use bcrypt
        if (user.password !== password) {
          console.log(`Invalid password for user: ${username}`);
          return res.status(401).json({ 
            error: "Authentication failed", 
            details: "Invalid username or password", 
            missing: ["valid_credentials"] 
          });
        }
        
        // Validate that user has necessary fields
        if (!user.firstName || !user.lastName) {
          console.warn(`User ${username} has incomplete profile data`);
        }
        
        // Ensure user has organization ID
        if (!user.orgId) {
          console.log(`User ${username} has no organization, attempting to assign default org`);
          try {
            const orgs = await storage.getOrganizations();
            if (orgs && orgs.length > 0) {
              await storage.updateUser(user.id, { orgId: orgs[0].id });
              user.orgId = orgs[0].id;
              console.log(`Assigned user ${user.id} to default organization ${orgs[0].id}`);
            }
          } catch (orgError) {
            console.error("Error assigning default organization:", orgError);
          }
        }
      } catch (dbError) {
        console.error("Database error during login:", dbError);
        return res.status(500).json({
          error: "Authentication failed due to database error",
          details: "An internal server error occurred while processing your request",
          missing: ["database_connection"]
        });
      }

      if (!user) {
        return res.status(500).json({
          error: "Authentication failed",
          details: "User could not be retrieved",
          missing: ["user"]
        });
      }

      // Enhanced session data with more user context
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.roleId = user.roleId;
      req.session.authenticated = true;
      req.session.loginTime = new Date().toISOString();
      
      if (user.orgId) {
        req.session.orgId = user.orgId;
      }
      
      // Set session cookie options to improve persistence
      if (req.session.cookie) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }
      
      // Explicitly save the session to ensure it's stored properly
      try {
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error("Session save error during login:", err);
              reject(err);
            } else {
              console.log(`Session saved successfully for ${user.username}, session ID: ${req.sessionID}`);
              resolve();
            }
          });
        });
      } catch (sessionError) {
        console.error("Failed to save session:", sessionError);
        
        // Try to regenerate session as recovery
        await new Promise<void>((resolve) => {
          req.session.regenerate((err) => {
            if (err) {
              console.error("Session regeneration failed:", err);
            } else {
              req.session.userId = user.id;
              req.session.username = user.username;
              req.session.roleId = user.roleId;
              req.session.authenticated = true;
              req.session.loginTime = new Date().toISOString();
              if (user.orgId) {
                req.session.orgId = user.orgId;
              }
              req.session.save();
              console.log("Regenerated session with ID:", req.sessionID);
            }
            resolve();
          });
        });
      }
      
      // Verify session was properly set with a test
      if (!req.session.userId) {
        console.error("Session verification failed - userId missing after save attempt");
      }
      
      try {
        // Try to get role information, but handle any errors
        const role = await storage.getRole(user.roleId);
        
        // Return user info (except password)
        const { password: _, ...userInfo } = user;
        
        // Log successful login
        console.log(`User ${username} logged in successfully with session ID: ${req.sessionID}`);
        
        return res.status(200).json({ 
          user: userInfo,
          role: role ? role : null,
          sessionId: req.sessionID,
          sessionValid: !!req.session.userId
        });
      } catch (roleError) {
        console.error(`Error fetching role for user ${username}:`, roleError);
        
        // Return user info without role if there's an error getting role
        const { password: _, ...userInfo } = user;
        
        return res.status(200).json({ 
          user: userInfo,
          role: null,
          sessionId: req.sessionID,
          sessionValid: !!req.session.userId,
          message: "Authentication successful but role data is unavailable"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      next(error);
    }
  });

  // Logout route with proper session cleanup
  authRouter.post("/logout", (req, res) => {
    // Log session status before logout
    console.log(`Logout attempt with session ID: ${req.sessionID}, userId: ${req.session.userId}`);
    
    if (!req.session.userId) {
      return res.status(200).json({ message: "Already logged out" });
    }
    
    // First save any pending changes, then destroy the session
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error("Error saving session before logout:", saveErr);
      }
      
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Error destroying session during logout:", destroyErr);
          return res.status(500).json({ message: "Error during logout" });
        }
        
        // Clear session cookie
        res.clearCookie('connect.sid');
        console.log("User successfully logged out");
        
        return res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  // Check current user session with enhanced debugging and session recovery
  authRouter.get("/me", async (req, res, next) => {
    try {
      // Log session info for debugging purposes
      console.log(`Auth check for session: ${req.sessionID}`, {
        hasSession: !!req.session,
        sessionData: {
          userId: req.session?.userId,
          orgId: req.session?.orgId,
          username: req.session?.username,
          authenticated: req.session?.authenticated
        }
      });
      
      // Check if cookie exists but session data is missing
      if (req.sessionID && (!req.session || !req.session.userId)) {
        console.log(`Session ID exists (${req.sessionID}) but session data is missing or invalid`);
        
        // Try to regenerate the session to fix potential issues
        if (req.session) {
          await new Promise<void>((resolve) => {
            req.session.regenerate((err) => {
              if (err) {
                console.error("Session regeneration failed:", err);
              } else {
                console.log("Session regenerated with ID:", req.sessionID);
              }
              resolve();
            });
          });
        }
        
        return res.status(401).json({ 
          authenticated: false,
          error: "Session expired or invalid",
          sessionId: req.sessionID
        });
      }

      try {
        const user = await storage.getUser(req.session.userId);
        if (!user) {
          console.log(`User with id ${req.session.userId} not found in database`);
          
          // Save and then destroy the session to ensure proper cleanup
          await new Promise<void>((resolve) => {
            req.session.userId = undefined;
            req.session.orgId = undefined;
            req.session.authenticated = false;
            req.session.save((saveErr) => {
              if (saveErr) {
                console.error("Error saving session before destroy:", saveErr);
              }
              
              req.session.destroy((destroyErr) => {
                if (destroyErr) {
                  console.error("Error destroying invalid session:", destroyErr);
                } else {
                  console.log("Session destroyed successfully after user not found");
                }
                resolve();
              });
            });
          });
          
          return res.status(401).json({ 
            authenticated: false,
            error: "User not found",
            sessionReset: true
          });
        }
      } catch (userError) {
        console.error("Error fetching user:", userError);
        return res.status(500).json({ 
          authenticated: false,
          error: "Database error while authenticating user",
          details: process.env.NODE_ENV === 'development' ? userError.message : undefined
        });
      }
      
      // Touch the session to extend its lifetime
      req.session.touch();

      // Ensure user is a valid object before proceeding
      if (!user || !user.id) {
        console.error("User object is invalid:", user);
        return res.status(401).json({
          authenticated: false,
          error: "Invalid user record"
        });
      }
      
      // Update session with complete user data if needed
      if (!req.session.authenticated) {
        req.session.authenticated = true;
        req.session.username = user.username;
        await new Promise<void>((resolve) => {
          req.session.save((err) => {
            if (err) {
              console.error("Error updating session after auth check:", err);
            }
            resolve();
          });
        });
      }
      
      // Try to get role information but handle errors gracefully
      try {
        const role = await storage.getRole(user.roleId);
        
        // Return user info (except password)
        const { password: _, ...userInfo } = user;
        return res.status(200).json({ 
          authenticated: true,
          user: userInfo,
          role,
          sessionId: req.sessionID,
          sessionValid: true
        });
      } catch (roleError) {
        console.error(`Error fetching role for user ${user.username}:`, roleError);
        
        // Return user info without role
        const { password: _, ...userInfo } = user;
        return res.status(200).json({ 
          authenticated: true,
          user: userInfo,
          role: null,
          sessionId: req.sessionID,
          sessionValid: true,
          message: "Authentication successful but role data is unavailable"
        });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      next(error);
    }
  });

  // Commissions routes
  const commissionsRouter = express.Router();
  app.use("/api/commissions", commissionsRouter);

  // GET monthly commissions for user
  commissionsRouter.get("/monthly/user/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      const month = req.query.month as string || new Date().toISOString().slice(0, 7); // Default to current month
      
      // Fix for the CRM commissions page error - ensure valid JSON response
      if (req.headers.accept?.includes('text/html')) {
        return res.json({
          userId,
          month,
          items: [],
          total: 0,
          leads: 0,
          clients: 0
        });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          status: "error", 
          message: "User not found" 
        });
      }

      // Default commission response
      const commissions = {
        userId,
        month,
        deals: [],
        total: 0,
        previousMonth: {
          total: 0
        },
        stats: {
          totalDeals: 0,
          avgCommission: 0,
          percentChange: 0
        }
      };
      
      // Check if the user has a sales or dispatch role
      const role = await storage.getUserRole(userId);
      
      if (role?.department === "sales") {
        // Calculate sales commissions
        const salesCommissions = await calculateSalesCommission(userId, month, req.user.id);
        res.json(salesCommissions);
      } else if (role?.department === "dispatch") {
        // Calculate dispatch commissions
        const dispatchCommissions = await calculateDispatchCommission(userId, month, req.user.id);
        res.json(dispatchCommissions);
      } else {
        // Return default structure for users without commissions
        res.json(commissions);
      }
    } catch (error) {
      console.error("Error fetching user commissions:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch commission data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET commissions for all users
  commissionsRouter.get("/monthly", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const month = req.query.month as string || new Date().toISOString().slice(0, 7); // Default to current month
      const department = req.query.department as string || "all"; // Filter by department
      
      // Fetch users with their roles
      const users = await storage.getAllUsers();
      const userIds = users.map(u => u.id);
      
      // Get commissions for each user
      const usersWithCommissions = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const role = await storage.getUserRole(userId);
            
            // Skip users not in the requested department
            if (department !== "all" && role?.department !== department) {
              return null;
            }
            
            let commissions;
            if (role?.department === "sales") {
              commissions = await calculateSalesCommission(userId, month, req.user.id);
            } else if (role?.department === "dispatch") {
              commissions = await calculateDispatchCommission(userId, month, req.user.id);
            } else {
              // Default empty commission data
              commissions = {
                userId,
                month,
                deals: [],
                total: 0,
                previousMonth: { total: 0 },
                stats: { totalDeals: 0, avgCommission: 0, percentChange: 0 }
              };
            }
            
            const user = users.find(u => u.id === userId);
            
            return {
              ...commissions,
              user: {
                id: user?.id,
                name: `${user?.firstName} ${user?.lastName}`,
                department: role?.department || "unknown"
              }
            };
          } catch (error) {
            console.error(`Error calculating commissions for user ${userId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out nulls and sort by total commission amount
      const filteredResults = usersWithCommissions
        .filter(Boolean)
        .sort((a, b) => b.total - a.total);
      
      res.json(filteredResults);
    } catch (error) {
      console.error("Error fetching all commissions:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch commission data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // User routes
  const userRouter = express.Router();
  app.use("/api/users", userRouter); // Using the full path to match frontend expectations

  // User-Organization management routes
  userRouter.get("/:userId/organizations", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's organizations
      const organizations = await storage.getUserOrganizations(userId);
      res.json(organizations);
    } catch (error) {
      next(error);
    }
  });
  
  userRouter.post("/:userId/organizations", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate organization IDs
      const { organizationIds } = req.body;
      if (!Array.isArray(organizationIds)) {
        return res.status(400).json({ message: "organizationIds must be an array" });
      }
      
      // Verify all organization IDs exist
      for (const orgId of organizationIds) {
        const org = await storage.getOrganization(Number(orgId));
        if (!org) {
          return res.status(404).json({ message: `Organization with ID ${orgId} not found` });
        }
      }
      
      // Set user's organizations
      await storage.setUserOrganizations(userId, organizationIds.map(id => Number(id)));
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'user',
        entityId: userId,
        action: 'updated_organizations',
        details: `Updated organization access for user: ${user.username}`
      });
      
      res.status(200).json({ message: "User organizations updated successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Get users by department
  userRouter.get("/department/:department", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const department = req.params.department;
      
      // Get users in this department
      const users = await storage.getUsersByDepartment(department);
      
      // Remove passwords before sending to client
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  });

  userRouter.get("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  });

  userRouter.get("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is trying to access other user's data
      if (req.user.id !== user.id && req.userRole.level < 3) {
        return res.status(403).json({ message: "Forbidden: You can only view your own profile" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  userRouter.post("/", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  userRouter.patch("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Make a copy of the original request body for filtering
      const updates = { ...req.body };
      
      // Determine permission level
      const isAdmin = req.userRole.level >= 5;  // System Admin
      const isHR = req.userRole.department === 'hr' && req.userRole.level >= 3;  // HR Manager or above
      const isSelf = req.user.id === userId;
      
      // Users can only update their own profile unless they're an admin or HR
      if (!isSelf && !isAdmin && !isHR) {
        return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
      }
      
      // Username and full name changes only allowed for admins or HR
      if ((!isAdmin && !isHR) && (updates.username || updates.firstName || updates.lastName)) {
        delete updates.username;
        delete updates.firstName;
        delete updates.lastName;
        
        // Inform the user that these fields were not updated
        return res.status(403).json({ 
          message: "Forbidden: Only System Admins or HR can change username and full name",
          restrictedFields: ["username", "firstName", "lastName"]
        });
      }
      
      // Additional permission checks
      // Don't allow role changes unless admin
      if (updates.roleId && !isAdmin) {
        delete updates.roleId;
        return res.status(403).json({ message: "Forbidden: Only System Admins can change user roles" });
      }

      // Prevent userId or id changes by anyone - these must remain unique and unchangeable
      delete updates.id;
      
      // If we removed all fields, there's nothing to update
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      // Process the update with the filtered fields
      const updatedUser = await storage.updateUser(userId, updates);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ 
        message: "Failed to update profile", 
        error: error.message || "Internal server error"
      });
    }
  });

  // Role routes
  const roleRouter = express.Router();
  app.use("/api/roles", roleRouter); // Using the full path to match frontend expectations

  // Get users by role
  roleRouter.get("/:id/users", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const roleId = Number(req.params.id);
      
      // Check if role exists
      const role = await storage.getRole(roleId);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      // Get users with this role
      const users = await storage.getUsersByRole(roleId);
      
      // Remove passwords before sending to client
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  });

  roleRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      next(error);
    }
  });

  roleRouter.post("/", createAuthMiddleware(5), async (req, res, next) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  // Lead routes
  const leadRouter = express.Router();
  app.use("/api/leads", leadRouter); // Using the full path to match frontend expectations

  leadRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      let leads;
      const { status, assigned } = req.query;
      
      // Determine which leads the user can access based on role
      if (req.userRole?.department === 'sales' || req.userRole?.department === 'admin') {
        if (req.userRole?.level === 1) {
          // Sales Reps can only see their own leads
          leads = await storage.getLeadsByAssignee(req.user?.id || 0);
        } else if (req.userRole?.level === 2) {
          // Team Leads can see all leads (we would filter by team in a real app)
          leads = await storage.getLeads();
        } else {
          // Managers and above can see all leads
          leads = await storage.getLeads();
        }
      } else {
        // Dispatch can only see active leads
        leads = await storage.getLeadsByStatus('Active');
      }
      
      // Filter by status if provided
      if (status && typeof status === 'string') {
        leads = leads.filter(lead => lead.status === status);
      }
      
      // Filter by assigned user if provided
      if (assigned && typeof assigned === 'string') {
        const assignedId = parseInt(assigned, 10);
        if (!isNaN(assignedId)) {
          leads = leads.filter(lead => lead.assignedTo === assignedId);
        }
      }
      
      // Return a proper structured JSON response
      res.status(200).json({
        status: "success",
        data: leads || []
      });
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch leads",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  leadRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const lead = await storage.getLead(Number(req.params.id));
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to view this lead
      if (req.userRole.department === 'sales' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && lead.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only view your own leads" });
        }
      } else if (req.userRole.department === 'dispatch' && lead.status !== 'Active') {
        return res.status(403).json({ message: "Forbidden: Dispatch can only view active leads" });
      }
      
      res.json(lead);
    } catch (error) {
      next(error);
    }
  });

  leadRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadData = insertLeadSchema.parse({
        ...req.body,
        createdBy: req.user.id,
        orgId: req.orgId // Add organization ID from the request context
      });
      
      // Validate MC number age if provided
      if (leadData.mcNumber) {
        // In a real app, this would check against a database or API to validate the MC number's age
        // For now, we'll assume all MC numbers are valid
      }
      
      const lead = await storage.createLead(leadData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'lead',
        entityId: lead.id,
        action: 'created',
        details: `Created lead for ${lead.companyName}`
      });
      
      // Send notification through multiple channels
      notificationService.sendLeadNotification(
        lead.id,
        'created',
        true
      ).catch(err => console.error('Error sending lead notification:', err));
      
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  leadRouter.patch("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadId = Number(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to update this lead
      if (req.userRole.department === 'sales' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && lead.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only update your own leads" });
        }
      } else {
        return res.status(403).json({ message: "Forbidden: Only sales department can update leads" });
      }
      
      const updatedLead = await storage.updateLead(leadId, req.body);
      
      // Log the activity
      if (req.body.status && req.body.status !== lead.status) {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'lead',
          entityId: leadId,
          action: 'status_changed',
          details: `Changed lead status from ${lead.status} to ${req.body.status}`
        });
        
        // Step 7: Activation Workflow - Create dispatch client record when lead status changes to "Active"
        if (req.body.status === 'Active') {
          // Check if this lead already has a dispatch client record
          const existingClient = await storage.getDispatchClientByLeadId(leadId);
          
          if (!existingClient) {
            // Create new dispatch client with status "Pending Onboard"
            const dispatchClient = await storage.createDispatchClient({
              leadId: leadId,
              status: 'pending_onboard',
              orgId: req.user.id, // Typically would be organization ID
              notes: `Auto-created when lead ${lead.companyName} was activated`,
              onboardingDate: null,
              approvedBy: null
            });
            
            // Log activity for dispatch client creation
            await storage.createActivity({
              userId: req.user.id,
              entityType: 'dispatch_client',
              entityId: dispatchClient.id,
              action: 'created',
              details: `Created dispatch client record for lead ${lead.companyName}`
            });
            
            // Send notification to dispatch team
            await notificationService.sendDispatchNotification(
              dispatchClient.id,
              'created',
              {
                userId: req.user.id,
                userName: `${req.user.firstName} ${req.user.lastName}`,
                leadId: leadId,
                companyName: lead.companyName
              }
            );
            
            console.log(`Created dispatch client ${dispatchClient.id} for activated lead ${leadId}`);
          }
        }
      } else {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'lead',
          entityId: leadId,
          action: 'updated',
          details: `Updated lead information`
        });
      }
      
      res.json(updatedLead);
    } catch (error) {
      next(error);
    }
  });

  // Load routes
  const loadRouter = express.Router();
  app.use("/loads", loadRouter);

  // Lead remarks routes
  const leadRemarkRouter = express.Router();
  app.use("/lead-remarks", leadRemarkRouter);
  
  // Team management routes
  const teamRouter = express.Router();
  app.use("/api/teams", teamRouter);
  
  // Get all teams
  teamRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const teams = await storage.getTeams(req.orgId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ 
        message: "Failed to fetch teams",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get a specific team by ID
  teamRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const teamId = Number(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ 
        message: "Failed to fetch team",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Create a new team
  teamRouter.post("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      // Check if user has permission to create teams (System Admin or HR Manager+)
      const isAdmin = req.userRole.level >= 5;
      const isHR = req.userRole.department === 'hr' && req.userRole.level >= 3;
      
      if (!isAdmin && !isHR) {
        return res.status(403).json({ 
          message: "Forbidden: You don't have permission to create teams"
        });
      }
      
      const teamData = {
        ...req.body,
        orgId: req.orgId
      };
      
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ 
        message: "Failed to create team",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Update a team
  teamRouter.patch("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const teamId = Number(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user has permission to update teams (System Admin or HR Manager+)
      const isAdmin = req.userRole.level >= 5;
      const isHR = req.userRole.department === 'hr' && req.userRole.level >= 3;
      
      if (!isAdmin && !isHR) {
        return res.status(403).json({ 
          message: "Forbidden: You don't have permission to update teams"
        });
      }
      
      const updatedTeam = await storage.updateTeam(teamId, req.body);
      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ 
        message: "Failed to update team",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Delete a team
  teamRouter.delete("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const teamId = Number(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user has permission to delete teams (System Admin or HR Manager+)
      const isAdmin = req.userRole.level >= 5;
      const isHR = req.userRole.department === 'hr' && req.userRole.level >= 3;
      
      if (!isAdmin && !isHR) {
        return res.status(403).json({ 
          message: "Forbidden: You don't have permission to delete teams"
        });
      }
      
      // First remove all team members
      await storage.removeAllTeamMembers(teamId);
      
      // Then delete the team
      await storage.deleteTeam(teamId);
      
      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ 
        message: "Failed to delete team",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get team members for a specific team
  teamRouter.get("/:id/members", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const teamId = Number(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ 
        message: "Failed to fetch team members",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Add a member to a team
  teamRouter.post("/members", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const { teamId, userId } = req.body;
      
      if (!teamId || !userId) {
        return res.status(400).json({ message: "Team ID and User ID are required" });
      }
      
      const team = await storage.getTeam(Number(teamId));
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user has permission (System Admin or HR Manager+)
      const isAdmin = req.userRole.level >= 5;
      const isHR = req.userRole.department === 'hr' && req.userRole.level >= 3;
      
      if (!isAdmin && !isHR) {
        return res.status(403).json({ 
          message: "Forbidden: You don't have permission to add team members"
        });
      }
      
      // Check if user already belongs to another team
      const existingTeamMember = await storage.getUserTeam(Number(userId));
      
      if (existingTeamMember) {
        return res.status(400).json({ 
          message: "User already belongs to another team",
          teamId: existingTeamMember.teamId
        });
      }
      
      const teamMember = await storage.addTeamMember({
        userId: Number(userId),
        teamId: Number(teamId)
      });
      
      res.status(201).json(teamMember);
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(500).json({ 
        message: "Failed to add team member",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Remove a member from a team
  teamRouter.delete("/:teamId/members/:userId", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const teamId = Number(req.params.teamId);
      const userId = Number(req.params.userId);
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user has permission (System Admin or HR Manager+)
      const isAdmin = req.userRole.level >= 5;
      const isHR = req.userRole.department === 'hr' && req.userRole.level >= 3;
      
      if (!isAdmin && !isHR) {
        return res.status(403).json({ 
          message: "Forbidden: You don't have permission to remove team members"
        });
      }
      
      await storage.removeTeamMember(teamId, userId);
      
      res.json({ message: "Team member removed successfully" });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ 
        message: "Failed to remove team member",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get teams by department
  teamRouter.get("/department/:department", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const department = req.params.department;
      const teams = await storage.getTeamsByDepartment(department, req.orgId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams by department:", error);
      res.status(500).json({ 
        message: "Failed to fetch teams by department",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get available users (not in any team)
  userRouter.get("/available", createAuthMiddleware(3), async (req, res, next) => {
    try {
      // Check if user has permission (System Admin or HR Manager+)
      const isAdmin = req.userRole.level >= 5;
      const isHR = req.userRole.department === 'hr' && req.userRole.level >= 3;
      
      if (!isAdmin && !isHR) {
        return res.status(403).json({ 
          message: "Forbidden: You don't have permission to view available users"
        });
      }
      
      const availableUsers = await storage.getAvailableUsers(req.orgId);
      
      // Remove passwords before sending to client
      const sanitizedUsers = availableUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching available users:", error);
      res.status(500).json({ 
        message: "Failed to fetch available users",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get all remarks for a specific lead
  leadRemarkRouter.get("/lead/:leadId", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadId = Number(req.params.leadId);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to view this lead's remarks
      if (req.userRole.department === 'sales' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && lead.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only view remarks for your own leads" });
        }
      } else if (req.userRole.department === 'dispatch' && lead.status !== 'Active') {
        return res.status(403).json({ message: "Forbidden: Dispatch can only view remarks for active leads" });
      }
      
      const remarks = await storage.getLeadRemarksByLeadId(leadId);
      res.json(remarks);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new remark for a lead
  leadRemarkRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const { leadId, text } = req.body;
      
      if (!leadId || !text) {
        return res.status(400).json({ message: "Missing required fields: leadId, text" });
      }
      
      const lead = await storage.getLead(Number(leadId));
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to add remarks to this lead
      if (req.userRole.department === 'sales' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && lead.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only add remarks to your own leads" });
        }
      } else if (req.userRole.department === 'dispatch' && lead.status !== 'Active') {
        return res.status(403).json({ message: "Forbidden: Dispatch can only add remarks to active leads" });
      }
      
      const remark = await storage.createLeadRemark({
        leadId: Number(leadId),
        userId: req.user.id,
        text
      });
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'lead',
        entityId: lead.id,
        action: 'added_remark',
        details: `Added remark to lead: ${lead.companyName}`
      });
      
      // Send notification through socket for real-time updates
      notificationService.sendLeadRemarkNotification(
        lead.id,
        'remark_added',
        {
          userId: req.user.id,
          userName: `${req.user.firstName} ${req.user.lastName}`,
          leadId: lead.id,
          remarkId: remark.id
        }
      ).catch(err => console.error('Error sending lead remark notification:', err));
      
      res.status(201).json(remark);
    } catch (error) {
      next(error);
    }
  });
  
  // Call Log routes
  const callLogRouter = express.Router();
  app.use("/api/call-logs", callLogRouter);
  
  // Get all call logs for a specific lead
  callLogRouter.get("/lead/:leadId", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadId = Number(req.params.leadId);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to view this lead's call logs
      if (req.userRole.department === 'sales' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && lead.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only view call logs for your own leads" });
        }
      } else if (req.userRole.department === 'dispatch' && lead.status !== 'Active') {
        return res.status(403).json({ message: "Forbidden: Dispatch can only view call logs for active leads" });
      }
      
      const callLogs = await storage.getCallLogsByLeadId(leadId);
      res.json(callLogs);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all call logs
  callLogRouter.get("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const callLogs = await storage.getCallLogs();
      res.json(callLogs);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new call log
  callLogRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const callLogData = insertCallLogSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const lead = await storage.getLead(callLogData.leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to add call logs to this lead
      if (req.userRole.department === 'sales' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && lead.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only add call logs to your own leads" });
        }
      } else if (req.userRole.department === 'dispatch' && lead.status !== 'Active') {
        return res.status(403).json({ message: "Forbidden: Dispatch can only add call logs to active leads" });
      }
      
      const callLog = await storage.createCallLog(callLogData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'lead',
        entityId: lead.id,
        action: 'added_call_log',
        details: `Added call log (${callLog.outcome}) to lead: ${lead.companyName}`
      });
      
      // Send notification
      notificationService.sendCallLogNotification(
        lead.id,
        callLog.id,
        {
          userId: req.user.id,
          userName: `${req.user.firstName} ${req.user.lastName}`,
          outcome: callLog.outcome
        }
      ).catch(err => console.error('Error sending call log notification:', err));
      
      // If scheduled follow-up is true, create a follow-up task
      if (callLog.scheduledFollowUp && req.body.followUpDate) {
        const followUpData = {
          leadId: callLog.leadId,
          createdBy: req.user.id,
          assignedTo: lead.assignedTo || req.user.id,
          scheduledDate: new Date(req.body.followUpDate),
          notes: req.body.notes || `Follow-up from call on ${new Date().toLocaleDateString()}`,
          priority: req.body.priority || "medium"
        };
        
        const followUp = await storage.createLeadFollowUp(followUpData);
        
        // Send follow-up created notification
        notificationService.sendLeadFollowUpNotification(
          lead.id,
          'created',
          followUp.id
        ).catch(err => console.error('Error sending follow-up notification:', err));
      }
      
      res.status(201).json(callLog);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });
  
  // Lead Follow-Up routes
  const leadFollowUpRouter = express.Router();
  app.use("/api/lead-follow-ups", leadFollowUpRouter);
  
  // Get all follow-ups for a specific lead
  leadFollowUpRouter.get("/lead/:leadId", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadId = Number(req.params.leadId);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to view this lead's follow-ups
      if (req.userRole.department === 'sales' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && lead.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only view follow-ups for your own leads" });
        }
      } else if (req.userRole.department === 'dispatch' && lead.status !== 'Active') {
        return res.status(403).json({ message: "Forbidden: Dispatch can only view follow-ups for active leads" });
      }
      
      const followUps = await storage.getLeadFollowUpsByLeadId(leadId);
      res.json(followUps);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all follow-ups assigned to current user
  leadFollowUpRouter.get("/assigned", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const followUps = await storage.getLeadFollowUpsByAssignee(req.user.id);
      res.json(followUps);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all due follow-ups
  leadFollowUpRouter.get("/due", createAuthMiddleware(1), async (req, res, next) => {
    try {
      let dueDate = undefined;
      if (req.query.date) {
        dueDate = new Date(req.query.date as string);
      }
      
      const followUps = await storage.getDueLeadFollowUps(dueDate);
      
      // Filter based on user permissions
      const filteredFollowUps = followUps.filter(followUp => {
        // Admin sees all follow-ups
        if (req.userRole.department === 'admin') {
          return true;
        }
        
        // Sales reps see only their assigned follow-ups
        if (req.userRole.department === 'sales' && req.userRole.level === 1) {
          return followUp.assignedTo === req.user.id;
        }
        
        // Team leads and managers see all follow-ups in their department
        return true;
      });
      
      res.json(filteredFollowUps);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new follow-up
  leadFollowUpRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const followUpData = insertLeadFollowUpSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const lead = await storage.getLead(followUpData.leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to add follow-ups to this lead
      if (req.userRole.department === 'sales' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && lead.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only add follow-ups to your own leads" });
        }
      } else if (req.userRole.department === 'dispatch' && lead.status !== 'Active') {
        return res.status(403).json({ message: "Forbidden: Dispatch can only add follow-ups to active leads" });
      }
      
      const followUp = await storage.createLeadFollowUp(followUpData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'lead',
        entityId: lead.id,
        action: 'added_follow_up',
        details: `Scheduled follow-up for lead: ${lead.companyName} on ${new Date(followUp.scheduledDate).toLocaleDateString()}`
      });
      
      // Send notification
      notificationService.sendLeadFollowUpNotification(
        lead.id,
        'created',
        followUp.id
      ).catch(err => console.error('Error sending follow-up notification:', err));
      
      res.status(201).json(followUp);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });
  
  // Update a follow-up (mark as complete or edit)
  leadFollowUpRouter.patch("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const followUpId = Number(req.params.id);
      const followUp = await storage.getLeadFollowUp(followUpId);
      
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      
      // Check if user has permission to update this follow-up
      if (req.userRole.level === 1 && followUp.assignedTo !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You can only update your assigned follow-ups" });
      }
      
      const updates: Partial<LeadFollowUp> = req.body;
      
      // If marking as complete, set completedAt
      if (updates.completed === true && !followUp.completedAt) {
        updates.completedAt = new Date();
      }
      
      const updatedFollowUp = await storage.updateLeadFollowUp(followUpId, updates);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'follow_up',
        entityId: followUp.id,
        action: updates.completedAt ? 'completed_follow_up' : 'updated_follow_up',
        details: updates.completedAt 
          ? `Completed follow-up for lead #${followUp.leadId}` 
          : `Updated follow-up for lead #${followUp.leadId}`
      });
      
      // Send notification if follow-up was completed
      if (updates.completed === true && updates.completedAt) {
        notificationService.sendLeadFollowUpNotification(
          followUp.leadId,
          'completed',
          followUp.id
        ).catch(err => console.error('Error sending follow-up completion notification:', err));
      }
      
      res.json(updatedFollowUp);
    } catch (error) {
      next(error);
    }
  });
  
  // Customer Feedback routes
  const customerFeedbackRouter = express.Router();
  app.use("/api/customer-feedback", customerFeedbackRouter);
  
  // Get all feedback for a specific lead
  customerFeedbackRouter.get("/lead/:leadId", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const leadId = Number(req.params.leadId);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to view this lead's feedback
      if (req.userRole.department === 'sales' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && lead.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only view feedback for your own leads" });
        }
      } else if (req.userRole.department === 'dispatch' && lead.status !== 'Active') {
        return res.status(403).json({ message: "Forbidden: Dispatch can only view feedback for active leads" });
      }
      
      const feedback = await storage.getCustomerFeedbacksByLeadId(leadId);
      res.json(feedback);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all customer feedback
  customerFeedbackRouter.get("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const feedback = await storage.getCustomerFeedbacks();
      res.json(feedback);
    } catch (error) {
      next(error);
    }
  });
  
  // Create new customer feedback
  customerFeedbackRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const feedbackData = insertCustomerFeedbackSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const lead = await storage.getLead(feedbackData.leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if user has permission to add feedback to this lead
      if (req.userRole.department === 'sales' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && lead.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only add feedback to your own leads" });
        }
      } else if (req.userRole.department === 'dispatch' && lead.status !== 'Active') {
        return res.status(403).json({ message: "Forbidden: Dispatch can only add feedback to active leads" });
      }
      
      const feedback = await storage.createCustomerFeedback(feedbackData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'lead',
        entityId: lead.id,
        action: 'added_feedback',
        details: `Added customer feedback (${feedback.rating}/5) for lead: ${lead.companyName}`
      });
      
      // Send notification
      notificationService.sendCustomerFeedbackNotification(
        lead.id,
        feedback.id
      ).catch(err => console.error('Error sending customer feedback notification:', err));
      
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  loadRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      let loads;
      const { status, assigned, leadId } = req.query;
      
      // Determine which loads the user can access based on role
      if (req.userRole.department === 'dispatch' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1) {
          // Dispatch Reps can only see their own loads
          loads = await storage.getLoadsByAssignee(req.user.id);
        } else {
          // Team Leads and above can see all loads
          loads = await storage.getLoads();
        }
      } else {
        // Sales can see loads but not modify them
        loads = await storage.getLoads();
      }
      
      // Filter by status if provided
      if (status && typeof status === 'string') {
        loads = loads.filter(load => load.status === status);
      }
      
      // Filter by assigned user if provided
      if (assigned && typeof assigned === 'string') {
        const assignedId = parseInt(assigned, 10);
        if (!isNaN(assignedId)) {
          loads = loads.filter(load => load.assignedTo === assignedId);
        }
      }
      
      // Filter by lead ID if provided
      if (leadId && typeof leadId === 'string') {
        const leadIdNum = parseInt(leadId, 10);
        if (!isNaN(leadIdNum)) {
          loads = loads.filter(load => load.leadId === leadIdNum);
        }
      }
      
      res.json(loads);
    } catch (error) {
      next(error);
    }
  });

  loadRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const load = await storage.getLoad(Number(req.params.id));
      
      if (!load) {
        return res.status(404).json({ message: "Load not found" });
      }
      
      // Check if user has permission to view this load
      if (req.userRole.department === 'dispatch' || req.userRole.department === 'admin') {
        if (req.userRole.level === 1 && load.assignedTo !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You can only view your own loads" });
        }
      }
      
      res.json(load);
    } catch (error) {
      next(error);
    }
  });

  loadRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Ensure user is in dispatch department or admin
      if (req.userRole.department !== 'dispatch' && req.userRole.department !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Only dispatch department can create loads" });
      }
      
      const loadData = insertLoadSchema.parse({
        ...req.body,
        orgId: req.orgId // Add organization ID from the request context
      });
      
      // Verify lead exists and is active
      const lead = await storage.getLead(loadData.leadId);
      if (!lead) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }
      
      if (lead.status !== 'Active') {
        return res.status(400).json({ message: "Cannot create load for inactive lead" });
      }
      
      const load = await storage.createLoad(loadData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'load',
        entityId: load.id,
        action: 'created',
        details: `Created load from ${load.origin} to ${load.destination}`
      });
      
      // Send notification through multiple channels
      notificationService.sendLoadNotification(
        load.id,
        'created',
        true
      ).catch(err => console.error('Error sending load notification:', err));
      
      res.status(201).json(load);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  loadRouter.patch("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Ensure user is in dispatch department or admin
      if (req.userRole.department !== 'dispatch' && req.userRole.department !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Only dispatch department can update loads" });
      }
      
      const loadId = Number(req.params.id);
      const load = await storage.getLoad(loadId);
      
      if (!load) {
        return res.status(404).json({ message: "Load not found" });
      }
      
      // Check if user has permission to update this load
      if (req.userRole.level === 1 && load.assignedTo !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You can only update your own loads" });
      }
      
      const updatedLoad = await storage.updateLoad(loadId, req.body);
      
      // Log the activity
      if (req.body.status && req.body.status !== load.status) {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'load',
          entityId: loadId,
          action: 'status_changed',
          details: `Changed load status from ${load.status} to ${req.body.status}`
        });
        
        // Send notification through multiple channels for status change
        notificationService.sendLoadNotification(
          load.id,
          'status_changed',
          true
        ).catch(err => console.error('Error sending load status notification:', err));
        
        // If status changed to 'delivered', trigger invoice creation logic
        if (req.body.status === 'delivered') {
          // This would normally be more complex, possibly creating an invoice
          // or adding this load to a pending invoice
        }
      } else {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'load',
          entityId: loadId,
          action: 'updated',
          details: `Updated load information`
        });
      }
      
      res.json(updatedLoad);
    } catch (error) {
      next(error);
    }
  });

  // Dispatch Client routes
  // Load routes for dispatch module
  const dispatchLoadRouter = express.Router();
  app.use("/api/dispatch/loads", dispatchLoadRouter);

  // GET loads
  dispatchLoadRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Fetch loads based on organization and user role
      const loads = await storage.getLoads(req.orgId);
      res.json(loads || []);
    } catch (error) {
      console.error("Error fetching dispatch loads:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch loads",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET a specific load
  dispatchLoadRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const loadId = Number(req.params.id);
      const load = await storage.getLoad(loadId);
      
      if (!load) {
        return res.status(404).json({ 
          status: "error", 
          message: "Load not found" 
        });
      }
      
      res.json(load);
    } catch (error) {
      console.error("Error fetching specific load:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch load details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create a new load
  dispatchLoadRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const loadData = {
        ...req.body,
        createdBy: req.user.id,
        orgId: req.orgId
      };
      
      const newLoad = await storage.createLoad(loadData);
      res.status(201).json(newLoad);
    } catch (error) {
      console.error("Error creating load:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to create load",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update a load
  dispatchLoadRouter.patch("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const loadId = Number(req.params.id);
      const load = await storage.getLoad(loadId);
      
      if (!load) {
        return res.status(404).json({ 
          status: "error", 
          message: "Load not found" 
        });
      }
      
      const updatedLoad = await storage.updateLoad(loadId, {
        ...req.body,
        updatedBy: req.user.id
      });
      
      res.json(updatedLoad);
    } catch (error) {
      console.error("Error updating load:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to update load",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Tracking endpoint for dispatch
  const trackingRouter = express.Router();
  app.use("/api/dispatch/tracking", trackingRouter);

  trackingRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Return empty array for now - tracking data would be implementation-specific
      // Use a structured response format for consistency
      res.status(200).json({
        status: "success",
        data: []
      });
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch tracking data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  trackingRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const trackingId = req.params.id;
      
      // Return empty object for now - tracking implementation would be specific
      // Use consistent response format with status and data fields
      res.status(200).json({
        status: "success",
        data: {
          id: trackingId,
          status: "in_transit"
        }
      });
    } catch (error) {
      console.error("Error fetching specific tracking:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch tracking details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Dispatch client routes
  const dispatchClientRouter = express.Router();
  app.use("/api/dispatch/clients", dispatchClientRouter);
  
  dispatchClientRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      let clients = await storage.getDispatchClients();
      
      // Load the associated lead data for each client
      const clientsWithLeads = await Promise.all(
        clients.map(async (client) => {
          const lead = await storage.getLead(client.leadId);
          return {
            ...client,
            lead
          };
        })
      );
      
      // Return a structured JSON response
      res.status(200).json({
        status: "success",
        data: clientsWithLeads || []
      });
    } catch (error) {
      console.error("Error fetching dispatch clients:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch dispatch clients",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  dispatchClientRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const client = await storage.getDispatchClient(Number(req.params.id));
      
      if (!client) {
        return res.status(404).json({ 
          status: "error", 
          message: "Dispatch client not found" 
        });
      }
      
      // Get the associated lead
      const lead = await storage.getLead(client.leadId);
      
      // Get loads for this client
      const loads = await storage.getLoadsByLead(client.leadId);
      
      // Return with consistent response format
      res.status(200).json({
        status: "success",
        data: {
          ...client,
          lead,
          loads
        }
      });
    } catch (error) {
      console.error("Error fetching specific dispatch client:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch dispatch client details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  dispatchClientRouter.post("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const clientData = insertDispatchClientSchema.parse(req.body);
      
      // Check if lead exists
      const lead = await storage.getLead(clientData.leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Check if a dispatch client already exists for this lead
      const existingClient = await storage.getDispatchClientByLeadId(clientData.leadId);
      if (existingClient) {
        return res.status(400).json({ message: "A dispatch client already exists for this lead" });
      }
      
      const client = await storage.createDispatchClient(clientData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'dispatch_client',
        entityId: client.id,
        action: 'created',
        details: `Created dispatch client for lead ${lead.companyName}`
      });
      
      // Send notification
      await notificationService.sendDispatchNotification(
        client.id,
        'created',
        {
          userId: req.user.id,
          userName: `${req.user.firstName} ${req.user.lastName}`,
          leadId: clientData.leadId,
          companyName: lead.companyName
        }
      );
      
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });
  
  dispatchClientRouter.patch("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const clientId = Number(req.params.id);
      const client = await storage.getDispatchClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Dispatch client not found" });
      }
      
      // Get the lead for notifications
      const lead = await storage.getLead(client.leadId);
      
      // Check if status is being updated
      const isStatusChange = req.body.status && req.body.status !== client.status;
      
      // Update the client
      const updatedClient = await storage.updateDispatchClient(clientId, req.body);
      
      // Log the appropriate activity
      if (isStatusChange) {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'dispatch_client',
          entityId: clientId,
          action: 'status_changed',
          details: `Changed dispatch client status from ${client.status} to ${req.body.status}`
        });
        
        // Send notification for status change
        await notificationService.sendDispatchNotification(
          clientId,
          'status_changed',
          {
            userId: req.user.id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            leadId: client.leadId,
            companyName: lead.companyName
          }
        );
        
        // If client is being activated from pending, perform additional setup
        if (client.status === 'pending_onboard' && req.body.status === 'active') {
          // Additional setup could go here (e.g., creating default settings)
          console.log(`Activated dispatch client ${clientId} - performing setup`);
        }
      } else {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'dispatch_client',
          entityId: clientId,
          action: 'updated',
          details: `Updated dispatch client information`
        });
        
        // Send notification for general update
        await notificationService.sendDispatchNotification(
          clientId,
          'updated',
          {
            userId: req.user.id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            leadId: client.leadId,
            companyName: lead.companyName
          }
        );
      }
      
      res.json(updatedClient);
    } catch (error) {
      next(error);
    }
  });

  // Invoice routes
  const invoiceRouter = express.Router();
  app.use("/api/invoices", invoiceRouter);

  invoiceRouter.get("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      // Get pagination parameters from query
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = (page - 1) * limit;
      
      // Get all invoices first
      const allInvoices = await storage.getInvoices();
      
      // Enrich invoices with client names for frontend display
      const enrichedInvoices = await Promise.all(
        allInvoices.map(async (invoice) => {
          // Get the lead (client) data for the invoice
          const lead = await storage.getLead(invoice.leadId);
          return {
            ...invoice,
            clientName: lead ? `${lead.companyName}` : `Client ${invoice.leadId}`
          };
        })
      );
      
      // Apply pagination
      const paginatedInvoices = enrichedInvoices.slice(offset, offset + limit);
      
      // Add pagination metadata
      res.json({
        data: paginatedInvoices,
        pagination: {
          total: allInvoices.length,
          page,
          limit,
          pages: Math.ceil(allInvoices.length / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
      next(error);
    }
  });

  invoiceRouter.get("/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const invoice = await storage.getInvoice(Number(req.params.id));
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get the invoice items
      const items = await storage.getInvoiceItemsByInvoice(invoice.id);
      
      // Get the lead (client) data for the invoice
      const lead = await storage.getLead(invoice.leadId);
      
      res.json({
        ...invoice,
        clientName: lead ? `${lead.companyName}` : `Client ${invoice.leadId}`,
        items
      });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      next(error);
    }
  });

  invoiceRouter.post("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const invoiceData = insertInvoiceSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      // Verify the lead exists
      const lead = await storage.getLead(invoiceData.leadId);
      if (!lead) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }
      
      const invoice = await storage.createInvoice(invoiceData);
      
      // Create invoice items if provided
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          await storage.createInvoiceItem({
            ...item,
            invoiceId: invoice.id
          });
        }
      }
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'invoice',
        entityId: invoice.id,
        action: 'created',
        details: `Created invoice #${invoice.invoiceNumber} for $${invoice.totalAmount}`
      });
      
      // Get the created invoice items
      const items = await storage.getInvoiceItemsByInvoice(invoice.id);
      
      res.status(201).json({
        ...invoice,
        items
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  invoiceRouter.patch("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const invoiceId = Number(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, req.body);
      
      // Log the activity
      if (req.body.status && req.body.status !== invoice.status) {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'invoice',
          entityId: invoiceId,
          action: 'status_changed',
          details: `Changed invoice status from ${invoice.status} to ${req.body.status}`
        });
        
        // If status changed to 'paid', trigger commission calculation
        if (req.body.status === 'paid') {
          // This would normally trigger commission calculation
          // based on the invoice details
        }
      } else {
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'invoice',
          entityId: invoiceId,
          action: 'updated',
          details: `Updated invoice information`
        });
      }
      
      // Get the invoice items
      const items = await storage.getInvoiceItemsByInvoice(invoiceId);
      
      res.json({
        ...updatedInvoice,
        items
      });
    } catch (error) {
      next(error);
    }
  });

  // Commission routes
  const commissionRouter = express.Router();
  app.use("/api/commissions", commissionRouter);
  
  // Admin commission routes
  const adminCommissionRouter = express.Router();
  app.use("/api/admin/commissions", adminCommissionRouter);
  
  // Get top commission earners for admin dashboard
  adminCommissionRouter.get("/top-earners", createAuthMiddleware(4), async (req, res, next) => {
    try {
      // Get query parameters
      const type = req.query.type as string || 'all';
      const month = req.query.month as string || new Date().toISOString().slice(0, 7); // Format: YYYY-MM
      const limit = parseInt(req.query.limit as string || '5');
      
      // Get top commission earners
      const commissions = await storage.getTopCommissionEarners({
        orgId: req.user.orgId || 1,
        month,
        limit,
        type: type === 'all' ? undefined : type as 'sales' | 'dispatch'
      });
      
      // Get previous month for comparison
      const [year, monthNum] = month.split('-').map(Number);
      const prevDate = new Date(year, monthNum - 2, 1); // -2 because months are 0-indexed
      const prevMonth = prevDate.toISOString().slice(0, 7);
      
      // Get previous month commissions for comparison
      const prevCommissions = await storage.getTopCommissionEarners({
        orgId: req.user.orgId || 1,
        month: prevMonth,
        limit: 50, // Get more to ensure we can match all current users
        type: type === 'all' ? undefined : type as 'sales' | 'dispatch'
      });
      
      // Add previous month amounts for trending indicators
      const result = commissions.map(comm => {
        const prevComm = prevCommissions.find(pc => pc.userId === comm.userId);
        return {
          ...comm,
          previousAmount: prevComm ? prevComm.amount : undefined
        };
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  commissionRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      let commissions;
      
      // If the user is a rep, only show their own commissions
      if (req.userRole?.level === 1) {
        commissions = await storage.getCommissionsByUser(req.user?.id || 0);
      } else {
        // Managers and above can see all commissions
        commissions = await storage.getCommissions();
      }
      
      // Return a structured JSON response
      res.status(200).json({
        status: "success",
        data: commissions || []
      });
    } catch (error) {
      console.error("Error fetching commissions:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch commissions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  commissionRouter.get("/user/:userId", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      
      // Check if requesting user has permission
      if (req.userRole.level === 1 && req.user.id !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only view your own commissions" });
      }
      
      const commissions = await storage.getCommissionsByUser(userId);
      res.json(commissions);
    } catch (error) {
      next(error);
    }
  });

  // Commission Policy routes
  
  // Get all commission policies
  commissionRouter.get("/policy", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const policies = await storage.getCommissionPolicies();
      res.json(policies);
    } catch (error) {
      console.error("Error fetching commission policies:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch commission policies",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get a specific commission policy
  commissionRouter.get("/policy/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const policy = await storage.getCommissionPolicy(id);
      
      if (!policy) {
        return res.status(404).json({ 
          status: "error", 
          message: "Commission policy not found" 
        });
      }
      
      res.json(policy);
    } catch (error) {
      console.error("Error fetching commission policy:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch commission policy",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Create commission policy
  commissionRouter.post("/policy", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const policyData = {
        ...req.body,
        orgId: req.user.orgId || 1,
        createdBy: req.user.id,
        updatedBy: req.user.id
      };
      
      const policy = await storage.createCommissionPolicy(policyData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: "commission_policy",
        entityId: policy.id,
        action: "created",
        details: `Commission policy created: ${req.body.type}`
      });
      
      res.status(201).json(policy);
    } catch (error) {
      console.error("Error creating commission policy:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to create commission policy",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Update commission policy
  commissionRouter.put("/policy/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      
      // Make sure the policy exists
      const existingPolicy = await storage.getCommissionPolicy(id);
      if (!existingPolicy) {
        return res.status(404).json({ 
          status: "error", 
          message: "Commission policy not found" 
        });
      }
      
      const policyData = {
        ...req.body,
        updatedBy: req.user.id
      };
      
      const policy = await storage.updateCommissionPolicy(id, policyData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: "commission_policy",
        entityId: id,
        action: "updated",
        details: `Commission policy updated: ${existingPolicy.type}`
      });
      
      res.json(policy);
    } catch (error) {
      console.error("Error updating commission policy:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to update commission policy",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Archive commission policy
  commissionRouter.patch("/policy/:id/archive", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      
      // Make sure the policy exists
      const existingPolicy = await storage.getCommissionPolicy(id);
      if (!existingPolicy) {
        return res.status(404).json({ 
          status: "error", 
          message: "Commission policy not found" 
        });
      }
      
      // Archive the policy
      const archivedPolicy = await storage.archiveCommissionPolicy(id, req.user?.id || 0);
      
      // Log activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: "commission_policy",
        entityId: id,
        action: "archived",
        details: `Commission policy archived: ${existingPolicy.type}`
      });
      
      res.json({ 
        status: "success", 
        message: "Commission policy archived successfully",
        policy: archivedPolicy
      });
    } catch (error) {
      console.error("Error archiving commission policy:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to archive commission policy",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  commissionRouter.post("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const commissionData = insertCommissionSchema.parse(req.body);
      
      // Verify the user exists
      const user = await storage.getUser(commissionData.userId);
      if (!user) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Verify the invoice exists
      const invoice = await storage.getInvoice(commissionData.invoiceId);
      if (!invoice) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const commission = await storage.createCommission(commissionData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'commission',
        entityId: commission.id,
        action: 'created',
        details: `Created ${commission.commissionType} commission for $${commission.amount}`
      });
      
      res.status(201).json(commission);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  // UI Preferences routes
  const uiPreferencesRouter = express.Router();
  app.use("/api/ui-prefs", uiPreferencesRouter);
  
  // Dispatch automation routes
  const dispatchTasksRouter = express.Router();
  const dispatchReportsRouter = express.Router();
  const performanceTargetsRouter = express.Router();
  
  app.use("/api/dispatch/tasks", dispatchTasksRouter);
  app.use("/api/dispatch/reports", dispatchReportsRouter);
  app.use("/api/performance-targets", performanceTargetsRouter);

  // Get user UI preferences
  uiPreferencesRouter.get("/me", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      
      // Get user preferences (will return default if table doesn't exist)
      const prefs = await storage.getUserPreferences(userId);
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching UI preferences:", error);
      // Return default preferences even on error
      if (req.user) {
        res.json({
          id: 0,
          userId: req.user.id,
          sidebarPinned: true,
          sidebarCollapsed: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        next(error);
      }
    }
  });

  // Update UI preferences
  uiPreferencesRouter.patch("/me", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const updates = req.body;
      
      // The updateUserPreferences method now handles everything
      // It will create new preferences if they don't exist or
      // update existing ones if they do exist
      const updatedPrefs = await storage.updateUserPreferences(userId, {
        ...updates
      });

      // Emit socket event for real-time updates
      io.emit("uiPrefsUpdated", updatedPrefs);
      
      res.json(updatedPrefs);
    } catch (error) {
      next(error);
    }
  });
  
  // For backwards compatibility (temporary)
  app.use("/api/ui-preferences", uiPreferencesRouter);
  
  // Dispatch Tasks Routes
  dispatchTasksRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      let tasks;
      if (req.query.dispatcherId) {
        tasks = await storage.getDispatchTasksByDispatcher(Number(req.query.dispatcherId));
      } else if (req.query.date) {
        tasks = await storage.getDispatchTasksByDate(new Date(String(req.query.date)));
      } else {
        // Return current user's tasks if no query parameters are provided
        tasks = await storage.getDispatchTasksByDispatcher(req.user.id);
      }
      
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });
  
  dispatchTasksRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const task = await storage.getDispatchTask(Number(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      next(error);
    }
  });
  
  dispatchTasksRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const taskData = {
        ...req.body,
        dispatcherId: req.body.dispatcherId || req.user.id,
        orgId: req.body.orgId || req.user.orgId
      };
      
      const newTask = await storage.createDispatchTask(taskData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        action: 'create',
        entityType: 'dispatch_task',
        entityId: newTask.id,
        details: JSON.stringify(newTask)
      });
      
      // Send real-time notification to relevant users
      io.emit('dispatch-task-created', newTask);
      
      res.status(201).json(newTask);
    } catch (error) {
      next(error);
    }
  });
  
  dispatchTasksRouter.put("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const taskId = Number(req.params.id);
      const task = await storage.getDispatchTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Only allow updates if user is the task owner or an admin
      if (task.dispatcherId !== req.user.id && req.userRole?.department !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to update this task" });
      }
      
      const updatedTask = await storage.updateDispatchTask(taskId, req.body);
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        action: 'update',
        entityType: 'dispatch_task',
        entityId: taskId,
        details: JSON.stringify(updatedTask)
      });
      
      // Send real-time notification
      io.emit('dispatch-task-updated', updatedTask);
      
      // If the task is now submitted, create a notification for managers
      if (req.body.status === 'Submitted' && task.status === 'Pending') {
        // Find managers to notify
        const managers = await storage.getUsersByRole(8); // Head of Dispatch role id
        
        // Create notifications for each manager
        for (const manager of managers) {
          await storage.createNotification({
            userId: manager.id,
            type: 'dispatch_task_submitted',
            message: `Dispatch task submitted by ${req.user.firstName} ${req.user.lastName}`,
            entityType: 'dispatch_task',
            entityId: taskId,
            read: false
          });
          
          // Send real-time notification
          io.to(`user:${manager.id}`).emit('notification', {
            type: 'dispatch_task_submitted',
            message: `Dispatch task submitted by ${req.user.firstName} ${req.user.lastName}`,
            taskId
          });
        }
      }
      
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });
  
  // Dispatch Reports Routes
  dispatchReportsRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      let reports;
      if (req.query.dispatcherId) {
        reports = await storage.getDispatchReportsByDispatcher(Number(req.query.dispatcherId));
      } else if (req.query.date) {
        reports = await storage.getDispatchReportsByDate(new Date(String(req.query.date)));
      } else {
        // Return current user's reports if no query parameters are provided
        reports = await storage.getDispatchReportsByDispatcher(req.user.id);
      }
      
      res.json(reports);
    } catch (error) {
      next(error);
    }
  });
  
  // Generate a new dispatch report on demand
  dispatchReportsRouter.post("/generate", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // The dispatcher can generate reports for themselves or others if they're admins
      const dispatcherId = req.body.dispatcherId || req.user.id;
      
      // Check if user can generate for other dispatchers
      if (dispatcherId !== req.user.id && req.userRole?.level < 3) {
        return res.status(403).json({ 
          message: "You don't have permission to generate reports for other dispatchers" 
        });
      }
      
      // If date is provided, use it; otherwise use today
      const reportDate = req.body.date ? new Date(req.body.date) : new Date();
      
      // Generate the report
      const report = await storage.generateDailyDispatchReport(dispatcherId, reportDate);
      
      // Get user name if it's a different dispatcher
      let dispatcherName = `${req.user.firstName} ${req.user.lastName}`;
      if (dispatcherId !== req.user.id) {
        const dispatcher = await storage.getUser(dispatcherId);
        if (dispatcher) {
          dispatcherName = `${dispatcher.firstName} ${dispatcher.lastName}`;
        }
      }
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        action: 'generate',
        entityType: 'dispatch_report',
        entityId: report.id,
        details: `Generated dispatch report for ${dispatcherName}`
      });
      
      // Get performance target for context
      const target = await storage.getPerformanceTargetByOrgAndType(
        report.orgId, 
        'daily'
      );
      
      // Optional: send report to Slack if sendToSlack is true in request
      if (req.body.sendToSlack) {
        const { sendDailyDispatchReportToSlack } = await import('./slack');
        await sendDailyDispatchReportToSlack(
          report,
          dispatcherName,
          target?.minPct || undefined
        );
      }
      
      res.status(201).json({
        report,
        message: "Report generated successfully"
      });
    } catch (error) {
      console.error('Error generating dispatch report:', error);
      next(error);
    }
  });
  
  dispatchReportsRouter.get("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const report = await storage.getDispatchReport(Number(req.params.id));
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  // Generate and send daily summary report to Slack
  dispatchReportsRouter.post("/generate-summary", createAuthMiddleware(3), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // The date to generate a summary for - defaults to today
      const summaryDate = req.body.date ? new Date(req.body.date) : new Date();
      
      // Get all dispatchers
      const dispatchers = await storage.getUsersByDepartment('dispatch');
      
      if (dispatchers.length === 0) {
        return res.status(404).json({ message: "No dispatchers found" });
      }
      
      const reportsData = [];
      
      // Generate or get reports for each dispatcher
      for (const dispatcher of dispatchers) {
        try {
          // Use existing report or generate a new one
          let report = await storage.getDispatchReportByDispatcherAndDate(
            dispatcher.id, 
            summaryDate
          );
          
          if (!report) {
            report = await storage.generateDailyDispatchReport(
              dispatcher.id, 
              summaryDate
            );
          }
          
          // Add to collection with dispatcher name
          reportsData.push({
            report,
            dispatcherName: `${dispatcher.firstName} ${dispatcher.lastName}`
          });
        } catch (error) {
          console.error(`Error generating report for dispatcher ${dispatcher.id}:`, error);
        }
      }
      
      if (reportsData.length === 0) {
        return res.status(500).json({ message: "Failed to generate any reports" });
      }
      
      // Send summary to Slack
      const { sendDailyDispatchSummaryToSlack } = await import('./slack');
      const result = await sendDailyDispatchSummaryToSlack(reportsData);
      
      // Format the date using date-fns
      const formatDate = (await import('date-fns')).format;
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        action: 'generate_summary',
        entityType: 'dispatch_report',
        entityId: 0, // No specific entity ID for summary
        details: `Generated and sent dispatch summary report to Slack for ${formatDate(summaryDate, 'yyyy-MM-dd')}`
      });
      
      res.status(200).json({
        success: !!result,
        reportCount: reportsData.length,
        message: result ? "Summary report sent to Slack" : "Failed to send summary to Slack"
      });
    } catch (error) {
      console.error('Error generating summary report:', error);
      next(error);
    }
  });
  
  dispatchReportsRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const reportData = {
        ...req.body,
        dispatcherId: req.body.dispatcherId || req.user.id,
        orgId: req.body.orgId || req.user.orgId
      };
      
      const newReport = await storage.createDispatchReport(reportData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        action: 'create',
        entityType: 'dispatch_report',
        entityId: newReport.id,
        details: JSON.stringify(newReport)
      });
      
      // Get performance targets to check against
      const performanceTarget = await storage.getPerformanceTargetByOrgAndType(newReport.orgId, 'daily');
      
      // Send real-time notification to relevant users
      io.emit('dispatch-report-created', newReport);
      
      // Create color-coded performance notifications if targets are set
      if (performanceTarget) {
        // Calculate performance percentages based on targets
        const loadsTarget = performanceTarget.minPct; // Use minPct as baseline for loads booked
        const invoiceTarget = performanceTarget.maxPct; // Use maxPct as goal for invoice amounts
        
        // Check if we need to send performance alerts
        if (newReport.loadsBooked < loadsTarget) {
          // Red alert - below minimum target for loads booked
          io.to(`user:${newReport.dispatcherId}`).emit('performance-alert', {
            type: 'below_target',
            message: `Performance Alert: Loads booked (${newReport.loadsBooked}) below daily target of ${loadsTarget}`,
            color: '#C93131', // Red color for negative alerts
            metric: 'loadsBooked',
            value: newReport.loadsBooked,
            target: loadsTarget
          });
          
          // Create notification
          await storage.createNotification({
            userId: newReport.dispatcherId,
            type: 'performance_alert',
            message: `Performance Alert: Loads booked (${newReport.loadsBooked}) below daily target of ${loadsTarget}`,
            entityType: 'dispatch_report',
            entityId: newReport.id,
            read: false,
            metadata: JSON.stringify({
              color: '#C93131',
              metric: 'loadsBooked',
              value: newReport.loadsBooked,
              target: loadsTarget
            })
          });
        } else if (newReport.loadsBooked >= performanceTarget.maxPct) {
          // Green alert - exceeded target for loads booked
          io.to(`user:${newReport.dispatcherId}`).emit('performance-alert', {
            type: 'above_target',
            message: `Great job! Loads booked (${newReport.loadsBooked}) exceeded daily target of ${performanceTarget.maxPct}`,
            color: '#2EC4B6', // Green color for positive alerts
            metric: 'loadsBooked',
            value: newReport.loadsBooked,
            target: performanceTarget.maxPct
          });
          
          // Create notification
          await storage.createNotification({
            userId: newReport.dispatcherId,
            type: 'performance_achievement',
            message: `Great job! Loads booked (${newReport.loadsBooked}) exceeded daily target of ${performanceTarget.maxPct}`,
            entityType: 'dispatch_report',
            entityId: newReport.id,
            read: false,
            metadata: JSON.stringify({
              color: '#2EC4B6',
              metric: 'loadsBooked',
              value: newReport.loadsBooked,
              target: performanceTarget.maxPct
            })
          });
        }
        
        // Check invoice amounts against targets
        if (newReport.invoiceUsd < invoiceTarget) {
          // Red alert - below invoice target
          io.to(`user:${newReport.dispatcherId}`).emit('performance-alert', {
            type: 'below_target',
            message: `Performance Alert: Invoice amount ($${newReport.invoiceUsd}) below daily target of $${invoiceTarget}`,
            color: '#C93131', // Red color for negative alerts
            metric: 'invoiceUsd',
            value: newReport.invoiceUsd,
            target: invoiceTarget
          });
          
          // Create notification
          await storage.createNotification({
            userId: newReport.dispatcherId,
            type: 'performance_alert',
            message: `Performance Alert: Invoice amount ($${newReport.invoiceUsd}) below daily target of $${invoiceTarget}`,
            entityType: 'dispatch_report',
            entityId: newReport.id,
            read: false,
            metadata: JSON.stringify({
              color: '#C93131',
              metric: 'invoiceUsd',
              value: newReport.invoiceUsd,
              target: invoiceTarget
            })
          });
        } else if (newReport.invoiceUsd >= performanceTarget.maxPct) {
          // Green alert - exceeded invoice target
          io.to(`user:${newReport.dispatcherId}`).emit('performance-alert', {
            type: 'above_target',
            message: `Great job! Invoice amount ($${newReport.invoiceUsd}) exceeded daily target of $${performanceTarget.maxPct}`,
            color: '#2EC4B6', // Green color for positive alerts
            metric: 'invoiceUsd',
            value: newReport.invoiceUsd,
            target: performanceTarget.maxPct
          });
          
          // Create notification
          await storage.createNotification({
            userId: newReport.dispatcherId,
            type: 'performance_achievement',
            message: `Great job! Invoice amount ($${newReport.invoiceUsd}) exceeded daily target of $${performanceTarget.maxPct}`,
            entityType: 'dispatch_report',
            entityId: newReport.id,
            read: false,
            metadata: JSON.stringify({
              color: '#2EC4B6',
              metric: 'invoiceUsd',
              value: newReport.invoiceUsd,
              target: performanceTarget.maxPct
            })
          });
        }
      }
      
      res.status(201).json(newReport);
    } catch (error) {
      next(error);
    }
  });
  
  dispatchReportsRouter.put("/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const reportId = Number(req.params.id);
      const report = await storage.getDispatchReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      // Only allow updates if user is the report owner or an admin
      if (report.dispatcherId !== req.user.id && req.userRole?.department !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to update this report" });
      }
      
      const updatedReport = await storage.updateDispatchReport(reportId, req.body);
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        action: 'update',
        entityType: 'dispatch_report',
        entityId: reportId,
        details: JSON.stringify(updatedReport)
      });
      
      // Send real-time notification
      io.emit('dispatch-report-updated', updatedReport);
      
      // If the report is now submitted, create a notification for managers
      if (req.body.status === 'Submitted' && report.status === 'Pending') {
        // Find managers to notify
        const managers = await storage.getUsersByRole(8); // Head of Dispatch role id
        
        // Create notifications for each manager
        for (const manager of managers) {
          await storage.createNotification({
            userId: manager.id,
            type: 'dispatch_report_submitted',
            message: `Dispatch report submitted by ${req.user.firstName} ${req.user.lastName}`,
            entityType: 'dispatch_report',
            entityId: reportId,
            read: false
          });
          
          // Send real-time notification
          io.to(`user:${manager.id}`).emit('notification', {
            type: 'dispatch_report_submitted',
            message: `Dispatch report submitted by ${req.user.firstName} ${req.user.lastName}`,
            reportId
          });
        }
      }
      
      res.json(updatedReport);
    } catch (error) {
      next(error);
    }
  });
  
  // Performance Targets Routes
  performanceTargetsRouter.get("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only allow admin or manager access to performance targets
      if (req.userRole?.level < 3) {
        return res.status(403).json({ message: "Access denied: Insufficient permissions" });
      }
      
      let targets;
      if (req.query.type) {
        targets = await storage.getPerformanceTargetsByType(req.query.type as 'daily' | 'weekly');
      } else if (req.query.orgId) {
        const orgId = Number(req.query.orgId);
        const type = (req.query.type as 'daily' | 'weekly') || 'daily';
        const target = await storage.getPerformanceTargetByOrgAndType(orgId, type);
        return res.json(target || null);
      } else {
        // Get all targets for the current user's organization
        const orgId = req.user.orgId;
        if (!orgId) {
          return res.status(400).json({ message: "User is not associated with an organization" });
        }
        
        const dailyTarget = await storage.getPerformanceTargetByOrgAndType(orgId, 'daily');
        const weeklyTarget = await storage.getPerformanceTargetByOrgAndType(orgId, 'weekly');
        
        return res.json({
          daily: dailyTarget || null,
          weekly: weeklyTarget || null
        });
      }
      
      res.json(targets);
    } catch (error) {
      next(error);
    }
  });
  
  performanceTargetsRouter.post("/", createAuthMiddleware(4), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only allow admin or manager access to create performance targets
      if (req.userRole?.level < 4) {
        return res.status(403).json({ message: "Access denied: Insufficient permissions" });
      }
      
      const targetData = {
        ...req.body,
        orgId: req.body.orgId || req.user.orgId
      };
      
      if (!targetData.orgId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }
      
      // Check if a target for this org and type already exists
      const existingTarget = await storage.getPerformanceTargetByOrgAndType(
        targetData.orgId, 
        targetData.type
      );
      
      if (existingTarget) {
        // Update existing target instead of creating a new one
        const updatedTarget = await storage.updatePerformanceTarget(existingTarget.id, targetData);
        return res.json(updatedTarget);
      }
      
      const newTarget = await storage.createPerformanceTarget(targetData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        action: 'create',
        entityType: 'performance_target',
        entityId: newTarget.id,
        details: JSON.stringify(newTarget)
      });
      
      // Notify all users in the organization about the new performance targets
      const orgUsers = await storage.getUsersByOrganization(targetData.orgId);
      for (const user of orgUsers) {
        io.to(`user:${user.id}`).emit('performance-target-updated', {
          type: targetData.type,
          minPct: newTarget.minPct,
          maxPct: newTarget.maxPct
        });
      }
      
      res.status(201).json(newTarget);
    } catch (error) {
      next(error);
    }
  });
  
  performanceTargetsRouter.put("/:id", createAuthMiddleware(4), async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only allow admin or manager access to update performance targets
      if (req.userRole?.level < 4) {
        return res.status(403).json({ message: "Access denied: Insufficient permissions" });
      }
      
      const targetId = Number(req.params.id);
      const target = await storage.getPerformanceTarget(targetId);
      
      if (!target) {
        return res.status(404).json({ message: "Performance target not found" });
      }
      
      const updatedTarget = await storage.updatePerformanceTarget(targetId, req.body);
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        action: 'update',
        entityType: 'performance_target',
        entityId: targetId,
        details: JSON.stringify(updatedTarget)
      });
      
      // Notify all users in the organization about the updated performance targets
      const orgUsers = await storage.getUsersByOrganization(target.orgId);
      for (const user of orgUsers) {
        io.to(`user:${user.id}`).emit('performance-target-updated', {
          type: updatedTarget!.type,
          minPct: updatedTarget!.minPct,
          maxPct: updatedTarget!.maxPct
        });
      }
      
      res.json(updatedTarget);
    } catch (error) {
      next(error);
    }
  });

  // Activity routes
  const activityRouter = express.Router();
  app.use("/api/activities", activityRouter);
  
  // Notification settings routes
  const notificationSettingsRouter = express.Router();
  app.use("/api/notification-settings", notificationSettingsRouter);
  
  // Lead notifications routes
  const leadNotificationsRouter = express.Router();
  app.use("/api/notifications/leads", leadNotificationsRouter);
  
  // Get lead notifications for a user
  leadNotificationsRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const userId = req.user.id;
      const role = req.userRole;
      const rangeParam = req.query.range as string || '30d'; // Default to 30 days
      
      // Parse range parameter for date filtering
      let daysAgo = 30;
      if (rangeParam.endsWith('d')) {
        daysAgo = parseInt(rangeParam.replace('d', ''));
      }
      
      // Calculate the date 'daysAgo' days ago
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      // Initialize result structure
      const result = {
        assigned: [],
        followUp: [],
        inactive: [],
        statusChanges: []
      };
      
      // Determine which leads to fetch based on role level instead of department
      let leads;
      if (role.level >= 4 || req.user.can_access_all_orgs) {
        // Admins or higher-level roles can see all leads
        leads = await storage.getLeads();
      } else {
        // Regular users see only their assigned leads
        leads = await storage.getLeadsByAssignee(userId);
      }
      
      if (leads.length > 0) {
        const now = new Date();
        
        // Filter for each category
        
        // 1. Assigned Leads: assigned to current user and with status New or HandToDispatch in last 3 days
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(now.getDate() - 3);
        
        result.assigned = leads.filter(lead => 
          lead.assignedTo === userId &&
          (lead.status === 'New' || lead.status === 'HandToDispatch') &&
          new Date(lead.createdAt) >= threeDaysAgo
        );
        
        // 2. Follow-up: leads where last update was more than 7 days ago AND status is not Active/Lost
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        
        result.followUp = leads.filter(lead => 
          lead.status !== 'Active' && 
          lead.status !== 'Lost' &&
          new Date(lead.updatedAt) <= sevenDaysAgo
        );
        
        // 3. Inactive: leads with status InProgress or HandToDispatch with no updates in 10+ days
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(now.getDate() - 10);
        
        result.inactive = leads.filter(lead => 
          (lead.status === 'InProgress' || lead.status === 'HandToDispatch') &&
          new Date(lead.updatedAt) <= tenDaysAgo
        );
        
        // 4. Status Changes: leads with status change in last 2 days
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(now.getDate() - 2);
        
        // For status changes, we need to query lead activities or remarks
        const recentActivities = await storage.getActivitiesByEntityType('lead', twoDaysAgo);
        const statusChangeActivities = recentActivities.filter(activity => 
          activity.action === 'status_changed'
        );
        
        const statusChangedLeadIds = statusChangeActivities.map(activity => activity.entityId);
        result.statusChanges = leads.filter(lead => statusChangedLeadIds.includes(lead.id));
      }
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Performance metrics routes
  const performanceRouter = express.Router();
  app.use("/api/dispatch/performance", performanceRouter);
  
  // Get performance metrics for a specific range (daily/weekly)
  performanceRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const range = req.query.range as string || 'daily';
      
      if (range !== 'daily' && range !== 'weekly') {
        return res.status(400).json({ message: "Invalid range parameter. Use 'daily' or 'weekly'." });
      }
      
      const userId = req.user?.id;
      
      // Get user's reports
      let reports;
      if (req.userRole?.level >= 4 && req.query.userId) {
        // Admins and team leads can view reports for specific users
        reports = await storage.getDispatchReportsByDispatcher(Number(req.query.userId));
      } else if (req.userRole?.level >= 4 && !req.query.userId) {
        // Admins and team leads see all reports by default
        reports = await storage.getDispatchReports();
      } else {
        // Regular users only see their own reports
        reports = await storage.getDispatchReportsByDispatcher(userId);
      }
      
      // Get performance targets for the requested range
      const targets = await storage.getPerformanceTargets(range);
      const target = targets[0];
      
      // Calculate averages and totals
      const result = {
        range,
        targets: target || null,
        metrics: {
          totalLoads: 0,
          totalInvoice: 0,
          totalLeads: 0,
          averageLoadsPerDay: 0,
          averageInvoicePerDay: 0,
          averageLeadsPerDay: 0,
          daysAboveTarget: 0,
          daysBelowTarget: 0
        },
        dailyData: [] as any[]
      };
      
      if (reports && reports.length > 0) {
        // Calculate metrics
        result.metrics.totalLoads = reports.reduce((sum, r) => sum + r.loadsBooked, 0);
        result.metrics.totalInvoice = reports.reduce((sum, r) => sum + r.invoiceUsd, 0);
        result.metrics.totalLeads = reports.reduce((sum, r) => sum + r.newLeads, 0);
        result.metrics.averageLoadsPerDay = result.metrics.totalLoads / reports.length;
        result.metrics.averageInvoicePerDay = result.metrics.totalInvoice / reports.length;
        result.metrics.averageLeadsPerDay = result.metrics.totalLeads / reports.length;
        
        if (target) {
          result.metrics.daysAboveTarget = reports.filter(r => r.loadsBooked >= target.minPct).length;
          result.metrics.daysBelowTarget = reports.filter(r => r.loadsBooked < target.minPct).length;
        }
        
        // Format daily data for charts
        result.dailyData = reports.map(r => ({
          date: r.date,
          loads: r.loadsBooked,
          invoice: r.invoiceUsd,
          leads: r.newLeads,
          status: r.status,
          isAboveLoadTarget: target ? r.loadsBooked >= target.minPct : null,
          isAboveInvoiceTarget: target ? r.invoiceUsd >= target.maxPct : null
        }));
      }
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Store notification settings in memory since we aren't using a DB yet
  const userNotificationSettings = new Map<number, NotificationPreferences>();
  
  // Get user notification settings
  notificationSettingsRouter.get("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Get user's notification settings or return defaults
      const settings = userNotificationSettings.get(userId) || defaultNotificationPreferences;
      
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });
  
  // Update user notification settings
  notificationSettingsRouter.post("/", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const userId = req.user.id;
      const settings = req.body as NotificationPreferences;
      
      // Validate the settings
      if (typeof settings !== 'object') {
        return res.status(400).json({ message: "Invalid notification settings format" });
      }
      
      // Save the settings
      userNotificationSettings.set(userId, settings);
      
      // Log activity
      await storage.createActivity({
        userId,
        entityType: 'user',
        entityId: userId,
        action: 'updated',
        details: 'Updated notification preferences'
      });
      
      res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  });

  activityRouter.get("/", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  activityRouter.get("/user/:userId", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      
      // Check if requesting user has permission
      if (req.userRole.level === 2 && req.user.id !== userId) {
        // In a real app, we would check if the userId belongs to the same team
        // For simplicity, we'll allow team leads to view any user's activities
      }
      
      const activities = await storage.getActivitiesByUser(userId, limit);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  activityRouter.get("/entity/:type/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const entityType = req.params.type;
      const entityId = Number(req.params.id);
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      
      const activities = await storage.getActivitiesByEntity(entityType, entityId, limit);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  // Admin commission routes handler
  adminCommissionRouter.post("/:type", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const type = req.params.type;
      if (type !== 'sales' && type !== 'dispatch') {
        return res.status(400).json({ message: "Invalid commission rule type" });
      }
      
      // Validate the tiers based on type
      const { tiers } = req.body;
      if (!Array.isArray(tiers) || tiers.length === 0) {
        return res.status(400).json({ message: "Tiers must be a non-empty array" });
      }
      
      // Validate tier structure based on type
      for (const tier of tiers) {
        if (typeof tier.min !== 'number' || typeof tier.max !== 'number') {
          return res.status(400).json({ message: "Each tier must have min and max values" });
        }
        
        if (type === 'sales') {
          if (typeof tier.active !== 'number' || typeof tier.inbound !== 'number') {
            return res.status(400).json({ 
              message: "Sales tiers must have active and inbound values" 
            });
          }
        } else if (type === 'dispatch') {
          if (typeof tier.pct !== 'number') {
            return res.status(400).json({ 
              message: "Dispatch tiers must have a percentage value" 
            });
          }
        }
      }
      
      // Create a new commission rule
      const rule = await storage.createCommissionRule({
        type,
        orgId: req.user?.orgId || 1, // Default to org 1 if not available
        tiers,
        updatedBy: req.user?.id || 0
      });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'commission_rule',
        entityId: rule.id,
        action: 'updated',
        details: `Updated ${type} commission rules`
      });

      // Emit a socket event for real-time updates
      io.emit('commissionRulesUpdated', { type });
      
      res.status(201).json(rule);
    } catch (error) {
      next(error);
    }
  });

  // Import Admin router
  import adminRouter from './routes/admin';
  
  // Register the Admin router
  app.use('/api/admin', adminRouter);
  
  // Legacy Admin route - preserved for backward compatibility
  app.get("/api/admin-legacy", createAuthMiddleware(4), async (req, res, next) => {
    try {
      // Verify user level only, not department
      if (req.userRole?.level < 4) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      // Get system health metrics
      const systemHealth = {
        cpu: Math.floor(Math.random() * 40) + 20, // Random value between 20-60%
        memory: Math.floor(Math.random() * 30) + 30, // Random value between 30-60%
        disk: Math.floor(Math.random() * 30) + 50, // Random value between 50-80%
        network: Math.floor(Math.random() * 40) + 20, // Random value between 20-60%
        uptime: 99.98, // High uptime percentage
      };
      
      // Get security metrics
      const securityMetrics = {
        lastScan: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        vulnerabilities: 0,
        failedLogins: {
          count: 3,
          lastAttempt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        securityEvents: [
          {
            type: 'failed_login',
            user: 'sarah.johnson',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            details: 'Failed login attempt from IP 192.168.1.100'
          },
          {
            type: 'password_change',
            user: 'john.smith',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            details: 'Password changed successfully'
          },
          {
            type: 'security_scan',
            user: 'system',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            details: 'Scheduled security scan completed with 0 vulnerabilities'
          }
        ]
      };
      
      // Get users data
      const users = await storage.getUsers();
      
      // Get tasks data - simulated for now
      const tasks = [
        {
          id: 'task-1',
          name: 'Daily Database Backup',
          status: 'completed',
          lastRun: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'task-2',
          name: 'Data Synchronization',
          status: 'running',
          lastRun: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          progress: 78
        },
        {
          id: 'task-3',
          name: 'Weekly Analytics Report',
          status: 'scheduled',
          lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      // Get recent activities
      const activities = await storage.getActivities(10);
      
      res.json({
        systemHealth,
        securityMetrics,
        users: users.map((u: typeof users.$inferSelect) => ({
          id: u.id,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          roleId: u.roleId,
          active: u.active,
          lastActivity: activities.find(a => a.userId === u.id)?.timestamp || null
        })),
        tasks,
        activities
      });
    } catch (error) {
      next(error);
    }
  });

  // Generate invoices (for weekly or custom date range)
  app.post("/api/invoices/generate", createAuthMiddleware(4), async (req, res, next) => {
    try {
      // Get date range parameter
      const range = req.query.range as string || 'weekly';
      
      // Get all leads
      const leads = await storage.getLeads();
      if (!leads.length) {
        return res.status(400).json({ message: "No leads available to generate invoices for" });
      }
      
      // Get all loads that are completed but not invoiced
      // Filter loads based on date range and status
      const allLoads = await storage.getLoads();
      let loads;
      
      if (range === 'weekly') {
        // Get loads from the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        loads = allLoads.filter(load => 
          load.status === 'delivered' && 
          !load.invoiceId && // Not already invoiced
          new Date(load.deliveryDate) >= weekAgo
        );
      } else if (range === 'custom') {
        // Get all loads that are delivered but not invoiced (regardless of date)
        loads = allLoads.filter(load => 
          load.status === 'delivered' && 
          !load.invoiceId // Not already invoiced
        );
      } else {
        return res.status(400).json({ message: "Invalid range parameter. Use 'weekly' or 'custom'." });
      }
      
      if (!loads.length) {
        return res.status(400).json({ message: "No uninvoiced loads available in the specified range" });
      }
      
      // Group loads by client (lead)
      const loadsByLead: Record<number, any[]> = {};
      
      for (const load of loads) {
        if (!loadsByLead[load.leadId]) {
          loadsByLead[load.leadId] = [];
        }
        loadsByLead[load.leadId].push(load);
      }
      
      // Generate an invoice for each lead that has loads
      const createdInvoices = [];
      
      for (const [leadId, leadLoads] of Object.entries(loadsByLead)) {
        if (leadLoads.length === 0) continue;
        
        // Generate invoice number
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000).toString();
        const invoiceNumber = `INV-${year}${month}-${random}`;
        
        // Calculate total amount
        const totalAmount = leadLoads.reduce((total, load) => {
          // Make sure we're calculating the actual total properly
          const loadTotal = load.freightAmount + load.serviceCharge;
          return total + loadTotal;
        }, 0);
        
        // Create the invoice
        const invoice = await storage.createInvoice({
          leadId: parseInt(leadId),
          invoiceNumber,
          totalAmount,
          status: 'draft',
          issuedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdBy: req.user?.id || 1,
          notes: `Automatically generated invoice for ${leadLoads.length} loads.`
        });
        
        // Create invoice items for each load
        for (const load of leadLoads) {
          await storage.createInvoiceItem({
            invoiceId: invoice.id,
            loadId: load.id,
            description: `Load: ${load.origin} to ${load.destination}`,
            amount: load.freightAmount + load.serviceCharge
          });
          
          // Mark the load as invoiced by adding the invoice ID
          await storage.updateLoad(load.id, { status: 'invoiced', invoiceId: invoice.id });
        }
        
        createdInvoices.push(invoice);
      }
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 1,
        entityType: 'invoice',
        entityId: 0, // System-wide activity
        action: range === 'weekly' ? 'generate-weekly' : 'generate-custom',
        details: `Generated ${createdInvoices.length} invoices (${range} range)`
      });
      
      return res.status(200).json({ 
        success: true, 
        message: `Successfully generated ${createdInvoices.length} invoices`,
        count: createdInvoices.length,
        invoices: createdInvoices.map(inv => inv.id)
      });
    } catch (error) {
      console.error("Error generating invoices:", error);
      next(error);
    }
  });
  
  // Legacy route for backward compatibility
  app.post("/api/invoices/generate-weekly", createAuthMiddleware(4), async (req, res, next) => {
    try {
      // This will generate invoices for all active loads that don't have invoices yet
      // In a real implementation, this would query for all completed loads without invoices
      
      // Get all leads
      const leads = await storage.getLeads();
      if (!leads.length) {
        return res.status(400).json({ message: "No leads available to generate invoices for" });
      }
      
      // Get all loads that are completed but not invoiced
      // Filter loads that are "delivered" status and not already invoiced
      const allLoads = await storage.getLoads();
      const loads = allLoads.filter(load => 
        load.status === 'delivered' && 
        !load.invoiceId // We'll use this to determine if it's been invoiced
      );
      
      if (!loads.length) {
        return res.status(400).json({ message: "No uninvoiced loads available" });
      }
      
      // Group loads by client (lead)
      const loadsByLead: Record<number, any[]> = {};
      
      for (const load of loads) {
        if (!loadsByLead[load.leadId]) {
          loadsByLead[load.leadId] = [];
        }
        loadsByLead[load.leadId].push(load);
      }
      
      // Generate an invoice for each lead that has loads
      const createdInvoices = [];
      
      for (const [leadId, leadLoads] of Object.entries(loadsByLead)) {
        if (leadLoads.length === 0) continue;
        
        // Generate invoice number
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000).toString();
        const invoiceNumber = `INV-${year}${month}-${random}`;
        
        // Calculate total amount
        const totalAmount = leadLoads.reduce((total, load) => {
          // Make sure we're calculating the actual total properly
          const loadTotal = load.freightAmount + load.serviceCharge;
          return total + loadTotal;
        }, 0);
        
        // Create the invoice
        const invoice = await storage.createInvoice({
          leadId: parseInt(leadId),
          invoiceNumber,
          totalAmount,
          status: 'draft',
          issuedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdBy: req.user?.id || 1,
          notes: `Automatically generated weekly invoice for ${leadLoads.length} loads.`
        });
        
        // Create invoice items for each load
        for (const load of leadLoads) {
          await storage.createInvoiceItem({
            invoiceId: invoice.id,
            loadId: load.id,
            description: `Load: ${load.origin} to ${load.destination}`,
            amount: load.freightAmount + load.serviceCharge
          });
          
          // Mark the load as invoiced by adding the invoice ID
          await storage.updateLoad(load.id, { status: 'invoiced', invoiceId: invoice.id });
        }
        
        createdInvoices.push(invoice);
      }
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 1,
        entityType: 'invoice',
        entityId: 0, // System-wide activity
        action: 'generate-weekly',
        details: `Generated ${createdInvoices.length} weekly invoices`
      });
      
      return res.status(200).json({ 
        success: true, 
        message: `Successfully generated ${createdInvoices.length} invoices`,
        count: createdInvoices.length,
        invoices: createdInvoices.map(inv => inv.id)
      });
    } catch (error) {
      console.error("Error generating weekly invoices:", error);
      next(error);
    }
  });

  // Invoice email endpoints
  app.post("/api/invoices/:id/send", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { template = 'standard', message = '' } = req.body;
      
      // Get the invoice
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get the lead (client) information
      const lead = await storage.getLead(invoice.leadId);
      if (!lead) {
        return res.status(404).json({ message: "Client information not found" });
      }
      
      // Get the invoice items
      const items = await storage.getInvoiceItems(invoiceId);
      
      // Get the user who created the invoice
      const creator = await storage.getUser(invoice.createdBy);
      if (!creator) {
        return res.status(404).json({ message: "Invoice creator not found" });
      }
      
      // Get load information for each item
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const load = await storage.getLoad(item.loadId);
        return {
          ...item,
          loadInfo: load ? {
            loadNumber: load.loadNumber,
            origin: load.origin,
            destination: load.destination,
            date: load.date
          } : undefined
        };
      }));
      
      // Import InvoiceTemplateType from invoiceTemplates
      const { sendInvoiceEmailWithTemplate, InvoiceTemplateType } = await import('./invoiceTemplates');
      
      // Prepare email data
      const emailData = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: lead.companyName,
        clientEmail: lead.email,
        clientContactName: lead.contactName,
        totalAmount: invoice.totalAmount,
        issuedDate: invoice.issuedDate,
        dueDate: invoice.dueDate,
        items: enrichedItems,
        notes: invoice.notes,
        createdBy: {
          name: `${creator.firstName} ${creator.lastName}`,
          email: creator.email,
          phone: creator.phoneNumber
        },
        customMessage: message
      };
      
      // Determine template type
      let templateType: any;
      switch (template) {
        case 'friendly':
          templateType = InvoiceTemplateType.FRIENDLY_REMINDER;
          break;
        case 'urgent':
          templateType = InvoiceTemplateType.URGENT_PAYMENT;
          break;
        case 'overdue':
          templateType = InvoiceTemplateType.OVERDUE_NOTICE;
          break;
        case 'standard':
        default:
          templateType = InvoiceTemplateType.STANDARD;
          break;
      }
      
      // Send the email
      const success = await sendInvoiceEmailWithTemplate(
        templateType,
        emailData,
        message
      );
      
      if (success) {
        // If the invoice was in draft status, update it to sent
        if (invoice.status === 'draft') {
          await storage.updateInvoice(invoiceId, {
            status: 'sent'
          });
        }
        
        // Log the activity
        await storage.createActivity({
          userId: req.user.id,
          entityType: 'invoice',
          entityId: invoiceId,
          action: 'sent',
          details: `Invoice ${invoice.invoiceNumber} sent to ${lead.email} using ${template} template`
        });
        
        return res.status(200).json({ 
          success: true, 
          message: "Invoice sent successfully" 
        });
      } else {
        throw new Error("Failed to send invoice email");
      }
    } catch (error) {
      console.error("Error sending invoice:", error);
      next(error);
    }
  });
  
  // Dashboard data route
  app.get("/api/dashboard", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const roleLevel = req.userRole?.level || 5;  // Default to admin level if undefined
      const department = req.userRole?.department || 'admin';  // Default to admin department if undefined
      
      // Common metrics for all roles
      const dashboardData: any = {
        metrics: {},
        activities: [],
        leads: [],
        employees: []
      };
      
      // Add dummy data for visualization
      // KPI Metrics
      dashboardData.metrics = {
        totalLeads: 142,
        qualifiedLeads: 87,
        leadsConverted: 65,
        totalLoads: 118,
        activeLoads: 32,
        completedLoads: 86,
        totalRevenue: 528750,
        totalProfit: 158625,
        profitMargin: 30,
        invoicesPending: 24,
        activeDispatchClients: 28,
        dispatchClientsChange: 8,
        dispatchClientsTrend: 'up'
      };
      
      // Revenue data
      dashboardData.revenueData = {
        total: 528750,
        byMonth: [
          { month: 'Jan', revenue: 35000, target: 40000 },
          { month: 'Feb', revenue: 42000, target: 42000 },
          { month: 'Mar', revenue: 48500, target: 45000 },
          { month: 'Apr', revenue: 51200, target: 48000 },
          { month: 'May', revenue: 53700, target: 50000 },
          { month: 'Jun', revenue: 58900, target: 52000 },
          { month: 'Jul', revenue: 63400, target: 55000 },
          { month: 'Aug', revenue: 67800, target: 58000 },
          { month: 'Sep', revenue: 72500, target: 60000 },
          { month: 'Oct', revenue: 78250, target: 65000 },
          { month: 'Nov', revenue: 84500, target: 70000 },
          { month: 'Dec', revenue: 91200, target: 75000 }
        ]
      };
      
      // Team metrics
      dashboardData.teamMetrics = {
        performanceData: [
          { name: 'Sarah', calls: 42, conversions: 8 },
          { name: 'John', calls: 38, conversions: 7 },
          { name: 'Alex', calls: 45, conversions: 10 },
          { name: 'Maya', calls: 36, conversions: 9 },
          { name: 'Dave', calls: 40, conversions: 6 }
        ],
        avgCallsPerDay: 40.2,
        callsChangePercentage: 12,
        conversionRate: 18.4,
        conversionChangePercentage: 5.2,
        teamTarget: 45
      };
      
      // Sales performance
      dashboardData.salesPerformance = {
        performanceData: [
          { name: 'Sarah', calls: 42, conversions: 8 },
          { name: 'John', calls: 38, conversions: 7 },
          { name: 'Alex', calls: 45, conversions: 10 },
          { name: 'Maya', calls: 36, conversions: 9 },
          { name: 'Dave', calls: 40, conversions: 6 }
        ],
        avgCallsPerDay: 40.2,
        callsChangePercentage: 12,
        conversionRate: 18.4,
        conversionChangePercentage: 5.2,
        teamTarget: 45
      };
      
      // Dispatch performance
      dashboardData.dispatchPerformance = {
        performanceData: [
          { name: 'Mike', loads: 22, invoices: 18 },
          { name: 'Lisa', loads: 18, invoices: 15 },
          { name: 'Carlos', loads: 25, invoices: 22 },
          { name: 'Priya', loads: 20, invoices: 19 },
          { name: 'Raj', loads: 17, invoices: 14 }
        ],
        avgLoadsPerDay: 20.4,
        loadsChangePercentage: 8.2,
        invoiceRate: 88,
        invoiceChangePercentage: 3.5,
        teamTarget: 22
      };
      
      // Onboarding metrics
      dashboardData.onboardingMetrics = {
        total: 65,
        completed: 42,
        inProgress: 18,
        stalled: 5,
        conversion: 78
      };
      
      // Finance data
      dashboardData.finance = {
        revenue: 528750,
        expenses: {
          salaries: 185000,
          operations: 98500,
          tools: 22750,
          commissions: 63900,
          other: 35600
        },
        profit: 158625,
        cashOnHand: 245000,
        accountsReceivable: 128500,
        accountsPayable: 87200
      };
      
      // Employee data
      dashboardData.employees = {
        total: 28,
        active: 26,
        onLeave: 2,
        byDepartment: [
          { department: 'Sales', count: 10 },
          { department: 'Dispatch', count: 8 },
          { department: 'Finance', count: 4 },
          { department: 'HR', count: 2 },
          { department: 'Admin', count: 4 }
        ],
        attendance: {
          present: 24,
          absent: 2,
          late: 2
        },
        newHires: 3,
        topPerformers: [
          { name: 'Alex Johnson', department: 'Sales', achievement: '125% of target' },
          { name: 'Carlos Rodriguez', department: 'Dispatch', achievement: '98% load efficiency' },
          { name: 'Priya Sharma', department: 'Finance', achievement: 'Cost optimization lead' }
        ]
      };
      
      // Activity feed
      dashboardData.activities = [
        { type: 'lead_created', user: 'Sarah Kim', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), details: 'New lead from ABC Logistics' },
        { type: 'load_completed', user: 'Carlos Rodriguez', timestamp: new Date(Date.now() - 55 * 60000).toISOString(), details: 'Load #L-2458 delivered successfully' },
        { type: 'invoice_paid', user: 'System', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), details: 'Invoice #INV-8751 marked as paid' },
        { type: 'lead_qualified', user: 'John Smith', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), details: 'Lead #L-1022 moved to qualified' },
        { type: 'new_user', user: 'Admin', timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), details: 'Added Rachel Green to Dispatch team' },
        { type: 'commission_paid', user: 'Finance', timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), details: 'Commissions processed for March' },
        { type: 'load_assigned', user: 'Mike Willis', timestamp: new Date(Date.now() - 25 * 3600000).toISOString(), details: 'Load #L-2457 assigned to carrier FAST-XL' },
        { type: 'lead_updated', user: 'Maya Johnson', timestamp: new Date(Date.now() - 26 * 3600000).toISOString(), details: 'Updated contact info for Acme Shipping' },
        { type: 'invoice_created', user: 'Lisa Chen', timestamp: new Date(Date.now() - 28 * 3600000).toISOString(), details: 'Created invoice #INV-8752 for $8,750' },
        { type: 'system_update', user: 'System', timestamp: new Date(Date.now() - 48 * 3600000).toISOString(), details: 'System maintenance completed' }
      ];
      
      // Recent leads
      dashboardData.leads = [
        { id: 'L-1025', company: 'Globex Shipping', contact: 'Mark Rogers', status: 'new', value: 15000, assignee: 'Sarah Kim', lastActivity: 'Initial contact made', lastUpdated: new Date(Date.now() - 35 * 60000).toISOString() },
        { id: 'L-1024', company: 'Oceanic Freight', contact: 'Jessica Wong', status: 'qualified', value: 22500, assignee: 'John Smith', lastActivity: 'Needs analysis completed', lastUpdated: new Date(Date.now() - 3 * 3600000).toISOString() },
        { id: 'L-1023', company: 'Continental Logistics', contact: 'Robert Chen', status: 'nurturing', value: 18000, assignee: 'Alex Johnson', lastActivity: 'Follow-up call scheduled', lastUpdated: new Date(Date.now() - 24 * 3600000).toISOString() },
        { id: 'L-1022', company: 'Alliance Transport', contact: 'Maria Garcia', status: 'qualified', value: 31000, assignee: 'Maya Johnson', lastActivity: 'Proposal sent', lastUpdated: new Date(Date.now() - 26 * 3600000).toISOString() },
        { id: 'L-1021', company: 'Pacific Carriers', contact: 'David Kim', status: 'won', value: 27500, assignee: 'Dave Wilson', lastActivity: 'Contract signed', lastUpdated: new Date(Date.now() - 48 * 3600000).toISOString() }
      ];
      
      // Commission data
      dashboardData.commissions = {
        total: 63900,
        byTeam: [
          { team: 'Sales', amount: 42600 },
          { team: 'Dispatch', amount: 21300 }
        ],
        topEarners: [
          { name: 'Alex Johnson', amount: 8750 },
          { name: 'Sarah Kim', amount: 7200 },
          { name: 'Carlos Rodriguez', amount: 6850 },
          { name: 'John Smith', amount: 5900 },
          { name: 'Maya Johnson', amount: 5400 }
        ],
        byMonth: [
          { month: 'Jan', amount: 3200 },
          { month: 'Feb', amount: 3800 },
          { month: 'Mar', amount: 4500 },
          { month: 'Apr', amount: 5100 },
          { month: 'May', amount: 5800 },
          { month: 'Jun', amount: 6300 },
          { month: 'Jul', amount: 6900 },
          { month: 'Aug', amount: 7100 },
          { month: 'Sep', amount: 7400 },
          { month: 'Oct', amount: 7800 },
          { month: 'Nov', amount: 8200 },
          { month: 'Dec', amount: 8800 }
        ]
      };
      
      // Try to get real data from database if available
      try {
        // Real database metrics based on role
        if (department === 'sales' || department === 'admin') {
          // Get leads data if available
          const allLeads = await storage.getLeads();
          if (allLeads && allLeads.length > 0) {
            const qualifiedLeads = allLeads.filter(lead => lead.status === 'qualified');
            const activeClients = allLeads.filter(lead => lead.status === 'active');
            
            // Update metrics with real data
            dashboardData.metrics.realLeadsCount = allLeads.length;
            dashboardData.metrics.realQualifiedLeads = qualifiedLeads.length;
            dashboardData.metrics.realActiveClients = activeClients.length;
            
            // Get user-specific leads if needed
            if (roleLevel === 1 && req.user) {
              const userLeads = await storage.getLeadsByAssignee(req.user.id);
              if (userLeads && userLeads.length > 0) {
                dashboardData.userLeads = userLeads.slice(0, 5);
              }
            }
          }
        } else if (department === 'dispatch') {
          // Get loads data if available
          const allLoads = await storage.getLoads();
          if (allLoads && allLoads.length > 0) {
            const inTransitLoads = allLoads.filter(load => load.status === 'in_transit');
            const deliveredLoads = allLoads.filter(load => load.status === 'delivered');
            
            // Update metrics with real data
            dashboardData.metrics.realLoadsCount = allLoads.length;
            dashboardData.metrics.realInTransitLoads = inTransitLoads.length;
            dashboardData.metrics.realDeliveredLoads = deliveredLoads.length;
            
            // Get active dispatch clients
            try {
              const activeClients = await storage.getDispatchClientsByStatus('Active');
              if (activeClients) {
                dashboardData.metrics.activeDispatchClients = activeClients.length;
              }
            } catch (error) {
              console.log('Error fetching active dispatch clients:', error);
            }
            
            // Get user-specific loads if needed
            if (roleLevel === 1 && req.user) {
              const userLoads = await storage.getLoadsByAssignee(req.user.id);
              if (userLoads && userLoads.length > 0) {
                dashboardData.userLoads = userLoads.slice(0, 5);
              }
            }
          }
        }
        
        // Get activities for all roles
        const activities = await storage.getActivities(10);
        if (activities && activities.length > 0) {
          dashboardData.realActivities = activities;
        }
      } catch (error) {
        console.log('Error fetching real data, using dummy data:', error);
      }
      
      res.json(dashboardData);
    } catch (error) {
      next(error);
    }
  });

  // Create HTTP server
  // Organization routes
  const orgRouter = express.Router();
  app.use("/api/organizations", orgRouter);

  // Get users by organization
  orgRouter.get("/:id/users", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const orgId = Number(req.params.id);
      
      // Check if organization exists
      const organization = await storage.getOrganization(orgId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Get users from this organization
      const users = await storage.getUsersByOrganization(orgId);
      
      // Remove passwords before sending to client
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  });

  orgRouter.get("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      next(error);
    }
  });

  orgRouter.get("/active", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const activeOrgs = await storage.getActiveOrganizations();
      res.json(activeOrgs);
    } catch (error) {
      next(error);
    }
  });

  orgRouter.get("/current", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Return the current organization if it's set in the request
      if (!req.orgId) {
        return res.status(404).json({ message: "No organization selected" });
      }
      
      const organization = await storage.getOrganization(req.orgId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error) {
      next(error);
    }
  });

  orgRouter.get("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const organization = await storage.getOrganization(Number(req.params.id));
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error) {
      next(error);
    }
  });

  orgRouter.post("/", createAuthMiddleware(5), async (req, res, next) => {
    try {
      const orgData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(orgData);
      res.status(201).json(organization);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  orgRouter.put("/:id", createAuthMiddleware(5), async (req, res, next) => {
    try {
      const orgId = Number(req.params.id);
      const organization = await storage.getOrganization(orgId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      const orgData = insertOrganizationSchema.partial().parse(req.body);
      const updatedOrg = await storage.updateOrganization(orgId, orgData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'organization',
        entityId: orgId,
        action: 'updated',
        details: `Updated organization: ${organization.name}`
      });
      
      res.json(updatedOrg);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });
  
  // Update organization modules (specific endpoint for module management)
  orgRouter.put("/:id/modules", createAuthMiddleware(5), async (req, res, next) => {
    try {
      const orgId = Number(req.params.id);
      const organization = await storage.getOrganization(orgId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Validate and extract modules from request body
      const { enabledModules } = req.body;
      
      if (!enabledModules || typeof enabledModules !== 'object') {
        return res.status(400).json({ message: "Invalid modules format" });
      }
      
      // Update only the enabled modules
      const updatedOrg = await storage.updateOrganization(orgId, { enabledModules });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'organization',
        entityId: orgId,
        action: 'updated_modules',
        details: `Updated modules for organization: ${organization.name}`
      });
      
      res.json(updatedOrg);
    } catch (error) {
      // Since we're not using Zod validation here, just pass the error to the next middleware
      next(error);
    }
  });
  
  // Delete organization route
  orgRouter.delete("/:id", createAuthMiddleware(5), async (req, res, next) => {
    try {
      const orgId = Number(req.params.id);
      const organization = await storage.getOrganization(orgId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Don't allow deletion of the default organization
      if (organization.code === "DEFAULT") {
        return res.status(403).json({ message: "Cannot delete the default organization" });
      }
      
      // Count users in this organization
      const usersInOrg = await storage.getUsersByOrganization(orgId);
      if (usersInOrg.length > 0) {
        return res.status(400).json({ 
          message: `Cannot delete organization with ${usersInOrg.length} active users. Reassign users first.` 
        });
      }
      
      // Perform the deletion - soft delete by setting active=false
      const updatedOrg = await storage.updateOrganization(orgId, { active: false });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'organization',
        entityId: orgId,
        action: 'deleted',
        details: `Deleted organization: ${organization.name}`
      });
      
      res.json({ message: "Organization deleted successfully", organization: updatedOrg });
    } catch (error) {
      next(error);
    }
  });

  // Get all organizations the user has access to
  authRouter.get("/user-organizations", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const organizations = await storage.getUserOrganizations(req.user.id);
      res.json(organizations);
    } catch (error) {
      next(error);
    }
  });
  
  // Switch organization route (GET version)
  authRouter.get("/switch", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const orgId = req.query.orgId;
      
      if (!orgId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }
      
      const organization = await storage.getOrganization(Number(orgId));
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Check if user has access to this organization
      const userOrgIds = await storage.getUserOrganizationIds(req.user.id);
      if (!userOrgIds.includes(Number(orgId))) {
        return res.status(403).json({ 
          message: "You don't have access to this organization" 
        });
      }
      
      // Store the selected organization ID in the session
      req.session.orgId = organization.id;
      
      // Also update the user's current organization in the database
      await storage.updateUser(req.user.id, {
        orgId: Number(orgId)
      });
      
      res.json({ message: `Switched to ${organization.name}`, organization });
    } catch (error) {
      next(error);
    }
  });

  // Switch organization route
  authRouter.post("/switch-organization", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const { organizationId } = req.body;
      
      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }
      
      const organization = await storage.getOrganization(Number(organizationId));
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Check if user has access to this organization
      const userOrgIds = await storage.getUserOrganizationIds(req.user.id);
      if (!userOrgIds.includes(Number(organizationId))) {
        return res.status(403).json({ 
          message: "You don't have access to this organization" 
        });
      }
      
      // Store the selected organization ID in the session
      req.session.orgId = organization.id;
      
      // Also update the user's current organization in the database
      await storage.updateUser(req.user.id, {
        orgId: Number(organizationId)
      });
      
      res.json({ message: `Switched to ${organization.name}`, organization });
    } catch (error) {
      next(error);
    }
  });

  // Commission Rules routes
  const commissionRuleRouter = express.Router();
  app.use("/api/commission-rules", commissionRuleRouter);

  commissionRuleRouter.get("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const { type, orgId } = req.query;
      let rules = [];

      if (type && orgId) {
        // Get rules by type and organization
        rules = await storage.getCommissionRulesByType(type as string);
        rules = rules.filter(rule => rule.orgId === Number(orgId));
      } else if (type) {
        // Get rules by type only
        rules = await storage.getCommissionRulesByType(type as string);
      } else if (orgId) {
        // Get rules by organization only
        rules = await storage.getCommissionRulesByOrg(Number(orgId));
      } else {
        // Get all rules
        const allRules = [];
        
        // Get sales commission rules
        const salesRules = await storage.getCommissionRulesByType("sales");
        allRules.push(...salesRules);
        
        // Get dispatch commission rules
        const dispatchRules = await storage.getCommissionRulesByType("dispatch");
        allRules.push(...dispatchRules);
        
        rules = allRules;
      }
      
      res.json(rules);
    } catch (error) {
      next(error);
    }
  });

  commissionRuleRouter.get("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const rule = await storage.getCommissionRule(id);
      
      if (!rule) {
        return res.status(404).json({ message: "Commission rule not found" });
      }
      
      res.json(rule);
    } catch (error) {
      next(error);
    }
  });

  commissionRuleRouter.post("/", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const ruleData = insertCommissionRuleSchema.parse(req.body);
      
      // Make sure updatedBy is set to the current user
      const rule = await storage.createCommissionRule({
        ...ruleData,
        updatedBy: req.user?.id || 0
      });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'commission_rule',
        entityId: rule.id,
        action: 'created',
        details: `Created ${rule.type} commission rule`
      });
      
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  commissionRuleRouter.patch("/:id", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const rule = await storage.getCommissionRule(id);
      
      if (!rule) {
        return res.status(404).json({ message: "Commission rule not found" });
      }
      
      // Make sure updatedBy is set to the current user
      const updatedRule = await storage.updateCommissionRule(id, {
        ...req.body,
        updatedBy: req.user?.id || 0
      });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'commission_rule',
        entityId: id,
        action: 'updated',
        details: `Updated ${rule.type} commission rule`
      });
      
      res.json(updatedRule);
    } catch (error) {
      next(error);
    }
  });

  // Monthly Commissions routes
  const commissionMonthlyRouter = express.Router();
  app.use("/api/commissions-monthly", commissionMonthlyRouter);

  commissionMonthlyRouter.get("/", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const { userId, month, orgId } = req.query;
      let commissions = [];

      if (userId && month) {
        // Get commission by user and month
        const commission = await storage.getCommissionMonthlyByUserAndMonth(
          Number(userId), 
          month as string
        );
        if (commission) {
          commissions = [commission];
        }
      } else if (userId) {
        // Get commissions by user
        commissions = await storage.getCommissionsMonthlyByUser(Number(userId));
      } else if (month) {
        // Get commissions by month
        commissions = await storage.getCommissionsMonthlyByMonth(month as string);
      } else if (orgId) {
        // Get commissions by organization
        commissions = await storage.getCommissionsMonthlyByOrg(Number(orgId));
      } else {
        // Get all commissions (limited by role permissions)
        if (req.userRole?.level >= 4) {
          // Admins and department heads can see all commissions
          const allCommissions = [];
          
          // Get latest month's commissions
          const currentDate = new Date();
          const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
          
          const latestCommissions = await storage.getCommissionsMonthlyByMonth(currentMonth);
          allCommissions.push(...latestCommissions);
          
          commissions = allCommissions;
        } else {
          // Others can only see their own commissions
          commissions = await storage.getCommissionsMonthlyByUser(req.user?.id || 0);
        }
      }
      
      res.json(commissions);
    } catch (error) {
      next(error);
    }
  });

  commissionMonthlyRouter.get("/:id", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const commission = await storage.getCommissionMonthly(id);
      
      if (!commission) {
        return res.status(404).json({ message: "Monthly commission not found" });
      }
      
      // Check if user has permission to view this commission
      if (req.userRole?.level < 4 && commission.userId !== req.user?.id) {
        return res.status(403).json({ 
          message: "You don't have permission to view this commission report" 
        });
      }
      
      res.json(commission);
    } catch (error) {
      next(error);
    }
  });
  
  // Get top commission earners for a specific month and organization
  commissionMonthlyRouter.get("/top-earners", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const { month, limit = 5, type, previousMonth } = req.query;
      const orgId = req.user?.orgId || 0;
      
      // Default to current month if not specified
      const targetMonth = month ? String(month) : new Date().toISOString().substring(0, 7);
      
      // Get top earners for current month
      const topEarners = await storage.getTopCommissionEarners({
        orgId,
        month: targetMonth,
        limit: Number(limit),
        type: type as 'sales' | 'dispatch' | undefined
      });
      
      // If we need to include previous month data for comparison
      if (previousMonth === 'true') {
        // Calculate previous month in YYYY-MM format
        const [year, monthNum] = targetMonth.split('-').map(Number);
        const prevMonthDate = new Date(year, monthNum - 2, 1); // Month is 0-indexed
        const prevMonth = prevMonthDate.toISOString().substring(0, 7);
        
        // Get previous month data for the same users
        const userIds = topEarners.map(earner => earner.userId);
        
        // Get all commission records for the previous month
        const prevMonthCommissions = await storage.getCommissionsMonthlyByMonth(prevMonth);
        
        // Filter to only include our top earners from current month and same org
        const filteredPrevMonthCommissions = prevMonthCommissions.filter(
          comm => userIds.includes(comm.userId) && comm.orgId === orgId
        );
        
        // Create a map for quick lookup
        const prevMonthMap = new Map(
          filteredPrevMonthCommissions.map(comm => [comm.userId, comm.totalCommission])
        );
        
        // Add previous amount to each earner
        const earnersWithPrevious = topEarners.map(earner => ({
          ...earner,
          previousAmount: prevMonthMap.get(earner.userId) || 0
        }));
        
        return res.json(earnersWithPrevious);
      }
      
      res.json(topEarners);
    } catch (error) {
      next(error);
    }
  });

  commissionMonthlyRouter.post("/calculate", createAuthMiddleware(4), async (req, res, next) => {
    try {
      const { userId, month } = req.body;
      
      if (!userId || !month) {
        return res.status(400).json({ 
          message: "Both userId and month are required" 
        });
      }
      
      // Get the user
      const user = await storage.getUser(Number(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get the user's role to determine calculation method
      const role = await storage.getRole(user.roleId);
      if (!role) {
        return res.status(404).json({ message: "User role not found" });
      }
      
      let calculatedCommission = null;
      
      // Calculate commission based on role name rather than department
      const roleName = role.name?.toLowerCase() || '';
      
      if (roleName.includes('sales')) {
        calculatedCommission = await calculateSalesCommission(userId, month, req.user?.id || 0);
      } else if (roleName.includes('dispatch')) {
        calculatedCommission = await calculateDispatchCommission(userId, month, req.user?.id || 0);
      } else {
        return res.status(400).json({ 
          message: `Cannot calculate commission for this role type` 
        });
      }
      
      if (!calculatedCommission) {
        return res.status(404).json({ 
          message: "Could not calculate commission - insufficient data" 
        });
      }
      
      // Use role name instead of department
      const departmentType = roleName.includes('sales') ? 'sales' : 'dispatch';
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'commission_monthly',
        entityId: calculatedCommission.id,
        action: 'calculated',
        details: `Calculated ${departmentType} commission for ${user.firstName} ${user.lastName} (${month})`
      });
      
      // Emit socket events for real-time updates
      io.emit(`commission_update_${userId}`, {
        type: 'updated',
        data: calculatedCommission
      });
      
      // Emit admin-specific event for dashboard updates
      io.emit('commission_admin_update', {
        type: 'updated',
        department: departmentType,
        month,
        orgId: user.orgId
      });
      
      res.json(calculatedCommission);
    } catch (error) {
      next(error);
    }
  });

  commissionMonthlyRouter.post("/calculate-all", createAuthMiddleware(5), async (req, res, next) => {
    try {
      const { month } = req.body;
      
      if (!month) {
        return res.status(400).json({ message: "Month is required (YYYY-MM format)" });
      }
      
      // Get all active users
      const allUsers = await storage.getUsers();
      const activeUsers = allUsers.filter(user => user.active);
      
      const results = [];
      
      // Calculate commissions for all users
      for (const user of activeUsers) {
        // Get the user's role
        const role = await storage.getRole(user.roleId);
        if (!role) continue;
        
        // Check role name instead of department
        const roleName = role.name?.toLowerCase() || '';
        
        // Only calculate for sales and dispatch roles
        if (!roleName.includes('sales') && !roleName.includes('dispatch')) {
          continue;
        }
        
        let calculatedCommission = null;
        
        // Calculate commission based on role name
        if (roleName.includes('sales')) {
          calculatedCommission = await calculateSalesCommission(user.id, month, req.user?.id || 0);
        } else if (roleName.includes('dispatch')) {
          calculatedCommission = await calculateDispatchCommission(user.id, month, req.user?.id || 0);
        }
        
        if (calculatedCommission) {
          results.push(calculatedCommission);
        }
      }
      
      // Log the activity
      await storage.createActivity({
        userId: req.user?.id || 0,
        entityType: 'commission_monthly',
        entityId: 0, // Batch operation
        action: 'calculated_all',
        details: `Calculated all commissions for ${month}`
      });
      
      // Emit socket event for admin dashboard
      io.emit('commission_admin_update', {
        type: 'calculated_all',
        month,
        count: results.length,
        orgId: req.user?.orgId
      });
      
      // Also emit individual events for each affected user
      results.forEach(commission => {
        io.emit(`commission_update_${commission.userId}`, {
          type: 'updated',
          data: commission
        });
      });
      
      res.json({ 
        message: `Calculated commissions for ${results.length} users`,
        commissions: results
      });
    } catch (error) {
      next(error);
    }
  });

  // Helper function to calculate sales commission
  async function calculateSalesCommission(userId: number, month: string, calculatedBy: number): Promise<any> {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) return null;
    
    // Get the commission rule for sales
    const salesRules = await storage.getCommissionRulesByType("sales");
    const orgRules = salesRules.filter(rule => rule.orgId === user.orgId);
    if (orgRules.length === 0) return null;
    
    // Use the latest rule
    const rule = orgRules.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
    
    // Parse the tiers from the rule
    const tiers = rule.tiers as { active: number, pct?: number, fixed?: number }[];
    
    // Count active leads for this user for the specified month
    // This is a simplified version - in a real app, we would filter by created month
    // and status change date to ensure we only count leads activated in the target month
    const userLeads = await storage.getLeadsByAssignee(userId);
    const activeLeads = userLeads.filter(lead => lead.status === 'active');
    const activeLeadCount = activeLeads.length;
    
    // Get existing commission record if any
    let commissionRecord = await storage.getCommissionMonthlyByUserAndMonth(userId, month);
    
    // Calculate the fixed amount and percentage
    let fixedAmount = 0;
    let calculatedPct = 0;
    let appliedTier = null;
    
    // Find the appropriate tier based on active lead count
    for (const tier of tiers) {
      if (activeLeadCount >= tier.active) {
        appliedTier = tier;
        if (tier.fixed !== undefined) {
          fixedAmount = tier.fixed;
        }
        if (tier.pct !== undefined) {
          calculatedPct = tier.pct;
        }
      }
    }
    
    // Calculate total amount (simplified - in a real app we would factor in lead value)
    // Adjust for inbound leads if needed
    const inboundFactor = 0.75; // 25% reduction for inbound leads
    const starterCloserSplit = { starter: 0.4, closer: 0.6 }; // 40% starter, 60% closer
    
    // Dummy values for metrics - in a real app, these would be calculated from actual data
    const inboundLeadCount = Math.floor(activeLeadCount * 0.3); // Assuming 30% are inbound
    const outboundLeadCount = activeLeadCount - inboundLeadCount;
    const teamTargetMet = activeLeadCount >= 10; // Example target
    const teamLeadBonus = teamTargetMet ? activeLeadCount * 1000 : 0; // 1000 PKR per active lead after target
    
    // Calculate adjusted amount based on inbound/outbound mix
    const adjustedFixedAmount = (
      (inboundLeadCount * fixedAmount * inboundFactor) + 
      (outboundLeadCount * fixedAmount)
    ) / activeLeadCount;
    
    // Apply percentage adjustment if applicable
    let finalAmount = adjustedFixedAmount;
    if (calculatedPct !== 0) {
      const percentageAdjustment = (finalAmount * calculatedPct) / 100;
      finalAmount += percentageAdjustment;
    }
    
    // Add team lead bonus if applicable
    if (user.roleId === 2) { // Assuming roleId 2 is for Team Leads
      finalAmount += teamLeadBonus;
    }
    
    // If we have an existing record, update it, otherwise create a new one
    if (commissionRecord) {
      commissionRecord = await storage.updateCommissionMonthly(commissionRecord.id, {
        amount: finalAmount,
        metrics: {
          activeLeads: activeLeadCount,
          inboundLeads: inboundLeadCount,
          outboundLeads: outboundLeadCount,
          teamTargetMet,
          appliedTier: appliedTier ? appliedTier.active : 0,
          fixedAmount,
          adjustedAmount: adjustedFixedAmount,
          teamLeadBonus
        },
        updatedBy: calculatedBy
      });
    } else {
      commissionRecord = await storage.createCommissionMonthly({
        userId,
        orgId: user.orgId || 0,
        month,
        amount: finalAmount,
        baseAmount: fixedAmount,
        bonusAmount: teamLeadBonus,
        percentageAdjustment: calculatedPct,
        type: "sales",
        metrics: {
          activeLeads: activeLeadCount,
          inboundLeads: inboundLeadCount,
          outboundLeads: outboundLeadCount,
          teamTargetMet,
          appliedTier: appliedTier ? appliedTier.active : 0,
          fixedAmount,
          adjustedAmount: adjustedFixedAmount,
          teamLeadBonus
        },
        status: "calculated",
        approvedBy: null,
        approvedAt: null,
        updatedBy: calculatedBy
      });
    }
    
    return commissionRecord;
  }

  // Helper function to calculate dispatch commission
  async function calculateDispatchCommission(userId: number, month: string, calculatedBy: number): Promise<any> {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) return null;
    
    // Get the commission rule for dispatch
    const dispatchRules = await storage.getCommissionRulesByType("dispatch");
    const orgRules = dispatchRules.filter(rule => rule.orgId === user.orgId);
    if (orgRules.length === 0) return null;
    
    // Use the latest rule
    const rule = orgRules.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
    
    // Parse the tiers from the rule
    const tiers = rule.tiers as { min: number, max: number, pct: number }[];
    
    // Get loads managed by this dispatcher for the specified month
    // This is a simplified version - in a real app, we would filter by month
    const userLoads = await storage.getLoadsByAssignee(userId);
    const completedLoads = userLoads.filter(load => load.status === 'completed');
    
    // Calculate total invoice amount from completed loads
    // In a real app, we would sum the actual invoice amounts
    const invoiceTotal = completedLoads.reduce((sum, load) => {
      // Dummy invoice amount - in real app, we'd get from the invoice
      const loadValue = Math.floor(Math.random() * 1000) + 500; // Random value between 500-1500
      return sum + loadValue;
    }, 0);
    
    // Get existing commission record if any
    let commissionRecord = await storage.getCommissionMonthlyByUserAndMonth(userId, month);
    
    // Calculate the percentage based on invoice total
    let calculatedPct = 0;
    let salaryPenalty = 0;
    let appliedTier = null;
    
    // Check for salary penalty if invoice total is below threshold
    if (invoiceTotal < 650) {
      salaryPenalty = -25; // 25% reduction
    }
    
    // Find the appropriate tier based on invoice total
    for (const tier of tiers) {
      if (invoiceTotal >= tier.min && invoiceTotal <= tier.max) {
        appliedTier = tier;
        calculatedPct = tier.pct;
      }
    }
    
    // Calculate additional bonuses
    
    // Own lead bonus (3000 PKR per onboarded lead)
    const ownLeadCount = 2; // Dummy value - in real app, we'd count actual own leads
    const ownLeadBonus = ownLeadCount * 3000;
    
    // New lead bonus (2000 PKR per new lead)
    const newLeadCount = 3; // Dummy value - in real app, we'd count actual new leads
    const newLeadBonus = newLeadCount * 2000;
    
    // First-2-weeks invoice bonus (3%)
    const first2WeeksInvoiceAmount = invoiceTotal * 0.4; // Dummy value - assuming 40% of invoices were in first 2 weeks
    const first2WeeksBonus = first2WeeksInvoiceAmount * 0.03;
    
    // Active trucks bonus (3000 PKR per lead if ≥3 active trucks)
    const activeLeads = 4; // Dummy value - in real app, we'd count actual active leads
    const activeTrucksBonus = activeLeads >= 3 ? activeLeads * 3000 : 0;
    
    // More than 5 active leads in month bonus (5000 PKR)
    const activeLeadsBonus = activeLeads > 5 ? 5000 : 0;
    
    // Calculate base amount from invoice total and percentage
    const baseAmount = (invoiceTotal * calculatedPct) / 100;
    
    // Calculate total bonuses
    const totalBonuses = ownLeadBonus + newLeadBonus + first2WeeksBonus + activeTrucksBonus + activeLeadsBonus;
    
    // Apply salary penalty if applicable
    const penaltyAmount = salaryPenalty !== 0 ? (baseAmount * salaryPenalty) / 100 : 0;
    
    // Calculate final amount
    const finalAmount = baseAmount + totalBonuses + penaltyAmount;
    
    // If we have an existing record, update it, otherwise create a new one
    if (commissionRecord) {
      commissionRecord = await storage.updateCommissionMonthly(commissionRecord.id, {
        amount: finalAmount,
        metrics: {
          invoiceTotal,
          completedLoads: completedLoads.length,
          appliedTier: appliedTier ? `${appliedTier.min}-${appliedTier.max}` : 'None',
          ownLeadCount,
          newLeadCount,
          first2WeeksInvoiceAmount,
          activeLeads,
          baseAmount,
          ownLeadBonus,
          newLeadBonus,
          first2WeeksBonus,
          activeTrucksBonus,
          activeLeadsBonus,
          totalBonuses,
          penaltyAmount
        },
        updatedBy: calculatedBy
      });
    } else {
      commissionRecord = await storage.createCommissionMonthly({
        userId,
        orgId: user.orgId || 0,
        month,
        amount: finalAmount,
        baseAmount,
        bonusAmount: totalBonuses,
        percentageAdjustment: calculatedPct,
        penaltyPct: salaryPenalty,
        type: "dispatch",
        metrics: {
          invoiceTotal,
          completedLoads: completedLoads.length,
          appliedTier: appliedTier ? `${appliedTier.min}-${appliedTier.max}` : 'None',
          ownLeadCount,
          newLeadCount,
          first2WeeksInvoiceAmount,
          activeLeads,
          baseAmount,
          ownLeadBonus,
          newLeadBonus,
          first2WeeksBonus,
          activeTrucksBonus,
          activeLeadsBonus,
          totalBonuses,
          penaltyAmount
        },
        status: "calculated",
        approvedBy: null,
        approvedAt: null,
        updatedBy: calculatedBy
      });
    }
    
    return commissionRecord;
  }

  // Automatically recalculate commissions and send notifications when a lead status changes
  app.patch("/api/leads/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const leadId = Number(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      const previousStatus = lead.status;
      const newStatus = req.body.status;
      
      // Update lead
      const updatedLead = await storage.updateLead(leadId, req.body);
      
      // Check if status changed
      if (newStatus && newStatus !== previousStatus) {
        // Handle status change notification
        if (newStatus === 'Active' || newStatus === 'Unqualified') {
          // Import needed at the top level
          const { sendLeadStatusChangeNotification } = await import('./socket');
          
          // Send notification for active/unqualified status change
          await sendLeadStatusChangeNotification({
            id: leadId,
            name: lead.name,
            clientName: lead.clientName,
            previousStatus,
            status: newStatus,
            changedBy: req.user?.id || 0,
            changedByName: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim()
          });
        }
        
        // Send leadAssigned notification if status changed to HandToDispatch
        if (newStatus === 'HandToDispatch' && lead.assignedTo) {
          const { sendLeadAssignedNotification } = await import('./socket');
          
          await sendLeadAssignedNotification(lead.assignedTo, {
            id: leadId,
            name: lead.name,
            clientName: lead.clientName,
            assignedBy: req.user?.id || 0,
            status: newStatus
          });
        }
        
        // Trigger commission recalculation for the assigned sales rep when status changes to Active
        if (newStatus === 'Active' && previousStatus !== 'Active') {
          const currentDate = new Date();
          const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
          
          // Only recalculate if we have an assigned user
          if (lead.assignedTo) {
            await calculateSalesCommission(lead.assignedTo, currentMonth, req.user?.id || 0);
          }
        }
      }
      
      res.json(updatedLead);
    } catch (error) {
      console.error('Error updating lead status:', error);
      next(error);
    }
  });

  // Automatically recalculate commissions when a load is marked as completed
  app.patch("/api/loads/:id", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const loadId = Number(req.params.id);
      const load = await storage.getLoad(loadId);
      
      if (!load) {
        return res.status(404).json({ message: "Load not found" });
      }
      
      // Update load
      const updatedLoad = await storage.updateLoad(loadId, req.body);
      
      // Check if status changed to completed
      if (req.body.status === 'completed' && load.status !== 'completed') {
        // Trigger commission recalculation for the assigned dispatcher
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        // Only recalculate if we have an assigned user
        if (load.assignedTo) {
          await calculateDispatchCommission(load.assignedTo, currentMonth, req.user?.id || 0);
        }
      }
      
      res.json(updatedLoad);
    } catch (error) {
      next(error);
    }
  });

  // Task Management API Routes
  // Get all tasks with optional filtering
  app.get("/api/tasks", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const options: { status?: string; priority?: string; limit?: number } = {};
      if (status) options.status = status;
      if (priority) options.priority = priority;
      if (limit) options.limit = limit;
      
      const tasks = await storage.getTasks(options);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  // Get a specific task by ID
  app.get("/api/tasks/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  // Get tasks assigned to a specific user
  app.get("/api/tasks/user/:userId", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const tasks = await storage.getTasksByAssignee(userId);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  // Get tasks for a specific entity (lead, load, etc.)
  app.get("/api/tasks/entity/:type/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const entityType = req.params.type;
      const entityId = parseInt(req.params.id);
      const tasks = await storage.getTasksByEntity(entityType, entityId);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  // Create a new task
  app.post("/api/tasks", createAuthMiddleware(1), async (req, res, next) => {
    try {
      // Validate request body against schema
      const validatedData = insertTaskSchema.parse(req.body);
      
      // Create task
      const task = await storage.createTask(validatedData);
      
      // Log activity
      if (req.user?.id) {
        await storage.createActivity({
          userId: req.user.id,
          entityType: "task",
          entityId: task.id,
          action: "created",
          details: `Task created: ${task.title}`
        });
      }
      
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  });

  // Update a task
  app.patch("/api/tasks/:id", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Update task
      const updatedTask = await storage.updateTask(taskId, req.body);
      
      // Log activity if status is changing
      if (req.body.status && req.body.status !== task.status && req.user?.id) {
        await storage.createActivity({
          userId: req.user.id,
          entityType: "task",
          entityId: taskId,
          action: "status_changed",
          details: `Task status changed from ${task.status} to ${req.body.status}`
        });
      }
      
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });

  // Time Tracking routes
  // Get current clock status for a user
  app.get("/api/time-tracking/status", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const status = await storage.getCurrentClockStatus(req.user.id);
      res.json({ status });
    } catch (error) {
      next(error);
    }
  });

  // Clock in/out endpoint
  app.post("/api/time-tracking/clock", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const { type } = req.body;
      
      if (!type || !['IN', 'OUT'].includes(type)) {
        return res.status(400).json({ message: "Invalid clock event type. Must be 'IN' or 'OUT'" });
      }
      
      // Get current status to prevent duplicate events
      const currentStatus = await storage.getCurrentClockStatus(req.user.id);
      
      if (currentStatus === type) {
        return res.status(400).json({ 
          message: `You are already clocked ${type === 'IN' ? 'in' : 'out'}` 
        });
      }
      
      // Create clock event
      const clockEvent = await storage.createClockEvent({
        userId: req.user.id,
        type
      });
      
      // Create activity log
      await storage.createActivity({
        userId: req.user.id,
        entityType: 'clock_event',
        entityId: clockEvent.id,
        action: `clock_${type.toLowerCase()}`,
        details: `User clocked ${type.toLowerCase()}`
      });
      
      res.status(201).json({
        message: `Successfully clocked ${type === 'IN' ? 'in' : 'out'}`,
        event: clockEvent
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get clock events for the current user
  app.get("/api/time-tracking/events", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const events = await storage.getClockEventsByUser(req.user.id);
      res.json(events);
    } catch (error) {
      next(error);
    }
  });
  
  // Get clock events for a specific day for the current user
  app.get("/api/time-tracking/events/day", createAuthMiddleware(1), async (req, res, next) => {
    try {
      const dateStr = req.query.date as string;
      let date: Date;
      
      if (dateStr) {
        date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      } else {
        date = new Date(); // Default to today
      }
      
      const events = await storage.getClockEventsByUserAndDay(req.user.id, date);
      res.json(events);
    } catch (error) {
      next(error);
    }
  });
  
  // Admin endpoint to get clock events for any user
  app.get("/api/time-tracking/events/user/:userId", createAuthMiddleware(3), async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const events = await storage.getClockEventsByUser(userId);
      res.json(events);
    } catch (error) {
      next(error);
    }
  });

  // Team Management routes
  const teamRouter = express.Router();
  app.use("/api/teams", teamRouter);
  
  // Get all team members by department
  teamRouter.get("/department/:department", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const department = req.params.department;
      
      // Validate department parameter
      if (!['sales', 'dispatch', 'admin', 'finance', 'hr'].includes(department)) {
        return res.status(400).json({ message: "Invalid department. Must be one of: sales, dispatch, admin, finance, hr" });
      }
      
      // Get users by role department
      const users = await storage.getUsersByDepartment(department);
      
      // Enhance with role information and count metrics
      const teamMembers = await Promise.all(users.map(async (user) => {
        const role = await storage.getRole(user.roleId);
        
        // Add department-specific metrics
        let metrics = {};
        if (department === 'sales') {
          const activeLeadCount = await storage.getActiveLeadCountByUser(user.id);
          metrics = { activeLeadCount: activeLeadCount || 0 };
        } else if (department === 'dispatch') {
          const loadCount = await storage.getActiveLoadCountByUser(user.id);
          metrics = { loadCount: loadCount || 0 };
        }
        
        return {
          ...user,
          roleName: role?.name || 'Unknown',
          ...metrics
        };
      }));
      
      res.json(teamMembers);
    } catch (error) {
      next(error);
    }
  });

  // Get all sales team members
  teamRouter.get("/sales", createAuthMiddleware(2), async (req, res, next) => {
    try {
      // Get users with sales roles
      const users = await storage.getUsersByDepartment('sales');
      
      // Enhance with role and lead information
      const teamMembers = await Promise.all(users.map(async (user) => {
        const role = await storage.getRole(user.roleId);
        const activeLeadCount = await storage.getActiveLeadCountByUser(user.id);
        
        return {
          ...user,
          roleName: role?.name || 'Unknown',
          activeLeadCount: activeLeadCount || 0
        };
      }));
      
      res.json(teamMembers);
    } catch (error) {
      next(error);
    }
  });

  // Get performance metrics for sales team members
  teamRouter.get("/sales/performance/:month?", createAuthMiddleware(2), async (req, res, next) => {
    try {
      // Get month parameter or default to current month
      const month = req.params.month || safeDate(new Date())?.substring(0, 7); // Format: YYYY-MM
      
      // Get sales team members
      const salesUsers = await storage.getUsersByDepartment('sales');
      
      // Build performance data for each team member
      const performanceData = await Promise.all(salesUsers.map(async (user) => {
        // Get commission data for the month
        const commission = await storage.getUserCommissionByMonth(user.id, month);
        
        // Get active leads count and closed deals
        const activeLeadsCount = await storage.getActiveLeadCountByUser(user.id);
        const closedDealsCount = await storage.getClosedDealCountByUserForMonth(user.id, month);
        
        return {
          id: user.id, 
          userId: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          activeLeads: activeLeadsCount || 0,
          closedDeals: closedDealsCount || 0,
          invoiceTotal: commission?.invoiceTotal || 0,
          ownLeadBonus: commission?.ownLeadBonus || 0,
          totalCommission: commission?.totalCommission || 0
        };
      }));
      
      res.json(performanceData);
    } catch (error) {
      next(error);
    }
  });

  // Get all dispatch team members
  teamRouter.get("/dispatch", createAuthMiddleware(2), async (req, res, next) => {
    try {
      // Get users with dispatch roles
      const users = await storage.getUsersByDepartment('dispatch');
      
      // Enhance with role and load information
      const teamMembers = await Promise.all(users.map(async (user) => {
        const role = await storage.getRole(user.roleId);
        const loadCount = await storage.getActiveLoadCountByUser(user.id);
        
        return {
          ...user,
          roleName: role?.name || 'Unknown',
          loadCount: loadCount || 0
        };
      }));
      
      res.json(teamMembers);
    } catch (error) {
      next(error);
    }
  });

  // Get performance metrics for dispatch team members
  teamRouter.get("/dispatch/performance/:month?", createAuthMiddleware(2), async (req, res, next) => {
    try {
      // Get month parameter or default to current month
      const month = req.params.month || safeDate(new Date())?.substring(0, 7); // Format: YYYY-MM
      
      // Get dispatch team members
      const dispatchUsers = await storage.getUsersByDepartment('dispatch');
      
      // Build performance data for each team member
      const performanceData = await Promise.all(dispatchUsers.map(async (user) => {
        // Get commission data for the month
        const commission = await storage.getUserCommissionByMonth(user.id, month);
        
        // Get load count and revenue metrics
        const loadCount = await storage.getActiveLoadCountByUser(user.id);
        const grossRevenue = await storage.getGrossRevenueByUserForMonth(user.id, month);
        const directGrossRevenue = await storage.getDirectGrossRevenueByUserForMonth(user.id, month);
        
        return {
          id: user.id, 
          userId: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          loadCount: loadCount || 0,
          grossRevenue: grossRevenue || 0,
          directGrossRevenue: directGrossRevenue || 0,
          bonusAmount: commission?.tierFixed || 0,
          totalCommission: commission?.totalCommission || 0
        };
      }));
      
      res.json(performanceData);
    } catch (error) {
      next(error);
    }
  });

  // Get KPIs for a specific user
  app.get("/api/teams/user/:userId/kpi", createAuthMiddleware(2), async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      const month = req.query.month as string || createDateString().substring(0, 7); // Format: YYYY-MM
      
      // Find the user to determine their department
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const role = await storage.getRole(user.roleId);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      let kpiData;
      
      // Get department-specific KPIs
      if (role.department === 'sales') {
        const data = await storage.getSalesUserKPIs(userId, month);
        kpiData = {
          department: 'sales',
          metrics: {
            activeLeads: data.activeLeads || 0,
            closedDeals: data.closedDeals || 0,
            invoiceTotal: data.invoiceTotal || 0,
            ownLeadBonus: data.ownLeadBonus || 0,
            totalCommission: data.totalCommission || 0
          }
        };
      } else if (role.department === 'dispatch') {
        const data = await storage.getDispatchUserKPIs(userId, month);
        kpiData = {
          department: 'dispatch',
          metrics: {
            loadCount: data.loadCount || 0,
            grossRevenue: data.grossRevenue || 0,
            directGrossRevenue: data.directGrossRevenue || 0,
            bonusAmount: data.bonusAmount || 0,
            totalCommission: data.totalCommission || 0
          }
        };
      } else {
        kpiData = {
          department: role.department,
          metrics: {
            message: 'No specific KPIs defined for this department'
          }
        };
      }
      
      res.json(kpiData);
    } catch (error) {
      next(error);
    }
  });

  // Remove the root route handler - let Vite handle it for frontend rendering

  // Dedicated health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: Date.now(),
      uptime: process.uptime()
    });
  });

  // Use the existing httpServer
  return httpServer;
}