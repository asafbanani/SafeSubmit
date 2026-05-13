import { Link } from 'react-router-dom';
import { FileText, PlusCircle, Calendar } from 'lucide-react';
import { useApiFetch } from '../../hooks/useApiFetch';
import { assignmentsApi } from '../../services/api';
import type { Assignment } from '../../services/api';

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'published': return 'badge-success';
    case 'closed':    return 'badge-error';
    case 'archived':  return 'badge-info';
    default:          return 'badge-info'; // draft
  }
}

export function ManageSubmissionBoxesPage() {
  const { data, loading, error } = useApiFetch<{ assignments: Assignment[] }>(
    () => assignmentsApi.getAll(),
  );

  // The backend already returns only the lecturer's own assignments
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
