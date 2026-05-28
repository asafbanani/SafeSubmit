import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, PlusCircle, Calendar, Upload, Download, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useApiFetch } from '../../hooks/useApiFetch';
import { assignmentsApi, filesApi } from '../../services/api';
import type { Assignment, UploadedFileRecord } from '../../services/api';

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'published': return 'badge-success';
    case 'closed':    return 'badge-error';
    case 'archived':  return 'badge-info';
    default:          return 'badge-info'; // draft
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Per-assignment file management panel ──────────────────────────────────────

interface AssignmentFilePanelProps {
  assignmentId: string;
}

function AssignmentFilePanel({ assignmentId }: AssignmentFilePanelProps) {
  const inputRef                  = useRef<HTMLInputElement>(null);
  const [selected, setSelected]   = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);
  const [files, setFiles]         = useState<UploadedFileRecord[] | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  async function openPanel() {
    if (!showPanel) {
      setShowPanel(true);
      if (files === null) {
        setLoadingFiles(true);
        try {
          const res = await filesApi.listAssignmentFiles(assignmentId);
          setFiles(res.data.files);
        } catch {
          setFiles([]);
        } finally {
          setLoadingFiles(false);
        }
      }
    } else {
      setShowPanel(false);
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
      const res = await filesApi.uploadAssignmentFile(assignmentId, selected);
      const { file } = res.data;
      setSuccess(`"${file.original_filename}" uploaded successfully.`);
      setSelected(null);
      if (inputRef.current) inputRef.current.value = '';
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
      setError('Could not delete file.');
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
    <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        className="btn"
        style={{ alignSelf: 'flex-start', fontSize: 13, padding: '5px 12px' }}
        onClick={openPanel}
      >
        <FileText size={13} /> {showPanel ? 'Hide Files' : 'Assignment Files'}
      </button>

      {showPanel && (
        <>
          {/* Hidden file input — triggered by the Upload button below */}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleSelect}
            style={{ display: 'none' }}
          />

          {/* Step 1: no file chosen — show the Upload button that opens the picker */}
          {!selected && !uploading && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ fontSize: 13, padding: '6px 14px' }}
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={13} /> Upload Instruction File
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

          {error   && <div className="alert alert-error"   style={{ fontSize: 13 }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ fontSize: 13 }}>{success}</div>}

          {loadingFiles ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading files…</div>
          ) : !files || files.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No instruction files uploaded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {files.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, background: 'var(--surface-2)', borderRadius: 6, padding: '6px 10px' }}>
                  <FileText size={13} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.original_filename}>
                    {f.original_filename}
                  </span>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatBytes(f.file_size)}</span>
                  <button className="btn" style={{ padding: '3px 8px', fontSize: 12 }} title="Download" onClick={() => handleDownload(f.id, f.original_filename)}>
                    <Download size={11} />
                  </button>
                  <button className="btn" style={{ padding: '3px 8px', fontSize: 12, color: 'var(--error)' }} title="Delete" onClick={() => handleDelete(f.id, f.original_filename)}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ManageSubmissionBoxesPage() {
  const { data, loading, error } = useApiFetch<{ assignments: Assignment[] }>(
    () => assignmentsApi.getAll(),
  );

  const assignments = data?.assignments ?? [];

  return (
    <div className="page">
      <div className="container">
        <div
          className="page-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}
        >
          <div>
            <h1>Submission Boxes</h1>
            <p>All assignment boxes you've created.</p>
          </div>
          <Link to="/lecturer/boxes/create" className="btn btn-primary">
            <PlusCircle size={15} /> New Box
          </Link>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>
        )}

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            Loading…
          </div>
        ) : assignments.length === 0 ? (
          <div className="card empty-state">
            <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>No submission boxes</h3>
            <p>Create your first submission box to start collecting student work.</p>
          </div>
        ) : (
          <div className="grid-2">
            {assignments.map(a => (
              <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <h3 style={{ fontSize: 16, margin: 0 }}>{a.title}</h3>
                  <span className={`badge ${statusBadgeClass(a.status)}`} style={{ flexShrink: 0 }}>
                    {a.status}
                  </span>
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

                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  ID: {a.id.slice(0, 16)}…
                </div>

                <AssignmentFilePanel assignmentId={a.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
