import { BookOpen } from 'lucide-react';

export function MyCoursesPage() {
  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>My Courses</h1>
          <p>All courses you are responsible for.</p>
        </div>

        <div className="card empty-state">
          <BookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>No courses yet</h3>
          <p>Courses assigned to you will appear here.</p>
        </div>
      </div>
    </div>
  );
}
