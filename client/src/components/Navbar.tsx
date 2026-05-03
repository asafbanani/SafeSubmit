import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Shield, Home, LayoutDashboard, ShieldAlert,
  LogIn, UserPlus, Menu, X,
} from 'lucide-react';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `navbar-link${isActive ? ' active' : ''}`;

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
            <li><NavLink to="/dashboard" className={linkClass}><LayoutDashboard size={15} /> Dashboard</NavLink></li>
            <li><NavLink to="/security-logs" className={linkClass}><ShieldAlert size={15} /> Security Logs</NavLink></li>
          </ul>

          <div className="navbar-actions">
            <Link to="/login"    className="btn btn-ghost"   style={{ padding: '7px 14px', fontSize: 14 }}><LogIn size={14} />   Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 14 }}><UserPlus size={14} /> Register</Link>
          </div>

          <button className="navbar-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* ── Mobile menu ── */}
        {open && (
          <div className="navbar-mobile">
            <NavLink to="/"             end className={linkClass} onClick={close}><Home size={15} />          Home</NavLink>
            <NavLink to="/dashboard"        className={linkClass} onClick={close}><LayoutDashboard size={15} /> Dashboard</NavLink>
            <NavLink to="/security-logs"    className={linkClass} onClick={close}><ShieldAlert size={15} />   Security Logs</NavLink>
            <div className="navbar-mobile-actions">
              <Link to="/login"    className="btn btn-ghost"   style={{ flex: 1, justifyContent: 'center' }} onClick={close}><LogIn size={14} />   Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={close}><UserPlus size={14} /> Register</Link>
            </div>
          </div>
        )}

      </div>
    </nav>
  );
}
