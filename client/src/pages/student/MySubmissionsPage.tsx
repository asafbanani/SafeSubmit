import { useState } from 'react';
import { BookOpen, Download, Trash2, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useApiFetch } from '../../hooks/useApiFetch';
import { submissionsApi, filesApi } from '../../services/api';
import type { Submission, UploadedFileRecord } from '../../services/api';

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'draft':        return 'badge-info';
    case 'submitted':    return 'badge-warning';
    case 'under_review': return 'badge-warning';
    case 'graded':       return 'badge-success';
    case 'returned':     return 'badge-success';
    default:             return 'badge-info';
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Per-submission file panel ─────────────────────────────────────────────────

interface FilePanelProps {
  submission: Submission;
}

function SubmissionFilePanel({ submission }: FilePanelProps) {
  const [expanded, setExpanded]     = useState(false);
  const [files, setFiles]           = useState<UploadedFileRecord[] | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileError, setFileError]   = useState<string | null>(null);

  async function toggle() {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (files !== null) return;
    setLoadingFiles(true);
    setFileError(null);
    try {
      const res = await filesApi.listSubmissionFiles(submission.id);
      setFiles(res.data.files);
    } catch (err: unknown) {
      let msg = 'Could not load files.';
      if (axios.isAxiosError(err)) {
        msg = (err.response?.data as { message?: string } | undefined)?.message ?? msg;
      }
      setFileError(msg);
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }

  async function handleDownload(fileId: string, filename: string) {
    try {
      await filesApi.downloadFile(fileId, filename);
    } catch {
      setFileError('Download failed. Please try again.');
    }
  }

  async function handleDelete(fileId: string, filename: string) {
    if (!window.confirm(`Delete "${filename}"?`)) return;
    try {
      await filesApi.deleteFile(fileId);
      setFiles(prev => prev?.filter(f => f.id !== fileId) ?? []);
    } catch {
      setFileError('Could not delete file. Please try again.');
    }
  }

  const isDraft = submission.status === 'draft';

  return (
    <td colSpan={5} style={{ padding: 0 }}>
      <button
        onClick={toggle}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Files
      </button>

      {expanded && (
        <div style={{ padding: '6px 16px 10px', borderTop: '1px solid var(--border)' }}>
          {fileError && <div className="alert alert-error" style={{ fontSize: 12, marginBottom: 8 }}>{fileError}</div>}

          {loadingFiles ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading…</div>
          ) : !files || files.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No files attached.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {files.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <FileText size={12} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.original_filename}>
                    {f.original_filename}
                  </span>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatBytes(f.file_size)}</span>
                  <button className="btn" style={{ padding: '2px 7px', fontSize: 11 }} title="Download" onClick={() => handleDownload(f.id, f.original_filename)}>
                    <Download size={11} />
                  </button>
                  {isDraft && (
                    <button className="btn" style={{ padding: '2px 7px', fontSize: 11, color: 'var(--error)' }} title="Delete" onClick={() => handleDelete(f.id, f.original_filename)}>
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </td>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function MySubmissionsPage() {
  const { data, loading, error } = useApiFetch<{ submissions: Submission[] }>(
    () => submissionsApi.getAll(),
  );

  const submissions = data?.submissions ?? [];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>My Submissions</h1>
          <p>Track the status of everything you've submitted. Click "Files" to see or download attached files.</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>
        )}

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            Loading submissions…
          </div>
        ) : submissions.length === 0 ? (
          <div className="card empty-state">
            <BookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>No submissions yet</h3>
            <p>Upload a file for an open assignment to create your first submission.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="log-table">
                <thead>
                  <tr>
                    <th>Submission ID</th>
                    <th>Assignment</th>
                    <th>Status</th>
                    <th>Submitted At</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(sub => (
                    <>
                      <tr key={sub.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {sub.id.slice(0, 8)}…
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {sub.assignment_id.slice(0, 8)}…
                        </td>
                        <td>
                          <span className={`badge ${statusBadgeClass(sub.status)}`}>
                            {sub.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '—'}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {new Date(sub.updated_at).toLocaleString()}
                        </td>
                      </tr>
                      <tr key={`${sub.id}-files`}>
                        <SubmissionFilePanel submission={sub} />
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
