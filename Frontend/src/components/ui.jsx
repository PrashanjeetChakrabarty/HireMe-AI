import { useEffect, useState } from 'react';

import { initials, toneForMessage, toneForStatus } from '../utils/format';
import { useCountUp, useInView } from '../lib/hooks';
import * as I from '../lib/icons';

/* ---------- building blocks ---------- */
export function PageHead({ title, sub, children }) {
  return (
    <header className="u-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="u-actions">{children}</div>}
    </header>
  );
}

export function Card({ className = '', children, ...rest }) {
  return (
    <section className={`u-card ${className}`.trim()} {...rest}>
      {children}
    </section>
  );
}

export function CardHead({ title, children }) {
  return (
    <div className="u-card-h">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export function Badge({ tone = 'muted', dot = false, children, title }) {
  return (
    <span className={`u-badge ${tone} ${dot ? 'dot' : ''}`.trim()} title={title}>
      {children}
    </span>
  );
}

export const StatusBadge = ({ status }) => (
  <Badge tone={toneForStatus(status)} dot>
    {status}
  </Badge>
);

export function Spinner({ small = false }) {
  return <span className={`u-spin ${small ? 'sm' : ''}`} aria-hidden="true" />;
}

export function Notice({ message, busy = false, tone }) {
  if (!message) return null;
  const t = tone || toneForMessage(message);
  return (
    <div className={`u-notice ${t}`} role={t === 'bad' ? 'alert' : 'status'}>
      {busy ? <Spinner small /> : t === 'ok' ? <I.Check /> : <I.Clock />}
      <span>{message}</span>
    </div>
  );
}

export function Empty({ icon: Icon = I.File, title, children }) {
  return (
    <div className="u-empty">
      <span className="ico">
        <Icon />
      </span>
      <b>{title}</b>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Avatar({ name, size = 40 }) {
  return (
    <span className="u-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

/* Circular match score. Colour follows the score, the arc animates in on mount. */
export function MatchRing({ value, size = 56 }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(t);
  }, []);
  if (value == null || Number.isNaN(Number(value))) return null;
  const v = Math.max(0, Math.min(100, Number(value)));
  const r = 17;
  const c = 2 * Math.PI * r;
  const tone = v >= 75 ? 'hi' : v >= 50 ? 'mid' : 'lo';
  return (
    <span className={`u-ring ${tone}`} style={{ width: size, height: size }} title={`${v}% match`}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle className="bg" cx="22" cy="22" r={r} />
        <circle className="fg" cx="22" cy="22" r={r} strokeDasharray={c} strokeDashoffset={on ? c * (1 - v / 100) : c} />
      </svg>
      <b style={{ fontSize: size * 0.27 }}>{Math.round(v)}</b>
    </span>
  );
}

/* Number that counts up when it scrolls into view. */
export function Stat({ icon: Icon, value, label, suffix = '', tone }) {
  const [ref, inView] = useInView({ threshold: 0.3 });
  const shown = useCountUp(Number(value) || 0, inView, 1100);
  return (
    <div className={`u-stat ${tone || ''}`} ref={ref}>
      {Icon && (
        <span className="ico">
          <Icon />
        </span>
      )}
      <div>
        <b>
          {Math.round(shown)}
          {suffix}
        </b>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function Timeline({ items }) {
  return (
    <ol className="u-timeline">
      {items.map((it, i) => (
        <li key={i} className={it.tone || 'muted'}>
          <span className="dotmark" />
          <div className="body">
            <div className="top">
              {it.badge}
              <b>{it.title}</b>
              {it.sub && <span className="sub">{it.sub}</span>}
            </div>
            {it.text && <p>{it.text}</p>}
          </div>
          <time title={it.fullTime}>{it.time}</time>
        </li>
      ))}
    </ol>
  );
}

export function Skeleton({ rows = 3 }) {
  return (
    <div className="u-skel-wrap" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="u-skel" key={i} style={{ '--i': i }} />
      ))}
    </div>
  );
}

export function RoleGate({ user, role, children }) {
  if (!user) return <p className="u-gate">Please login first.</p>;
  if (user.roleName !== role) return <p className="u-gate">This page is only for {role.toLowerCase()}s.</p>;
  return children;
}