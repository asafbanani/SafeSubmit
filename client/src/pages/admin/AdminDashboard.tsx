import { Link } from 'react-router-dom';
import { Users, ShieldAlert, UserCheck, Settings, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminDashboard() {
  const { user } = useAuth();

  const stats = [
    { icon: <Users size={20} />,      label: 'Total Users',     value: '—', color: '#ff4da6', link: '/admin/users',     desc: 'Manage all accounts' },
    { icon: <UserCheck size={20} />,  label: 'Pending Approvals', value: '—', color: '#d946ef', link: '/admin/approvals', desc: 'Lecturer approval requests' },
    { icon: <ShieldAlert size={20} />,label: 'Security Events', value: '—', color: '#8b5cf6', link: '/security-logs',   desc: 'Review security activity' },
    { icon: <Settings size={20} />,   label: 'Role Management', value: '→', color: '#6d28d9', link: '/admin/roles',     desc: 'Assign and change roles' },
  ];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p className="dash-welcome">Welcome, <strong>{user?.full_name}</strong>. System overview and administration.</p>
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

        <div className="grid-2">
          <div className="card">
            <h3 style={{ fontSize: 17, marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/admin/approvals" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                <UserCheck size={16} /> Review Pending Approvals
              </Link>
              <Link to="/admin/users" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                <Users size={16} /> Manage Users
              </Link>
              <Link to="/security-logs" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                <ShieldAlert size={16} /> View Security Logs
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 17, marginBottom: 12 }}>System Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Database</span>
                <span className="badge badge-success">Connected</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>API</span>
                <span className="badge badge-success">Online</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Auth</span>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
