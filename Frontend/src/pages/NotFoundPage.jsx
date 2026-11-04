import { Link, useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="notfound">
      <p className="nf-code">404</p>
      <h1>This page does not exist</h1>
      <p>The link may be broken, or the page may have moved.</p>
      <div className="nf-actions">
        <Link className="btn btn-primary" to="/">
          Go to home
        </Link>
        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    </div>
  );
}
