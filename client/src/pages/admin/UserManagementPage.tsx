import { Users } from 'lucide-react';
import { useApiFetch } from '../../hooks/useApiFetch';
import { usersApi } from '../../services/api';
import type { SafeUser } from '../../services/api';

function roleBadgeClass(role: string): string {
  switch (role) {
    case 'admin':               return 'badge-error';
    case 'lecturer':            return 'badge-warning';
    case 'teaching_assistant':  return 'badge-info';
    default:                    return 'badge-info'; // student
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'active':    return 'badge-success';
    case 'pending':   return 'badge-warning';
    case 'suspended': return 'badge-error';
    case 'locked':    return 'badge-error';
    default:          return 'badge-info';
  }
}

export function UserManagementPage() {
  const { data, loading, error } = useApiFetch<{ users: SafeUser[] }>(
    () => usersApi.getAll(),
  );

  const users = data?.users ?? [];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>User Management</h1>
          <p>View, search, and manage all registered accounts.</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>
        )}

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            Loading users…
          </div>
        ) : users.length === 0 ? (
          <div className="card empty-state">
            <Users size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>No users found</h3>
            <p>Registered users will appear here.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="log-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Failed Attempts</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{u.email}</td>
                      <td>
                        <span className={`badge ${roleBadgeClass(u.role)}`}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass(u.status)}`}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : '—'}
                      </td>
                      <td style={{ fontSize: 13, textAlign: 'center' }}>
                        {u.failed_login_attempts > 0 ? (
                          <span style={{ color: u.failed_login_attempts >= 3 ? '#ef4444' : 'inherit' }}>
                            {u.failed_login_attempts}
                          </span>
                        ) : '0'}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
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
