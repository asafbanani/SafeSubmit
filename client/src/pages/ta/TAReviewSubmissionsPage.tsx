import { Star } from 'lucide-react';
import { useApiFetch } from '../../hooks/useApiFetch';
import { submissionsApi } from '../../services/api';
import type { Submission } from '../../services/api';

export function TAReviewSubmissionsPage() {
  const { data, loading, error } = useApiFetch<{ submissions: Submission[] }>(
    () => submissionsApi.getAll(),
  );

  const submissions = data?.submissions ?? [];
  const pending = submissions.filter(s => s.status === 'submitted' || s.status === 'under_review');

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Review Submissions</h1>
          <p>Grade and provide feedback on assigned student submissions.</p>
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
            <Star size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>Nothing to review</h3>
            <p>Student submissions assigned for your review will appear here.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                {pending.length} submission{pending.length !== 1 ? 's' : ''} awaiting review.
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
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(sub => (
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
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {new Date(sub.updated_at).toLocaleString()}
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
