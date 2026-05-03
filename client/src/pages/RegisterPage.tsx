import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Info } from 'lucide-react';

export function RegisterPage() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: call authApi.register() when backend is ready
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
                <UserPlus size={24} />
              </div>
              <h1 className="auth-title">Create account</h1>
              <p className="auth-subtitle">Join SafeSubmit to submit your assignments</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  <User size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Full name
                </label>
                <input id="name" type="text" className="form-input"
                  placeholder="Your full name" autoComplete="name" />
              </div>

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
                  placeholder="Create a strong password" autoComplete="new-password" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm">
                  <Lock size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Confirm password
                </label>
                <input id="confirm" type="password" className="form-input"
                  placeholder="Repeat your password" autoComplete="new-password" />
              </div>

              <div className="form-group" style={{ marginBottom: 8 }}>
                <label className="form-label" htmlFor="role">Role</label>
                <select id="role" className="form-input" style={{ cursor: 'pointer' }}>
                  <option value="student">Student</option>
                  <option value="ta">Teaching Assistant</option>
                  <option value="lecturer">Lecturer</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 12 }}>
                <UserPlus size={17} /> Create Account
              </button>
            </form>

            <div className="divider" />

            <p style={{ textAlign: 'center', fontSize: 14 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--purple)', fontWeight: 600 }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="alert alert-info" style={{ marginTop: 14 }}>
          <Info size={15} />
          Registration not yet implemented — UI skeleton only.
        </div>
      </div>
    </div>
  );
}
