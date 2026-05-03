import { Link } from 'react-router-dom';
import { Shield, Users, BarChart2, Lock, ArrowRight, FileText, Activity } from 'lucide-react';
import { HealthCheck } from '../components/HealthCheck';

const features = [
  { icon: <Shield size={20} />,    title: 'Secure by Design',        desc: 'Demonstrates input validation, authentication, and role-based access control built from the ground up.' },
  { icon: <Users size={20} />,     title: 'Role-Based Access',        desc: 'Supports Student, Teaching Assistant, Lecturer, and Administrator roles with granular permissions.' },
  { icon: <BarChart2 size={20} />, title: 'Security Logging',         desc: 'Sensitive actions are logged and auditable. Security events and login attempts are monitored.' },
  { icon: <FileText size={20} />,  title: 'Assignment Submissions',    desc: 'Students submit assignments and upload files. Tracked, reviewed, and graded through the portal.' },
  { icon: <Lock size={20} />,      title: 'Protected File Uploads',    desc: 'File uploads are validated for type, size, and content. Path traversal attacks are prevented.' },
  { icon: <Activity size={20} />,  title: 'Live Monitoring',           desc: 'Server health and activity monitored in real time. Suspicious activity triggers security alerts.' },
];

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            <span className="gradient-text">SafeSubmit</span>
            <br />
            Secure Assignment Portal
          </h1>
          <p className="hero-subtitle">
            A real-world web application for course assignment submissions, built for the
            Secure Development course. Every feature demonstrates a security topic.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary" style={{ fontSize: 16, padding: '13px 30px' }}>
              <Users size={18} /> Get Started
            </Link>
            <Link to="/dashboard" className="btn btn-secondary" style={{ fontSize: 16, padding: '13px 30px' }}>
              View Dashboard <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" style={{ background: 'white' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, marginBottom: 12 }}>
              Built for <span className="gradient-text">Secure Development</span>
            </h2>
            <p style={{ fontSize: 17, maxWidth: 520, margin: '0 auto' }}>
              Every feature is designed to demonstrate and practice real security topics
              from the course curriculum.
            </p>
          </div>
          <div className="grid-3">
            {features.map((f, i) => (
              <div key={i} className="card feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div>
                  <h3 style={{ fontSize: 17, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Server health */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, marginBottom: 8 }}>Server Status</h2>
            <p>Click below to verify the live connection between client and server.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <HealthCheck />
          </div>
        </div>
      </section>
    </>
  );
}
