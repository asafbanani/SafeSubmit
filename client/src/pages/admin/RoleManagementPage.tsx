import { Settings } from 'lucide-react';

export function RoleManagementPage() {
  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Role Management</h1>
          <p>Assign and modify user roles across the system.</p>
        </div>

        <div className="card empty-state">
          <Settings size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>Role management coming soon</h3>
          <p>Once the Users API is live, you'll be able to change roles and review the change log here.</p>
        </div>
      </div>
    </div>
  );
}
