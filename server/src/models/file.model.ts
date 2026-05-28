import { randomUUID } from 'crypto';
import { getDb } from '../config/db';

export interface UploadedFile {
  id:                string;
  owner_user_id:     string;
  assignment_id:     string | null;
  submission_id:     string | null;
  original_filename: string;
  stored_filename:   string; // UUID-based disk name — never sent to clients
  mime_type:         string;
  file_size:         number;
  upload_type:       'assignment_file' | 'submission_file';
  uploaded_at:       string;
}

export interface CreateFileInput {
  owner_user_id:     string;
  assignment_id?:    string | null;
  submission_id?:    string | null;
  original_filename: string;
  stored_filename:   string;
  mime_type:         string;
  file_size:         number;
  upload_type:       'assignment_file' | 'submission_file';
}

const FileModel = {
  create(input: CreateFileInput): UploadedFile {
    const id = randomUUID();
    getDb().prepare(`
      INSERT INTO upload_files
        (id, owner_user_id, assignment_id, submission_id,
         original_filename, stored_filename, mime_type, file_size, upload_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.owner_user_id,
      input.assignment_id   ?? null,
      input.submission_id   ?? null,
      input.original_filename,
      input.stored_filename,
      input.mime_type,
      input.file_size,
      input.upload_type,
    );
    return FileModel.findById(id)!;
  },

  findById(id: string): UploadedFile | undefined {
    return getDb()
      .prepare('SELECT * FROM upload_files WHERE id = ?')
      .get(id) as UploadedFile | undefined;
  },

  findByAssignment(assignmentId: string): UploadedFile[] {
    return getDb()
      .prepare(`
        SELECT * FROM upload_files
        WHERE  assignment_id = ? AND upload_type = 'assignment_file'
        ORDER  BY uploaded_at DESC
      `)
      .all(assignmentId) as UploadedFile[];
  },

  findBySubmission(submissionId: string): UploadedFile[] {
    return getDb()
      .prepare(`
        SELECT * FROM upload_files
        WHERE  submission_id = ? AND upload_type = 'submission_file'
        ORDER  BY uploaded_at DESC
      `)
      .all(submissionId) as UploadedFile[];
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM upload_files WHERE id = ?').run(id);
  },
};

export default FileModel;
