import { useState } from 'react';
import { Star, Download, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useApiFetch } from '../../hooks/useApiFetch';
import { submissionsApi, filesApi } from '../../services/api';
import type { Submission, UploadedFileRecord } from '../../services/api';

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Inline file list for a single submission ──────────────────────────────────

interface SubmissionFileListProps {
  submissionId: string;
}

function SubmissionFileList({ submissionId }: SubmissionFileListProps) {
  const [expanded, setExpanded]     = useState(false);
  const [files, setFiles]           = useState<UploadedFileRecord[] | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function toggle() {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (files !== null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await filesApi.listSubmissionFiles(submissionId);
      setFiles(res.data.files);
    } catch (err: unknown) {
      let msg = 'Could not load files.';
      if (axios.isAxiosError(err)) {
        msg = (err.response?.data as { message?: string } | undefined)?.message ?? msg;
      }
      setError(msg);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(fileId: string, filename: string) {
    try {
      await filesApi.downloadFile(fileId, filename);
    } catch {
      setError('Download failed.');
    }
  }

  return (
    <>
      <button
        onClick={toggle}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}
      >
        {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        Files
      </button>
      {expanded && (
        <div style={{ marginTop: 4, paddingLeft: 4 }}>
          {error && <div className="alert alert-error" style={{ fontSize: 11, marginBottom: 4 }}>{error}</div>}
          {loading ? (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Loading…</div>
          ) : !files || files.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No files.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {files.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <FileText size={11} style={{ flexShrink: 0 }} />
                  <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.original_filename}>
                    {f.original_filename}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{formatBytes(f.file_size)}</span>
                  <button
                    className="btn"
                    style={{ padding: '2px 6px', fontSize: 11 }}
                    title="Download"
                    onClick={() => handleDownload(f.id, f.original_filename)}
                  >
                    <Download size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ReviewSubmissionsPage() {
  const { data, loading, error } = useApiFetch<{ submissions: Submission[] }>(
    () => submissionsApi.getAll(),
  );

  const reviewable = data?.submissions.filter(
    s => s.status === 'submitted' || s.status === 'under_review',
  ) ?? [];

  const all = data?.submissions ?? [];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Review Submissions</h1>
          <p>Grade and provide feedback on student submissions. Click "Files" to download uploaded work.</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>
        )}

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            Loading submissions…
          </div>
        ) : all.length === 0 ? (
          <div className="card empty-state">
            <Star size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>Nothing to review</h3>
            <p>Student submissions awaiting your review will appear here.</p>
          </div>
        ) : (
          <>
            {reviewable.length > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                {reviewable.length} submission{reviewable.length !== 1 ? 's' : ''} awaiting review.
              </div>
            )}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="log-table">
                  <thead>
                    <tr>
                      <th>Submission ID</th>
                      <th>Assignment</th>
                      <th>Student</th>
                      <th>Status</th>
                      <th>Submitted At</th>
                      <th>Files</th>
                    </tr>
                  </thead>
                  <tbody>
                    {all.map(sub => (
                      <tr key={sub.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{sub.id.slice(0, 8)}…</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{sub.assignment_id.slice(0, 8)}…</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{sub.student_id.slice(0, 8)}…</td>
                        <td>
                          <span
                            className={`badge ${
                              sub.status === 'submitted' || sub.status === 'under_review'
                                ? 'badge-warning'
                                : sub.status === 'graded' || sub.status === 'returned'
                                ? 'badge-success'
                                : 'badge-info'
                            }`}
                          >
                            {sub.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '—'}
                        </td>
                        <td>
                          <SubmissionFileList submissionId={sub.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
