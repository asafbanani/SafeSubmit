import { UserCheck } from 'lucide-react';

export function PendingApprovalsPage() {
  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Pending Lecturer Approvals</h1>
          <p>Review and approve or reject lecturer registration requests.</p>
        </div>

        <div className="card empty-state">
          <UserCheck size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>No pending approvals</h3>
          <p>When lecturers register, their requests appear here for you to approve or reject.</p>
        </div>
      </div>
    </div>
  );
}
