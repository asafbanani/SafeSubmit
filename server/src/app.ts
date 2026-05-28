import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { env } from './config/env';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { usersRouter } from './routes/users.routes';
import { submissionsRouter } from './routes/submissions.routes';
import { assignmentsRouter } from './routes/assignments.routes';
import { securityLogsRouter } from './routes/securityLogs.routes';
import { fileRouter } from './routes/file.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/security-logs', securityLogsRouter);
app.use('/api', fileRouter);  // file upload/download/delete endpoints

// NOTE: the uploads/ directory is intentionally NOT served via express.static.
// All file access goes through authenticated /api/files/:id/download endpoints.

app.use(errorHandler);

export { app };
