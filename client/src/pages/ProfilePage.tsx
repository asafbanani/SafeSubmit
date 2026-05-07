import { User, Mail, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL: Record<string, string> = {
  student:            'Student',
  lecturer:           'Lecturer',
  teaching_assistant: 'Teaching Assistant',
  admin:              'Admin',
};

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 600 }}>
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Your account information.</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', flexShrink: 0,
            }}>
              <User size={28} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{user.full_name}</div>
              <span className="role-tag" style={{ marginTop: 4 }}>{ROLE_LABEL[user.role] ?? user.role}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <Mail size={18} style={{ color: 'var(--purple)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</div>
                <div style={{ fontSize: 15 }}>{user.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <Shield size={18} style={{ color: 'var(--purple)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Role</div>
                <div style={{ fontSize: 15 }}>{ROLE_LABEL[user.role] ?? user.role}</div>
              </div>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginTop: 24 }}>
            Password change and profile editing will be available in a future update.
          </div>
        </div>
      </div>
    </div>
  );
}
