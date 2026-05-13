import { Link } from 'react-router-dom';
import { FileText, BookOpen, Clock, CheckCircle, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApiFetch } from '../../hooks/useApiFetch';
import { assignmentsApi, submissionsApi } from '../../services/api';
import type { Assignment, Submission } from '../../services/api';

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'draft':        return 'badge-info';
    case 'submitted':    return 'badge-warning';
    case 'under_review': return 'badge-warning';
    case 'graded':       return 'badge-success';
    case 'returned':     return 'badge-success';
    default:             return 'badge-info';
  }
}

export function StudentDashboard() {
  const { user } = useAuth();

  const { data: assignData, loading: assignLoading } = useApiFetch<{ assignments: Assignment[] }>(
    () => assignmentsApi.getAll(),
  );
  const { data: subData, loading: subLoading } = useApiFetch<{ submissions: Submission[] }>(
    () => submissionsApi.getAll(),
  );

  const openCount    = assignData?.assignments.filter(a => a.status === 'published').length ?? '—';
  const subs         = subData?.submissions ?? [];
  const myCount      = subData ? subs.length : '—';
  const pendingCount = subData ? subs.filter(s => s.status === 'submitted' || s.status === 'under_review').length : '—';
  const gradedCount  = subData ? subs.filter(s => s.status === 'graded' || s.status === 'returned').length : '—';

  const stats = [
    { icon: <FileText size={20} />,    label: 'Open Submissions', value: assignLoading ? '…' : openCount,    color: '#ff4da6', link: '/submissions/open', desc: 'Assignments you can submit' },
    { icon: <BookOpen size={20} />,    label: 'My Submissions',   value: subLoading   ? '…' : myCount,      color: '#d946ef', link: '/submissions/mine', desc: 'View submitted work' },
    { icon: <Clock size={20} />,       label: 'Pending Review',   value: subLoading   ? '…' : pendingCount, color: '#8b5cf6', link: '/submissions/mine', desc: 'Awaiting feedback' },
    { icon: <CheckCircle size={20} />, label: 'Graded',           value: subLoading   ? '…' : gradedCount,  color: '#6d28d9', link: '/submissions/mine', desc: 'Completed assignments' },
  ];

  const recent = [...subs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

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

        {subLoading ? (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
            Loading activity…
          </div>
        ) : recent.length === 0 ? (
          <div className="card empty-state">
            <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>No recent activity</h3>
            <p>Your submission history will appear here once you start submitting assignments.</p>
            <Link to="/submissions/open" className="btn btn-primary" style={{ marginTop: 16 }}>
              Browse Open Submissions
            </Link>
          </div>
        ) : (
          <div className="card">
            <h3 style={{ fontSize: 17, marginBottom: 16 }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recent.map((sub, idx) => (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: idx < recent.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      Submission <span style={{ fontFamily: 'monospace', fontSize: 12 }}>#{sub.id.slice(0, 8)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(sub.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className={`badge ${statusBadgeClass(sub.status)}`}>
                    {sub.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
