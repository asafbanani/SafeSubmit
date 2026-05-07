import { Link } from 'react-router-dom';
import { BookOpen, FileText, Star, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function TADashboard() {
  const { user } = useAuth();

  const stats = [
    { icon: <BookOpen size={20} />, label: 'Assigned Courses', value: '—', color: '#ff4da6', link: '/ta/courses', desc: 'Courses you assist' },
    { icon: <FileText size={20} />, label: 'Pending Review',   value: '—', color: '#d946ef', link: '/ta/review',  desc: 'Awaiting your review' },
    { icon: <Star size={20} />,     label: 'Graded Today',     value: '—', color: '#8b5cf6', link: '/ta/review',  desc: 'Reviews completed today' },
  ];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Teaching Assistant Dashboard</h1>
          <p className="dash-welcome">Welcome, <strong>{user?.full_name}</strong>. Here's your review queue.</p>
        </div>

        <div className="grid-3" style={{ marginBottom: 32 }}>
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
          <Star size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>Review queue is empty</h3>
          <p>Student submissions assigned for your review will appear here.</p>
        </div>
      </div>
    </div>
  );
}
