import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { usersRouter } from './routes/users.routes';
import { submissionsRouter } from './routes/submissions.routes';
import { assignmentsRouter } from './routes/assignments.routes';
import { securityLogsRouter } from './routes/securityLogs.routes';
import { fileRouter } from './routes/file.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// ── Swagger UI — available only in non-production environments ────────────────
// Helmet's default CSP blocks the Swagger UI scripts, so we relax it only for
// this specific path. All other routes keep the strict default policy.
if (env.NODE_ENV !== 'production') {
  app.use(
    '/api-docs',
    // Swagger UI needs inline scripts/styles — loosen CSP for this route only
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc:  ["'self'", "'unsafe-inline'"],
          styleSrc:   ["'self'", "'unsafe-inline'"],
          imgSrc:     ["'self'", 'data:'],
        },
      },
    }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'SafeSubmit API Docs',
      swaggerOptions: {
        persistAuthorization: true, // JWT survives page refresh
        defaultModelsExpandDepth: 1,
        docExpansion: 'list',
      },
    }),
  );

  // Raw OpenAPI JSON — useful for importing into Postman or other tools
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

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
