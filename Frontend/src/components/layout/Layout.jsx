import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import Footer from './Footer';
import SeoManager from './SeoManager';
import ConsentBanner from './ConsentBanner';
import ScrollProgress from './ScrollProgress';
import Navbar, { AUTH_PATHS, isPublicPath } from './Navbar';

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const isApp = !isPublicPath(pathname);
  const isAuth = AUTH_PATHS.includes(pathname);

  // A new page always starts at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={e => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <ScrollProgress />
      <SeoManager />
      <ConsentBanner />
      <Navbar />
      <main id="main" tabIndex={-1} className={isApp ? 'app-main' : isAuth ? 'legacy-skin' : ''} style={{ outline: 'none' }}>
        {children}
      </main>
      {!isApp && <Footer />}
    </>
  );
}