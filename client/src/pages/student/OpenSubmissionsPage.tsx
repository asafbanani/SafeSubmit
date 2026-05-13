import { Link } from 'react-router-dom';
import { FileText, Calendar, ArrowRight } from 'lucide-react';
import { useApiFetch } from '../../hooks/useApiFetch';
import { assignmentsApi } from '../../services/api';
import type { Assignment } from '../../services/api';

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

                <Link to="/submissions/mine" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  Submit <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
