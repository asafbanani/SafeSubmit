import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Info } from 'lucide-react';

export function LoginPage() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: call authApi.login() when backend is ready
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="gradient-border">
          <div className="gradient-border-inner card">

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 54, height: 54, borderRadius: 14,
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px', color: 'white',
              }}>
                <LogIn size={24} />
              </div>
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Sign in to your SafeSubmit account</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  <Mail size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Email address
                </label>
                <input id="email" type="email" className="form-input"
                  placeholder="you@example.com" autoComplete="email" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  <Lock size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Password
                </label>
                <input id="password" type="password" className="form-input"
                  placeholder="••••••••" autoComplete="current-password" />
              </div>

              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }}>
                <LogIn size={17} /> Sign In
              </button>
            </form>

            <div className="divider" />

            <p style={{ textAlign: 'center', fontSize: 14 }}>
              Don&apos;t have an account?{' '}
              <Link to="/register" style={{ color: 'var(--purple)', fontWeight: 600 }}>
                Create one
              </Link>
            </p>
          </div>
        </div>

        <div className="alert alert-info" style={{ marginTop: 14 }}>
          <Info size={15} />
          Authentication not yet implemented — UI skeleton only.
        </div>
      </div>
    </div>
  );
}
