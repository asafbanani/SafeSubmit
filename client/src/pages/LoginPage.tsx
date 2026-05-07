import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ email, password });
      login(res.data.token);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as { message?: string })?.message ?? 'Login failed');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
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

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  <Mail size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Email address
                </label>
                <input
                  id="email" type="email" className="form-input"
                  placeholder="you@example.com" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  <Lock size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Password
                </label>
                <input
                  id="password" type="password" className="form-input"
                  placeholder="••••••••" autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }}
              >
                <LogIn size={17} /> {loading ? 'Signing in…' : 'Sign In'}
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
      </div>
    </div>
  );
}
