import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { recordStorageNotice } from '../../api/consentApi';

const KEY = 'consent-notice';

// The legal pages stay readable without a click, so people can read them before they decide.
const OPEN_PATHS = ['/privacy', '/terms'];

function alreadyAccepted() {
  try {
    return localStorage.getItem(KEY) === 'accepted';
  } catch {
    return false;
  }
}

// A notice about what the site stores in the browser. Until the visitor presses OK, the rest of the page stays locked.
export default function ConsentBanner() {
  const { pathname } = useLocation();
  const [accepted, setAccepted] = useState(alreadyAccepted);
  const blocking = !accepted && !OPEN_PATHS.includes(pathname);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!blocking || !root) {
      return undefined;
    }
    root.setAttribute('inert', '');
    document.body.style.overflow = 'hidden';
    return () => {
      root.removeAttribute('inert');
      document.body.style.overflow = '';
    };
  }, [blocking]);

  const accept = () => {
    try {
      localStorage.setItem(KEY, 'accepted');
    } catch {
      // Storage can be blocked. The notice then simply shows again next time.
    }
    try {
      recordStorageNotice().catch(() => {});
    } catch {
      // The record is extra. It must never stop the visitor from carrying on.
    }
    setAccepted(true);
  };

  if (!blocking) {
    return null;
  }

  return createPortal(
    <div className="consent-gate">
      <div className="consent-card" role="dialog" aria-modal="true" aria-labelledby="consent-title">
        <h2 id="consent-title">Before you continue</h2>
        <p>
          HireMe AI uses your browser&apos;s local storage to keep you logged in, to remember your theme and to remember this choice. It does not use
          advertising cookies. You can read the <Link to="/privacy">Privacy Policy</Link> and the{' '}
          <Link to="/terms">Terms of Service</Link> first.
        </p>
        <button type="button" className="btn btn-primary" onClick={accept} autoFocus>
          OK, got it
        </button>
      </div>
    </div>,
    document.body
  );
}
