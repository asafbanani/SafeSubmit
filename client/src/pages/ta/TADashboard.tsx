import { Link } from 'react-router-dom';
import { FileText, Star, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApiFetch } from '../../hooks/useApiFetch';
import { submissionsApi } from '../../services/api';
import type { Submission } from '../../services/api';

export function TADashboard() {
  const { user } = useAuth();

  const { data: subData, loading: subLoading } = useApiFetch<{ submissions: Submission[] }>(
    () => submissionsApi.getAll(),
  );

  const subs = subData?.submissions ?? [];

  const pendingCount = subLoading
    ? '…'
    : subs.filter(s => s.status === 'submitted' || s.status === 'under_review').length;

  const todayStr = new Date().toDateString();
  const gradedToday = subLoading
    ? '…'
    : subs.filter(
        s =>
          (s.status === 'graded' || s.status === 'returned') &&
          new Date(s.updated_at).toDateString() === todayStr,
      ).length;

  const stats = [
    {
      icon: <FileText size={20} />,
      label: 'Pending Review',
      value: pendingCount,
      color: '#d946ef',
      link: '/ta/review',
      desc: 'Awaiting your review',
    },
    {
      icon: <Star size={20} />,
      label: 'Graded Today',
      value: gradedToday,
      color: '#8b5cf6',
      link: '/ta/review',
      desc: 'Reviews completed today',
    },
  ];

  const queue = [...subs]
    .filter(s => s.status === 'submitted' || s.status === 'under_review')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Teaching Assistant Dashboard</h1>
          <p className="dash-welcome">
            Welcome, <strong>{user?.full_name}</strong>. Here's your review queue.
          </p>
        </div>

        <div className="grid-2" style={{ marginBottom: 32 }}>
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

        {subLoading ? (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
            Loading review queue…
          </div>
        ) : queue.length === 0 ? (
          <div className="card empty-state">
            <Star size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>Review queue is empty</h3>
            <p>Student submissions assigned for your review will appear here.</p>
          </div>
        ) : (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, margin: 0 }}>Pending Reviews</h3>
              <Link to="/ta/review" className="btn btn-ghost" style={{ fontSize: 13 }}>
                View all <ArrowUpRight size={13} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {queue.map((sub, idx) => (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: idx < queue.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      Submission{' '}
                      <span style={{ fontFamily: 'monospace', fontSize: 12 }}>#{sub.id.slice(0, 8)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'Not yet submitted'}
                    </div>
                  </div>
                  <span className="badge badge-warning">{sub.status.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
