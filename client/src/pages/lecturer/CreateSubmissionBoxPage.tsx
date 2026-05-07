import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

export function CreateSubmissionBoxPage() {
  const navigate = useNavigate();
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: POST /api/submissions when backend is ready
    navigate('/lecturer/boxes');
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 600 }}>
        <div className="page-header">
          <h1>Create Submission Box</h1>
          <p>Open a new assignment box for your students.</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="title">Assignment Title</label>
              <input id="title" type="text" className="form-input"
                placeholder="e.g. Assignment 1 — Secure Login" required
                value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="desc">Description</label>
              <textarea id="desc" className="form-input" rows={4}
                placeholder="Describe the assignment requirements…"
                value={desc} onChange={(e) => setDesc(e.target.value)}
                style={{ resize: 'vertical' }} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="deadline">Submission Deadline</label>
              <input id="deadline" type="datetime-local" className="form-input"
                required value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              <PlusCircle size={16} /> Create Box
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
