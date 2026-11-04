import { parseApiDate } from './dateTime';

export const fmtDateTime = value => {
  const d = parseApiDate(value);
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

export const fmtDate = value => {
  const d = parseApiDate(value);
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const timeAgo = (value, now = Date.now()) => {
  const d = parseApiDate(value);
  if (!d || Number.isNaN(d.getTime())) return '';
  const s = Math.round((now - d.getTime()) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)} d ago`;
  return fmtDate(value);
};

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('') || '?';

export const toneForStatus = status =>
  ({ Applied: 'info', Shortlisted: 'ok', Scheduled: 'violet', Completed: 'ok', Hired: 'ok', Rejected: 'bad', Open: 'ok', Closed: 'muted' })[status] || 'muted';

// Pages keep one "message" string for both successes and errors, so the colour is chosen from its wording.
export const toneForMessage = message => {
  if (/^please/i.test(message)) return 'warn';
  if (/could not|couldn't|failed|error|unable|invalid|not found/i.test(message)) return 'bad';
  if (/success|applied|uploaded|deleted|scheduled|marked|posted|closed|reopened|saved/i.test(message)) return 'ok';
  return 'info';
};


// The backend writes summaries like "Status changed to Rejected", "Application submitted" or "Application updated".
export const toneForSummary = summary => {
  if (/rejected/i.test(summary || '')) return 'bad';
  if (/shortlisted|hired|completed/i.test(summary || '')) return 'ok';
  return 'info';
};