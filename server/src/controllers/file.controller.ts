import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { getDb } from '../config/db';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/AppError';
import { validateFileType, sanitizeOriginalFilename } from '../utils/fileTypeValidator';
import { FILES_DIR, ensureUploadsDir } from '../middlewares/upload.middleware';
import FileModel, { type UploadedFile } from '../models/file.model';
import { auditLog } from '../utils/auditLogger';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Public shape sent to clients — stored_filename (physical disk path component)
 * is stripped so the real file location is never revealed.
 */
type PublicFile = Omit<UploadedFile, 'stored_filename'>;

function toPublic(f: UploadedFile): PublicFile {
  const { stored_filename: _omit, ...pub } = f;
  return pub;
}

function deletePhysicalFile(storedFilename: string): void {
  try {
    const fp = path.join(FILES_DIR, storedFilename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  } catch {
    console.error(`[file] Failed to delete physical file: ${storedFilename}`);
  }
}

/**
 * Validates the in-memory buffer, writes it to disk with a UUID name.
 * Returns the stored filename or throws a ValidationError.
 * Caller is responsible for deleting on subsequent failure.
 */
function persistFile(multerFile: Express.Multer.File): { storedFilename: string; mimeType: string } {
  const validation = validateFileType(multerFile.buffer, multerFile.originalname);
  if (!validation.valid) {
    throw new ValidationError(validation.reason ?? 'File type validation failed');
  }

  ensureUploadsDir();
  const ext            = path.extname(multerFile.originalname).toLowerCase();
  const storedFilename = `${randomUUID()}${ext}`;
  fs.writeFileSync(path.join(FILES_DIR, storedFilename), multerFile.buffer);

  return { storedFilename, mimeType: validation.mimeType };
}

// ── POST /api/assignments/:assignmentId/files ─────────────────────────────────
// Lecturer or admin uploads an instruction file for an assignment.

export function uploadAssignmentFile(req: Request, res: Response, next: NextFunction): void {
  const multerFile = req.file;
  if (!multerFile) {
    next(new ValidationError('No file provided. Attach a file using the field name "file".'));
    return;
  }

  const assignmentId = req.params['assignmentId'] as string;
  const { id: uid, role } = req.user!;
  const ip = req.ip ?? null;

  try {
    const db = getDb();

    const assignment = db
      .prepare('SELECT id, lecturer_id FROM assignments WHERE id = ?')
      .get(assignmentId) as { id: string; lecturer_id: string } | undefined;

    if (!assignment) {
      next(new NotFoundError('Assignment not found'));
      return;
    }

    if (role === 'lecturer' && assignment.lecturer_id !== uid) {
      auditLog({ userId: uid, action: 'upload_rejected', resourceType: 'assignment', resourceId: assignmentId, ipAddress: ip, status: 'failure', severity: 'warning', description: 'Lecturer tried to upload to another lecturer\'s assignment' });
      next(new ForbiddenError('You can only upload files to your own assignments'));
      return;
    }

    let storedFilename: string;
    let mimeType: string;
    try {
      ({ storedFilename, mimeType } = persistFile(multerFile));
    } catch (err) {
      if (err instanceof ValidationError) {
        auditLog({ userId: uid, action: 'upload_rejected', resourceType: 'assignment', resourceId: assignmentId, ipAddress: ip, status: 'failure', severity: 'warning', description: err.message });
      }
      next(err);
      return;
    }

    const sanitized = sanitizeOriginalFilename(multerFile.originalname);

    let fileRecord: UploadedFile;
    try {
      fileRecord = FileModel.create({
        owner_user_id:     uid,
        assignment_id:     assignmentId,
        submission_id:     null,
        original_filename: sanitized,
        stored_filename:   storedFilename,
        mime_type:         mimeType,
        file_size:         multerFile.size,
        upload_type:       'assignment_file',
      });
    } catch (dbErr) {
      deletePhysicalFile(storedFilename);
      throw dbErr;
    }

    auditLog({ userId: uid, action: 'file_uploaded', resourceType: 'assignment', resourceId: assignmentId, ipAddress: ip, status: 'success', severity: 'info', description: `Assignment file uploaded: ${sanitized}` });
    res.status(201).json({ file: toPublic(fileRecord) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/assignments/:assignmentId/files ──────────────────────────────────
// List instruction files for an assignment.

export function listAssignmentFiles(req: Request, res: Response, next: NextFunction): void {
  const assignmentId = req.params['assignmentId'] as string;
  const { role, id: uid } = req.user!;

  try {
    const db = getDb();

    const assignment = db
      .prepare('SELECT id, lecturer_id, status FROM assignments WHERE id = ?')
      .get(assignmentId) as { id: string; lecturer_id: string; status: string } | undefined;

    if (!assignment) {
      next(new NotFoundError('Assignment not found'));
      return;
    }

    // Students may only see files from published assignments
    if (role === 'student' && assignment.status !== 'published') {
      next(new NotFoundError('Assignment not found'));
      return;
    }

    // Lecturers may only see files for their own assignments
    if (role === 'lecturer' && assignment.lecturer_id !== uid) {
      next(new NotFoundError('Assignment not found'));
      return;
    }

    const files = FileModel.findByAssignment(assignmentId);
    res.json({ files: files.map(toPublic) });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/assignments/:assignmentId/submissions/upload ────────────────────
// Student uploads a file for a submission.
// Creates a draft submission for this assignment if one does not yet exist.

export function uploadSubmissionFile(req: Request, res: Response, next: NextFunction): void {
  const multerFile = req.file;
  if (!multerFile) {
    next(new ValidationError('No file provided. Attach a file using the field name "file".'));
    return;
  }

  const assignmentId = req.params['assignmentId'] as string;
  const { id: uid }  = req.user!;
  const ip = req.ip ?? null;

  try {
    const db = getDb();

    const assignment = db
      .prepare('SELECT id, status FROM assignments WHERE id = ?')
      .get(assignmentId) as { id: string; status: string } | undefined;

    if (!assignment) {
      next(new NotFoundError('Assignment not found'));
      return;
    }

    if (assignment.status !== 'published') {
      next(new ValidationError('This assignment is not currently accepting submissions'));
      return;
    }

    // Find existing submission or create a new draft
    let submission = db
      .prepare('SELECT id, status FROM submissions WHERE assignment_id = ? AND student_id = ?')
      .get(assignmentId, uid) as { id: string; status: string } | undefined;

    if (!submission) {
      const newId = randomUUID();
      db.prepare(`
        INSERT INTO submissions (id, assignment_id, student_id, status)
        VALUES (?, ?, ?, 'draft')
      `).run(newId, assignmentId, uid);
      submission = { id: newId, status: 'draft' };
    }

    if (submission.status !== 'draft') {
      next(new ForbiddenError('Files can only be added to draft submissions'));
      return;
    }

    let storedFilename: string;
    let mimeType: string;
    try {
      ({ storedFilename, mimeType } = persistFile(multerFile));
    } catch (err) {
      if (err instanceof ValidationError) {
        auditLog({ userId: uid, action: 'upload_rejected', resourceType: 'submission', resourceId: submission.id, ipAddress: ip, status: 'failure', severity: 'warning', description: err.message });
      }
      next(err);
      return;
    }

    const sanitized = sanitizeOriginalFilename(multerFile.originalname);

    let fileRecord: UploadedFile;
    try {
      fileRecord = FileModel.create({
        owner_user_id:     uid,
        assignment_id:     assignmentId,
        submission_id:     submission.id,
        original_filename: sanitized,
        stored_filename:   storedFilename,
        mime_type:         mimeType,
        file_size:         multerFile.size,
        upload_type:       'submission_file',
      });
    } catch (dbErr) {
      deletePhysicalFile(storedFilename);
      throw dbErr;
    }

    auditLog({ userId: uid, action: 'file_uploaded', resourceType: 'submission', resourceId: submission.id, ipAddress: ip, status: 'success', severity: 'info', description: `Submission file uploaded: ${sanitized}` });
    res.status(201).json({ file: toPublic(fileRecord), submission_id: submission.id });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/submissions/:submissionId/files ──────────────────────────────────
// List files attached to a submission.

export function listSubmissionFiles(req: Request, res: Response, next: NextFunction): void {
  const submissionId = req.params['submissionId'] as string;
  const { role, id: uid } = req.user!;

  try {
    const db = getDb();

    const submission = db
      .prepare('SELECT id, student_id, assignment_id FROM submissions WHERE id = ?')
      .get(submissionId) as { id: string; student_id: string; assignment_id: string } | undefined;

    if (!submission) {
      next(new NotFoundError('Submission not found'));
      return;
    }

    let canAccess = false;
    if (role === 'admin' || role === 'teaching_assistant') {
      canAccess = true;
    } else if (role === 'student') {
      canAccess = submission.student_id === uid;
    } else if (role === 'lecturer') {
      const a = db
        .prepare('SELECT lecturer_id FROM assignments WHERE id = ?')
        .get(submission.assignment_id) as { lecturer_id: string } | undefined;
      canAccess = a?.lecturer_id === uid;
    }

    // Return 404 (not 403) so the submission existence is not revealed to unauthorised callers
    if (!canAccess) {
      next(new NotFoundError('Submission not found'));
      return;
    }

    const files = FileModel.findBySubmission(submissionId);
    res.json({ files: files.map(toPublic) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/files/:fileId/download ──────────────────────────────────────────
// Streams the physical file to the authenticated caller if they have access.
// Always sets Content-Disposition: attachment to force download, not inline render.
// Returns 404 (not 403) for unauthorised access to prevent file-existence leakage.

export function downloadFile(req: Request, res: Response, next: NextFunction): void {
  const fileId = req.params['fileId'] as string;
  const { role, id: uid } = req.user!;
  const ip = req.ip ?? null;

  try {
    const db = getDb();

    const fileRecord = FileModel.findById(fileId);
    if (!fileRecord) {
      auditLog({ userId: uid, action: 'download_rejected', resourceType: 'file', resourceId: fileId, ipAddress: ip, status: 'failure', severity: 'warning', description: 'Download attempt on non-existent file ID' });
      next(new NotFoundError('File not found'));
      return;
    }

    let canAccess = false;

    if (role === 'admin') {
      canAccess = true;

    } else if (fileRecord.upload_type === 'assignment_file') {
      if (role === 'teaching_assistant') {
        canAccess = true;
      } else if (role === 'student' && fileRecord.assignment_id) {
        const a = db
          .prepare('SELECT status FROM assignments WHERE id = ?')
          .get(fileRecord.assignment_id) as { status: string } | undefined;
        canAccess = a?.status === 'published';
      } else if (role === 'lecturer' && fileRecord.assignment_id) {
        const a = db
          .prepare('SELECT lecturer_id FROM assignments WHERE id = ?')
          .get(fileRecord.assignment_id) as { lecturer_id: string } | undefined;
        canAccess = a?.lecturer_id === uid;
      }

    } else { // submission_file
      if (role === 'teaching_assistant') {
        canAccess = true;
      } else if (role === 'student') {
        canAccess = fileRecord.owner_user_id === uid;
      } else if (role === 'lecturer' && fileRecord.assignment_id) {
        const a = db
          .prepare('SELECT lecturer_id FROM assignments WHERE id = ?')
          .get(fileRecord.assignment_id) as { lecturer_id: string } | undefined;
        canAccess = a?.lecturer_id === uid;
      }
    }

    if (!canAccess) {
      auditLog({ userId: uid, action: 'download_rejected', resourceType: 'file', resourceId: fileId, ipAddress: ip, status: 'failure', severity: 'warning', description: `Unauthorised download attempt — role: ${role}` });
      next(new NotFoundError('File not found'));
      return;
    }

    const physicalPath = path.join(FILES_DIR, fileRecord.stored_filename);

    if (!fs.existsSync(physicalPath)) {
      console.error(`[file] Physical file missing for record ${fileId}: ${fileRecord.stored_filename}`);
      next(new NotFoundError('File not found'));
      return;
    }

    auditLog({ userId: uid, action: 'file_downloaded', resourceType: 'file', resourceId: fileId, ipAddress: ip, status: 'success', severity: 'info', description: `Downloaded: ${fileRecord.original_filename}` });

    res.setHeader('Content-Type', fileRecord.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.original_filename}"`);
    res.setHeader('Content-Length', String(fileRecord.file_size));

    // sendFile requires an absolute path — FILES_DIR is already absolute
    res.sendFile(physicalPath);
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/files/:fileId ─────────────────────────────────────────────────
// Deletes the physical file then the DB record.
// Returns 404 for unauthorised access (not 403) to avoid revealing file existence.

export function deleteFile(req: Request, res: Response, next: NextFunction): void {
  const fileId = req.params['fileId'] as string;
  const { role, id: uid } = req.user!;
  const ip = req.ip ?? null;

  try {
    const db = getDb();

    const fileRecord = FileModel.findById(fileId);
    if (!fileRecord) {
      next(new NotFoundError('File not found'));
      return;
    }

    let canDelete = false;

    if (role === 'admin') {
      canDelete = true;

    } else if (fileRecord.upload_type === 'assignment_file') {
      if (role === 'lecturer' && fileRecord.assignment_id) {
        const a = db
          .prepare('SELECT lecturer_id FROM assignments WHERE id = ?')
          .get(fileRecord.assignment_id) as { lecturer_id: string } | undefined;
        canDelete = a?.lecturer_id === uid;
      }

    } else { // submission_file — student may delete own file only while submission is draft
      if (role === 'student' && fileRecord.owner_user_id === uid && fileRecord.submission_id) {
        const sub = db
          .prepare('SELECT status FROM submissions WHERE id = ?')
          .get(fileRecord.submission_id) as { status: string } | undefined;
        canDelete = sub?.status === 'draft';
      }
    }

    if (!canDelete) {
      auditLog({ userId: uid, action: 'delete_rejected', resourceType: 'file', resourceId: fileId, ipAddress: ip, status: 'failure', severity: 'warning', description: `Unauthorised delete attempt — role: ${role}` });
      next(new NotFoundError('File not found'));
      return;
    }

    deletePhysicalFile(fileRecord.stored_filename);
    FileModel.delete(fileId);

    auditLog({ userId: uid, action: 'file_deleted', resourceType: 'file', resourceId: fileId, ipAddress: ip, status: 'success', severity: 'info', description: `Deleted: ${fileRecord.original_filename}` });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
