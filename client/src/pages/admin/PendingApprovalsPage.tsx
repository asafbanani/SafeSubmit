import { UserCheck } from 'lucide-react';
import { useApiFetch } from '../../hooks/useApiFetch';
import { usersApi } from '../../services/api';
import type { SafeUser } from '../../services/api';

export function PendingApprovalsPage() {
  const { data, loading, error } = useApiFetch<{ users: SafeUser[] }>(
    () => usersApi.getAll(),
  );

  // Pending = users who registered but whose account status is 'pending'
  const pending = data?.users.filter(u => u.status === 'pending') ?? [];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Pending Approvals</h1>
          <p>Review and approve or reject lecturer registration requests.</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>
        )}

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            Loading…
          </div>
        ) : pending.length === 0 ? (
          <div className="card empty-state">
            <UserCheck size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>No pending approvals</h3>
            <p>When users register with a status requiring approval, their requests appear here.</p>
          </div>
        ) : (
          <>
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              {pending.length} account{pending.length !== 1 ? 's' : ''} awaiting approval.
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="log-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{u.email}</td>
                        <td>
                          <span className="badge badge-warning">
                            {u.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {new Date(u.created_at).toLocaleString()}
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
