import path from 'path';

// Only these extensions are accepted anywhere in the system
export const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx']);

export const MIME_BY_EXT: Record<string, string> = {
  '.pdf':  'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// Real file signatures (magic bytes).
// Checked against the actual byte content — not just the extension or MIME header.
const MAGIC: Record<string, Buffer> = {
  '.pdf':  Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D]), // %PDF-
  '.docx': Buffer.from([0x50, 0x4B, 0x03, 0x04]),        // PK\x03\x04  (ZIP / Office Open XML)
};

export interface FileValidationResult {
  valid: boolean;
  mimeType: string;
  reason?: string;
}

/**
 * Validates a file held in memory (Buffer) against its declared extension.
 * Checks both the extension whitelist and the actual file signature.
 * Client-supplied MIME headers are ignored — only the bytes matter.
 */
export function validateFileType(buffer: Buffer, originalName: string): FileValidationResult {
  const ext = path.extname(originalName).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid:    false,
      mimeType: 'application/octet-stream',
      reason:   'File type not allowed. Only PDF and DOCX files are accepted.',
    };
  }

  const magic      = MAGIC[ext]!;
  const actualHead = buffer.slice(0, magic.length);

  if (!actualHead.equals(magic)) {
    return {
      valid:    false,
      mimeType: 'application/octet-stream',
      reason:   `File content does not match the declared extension (${ext}). Upload rejected.`,
    };
  }

  return { valid: true, mimeType: MIME_BY_EXT[ext] ?? 'application/octet-stream' };
}

/**
 * Strips directory components and keeps only filesystem-safe characters.
 * Protects the database from path traversal filenames like ../../etc/passwd.
 */
export function sanitizeOriginalFilename(name: string): string {
  const base = path.basename(name);          // drop any directory prefix
  return base
    .replace(/[^a-zA-Z0-9 ._-]/g, '_')      // only safe chars
    .replace(/\.{2,}/g, '.')                 // collapse multiple dots
    .replace(/\s+/g, '_')                    // spaces → underscores
    .slice(0, 255);                          // hard cap
}
