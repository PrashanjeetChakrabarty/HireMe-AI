import { Link } from 'react-router-dom';

import { useScrollToSection } from '../../lib/hooks';
import * as I from '../../lib/icons';

export default function Footer() {
  const scrollTo = useScrollToSection();
  const go = id => e => {
    e.preventDefault();
    scrollTo(id);
  };
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link className="brand" to="/">
              <I.LogoMark className="brand-mark" />
              <span>HireMe <i className="brand-ai">AI</i></span>
            </Link>
            <p className="foot-about">AI-assisted resume screening that helps recruiters find the right people faster.</p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><a href="/#features" onClick={go('features')}>Features</a></li>
              <li><a href="/#how" onClick={go('how')}>How it works</a></li>
              <li><a href="/#shortlist" onClick={go('shortlist')}>Shortlist</a></li>
              <li><a href="/#faq" onClick={go('faq')}>FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4>Get started</h4>
            <ul>
              <li><Link to="/register">Create account</Link></li>
              <li><Link to="/login">Log in</Link></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 HireMe AI</span>
          <span>Resumes are processed with AI. Final hiring decisions are always made by people.</span>
        </div>
      </div>
    </footer>
  );
}