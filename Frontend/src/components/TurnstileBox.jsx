import { useEffect, useRef, useState } from 'react';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// The box is only used when a site key is set (VITE_TURNSTILE_SITE_KEY). Without one the pages work as before.
export function isTurnstileEnabled() {
  return Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
}

let scriptPromise = null;

function loadScript() {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('The human check could not be loaded.'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

// The Cloudflare "I am human" box. It tells the page the answer through onToken (an empty text means "not passed").
// When resetCounter goes up, the box starts again, because an answer can only be used once.
export default function TurnstileBox({ onToken, resetCounter = 0 }) {
  const container = useRef(null);
  const widgetId = useRef(null);
  const callback = useRef(onToken);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callback.current = onToken;
  });

  useEffect(() => {
    if (!isTurnstileEnabled()) {
      return undefined;
    }
    let cancelled = false;
    loadScript()
      .then((turnstile) => {
        if (cancelled || !container.current) {
          return;
        }
        widgetId.current = turnstile.render(container.current, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
          callback: (token) => callback.current(token),
          'expired-callback': () => callback.current(''),
          'error-callback': () => callback.current(''),
        });
      })
      .catch(() => {
        setFailed(true);
        callback.current('');
      });
    return () => {
      cancelled = true;
      if (widgetId.current !== null && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (resetCounter > 0 && widgetId.current !== null && window.turnstile) {
      window.turnstile.reset(widgetId.current);
    }
  }, [resetCounter]);

  if (!isTurnstileEnabled()) {
    return null;
  }

  return (
    <div>
      <div ref={container} className="turnstile-box" />
      {failed && (
        <p className="field-error" role="alert">
          The human check could not load. Turn off any ad blocker for this site and refresh the page.
        </p>
      )}
    </div>
  );
}
