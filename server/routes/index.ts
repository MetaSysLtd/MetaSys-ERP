import express from 'express';
import timeTrackingRouter from './time-tracking';
import hrRouter from './hr';
import financeRouter from './finance';
import marketingRouter from './marketing';
import portalRouter from './portal';
import dashboardRouter from './dashboard';
import bugsRouter from './bugs';
import crmRouter from './crm';
import crmDashboardRouter from './crm-dashboard';
import activitiesRouter from './activities';
import leadsRouter from './leads';
import accountsRouter from './accounts';
import commissionsRouter from './commissions';
import adminRouter from './admin';
import crossModuleRouter from './cross-module';
import { logger } from '../logger';

/**
 * Register all module routes with the API router
 */
export function registerModuleRoutes(apiRouter: express.Router): void {
  logger.info('Registering module routes');
  
  // Time Tracking Module
  apiRouter.use('/time-tracking', timeTrackingRouter);
  
  // HR Module
  apiRouter.use('/hr', hrRouter);
  
  // Finance Module
  apiRouter.use('/finance', financeRouter);
  
  // Marketing Module
  apiRouter.use('/marketing', marketingRouter);
  
  // Client Portal
  apiRouter.use('/client-portal', portalRouter);
  
  // Dashboard
  apiRouter.use('/dashboard', dashboardRouter);
  
  // Bug Reporting System
  apiRouter.use('/bugs', bugsRouter);
  
  // CRM Module
  apiRouter.use('/crm', crmRouter);
  
  // CRM Dashboard
  apiRouter.use('/crm/dashboard', crmDashboardRouter);
  
  // Direct access to CRM resources for CRM deep-carve implementation
  apiRouter.use('/activities', activitiesRouter);
  apiRouter.use('/leads', leadsRouter);
  apiRouter.use('/accounts', accountsRouter);
  apiRouter.use('/commissions', commissionsRouter);
  
  // Admin Management Module
  apiRouter.use('/admin', adminRouter);
  
  // Cross-Module Data Flow Integration
  apiRouter.use('/cross-module', crossModuleRouter);
  
  logger.info('All module routes registered');
}