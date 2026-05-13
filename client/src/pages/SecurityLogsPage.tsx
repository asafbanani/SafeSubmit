import { useState } from 'react';
import { ShieldAlert, Search, RefreshCw } from 'lucide-react';
import { useApiFetch } from '../hooks/useApiFetch';
import { securityLogsApi } from '../services/api';
import type { AuditLog } from '../services/api';

type Severity = AuditLog['severity'];

const severityBadge: Record<Severity, string> = {
  info:     'badge-info',
  warning:  'badge-warning',
  error:    'badge-error',
  critical: 'badge-error',
};

export function SecurityLogsPage() {
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error } = useApiFetch<{ logs: AuditLog[]; total: number }>(
    () => securityLogsApi.getAll({ limit: 200, severity: severityFilter || undefined }),
    [severityFilter, refreshKey],
  );

  const logs = data?.logs ?? [];

  const filtered = search.trim()
    ? logs.filter(
        l =>
          l.action.toLowerCase().includes(search.toLowerCase()) ||
          (l.ip_address ?? '').includes(search) ||
          (l.description ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : logs;

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

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>
        )}

        {/* Filters */}
        <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="search"
                className="form-input"
                placeholder="Search action, IP, description…"
                style={{ paddingLeft: 34 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Severity filter */}
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: 140 }}
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
            >
              <option value="">All severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>

            {/* Refresh */}
            <button
              className="btn btn-ghost"
              onClick={() => setRefreshKey(k => k + 1)}
              disabled={loading}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Summary */}
        {!loading && data && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Showing {filtered.length} of {data.total} total events
            {severityFilter && ` (filtered: ${severityFilter})`}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            Loading security logs…
          </div>
        ) : filtered.length === 0 ? (
          <div className="card empty-state">
            <ShieldAlert size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>No events found</h3>
            <p>No security events match your current filter.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="log-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>IP Address</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log, i) => (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{log.action}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {log.resource_type ?? '—'}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                        {log.ip_address ?? '—'}
                      </td>
                      <td>
                        <span className={`badge ${severityBadge[log.severity]}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{log.status}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.description ?? '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
