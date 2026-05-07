import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Shield, Home, LayoutDashboard, ShieldAlert,
  LogIn, UserPlus, Menu, X, LogOut, User,
  BookOpen, FileText, Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL: Record<string, string> = {
  student:            'Student',
  lecturer:           'Lecturer',
  teaching_assistant: 'Teaching Assistant',
  admin:              'Admin',
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `navbar-link${isActive ? ' active' : ''}`;

  const roleLinks = () => {
    if (!user) return null;
    switch (user.role) {
      case 'student':
        return (
          <>
            <li><NavLink to="/submissions/open"   className={linkClass} onClick={close}><FileText size={15} /> Open Submissions</NavLink></li>
            <li><NavLink to="/submissions/mine"   className={linkClass} onClick={close}><BookOpen size={15} />  My Submissions</NavLink></li>
          </>
        );
      case 'lecturer':
        return (
          <>
            <li><NavLink to="/lecturer/courses"   className={linkClass} onClick={close}><BookOpen size={15} /> My Courses</NavLink></li>
            <li><NavLink to="/lecturer/review"    className={linkClass} onClick={close}><FileText size={15} /> Review</NavLink></li>
          </>
        );
      case 'teaching_assistant':
        return (
          <>
            <li><NavLink to="/ta/courses"         className={linkClass} onClick={close}><BookOpen size={15} /> Assigned Courses</NavLink></li>
            <li><NavLink to="/ta/review"          className={linkClass} onClick={close}><FileText size={15} /> Review</NavLink></li>
          </>
        );
      case 'admin':
        return (
          <>
            <li><NavLink to="/admin/users"        className={linkClass} onClick={close}><Users size={15} />    Users</NavLink></li>
            <li><NavLink to="/admin/approvals"    className={linkClass} onClick={close}><ShieldAlert size={15} /> Approvals</NavLink></li>
            <li><NavLink to="/security-logs"      className={linkClass} onClick={close}><ShieldAlert size={15} /> Logs</NavLink></li>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="navbar">
      <div className="container">

        {/* ── Desktop row ── */}
        <div className="navbar-row">
          <Link to="/" className="navbar-logo gradient-text" onClick={close}>
            <Shield size={20} />
            SafeSubmit
          </Link>

          <ul className="navbar-links">
            <li><NavLink to="/" end className={linkClass}><Home size={15} /> Home</NavLink></li>
            {user && (
              <li><NavLink to="/dashboard" className={linkClass}><LayoutDashboard size={15} /> Dashboard</NavLink></li>
            )}
            {roleLinks()}
          </ul>

          <div className="navbar-actions">
            {user ? (
              <>
                <Link to="/profile" className="user-chip" onClick={close}>
                  <User size={14} />
                  <span>{user.full_name}</span>
                  <span className="role-tag">{ROLE_LABEL[user.role] ?? user.role}</span>
                </Link>
                <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: 14 }}>
                  <LogOut size={14} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn btn-ghost"   style={{ padding: '7px 14px', fontSize: 14 }}><LogIn size={14} />   Login</Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 14 }}><UserPlus size={14} /> Register</Link>
              </>
            )}
          </div>

          <button className="navbar-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* ── Mobile menu ── */}
        {open && (
          <div className="navbar-mobile">
            <NavLink to="/" end className={linkClass} onClick={close}><Home size={15} /> Home</NavLink>
            {user && (
              <NavLink to="/dashboard" className={linkClass} onClick={close}><LayoutDashboard size={15} /> Dashboard</NavLink>
            )}
            {roleLinks()}
            <div className="navbar-mobile-actions">
              {user ? (
                <button onClick={handleLogout} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                  <LogOut size={14} /> Sign Out
                </button>
              ) : (
                <>
                  <Link to="/login"    className="btn btn-ghost"   style={{ flex: 1, justifyContent: 'center' }} onClick={close}><LogIn size={14} />   Login</Link>
                  <Link to="/register" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={close}><UserPlus size={14} /> Register</Link>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </nav>
  );
}
