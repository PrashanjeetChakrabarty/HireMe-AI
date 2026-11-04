import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useCountUp, useInView, useTilt } from '../lib/hooks';

const TIP_MS = 5000;

// A number on a page that is also a button. Click it to go where it leads (a link with "to", or an action with "onClick").
// Point at it or tab to it and a light pop-up says what the number is and what the click does. It hides after 5 seconds.
export default function StatTile({ icon: Icon, value, label, hint, to, onClick, index = 0 }) {
  const [viewRef, inView] = useInView({ threshold: 0.3 });
  const tiltRef = useTilt(5);
  const shown = useCountUp(Number(value) || 0, inView, 1100);
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const show = () => {
    setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), TIP_MS);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const face = (
    <>
      <span className="ico">{Icon && <Icon />}</span>
      <div>
        <b>{Math.round(shown)}</b>
        <span>{label}</span>
      </div>
      <span className="stat-go" aria-hidden="true">
        &rsaquo;
      </span>
      <span id={tipId} role="tooltip" className={`stat-tip ${open ? 'show' : ''}`}>
        {hint}
      </span>
    </>
  );
  const shared = {
    ref: tiltRef,
    className: 'u-stat stat-link',
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    'aria-describedby': tipId,
  };

  return (
    <div className="stat-wrap dash-in" ref={viewRef} style={{ '--i': index }}>
      {to ? (
        <Link to={to} {...shared}>
          {face}
        </Link>
      ) : (
        <button type="button" onClick={onClick} {...shared}>
          {face}
        </button>
      )}
    </div>
  );
}
