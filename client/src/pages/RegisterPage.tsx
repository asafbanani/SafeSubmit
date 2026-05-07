import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import { authApi } from '../services/api';
import axios from 'axios';

type Role = 'student' | 'lecturer' | 'teaching_assistant';

export function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [role, setRole]           = useState<Role>('student');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({ full_name: fullName, email, password, role });
      const msg =
        role === 'lecturer'
          ? 'Account created! Your account is pending admin approval.'
          : 'Account created! You can now sign in.';
      setSuccess(msg);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as { message?: string })?.message ?? 'Registration failed');
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
                <UserPlus size={24} />
              </div>
              <h1 className="auth-title">Create account</h1>
              <p className="auth-subtitle">Join SafeSubmit to submit your assignments</p>
            </div>

            {error   && <div className="alert alert-error"   style={{ marginBottom: 16 }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  <User size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Full name
                </label>
                <input
                  id="name" type="text" className="form-input"
                  placeholder="Your full name" autoComplete="name"
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

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
                  placeholder="At least 8 characters" autoComplete="new-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm">
                  <Lock size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Confirm password
                </label>
                <input
                  id="confirm" type="password" className="form-input"
                  placeholder="Repeat your password" autoComplete="new-password"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 8 }}>
                <label className="form-label" htmlFor="role">Role</label>
                <select
                  id="role" className="form-input" style={{ cursor: 'pointer' }}
                  value={role} onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="student">Student</option>
                  <option value="teaching_assistant">Teaching Assistant</option>
                  <option value="lecturer">Lecturer</option>
                </select>
              </div>

              <button
                type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 12 }}
              >
                <UserPlus size={17} /> {loading ? 'Creating account…' : 'Create Account'}
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
      </div>
    </div>
  );
}
