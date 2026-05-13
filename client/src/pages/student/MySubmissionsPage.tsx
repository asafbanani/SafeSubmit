import { BookOpen } from 'lucide-react';
import { useApiFetch } from '../../hooks/useApiFetch';
import { submissionsApi } from '../../services/api';
import type { Submission } from '../../services/api';

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
          <p>Track the status of everything you've submitted.</p>
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
            <p>Your submitted assignments will appear here with their review status and grades.</p>
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
