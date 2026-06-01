/**
 * @swagger
 * tags:
 *   name: Submissions
 *   description: Student submission management
 */

/**
 * @swagger
 * /api/submissions:
 *   get:
 *     summary: List submissions
 *     tags: [Submissions]
 *     description: |
 *       Returns submissions scoped by the caller's role:
 *       - **Student** — only their own submissions
 *       - **Lecturer** — submissions belonging to their assignments
 *       - **Teaching Assistant / Admin** — all submissions
 *     responses:
 *       200:
 *         description: List of submissions visible to the caller
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Submission'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a submission
 *     tags: [Submissions]
 *     description: |
 *       Creates a new submission for a published assignment.
 *
 *       **IDOR prevention:** `student_id` is always taken from the authenticated JWT —
 *       it is never accepted from the request body.
 *
 *       The assignment must have `status = published`. Students cannot submit to
 *       draft, closed, or archived assignments. **Student only.**
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubmissionRequest'
 *           example:
 *             assignment_id: "550e8400-e29b-41d4-a716-446655440000"
 *             submission_text: "My analysis of the vulnerability..."
 *     responses:
 *       201:
 *         description: Submission created (status = draft)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submission:
 *                   $ref: '#/components/schemas/Submission'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Only students may create submissions
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
 */

/**
 * @swagger
 * /api/submissions/{id}:
 *   get:
 *     summary: Get a submission by ID
 *     tags: [Submissions]
 *     description: |
 *       Returns the submission if the caller is permitted to see it.
 *       Access rules mirror `GET /api/submissions`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Submission found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submission:
 *                   $ref: '#/components/schemas/Submission'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not permitted to view this submission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Submission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   put:
 *     summary: Update a submission
 *     tags: [Submissions]
 *     description: |
 *       Update rules by role:
 *       - **Student** — can only update `submission_text` on their **own draft** submissions.
 *         Cannot edit after submitting.
 *       - **Lecturer / Teaching Assistant / Admin** — can update `status` (e.g. `under_review`,
 *         `graded`, `returned`). This drives the grading workflow.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSubmissionRequest'
 *           examples:
 *             student_update:
 *               summary: Student updates draft text
 *               value:
 *                 submission_text: "Revised answer..."
 *             lecturer_grade:
 *               summary: Lecturer/TA marks as graded
 *               value:
 *                 status: graded
 *     responses:
 *       200:
 *         description: Submission updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submission:
 *                   $ref: '#/components/schemas/Submission'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not permitted to update this submission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Submission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     summary: Delete a submission
 *     tags: [Submissions]
 *     description: |
 *       - **Student** — can delete their own **draft** submission only.
 *       - **Admin** — can delete any submission.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Submission deleted
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
 *         description: Not permitted (not owner, not admin, or submission is not a draft)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Submission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export {};
