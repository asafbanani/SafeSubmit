import { Star } from 'lucide-react';

export function ReviewSubmissionsPage() {
  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Review Submissions</h1>
          <p>Grade and provide feedback on student submissions.</p>
        </div>

        <div className="card empty-state">
          <Star size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>Nothing to review</h3>
          <p>Student submissions awaiting your review will appear here.</p>
        </div>
      </div>
    </div>
  );
}
