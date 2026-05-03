import { ShieldAlert, Search, Filter, RefreshCw, AlertTriangle } from 'lucide-react';

type Severity = 'info' | 'warning' | 'error' | 'success';

interface LogEntry {
  id: number;
  event: string;
  user: string;
  ip: string;
  severity: Severity;
  time: string;
}

const placeholderLogs: LogEntry[] = [
  { id: 1, event: 'Login attempt',      user: 'unknown',              ip: '192.168.1.1',  severity: 'info',    time: '—' },
  { id: 2, event: 'Failed login',       user: 'user@example.com',     ip: '10.0.0.5',     severity: 'warning', time: '—' },
  { id: 3, event: 'File upload',        user: 'student@afeka.ac.il',  ip: '172.16.0.1',   severity: 'info',    time: '—' },
  { id: 4, event: 'Password change',    user: 'admin@afeka.ac.il',    ip: '127.0.0.1',    severity: 'info',    time: '—' },
  { id: 5, event: 'Unauthorized access',user: 'unknown',              ip: '203.0.113.5',  severity: 'error',   time: '—' },
];

const severityClass: Record<Severity, string> = {
  info:    'badge-info',
  warning: 'badge-warning',
  error:   'badge-error',
  success: 'badge-success',
};

export function SecurityLogsPage() {
  return (
    <div className="page">
      <div className="container">

        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <ShieldAlert size={26} style={{ color: 'var(--purple)' }} />
            <h1>Security Logs</h1>
          </div>
          <p>Monitor and review all security-related events in the system.</p>
        </div>

        <div className="alert alert-info" style={{ marginBottom: 24 }}>
          <AlertTriangle size={15} />
          No database connected yet — showing placeholder data only.
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="search" className="form-input" placeholder="Search logs…" style={{ paddingLeft: 34 }} />
            </div>
            <button className="btn btn-ghost"><Filter size={14} /> Filter</button>
            <button className="btn btn-ghost"><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="log-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event</th>
                  <th>User</th>
                  <th>IP Address</th>
                  <th>Severity</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {placeholderLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>{log.event}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{log.user}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{log.ip}</td>
                    <td><span className={`badge ${severityClass[log.severity]}`}>{log.severity}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
