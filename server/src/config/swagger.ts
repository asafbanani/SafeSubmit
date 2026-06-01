import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SafeSubmit API',
      version: '1.0.0',
      description: `
## SafeSubmit — Secure Academic Assignment Portal

REST API for managing course assignments, student submissions, file uploads,
user accounts, and system security logs.

### Security model
- All protected routes require a **Bearer JWT** token obtained from \`POST /api/auth/login\`.
- Tokens expire after **15 minutes**.
- Use the **Authorize** button (🔒) at the top of this page to set your token once,
  then all protected endpoints will include it automatically.

### Roles
| Role | Key permissions |
|---|---|
| \`student\` | Read published assignments · create/update own submissions · upload own files |
| \`lecturer\` | CRUD own assignments · read submissions for own assignments · upload instruction files |
| \`teaching_assistant\` | Read all submissions · update submission status |
| \`admin\` | Full access to all resources + security logs + user management |

### Password policy
Minimum 7 characters · at least one uppercase · one lowercase · one special character.
      `.trim(),
      contact: {
        name: 'SafeSubmit Dev Team',
      },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste the JWT token returned by **POST /api/auth/login** (without the "Bearer " prefix).',
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['full_name', 'email', 'password', 'role'],
          properties: {
            full_name: { type: 'string', example: 'Alice Student' },
            email:     { type: 'string', format: 'email', example: 'alice@example.com' },
            password:  { type: 'string', minLength: 7, example: 'Secret@1',
                         description: 'Min 7 chars · uppercase · lowercase · special character' },
            role:      { type: 'string', enum: ['student', 'lecturer', 'teaching_assistant'],
                         example: 'student' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'alice@example.com' },
            password: { type: 'string', example: 'Secret@1' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'JWT — expires in 15 minutes',
                     example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['current_password', 'new_password'],
          properties: {
            current_password: { type: 'string', example: 'OldPass@1' },
            new_password:     { type: 'string', minLength: 7, example: 'NewPass@2' },
          },
        },
        // ── User ─────────────────────────────────────────────────────────────
        SafeUser: {
          type: 'object',
          description: 'User record — password_hash is never included in API responses',
          properties: {
            id:                     { type: 'string', format: 'uuid' },
            full_name:              { type: 'string', example: 'Alice Student' },
            email:                  { type: 'string', format: 'email' },
            role:                   { type: 'string', enum: ['student', 'lecturer', 'teaching_assistant', 'admin'] },
            status:                 { type: 'string', enum: ['active', 'pending', 'locked', 'deactivated'] },
            is_active:              { type: 'integer', enum: [0, 1] },
            last_login_at:          { type: 'string', format: 'date-time', nullable: true },
            failed_login_attempts:  { type: 'integer', example: 0 },
            locked_until:           { type: 'string', format: 'date-time', nullable: true },
            approved_by:            { type: 'string', format: 'uuid', nullable: true },
            approved_at:            { type: 'string', format: 'date-time', nullable: true },
            created_at:             { type: 'string', format: 'date-time' },
            updated_at:             { type: 'string', format: 'date-time' },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            full_name: { type: 'string', example: 'Alice B. Student',
                         description: 'Any user can update their own name' },
            role:      { type: 'string', enum: ['student', 'lecturer', 'teaching_assistant', 'admin'],
                         description: 'Admin only' },
            status:    { type: 'string', enum: ['active', 'pending', 'locked', 'deactivated'],
                         description: 'Admin only' },
          },
        },
        // ── Assignment ────────────────────────────────────────────────────────
        Assignment: {
          type: 'object',
          properties: {
            id:                     { type: 'string', format: 'uuid' },
            lecturer_id:            { type: 'string', format: 'uuid' },
            title:                  { type: 'string', example: 'Midterm Assignment' },
            description:            { type: 'string', nullable: true, example: 'Submit your analysis report.' },
            due_date:               { type: 'string', format: 'date-time', example: '2025-07-01T23:59:00Z' },
            status:                 { type: 'string', enum: ['draft', 'published', 'closed', 'archived'] },
            max_score:              { type: 'number', nullable: true, example: 100 },
            allow_late_submission:  { type: 'integer', enum: [0, 1], example: 0 },
            created_at:             { type: 'string', format: 'date-time' },
            updated_at:             { type: 'string', format: 'date-time' },
          },
        },
        CreateAssignmentRequest: {
          type: 'object',
          required: ['title', 'due_date'],
          properties: {
            title:                  { type: 'string', example: 'Final Project' },
            description:            { type: 'string', example: 'Write a security analysis.' },
            due_date:               { type: 'string', format: 'date-time', example: '2025-08-01T23:59:00Z' },
            status:                 { type: 'string', enum: ['draft', 'published'], default: 'draft' },
            max_score:              { type: 'number', example: 100 },
            allow_late_submission:  { type: 'integer', enum: [0, 1], default: 0 },
          },
        },
        // ── Submission ────────────────────────────────────────────────────────
        Submission: {
          type: 'object',
          properties: {
            id:               { type: 'string', format: 'uuid' },
            assignment_id:    { type: 'string', format: 'uuid' },
            student_id:       { type: 'string', format: 'uuid',
                                description: 'Always the authenticated student — never accepted from request body' },
            file_path:        { type: 'string', nullable: true },
            submission_text:  { type: 'string', nullable: true },
            status:           { type: 'string', enum: ['draft', 'submitted', 'under_review', 'graded', 'returned'] },
            submitted_at:     { type: 'string', format: 'date-time', nullable: true },
            created_at:       { type: 'string', format: 'date-time' },
            updated_at:       { type: 'string', format: 'date-time' },
          },
        },
        CreateSubmissionRequest: {
          type: 'object',
          required: ['assignment_id'],
          properties: {
            assignment_id:    { type: 'string', format: 'uuid' },
            submission_text:  { type: 'string', example: 'My answer to the assignment...' },
          },
        },
        UpdateSubmissionRequest: {
          type: 'object',
          properties: {
            submission_text: { type: 'string',
                               description: 'Students can update text on their own draft submissions' },
            status:          { type: 'string', enum: ['submitted', 'under_review', 'graded', 'returned'],
                               description: 'Lecturers/TAs/admins update status for grading workflow' },
          },
        },
        // ── File ─────────────────────────────────────────────────────────────
        UploadedFile: {
          type: 'object',
          properties: {
            id:                { type: 'string', format: 'uuid' },
            uploader_id:       { type: 'string', format: 'uuid' },
            assignment_id:     { type: 'string', format: 'uuid', nullable: true },
            submission_id:     { type: 'string', format: 'uuid', nullable: true },
            original_filename: { type: 'string', example: 'assignment_brief.pdf' },
            stored_filename:   { type: 'string', example: 'a1b2c3d4-e5f6.pdf',
                                 description: 'UUID-based name on disk — never reveals the original path' },
            mime_type:         { type: 'string', example: 'application/pdf' },
            file_size:         { type: 'integer', example: 204800,
                                 description: 'Size in bytes (max 5 MB = 5,242,880)' },
            created_at:        { type: 'string', format: 'date-time' },
          },
        },
        // ── Security Log ──────────────────────────────────────────────────────
        AuditLog: {
          type: 'object',
          properties: {
            id:            { type: 'string', format: 'uuid' },
            user_id:       { type: 'string', format: 'uuid', nullable: true },
            action:        { type: 'string', example: 'login_failure' },
            resource_type: { type: 'string', nullable: true, example: 'user' },
            resource_id:   { type: 'string', nullable: true },
            ip_address:    { type: 'string', nullable: true, example: '192.168.1.1' },
            status:        { type: 'string', example: 'failure' },
            severity:      { type: 'string', enum: ['info', 'warning', 'error', 'critical'] },
            description:   { type: 'string', nullable: true },
            created_at:    { type: 'string', format: 'date-time' },
          },
        },
        // ── Shared ────────────────────────────────────────────────────────────
        MessageResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Unauthorized' },
          },
        },
      },
    },
    // Applied globally — individual routes that are public will override with security: []
    security: [{ bearerAuth: [] }],
  },
  // Tell swagger-jsdoc where to find JSDoc @swagger comment blocks
  apis: ['./src/routes/*.ts', './src/docs/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
