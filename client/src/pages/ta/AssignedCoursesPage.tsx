import { BookOpen } from 'lucide-react';

export function AssignedCoursesPage() {
  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Assigned Courses</h1>
          <p>Courses you are assisting as a teaching assistant.</p>
        </div>

        <div className="card empty-state">
          <BookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>No courses assigned</h3>
          <p>A lecturer will assign you to courses. They'll appear here once added.</p>
        </div>
      </div>
    </div>
  );
}
