import { useRef, useState } from 'react';
import { FileText, Calendar, Upload, Download, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useApiFetch } from '../../hooks/useApiFetch';
import { assignmentsApi, filesApi } from '../../services/api';
import type { Assignment, UploadedFileRecord } from '../../services/api';

// ── Per-assignment upload panel ───────────────────────────────────────────────

interface UploadPanelProps {
  assignmentId: string;
}

function SubmissionUploadPanel({ assignmentId }: UploadPanelProps) {
  const inputRef                = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const [files, setFiles]       = useState<UploadedFileRecord[] | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  function formatBytes(bytes: number): string {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function loadFiles(subId: string) {
    setLoadingFiles(true);
    try {
      const res = await filesApi.listSubmissionFiles(subId);
      setFiles(res.data.files);
    } catch {
      // no submission yet — that's fine
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setSelected(f);
    setError(null);
    setSuccess(null);
  }

  async function handleUpload() {
    if (!selected) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await filesApi.uploadSubmissionFile(assignmentId, selected);
      const { file, submission_id } = res.data;
      setSuccess(`"${file.original_filename}" uploaded successfully.`);
      setSelected(null);
      if (inputRef.current) inputRef.current.value = '';
      setSubmissionId(submission_id);
      setFiles(prev => (prev ? [file, ...prev] : [file]));
    } catch (err: unknown) {
      let msg = 'Upload failed. Please try again.';
      if (axios.isAxiosError(err)) {
        msg = (err.response?.data as { message?: string } | undefined)?.message ?? msg;
      }
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileId: string, filename: string) {
    if (!window.confirm(`Delete "${filename}"?`)) return;
    try {
      await filesApi.deleteFile(fileId);
      setFiles(prev => prev?.filter(f => f.id !== fileId) ?? []);
    } catch {
      setError('Could not delete file. Please try again.');
    }
  }

  async function handleShowFiles() {
    if (files !== null) { setFiles(null); return; }
    // We may not know the submission ID yet — upload first to create one,
    // or attempt to load files for a submission we don't have the ID for.
    // Use the cached submissionId if we already have it.
    if (submissionId) {
      await loadFiles(submissionId);
    } else {
      setFiles([]);
    }
  }

  async function handleDownload(fileId: string, filename: string) {
    try {
      await filesApi.downloadFile(fileId, filename);
    } catch {
      setError('Download failed. Please try again.');
    }
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Submit a File</div>

      {/* Hidden file input — triggered by the Upload button below */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleSelect}
        style={{ display: 'none' }}
      />

      {/* Step 1: no file chosen yet — show the Upload button that opens the picker */}
      {!selected && !uploading && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: 13, padding: '6px 14px' }}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={13} /> Upload File
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF or DOCX · max 5 MB</span>
        </div>
      )}

      {/* Step 2: file chosen — show its details and a Confirm / Cancel row */}
      {selected && !uploading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={13} />
            <strong>{selected.name}</strong>
            <span style={{ color: 'var(--text-muted)' }}>({formatBytes(selected.size)})</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              style={{ fontSize: 13, padding: '6px 14px' }}
              onClick={handleUpload}
            >
              <Upload size={13} /> Confirm Upload
            </button>
            <button
              className="btn"
              style={{ fontSize: 13, padding: '6px 14px' }}
              onClick={() => { setSelected(null); if (inputRef.current) inputRef.current.value = ''; setError(null); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Uploading state */}
      {uploading && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Uploading…</div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          className="btn"
          style={{ fontSize: 13, padding: '6px 14px' }}
          onClick={handleShowFiles}
        >
          {files !== null ? 'Hide Files' : 'My Files'}
        </button>
      </div>

      {error   && <div className="alert alert-error"   style={{ fontSize: 13 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ fontSize: 13 }}>{success}</div>}

      {files !== null && (
        <div style={{ marginTop: 4 }}>
          {loadingFiles ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading files…</div>
          ) : files.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No files uploaded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {files.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, background: 'var(--surface-2)', borderRadius: 6, padding: '6px 10px' }}>
                  <FileText size={13} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.original_filename}>
                    {f.original_filename}
                  </span>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatBytes(f.file_size)}</span>
                  <button className="btn" style={{ padding: '3px 8px', fontSize: 12 }} onClick={() => handleDownload(f.id, f.original_filename)}>
                    <Download size={11} />
                  </button>
                  <button className="btn" style={{ padding: '3px 8px', fontSize: 12, color: 'var(--error)' }} onClick={() => handleDelete(f.id, f.original_filename)}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function OpenSubmissionsPage() {
  const { data, loading, error } = useApiFetch<{ assignments: Assignment[] }>(
    () => assignmentsApi.getAll(),
  );

  const open = data?.assignments.filter(a => a.status === 'published') ?? [];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Open Submissions</h1>
          <p>Assignments currently accepting submissions.</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>
        )}

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            Loading assignments…
          </div>
        ) : open.length === 0 ? (
          <div className="card empty-state">
            <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>No open submissions</h3>
            <p>When lecturers open assignment boxes, they'll appear here.</p>
          </div>
        ) : (
          <div className="grid-2">
            {open.map(a => (
              <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <h3 style={{ fontSize: 16, margin: 0 }}>{a.title}</h3>
                  <span className="badge badge-success" style={{ flexShrink: 0 }}>Open</span>
                </div>

                {a.description && (
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {a.description}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                  <Calendar size={13} />
                  Due: <strong>{new Date(a.due_date).toLocaleDateString()}</strong>
                </div>

                {a.max_score != null && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Max score: {a.max_score}
                  </div>
                )}

                {a.allow_late_submission ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>✓ Late submissions allowed</div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>✗ No late submissions</div>
                )}

                <SubmissionUploadPanel assignmentId={a.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
