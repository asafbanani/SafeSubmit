import { FileText } from 'lucide-react';

export function OpenSubmissionsPage() {
  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Open Submissions</h1>
          <p>Assignments currently accepting submissions.</p>
        </div>

        <div className="card empty-state">
          <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>No open submissions</h3>
          <p>When lecturers open assignment boxes, they'll appear here.</p>
        </div>
      </div>
    </div>
  );
}
