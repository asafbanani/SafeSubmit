import { Link } from 'react-router-dom';
import {
  Users, Package, ShieldAlert, Settings,
  ArrowUpRight, Activity, BarChart2, Clock,
} from 'lucide-react';

const stats = [
  { icon: <Users size={20} />,      label: 'Total Users',     value: '—', color: '#ff4da6', link: '#',              desc: 'Manage all system users' },
  { icon: <Package size={20} />,     label: 'Submissions',     value: '—', color: '#d946ef', link: '#',              desc: 'View and manage orders' },
  { icon: <ShieldAlert size={20} />, label: 'Security Events', value: '—', color: '#8b5cf6', link: '/security-logs', desc: 'Review security activity' },
  { icon: <Settings size={20} />,    label: 'Settings',        value: '–', color: '#6d28d9', link: '#',              desc: 'System configuration' },
];

const activity = [
  { icon: <Activity size={13} />,  text: 'Server started successfully',   time: 'Just now', type: 'success' },
  { icon: <BarChart2 size={13} />, text: 'Health check endpoint is ready', time: '1 min ago', type: 'info'    },
  { icon: <Clock size={13} />,     text: 'Database connection pending',    time: '2 min ago', type: 'warning' },
];

const endpoints = [
  { method: 'GET',  path: '/api/health',         color: 'badge-success' },
  { method: 'POST', path: '/api/auth/login',      color: 'badge-info'    },
  { method: 'GET',  path: '/api/users',           color: 'badge-success' },
  { method: 'GET',  path: '/api/orders',          color: 'badge-success' },
  { method: 'GET',  path: '/api/security-logs',   color: 'badge-success' },
];

export function DashboardPage() {
  return (
    <div className="page">
      <div className="container">

        <div className="page-header">
          <h1>Dashboard</h1>
          <p style={{ marginTop: 6 }}>
            Welcome to SafeSubmit. Connect a database to see live data.
          </p>
        </div>

        {/* Stat cards */}
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

        {/* Bottom panels */}
        <div className="grid-2">
          <div className="card">
            <h3 style={{ fontSize: 17, marginBottom: 16 }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activity.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge badge-${a.type}`}>{a.icon}</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{a.text}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 17, marginBottom: 16 }}>Available API Endpoints</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {endpoints.map((ep, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span className={`badge ${ep.color}`}>{ep.method}</span>
                  <code style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{ep.path}</code>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
