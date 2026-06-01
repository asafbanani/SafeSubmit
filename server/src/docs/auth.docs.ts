/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registration, login, logout, and password management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new account
 *     tags: [Auth]
 *     security: []
 *     description: |
 *       Creates a new user account. The `admin` role cannot be self-registered.
 *
 *       Lecturer accounts are created with **status = pending** and require admin
 *       approval before the user can log in.
 *
 *       **Password rules:** minimum 7 characters · at least one uppercase letter ·
 *       one lowercase letter · one special character.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             student:
 *               summary: Student registration
 *               value:
 *                 full_name: Alice Student
 *                 email: alice@example.com
 *                 password: Secret@1
 *                 role: student
 *             lecturer:
 *               summary: Lecturer registration (requires admin approval)
 *               value:
 *                 full_name: Diana Lecturer
 *                 email: diana@example.com
 *                 password: Teach@123
 *                 role: lecturer
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registration successful.
 *                 user:
 *                   $ref: '#/components/schemas/SafeUser'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Validation error (missing field, weak password, invalid role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in and receive a JWT
 *     tags: [Auth]
 *     security: []
 *     description: |
 *       Authenticates the user and returns a **JWT** valid for 15 minutes.
 *
 *       **Security notes:**
 *       - The error message is intentionally identical for wrong email and wrong password
 *         to prevent user-enumeration attacks (OWASP A07).
 *       - After **5** consecutive failures the account is locked for **15 minutes**.
 *       - bcrypt (cost 12) is run even for unknown emails to prevent timing attacks.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: admin@safesubmit.local
 *             password: Admin@123
 *     responses:
 *       200:
 *         description: Login successful — copy the token and use Authorize 🔒
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials or account locked/pending/deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_credentials:
 *                 value:
 *                   message: "Invalid credentials. 4 attempts remaining before lockout."
 *               locked:
 *                 value:
 *                   message: "Account is locked. Try again in 14 minutes."
 *               pending:
 *                 value:
 *                   message: "Your account is pending admin approval. Please wait for confirmation."
 *       422:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out (stateless — client must discard the token)
 *     tags: [Auth]
 *     security: []
 *     description: |
 *       JWT authentication is stateless; the server holds no session.
 *       This endpoint simply returns a success message as a signal to the client
 *       to clear the token from storage.
 *     responses:
 *       200:
 *         description: Logout acknowledged
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: Logged out successfully. Please discard your token.
 */

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change the authenticated user's password
 *     tags: [Auth]
 *     description: |
 *       Requires the current password for re-authentication before accepting the new one.
 *       The new password must satisfy the same complexity policy as registration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       401:
 *         description: Not authenticated or current password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       501:
 *         description: Not yet implemented
 */
export {};
