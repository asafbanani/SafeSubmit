import { Users } from 'lucide-react';

export function UserManagementPage() {
  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>User Management</h1>
          <p>View, search, and manage all registered accounts.</p>
        </div>

        <div className="card empty-state">
          <Users size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>No data yet</h3>
          <p>All registered users will appear here once the Users API is connected.</p>
        </div>
      </div>
    </div>
  );
}
