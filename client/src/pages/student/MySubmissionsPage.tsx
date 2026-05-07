import { BookOpen } from 'lucide-react';

export function MySubmissionsPage() {
  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>My Submissions</h1>
          <p>Track the status of everything you've submitted.</p>
        </div>

        <div className="card empty-state">
          <BookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>No submissions yet</h3>
          <p>Your submitted assignments will appear here with their review status and grades.</p>
        </div>
      </div>
    </div>
  );
}
