import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/authorize';
import { getSecurityLogs, getSecurityLogById } from '../controllers/securityLogs.controller';

export const securityLogsRouter = Router();

// Admin only — both routes
securityLogsRouter.use(authenticate, requireRole('admin'));

securityLogsRouter.get('/',    getSecurityLogs);
securityLogsRouter.get('/:id', getSecurityLogById);
