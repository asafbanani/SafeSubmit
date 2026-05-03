import { useState } from 'react';
import { Activity, CheckCircle, XCircle, Loader } from 'lucide-react';
import { healthApi } from '../services/api';

type Status = 'idle' | 'loading' | 'ok' | 'error';

export function HealthCheck() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const checkHealth = async () => {
    setStatus('loading');
    try {
      const res = await healthApi.check();
      setStatus('ok');
      setMessage(res.data.message);
    } catch {
      setStatus('error');
      setMessage('Cannot reach server');
    }
  };

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h3 style={{ fontSize: 17, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Activity size={18} style={{ color: 'var(--purple)' }} />
        Server Health Check
      </h3>
      <div className="health-check">
        <button
          className="btn btn-primary"
          onClick={() => { void checkHealth(); }}
          disabled={status === 'loading'}
        >
          <Loader size={15} className={status === 'loading' ? 'spin' : ''} style={{ display: status === 'loading' ? 'block' : 'none' }} />
          <Activity size={15} style={{ display: status !== 'loading' ? 'block' : 'none' }} />
          {status === 'loading' ? 'Checking…' : 'Check Health'}
        </button>

        {status === 'ok' && (
          <div className="health-status ok">
            <CheckCircle size={15} />
            {message}
          </div>
        )}
        {status === 'error' && (
          <div className="health-status error">
            <XCircle size={15} />
            {message}
          </div>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
        Calls <code style={{ background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: 4 }}>GET /api/health</code> on the Express server.
      </p>
    </div>
  );
}
