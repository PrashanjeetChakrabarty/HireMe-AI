import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Card, CardHead } from './ui';

export const CANDIDATE_STEPS = [
  { title: 'Upload your resume', text: 'Our AI reads it and finds your skills, so jobs can be matched to you.', to: '/resumes' },
  { title: 'Apply to a job', text: 'Pick a job, read and tick its rules, then press Apply. You see your match score right away.', to: '/jobs' },
  { title: 'Track everything', text: 'Statuses, interviews and replies are all in My activity, and you also get an email.', to: '/my-activity' },
];

export const RECRUITER_STEPS = [
  { title: 'Post a job', text: 'Add the skills you need and choose simple rules, like how fast you will reply.', to: '/my-jobs' },
  { title: 'Review applicants', text: 'Candidates are ranked by their AI match score, so the best ones come first.', to: '/my-jobs' },
  { title: 'Shortlist and schedule', text: 'Move the best people forward and set an interview. They get an email.', to: '/my-jobs' },
];

const keyFor = userId => `quickstart-hidden:${userId ?? 'guest'}`;

function readHidden(userId) {
  try {
    return window.localStorage.getItem(keyFor(userId)) === '1';
  } catch {
    return false;
  }
}

// Whether the quick start card is showing. A person who hides it does not see it again on this browser, until they ask for it.
export function useQuickStart(userId) {
  const [visible, setVisible] = useState(() => !readHidden(userId));

  useEffect(() => {
    setVisible(!readHidden(userId));
  }, [userId]);

  const hide = () => {
    try {
      window.localStorage.setItem(keyFor(userId), '1');
    } catch {
      // Storage can be blocked. The card is still hidden for this visit.
    }
    setVisible(false);
  };

  const show = () => {
    try {
      window.localStorage.removeItem(keyFor(userId));
    } catch {
      // Same as above.
    }
    setVisible(true);
  };

  return { visible, hide, show };
}

export default function QuickStartCard({ role, onClose }) {
  const isRecruiter = role === 'Recruiter';
  const steps = isRecruiter ? RECRUITER_STEPS : CANDIDATE_STEPS;
  return (
    <Card className="quick-card">
      <CardHead title="Quick start">
        <button type="button" className="btn btn-ghost btn-xs" onClick={onClose}>
          Got it, hide this
        </button>
      </CardHead>
      <p className="u-hint">{isRecruiter ? 'New here? Three steps are all you need to hire.' : 'New here? Three steps are all you need to get hired.'}</p>
      <ol className="quick-steps">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Link to={step.to} className="quick-step">
              <span className="quick-num">{index + 1}</span>
              <span>
                <b>{step.title}</b>
                <small>{step.text}</small>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
