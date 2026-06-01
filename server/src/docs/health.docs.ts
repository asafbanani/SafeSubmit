/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Server health check (public — no authentication required)
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     security: []
 *     description: |
 *       Returns the server status and confirms the API is reachable.
 *       No authentication required. Useful for monitoring and uptime checks.
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: SafeSubmit API is running
 */
export {};
