import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

export function UnauthorizedPage() {
  return (
    <div className="not-found">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <ShieldOff size={64} style={{ color: 'var(--magenta)', opacity: 0.6 }} />
        <h1 style={{ fontSize: 40 }}>403</h1>
        <p style={{ fontSize: 18, marginBottom: 8 }}>You don't have permission to view this page.</p>
        <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );
}
