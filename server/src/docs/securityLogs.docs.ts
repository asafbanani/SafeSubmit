/**
 * @swagger
 * tags:
 *   name: Security Logs
 *   description: Audit and security event log — Admin only
 */

/**
 * @swagger
 * /api/security-logs:
 *   get:
 *     summary: List security / audit log entries
 *     tags: [Security Logs]
 *     description: |
 *       Returns paginated security events recorded by the system.
 *       Events include login successes/failures, unauthorized access attempts,
 *       account lockouts, file uploads, and admin operations.
 *
 *       **Admin only.**
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [info, warning, error, critical]
 *         description: Filter by severity level
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 50
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of records to skip (for pagination)
 *     responses:
 *       200:
 *         description: Paginated list of audit log entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *                 total:
 *                   type: integer
 *                   description: Total number of matching records (ignoring limit/offset)
 *                   example: 142
 *             example:
 *               total: 3
 *               logs:
 *                 - id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   user_id: null
 *                   action: "login_failure"
 *                   resource_type: "user"
 *                   resource_id: null
 *                   ip_address: "192.168.1.50"
 *                   status: "failure"
 *                   severity: "warning"
 *                   description: "Failed login attempt for unknown@example.com"
 *                   created_at: "2025-06-01T10:34:22Z"
 *                 - id: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
 *                   user_id: "c3d4e5f6-a7b8-9012-cdef-123456789012"
 *                   action: "login_success"
 *                   resource_type: "user"
 *                   resource_id: "c3d4e5f6-a7b8-9012-cdef-123456789012"
 *                   ip_address: "192.168.1.10"
 *                   status: "success"
 *                   severity: "info"
 *                   description: "User logged in successfully"
 *                   created_at: "2025-06-01T10:35:01Z"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/security-logs/{id}:
 *   get:
 *     summary: Get a single security log entry
 *     tags: [Security Logs]
 *     description: Returns the full details of one audit log entry. **Admin only.**
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Audit log entry UUID
 *     responses:
 *       200:
 *         description: Log entry found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 log:
 *                   $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Log entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export {};
