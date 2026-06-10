import { Link } from 'react-router-dom';
import { BookOpen, PlusCircle, Star, ArrowUpRight, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApiFetch } from '../../hooks/useApiFetch';
import { assignmentsApi, submissionsApi } from '../../services/api';
import type { Assignment, Submission } from '../../services/api';

export function LecturerDashboard() {
  const { user } = useAuth();

  const { data: assignData, loading: assignLoading } = useApiFetch<{ assignments: Assignment[] }>(
    () => assignmentsApi.getAll(),
  );
  const { data: subData, loading: subLoading } = useApiFetch<{ submissions: Submission[] }>(
    () => submissionsApi.getAll(),
  );

  // Backend already filters to the lecturer's own assignments
  const myAssignments = assignData?.assignments ?? [];
  const pendingReview = subData?.submissions.filter(
    s => s.status === 'submitted' || s.status === 'under_review',
  ).length ?? 0;

  const stats = [
    {
      icon: <BookOpen size={20} />,
      label: 'Submission Boxes',
      value: assignLoading ? '…' : myAssignments.length,
      color: '#d946ef',
      link: '/lecturer/boxes',
      desc: 'Open and closed boxes',
    },
    {
      icon: <Star size={20} />,
      label: 'Pending Review',
      value: subLoading ? '…' : pendingReview,
      color: '#8b5cf6',
      link: '/lecturer/review',
      desc: 'Submissions to grade',
    },
    {
      icon: <PlusCircle size={20} />,
      label: 'New Box',
      value: '+',
      color: '#6d28d9',
      link: '/lecturer/boxes/create',
      desc: 'Open a submission box',
    },
  ];

  const recent = [...myAssignments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Lecturer Dashboard</h1>
          <p className="dash-welcome">
            Welcome, <strong>{user?.full_name}</strong>. Manage your courses and submissions.
          </p>
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

        {assignLoading ? (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
            Loading assignments…
          </div>
        ) : recent.length === 0 ? (
          <div className="card empty-state">
            <BookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>No assignment boxes yet</h3>
            <p>Create your first submission box to start collecting student work.</p>
            <Link to="/lecturer/boxes/create" className="btn btn-primary" style={{ marginTop: 16 }}>
              <PlusCircle size={16} /> Create Submission Box
            </Link>
          </div>
        ) : (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, margin: 0 }}>My Assignment Boxes</h3>
              <Link to="/lecturer/boxes" className="btn btn-ghost" style={{ fontSize: 13 }}>
                View all <ArrowUpRight size={13} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recent.map((a, idx) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: idx < recent.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      <Calendar size={11} />
                      Due {new Date(a.due_date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`badge badge-${a.status === 'published' ? 'success' : a.status === 'closed' ? 'error' : 'info'}`}>
                    {a.status}
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
