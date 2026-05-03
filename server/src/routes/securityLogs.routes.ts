import { Router } from 'express';
import { getSecurityLogs, getSecurityLogById } from '../controllers/securityLogs.controller';

export const securityLogsRouter = Router();

securityLogsRouter.get('/', getSecurityLogs);
securityLogsRouter.get('/:id', getSecurityLogById);
