import express from 'express';
import timeTrackingRouter from './time-tracking';
import hrRouter from './hr';
import financeRouter from './finance';
import marketingRouter from './marketing';
import portalRouter from './client-portal';
import dashboardRouter from './dashboard';
import bugsRouter from './bugs';
import crmRouter from './crm';

export { default as timeTrackingRouter } from './time-tracking';
export { default as hrRouter } from './hr';
export { default as financeRouter } from './finance';
export { default as marketingRouter } from './marketing';
export { default as portalRouter } from './client-portal';
export { default as dashboardRouter } from './dashboard';
export { default as bugsRouter } from './bugs';
export { default as crmRouter } from './crm';

export function registerModuleRoutes(apiRouter: express.Router): void {
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
  
  // Direct access to CRM resources for CRM deep-carve
  apiRouter.use('/activities', crmRouter);
  apiRouter.use('/leads', crmRouter);
  apiRouter.use('/accounts', crmRouter);
}