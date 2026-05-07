import { Link } from 'react-router-dom';
import { FileText, PlusCircle } from 'lucide-react';

export function ManageSubmissionBoxesPage() {
  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Submission Boxes</h1>
            <p>All assignment boxes you've created.</p>
          </div>
          <Link to="/lecturer/boxes/create" className="btn btn-primary">
            <PlusCircle size={15} /> New Box
          </Link>
        </div>

        <div className="card empty-state">
          <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>No submission boxes</h3>
          <p>Create your first submission box to start collecting student work.</p>
        </div>
      </div>
    </div>
  );
}
