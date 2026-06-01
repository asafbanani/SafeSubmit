/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File upload, download, and deletion for assignments and submissions (PDF/DOCX only, max 5 MB)
 */

/**
 * @swagger
 * /api/assignments/{assignmentId}/files:
 *   post:
 *     summary: Upload an instruction file for an assignment
 *     tags: [Files]
 *     description: |
 *       Lecturers upload instruction/brief files for their own assignments.
 *       Admins can upload for any assignment.
 *
 *       **Allowed file types:** `.pdf`, `.docx` (enforced by extension AND magic-byte
 *       validation — the raw bytes are inspected server-side before the file is stored).
 *
 *       **Max size:** 5 MB.
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF or DOCX file, max 5 MB
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 file:
 *                   $ref: '#/components/schemas/UploadedFile'
 *       400:
 *         description: Rejected file type or magic-byte mismatch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not the assignment owner and not admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       413:
 *         description: File exceeds 5 MB limit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   get:
 *     summary: List instruction files for an assignment
 *     tags: [Files]
 *     description: Returns all instruction files attached to the assignment. Any authenticated user may list them.
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UploadedFile'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/assignments/{assignmentId}/submissions/upload:
 *   post:
 *     summary: Upload a file for a student submission
 *     tags: [Files]
 *     description: |
 *       Students upload their submission file (PDF or DOCX). A new `submission` record
 *       is created automatically if one does not yet exist for this student + assignment.
 *
 *       **IDOR prevention:** `student_id` is taken from the JWT — it cannot be spoofed.
 *
 *       **Allowed types:** `.pdf`, `.docx` — validated by extension **and** magic bytes.
 *
 *       **Max size:** 5 MB. **Student only.**
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF or DOCX file, max 5 MB
 *     responses:
 *       201:
 *         description: File uploaded and submission record created/updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 file:
 *                   $ref: '#/components/schemas/UploadedFile'
 *                 submission:
 *                   $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Rejected file type, magic-byte mismatch, or no file attached
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Only students may upload submission files
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Assignment not found or not published
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       413:
 *         description: File exceeds 5 MB limit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/submissions/{submissionId}/files:
 *   get:
 *     summary: List files attached to a submission
 *     tags: [Files]
 *     description: |
 *       Returns all files uploaded for a given submission.
 *       Access follows the same scoping rules as `GET /api/submissions/{id}`.
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UploadedFile'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not permitted to access this submission's files
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/files/{fileId}/download:
 *   get:
 *     summary: Download a file
 *     tags: [Files]
 *     description: |
 *       Streams the file to the client with its original filename in the
 *       `Content-Disposition` header.
 *
 *       Fine-grained access control is enforced inside the controller based on
 *       file type (instruction vs. submission), ownership, and related resource state.
 *
 *       **Note:** The stored filename on disk is a UUID — the original filename is
 *       never used as a path component, preventing path-traversal attacks.
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not permitted to download this file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/files/{fileId}:
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 *     description: |
 *       Deletes the file record and removes the physical file from disk.
 *       Only the uploader (while the linked submission/assignment is still editable)
 *       or an admin may delete a file.
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not permitted to delete this file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export {};
