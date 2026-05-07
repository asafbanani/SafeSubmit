import { Link } from 'react-router-dom';
import { BookOpen, PlusCircle, FileText, Star, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function LecturerDashboard() {
  const { user } = useAuth();

  const stats = [
    { icon: <BookOpen size={20} />,   label: 'My Courses',         value: '—', color: '#ff4da6', link: '/lecturer/courses',       desc: 'Courses you teach' },
    { icon: <FileText size={20} />,   label: 'Submission Boxes',   value: '—', color: '#d946ef', link: '/lecturer/boxes',          desc: 'Open and closed boxes' },
    { icon: <Star size={20} />,       label: 'Pending Review',     value: '—', color: '#8b5cf6', link: '/lecturer/review',         desc: 'Submissions to grade' },
    { icon: <PlusCircle size={20} />, label: 'New Box',            value: '+', color: '#6d28d9', link: '/lecturer/boxes/create',   desc: 'Open a submission box' },
  ];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Lecturer Dashboard</h1>
          <p className="dash-welcome">Welcome, <strong>{user?.full_name}</strong>. Manage your courses and submissions.</p>
        </div>

        <div className="grid-4" style={{ marginBottom: 32 }}>
          {stats.map((s, i) => (
            <Link to={s.link} key={i} className="card stat-card" style={{ textDecoration: 'none' }}>
              <div className="stat-card-icon" style={{ background: s.color }}>{s.icon}</div>
              <div className="stat-card-value">{s.value}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{s.label}</div>
              <div className="stat-card-label">{s.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: s.color, fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                View <ArrowUpRight size={13} />
              </div>
            </Link>
          ))}
        </div>

        <div className="card empty-state">
          <BookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>No recent activity</h3>
          <p>Course and submission activity will appear here.</p>
          <Link to="/lecturer/boxes/create" className="btn btn-primary" style={{ marginTop: 16 }}>
            <PlusCircle size={16} /> Create Submission Box
          </Link>
        </div>
      </div>
    </div>
  );
}
