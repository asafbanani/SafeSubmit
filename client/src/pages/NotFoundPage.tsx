import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="not-found">
      <h1 className="gradient-text">404</h1>
      <h2 style={{ fontSize: 26, marginBottom: 10 }}>Page not found</h2>
      <p style={{ maxWidth: 380, margin: '0 auto 40px' }}>
        Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-primary">
          <Home size={17} /> Go Home
        </Link>
        <button className="btn btn-secondary" onClick={() => window.history.back()}>
          <ArrowLeft size={17} /> Go Back
        </button>
      </div>
    </div>
  );
}
