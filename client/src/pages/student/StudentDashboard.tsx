import { Link } from 'react-router-dom';
import { FileText, BookOpen, Clock, CheckCircle, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function StudentDashboard() {
  const { user } = useAuth();

  const stats = [
    { icon: <FileText size={20} />,    label: 'Open Submissions',   value: '—', color: '#ff4da6', link: '/submissions/open',  desc: 'Assignments you can submit' },
    { icon: <BookOpen size={20} />,    label: 'My Submissions',     value: '—', color: '#d946ef', link: '/submissions/mine',  desc: 'View submitted work' },
    { icon: <Clock size={20} />,       label: 'Pending Review',     value: '—', color: '#8b5cf6', link: '/submissions/mine',  desc: 'Awaiting feedback' },
    { icon: <CheckCircle size={20} />, label: 'Graded',             value: '—', color: '#6d28d9', link: '/submissions/mine',  desc: 'Completed assignments' },
  ];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Student Dashboard</h1>
          <p className="dash-welcome">Welcome back, <strong>{user?.full_name}</strong>. Here's your assignment overview.</p>
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
          <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>No recent activity</h3>
          <p>Your submission history will appear here once you start submitting assignments.</p>
          <Link to="/submissions/open" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Open Submissions</Link>
        </div>
      </div>
    </div>
  );
}
