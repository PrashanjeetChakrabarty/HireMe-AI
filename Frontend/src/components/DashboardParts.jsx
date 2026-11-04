import { Link } from 'react-router-dom';

import { parseApiDate } from '../utils/dateTime';
import * as I from '../lib/icons';
import { Card, CardHead } from './ui';

const DAY = 24 * 60 * 60 * 1000;
const SHORTLISTED_OR_BETTER = ['Shortlisted', 'Scheduled', 'Completed', 'Hired'];

// Days left until the reply the recruiter promised. Negative means the promise is already late.
// It is null when the job has no reply deadline, or the date is unknown.
export function daysToReply(appliedAt, deadlineDays, now = Date.now()) {
  const days = Number(deadlineDays) || 0;
  const applied = parseApiDate(appliedAt);
  if (!applied || days <= 0) return null;
  return Math.ceil((applied.getTime() + days * DAY - now) / DAY);
}

export function describeReply(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return 'No reply deadline';
  if (daysLeft < 0) return `${-daysLeft} ${daysLeft === -1 ? 'day' : 'days'} late`;
  if (daysLeft === 0) return 'Due today';
  return `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`;
}

function byUrgency(a, b) {
  if (a.daysLeft === null && b.daysLeft === null) return 0;
  if (a.daysLeft === null) return 1;
  if (b.daysLeft === null) return -1;
  return a.daysLeft - b.daysLeft;
}

// Candidate: applications that have no answer yet, with the days left of the reply each recruiter promised.
export function waitingForCandidate(applications, openJobs, now = Date.now()) {
  const deadlineByJob = new Map((openJobs || []).map(job => [job.jobId, job.responseDeadlineDays]));
  return (applications || [])
    .filter(app => app.statusName === 'Applied')
    .map(app => ({
      key: app.applicationId,
      title: app.jobTitle,
      sub: app.companyName || '',
      daysLeft: daysToReply(app.appliedAt, deadlineByJob.get(app.jobId), now),
    }))
    .sort(byUrgency);
}

// Recruiter: applicants with no answer yet. Each entry of lists is { job, applicants }.
export function waitingForRecruiter(lists, now = Date.now()) {
  const items = [];
  (lists || []).forEach(({ job, applicants }) => {
    (applicants || [])
      .filter(app => app.statusName === 'Applied')
      .forEach(app => {
        items.push({
          key: app.applicationId,
          title: app.candidateName || 'A candidate',
          sub: job?.title || app.jobTitle || '',
          daysLeft: daysToReply(app.appliedAt, job?.responseDeadlineDays, now),
        });
      });
  });
  return items.sort(byUrgency);
}

// The candidate's checklist. Each step knows if it is done and where to go to do it.
export function buildChecklist({ resumes, applications, interviews, profile }) {
  const apps = applications || [];
  return [
    { id: 'resume', label: 'Upload your resume', done: (resumes || []).length > 0, to: '/resumes', guide: 'Upload a PDF or Word file. Our AI reads it and builds your skills profile.' },
    { id: 'phone', label: 'Add your phone number', done: Boolean(profile?.phone), to: '/profile', guide: 'Add your phone number in your profile so recruiters can reach you.' },
    { id: 'apply', label: 'Apply to your first job', done: apps.length > 0, to: '/jobs', guide: 'Open Browse jobs, pick a resume, read and tick the rules of the job, then press Apply.' },
    { id: 'shortlist', label: 'Get shortlisted', done: apps.some(app => SHORTLISTED_OR_BETTER.includes(app.statusName)), to: '/my-activity', guide: 'Recruiters review applications and shortlist the best. You get an email when it happens.' },
    { id: 'interview', label: 'Go to an interview', done: (interviews || []).length > 0, to: '/my-activity', guide: 'When a recruiter schedules an interview, the date, time and place show up here and in your email.' },
  ];
}

export function journeyCounts(applications) {
  const count = names => (applications || []).filter(app => names.includes(app.statusName)).length;
  return [
    { label: 'Applied', count: count(['Applied']) },
    { label: 'Shortlisted', count: count(['Shortlisted']) },
    { label: 'Interview', count: count(['Scheduled', 'Completed']) },
    { label: 'Hired', count: count(['Hired']) },
    { label: 'Not selected', count: count(['Rejected']) },
  ];
}

// A greeting for the time of day.
export function greetingFor(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// An animated guide: numbered steps joined by a line. The step to do now pulses and explains itself.
export function NextStepsCard({ items }) {
  const done = items.filter(item => item.done).length;
  const percent = items.length === 0 ? 0 : Math.round((done / items.length) * 100);
  const currentId = items.find(item => !item.done)?.id;
  return (
    <Card>
      <CardHead title="Your next steps" />
      <div className="u-funnel" style={{ marginBottom: 12 }}>
        <div className="r">
          <span>
            {done} of {items.length} done
          </span>
          <div className="bar">
            <i style={{ width: `${percent}%` }} />
          </div>
          <b>{percent}%</b>
        </div>
      </div>
      <ol className="guide-list">
        {items.map((item, index) => {
          const isCurrent = item.id === currentId;
          return (
            <li key={item.id} className={`guide-step ${item.done ? 'done' : ''} ${isCurrent ? 'current' : ''}`.trim()} style={{ '--i': index }}>
              <Link to={item.to} className="guide-link" aria-current={isCurrent ? 'step' : undefined}>
                <span className="guide-dot">{item.done ? <I.Check /> : index + 1}</span>
                <span className="guide-body">
                  <b>{item.label}</b>
                  {isCurrent && <small>{item.guide}</small>}
                  {isCurrent && (
                    <span className="guide-hint">
                      Start here <span className="guide-arrow" aria-hidden="true">&rarr;</span>
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

export function JourneyCard({ counts }) {
  const total = counts.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return null;
  const max = Math.max(1, ...counts.map(row => row.count));
  return (
    <Card>
      <CardHead title="Your journey" />
      <div className="u-funnel">
        {counts.map(row => (
          <div className="r" key={row.label}>
            <span>{row.label}</span>
            <div className="bar">
              <i style={{ width: `${(row.count / max) * 100}%` }} />
            </div>
            <b>{row.count}</b>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function WaitingCard({ title, hint, items, to, linkLabel }) {
  return (
    <Card>
      <CardHead title={title}>
        <Link className="btn btn-ghost btn-xs" to={to}>
          {linkLabel}
        </Link>
      </CardHead>
      {items.length === 0 ? (
        <p className="u-hint">{hint}</p>
      ) : (
        <ul className="u-list">
          {items.slice(0, 5).map(item => (
            <li key={item.key}>
              <div className="grow">
                <b>{item.title}</b>
                {item.sub && <small>{item.sub}</small>}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: item.daysLeft !== null && item.daysLeft < 0 ? 'var(--danger)' : 'var(--muted)' }}>
                {describeReply(item.daysLeft)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
