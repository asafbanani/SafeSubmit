import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { ALLOWED_EXTENSIONS } from '../utils/fileTypeValidator';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Resolved absolute path — safe to use with path.join / res.sendFile
export const UPLOADS_DIR = path.resolve(env.UPLOADS_PATH);
export const FILES_DIR   = path.join(UPLOADS_DIR, 'files');

export function ensureUploadsDir(): void {
  if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true });
}

// Memory storage: the file is held in req.file.buffer until the controller
// validates magic bytes and writes it to disk with a UUID filename.
// This avoids leaving partial or invalid files on disk if validation fails.
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    cb(new Error(`REJECTED_EXTENSION: Only PDF and DOCX files are accepted (got "${ext || 'no extension'}")`));
    return;
  }
  cb(null, true);
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_FILE_SIZE },
  fileFilter,
});
