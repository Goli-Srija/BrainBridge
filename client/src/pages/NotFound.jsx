import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="center-state">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link className="btn" to="/dashboard">Go to dashboard</Link>
    </div>
  );
}
