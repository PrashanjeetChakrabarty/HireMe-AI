import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useScrollToSection } from '../../lib/hooks';
import { useTheme } from '../../lib/theme';
import * as I from '../../lib/icons';
import { Avatar } from '../ui';

const LANDING_LINKS = [
  ['features', 'Features'],
  ['how', 'How it works'],
  ['shortlist', 'Shortlist'],
  ['audience', "Who it's for"],
  ['faq', 'FAQ']
];

const CANDIDATE_LINKS = [
  ['/dashboard', 'Dashboard'],
  ['/resumes', 'My Resumes'],
  ['/jobs', 'Browse Jobs'],
  ['/my-activity', 'My Activity']
];

const RECRUITER_LINKS = [
  ['/dashboard', 'Dashboard'],
  ['/my-jobs', 'My Jobs'],
  ['/analytics', 'Analytics'],
  ['/activity-feed', 'Activity Feed']
];

export const AUTH_PATHS = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];
export const PUBLIC_PATHS = ['/', '/privacy', '/terms', ...AUTH_PATHS];
export const isPublicPath = pathname => PUBLIC_PATHS.includes(pathname);

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const scrollTo = useScrollToSection();
  const [menu, setMenu] = useState(false);

  useEffect(() => setMenu(false), [pathname]);

  const appMode = Boolean(user) && !isPublicPath(pathname);
  const showAnchors = !appMode && ['/', '/privacy', '/terms'].includes(pathname);
  const appLinks = user?.roleName === 'Recruiter' ? RECRUITER_LINKS : CANDIDATE_LINKS;
  const firstName = user?.fullName?.split(' ')[0] || 'Account';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const go = id => e => {
    e.preventDefault();
    setMenu(false);
    scrollTo(id);
  };

  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link className="brand" to={appMode ? '/dashboard' : '/'} aria-label="HireMe AI home">
          <I.LogoMark className="brand-mark" />
          <span>
            HireMe <i className="brand-ai">AI</i>
            <small>AI Resume Screener</small>
          </span>
        </Link>

        {appMode && (
          <nav className="nav-app nav-links" aria-label="Primary">
            {appLinks.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {label}
              </NavLink>
            ))}
          </nav>
        )}

        {showAnchors && (
          <nav className="nav-links" aria-label="Primary">
            {LANDING_LINKS.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={go(id)}>
                {label}
              </a>
            ))}
          </nav>
        )}

        <div className="nav-cta" style={appMode || !showAnchors ? { marginLeft: 'auto' } : undefined}>
          <button type="button" className="icon-btn theme-btn" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            {theme === 'dark' ? <I.Sun /> : <I.Moon />}
          </button>

          {appMode ? (
            <>
              <Link className="u-user hide-sm" to="/profile" title={`My profile (${user.email})`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Avatar name={user.fullName} size={30} />
                <span className="nm">{firstName}</span>
              </Link>
              <button type="button" className="btn btn-ghost btn-sm hide-sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : user ? (
            <Link className="btn btn-primary btn-sm" to="/dashboard">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm hide-sm" to="/login">
                Log in
              </Link>
              <Link className="btn btn-primary btn-sm" to="/register">
                Create account
              </Link>
            </>
          )}

          <button type="button" className="icon-btn burger" onClick={() => setMenu(m => !m)} aria-expanded={menu} aria-label="Menu">
            {menu ? <I.Close /> : <I.Menu />}
          </button>
        </div>
      </div>

      {menu && (
        <div className="mobile-menu">
          <a
            href="#theme"
            onClick={e => {
              e.preventDefault();
              toggle();
            }}
          >
            {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          </a>
          {appMode &&
            appLinks.map(([to, label]) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
          {appMode && <Link to="/profile">My profile</Link>}
          {showAnchors &&
            LANDING_LINKS.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={go(id)}>
                {label}
              </a>
            ))}
          {appMode ? (
            <a
              href="#logout"
              onClick={e => {
                e.preventDefault();
                handleLogout();
              }}
            >
              Log out
            </a>
          ) : user ? (
            <Link to="/dashboard">Open dashboard</Link>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Create account</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}