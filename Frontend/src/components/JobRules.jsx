import { Fragment } from 'react';

export const DEFAULT_RULES = {
  exclusiveApplication: false,
  hireLockMonths: 0,
  hireLockScope: 'Recruiter',
  rejectWaitDays: 0,
  responseDeadlineDays: 14,
  acceptedPolicies: false,
};

const LOCK_OPTIONS = [0, 3, 6, 9, 12, 18, 24, 36, 60];
const WAIT_OPTIONS = [0, 15, 30, 60, 90, 180, 365];
const DEADLINE_OPTIONS = [7, 14, 21, 30, 45, 60, 90];

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// The rules of a job in plain words. Old jobs have no rules (the fields are missing), so they get the "no restrictions" line.
export function describeJobRules(job) {
  const lines = [];
  const days = Number(job.responseDeadlineDays) || 0;
  const months = Number(job.hireLockMonths) || 0;
  const wait = Number(job.rejectWaitDays) || 0;

  if (job.exclusiveApplication) {
    lines.push(
      days > 0
        ? `One job at a time: while your application is open, you cannot apply to this company's other jobs. This ends when the recruiter replies, or after ${plural(days, 'day')}.`
        : "One job at a time: while your application is open, you cannot apply to this company's other jobs. This ends when the recruiter replies."
    );
  }
  if (months > 0) {
    lines.push(
      job.hireLockScope === 'Platform'
        ? `If you are hired, you cannot apply for any job on HireMe AI for ${plural(months, 'month')}.`
        : `If you are hired, you cannot apply to this company's other jobs for ${plural(months, 'month')}.`
    );
  }
  if (wait > 0) {
    lines.push(`If you are not selected, you cannot apply to this company's other jobs for ${plural(wait, 'day')}.`);
  }
  if (lines.length === 0) {
    lines.push('No extra restrictions. You can apply to other jobs as you like.');
  }
  if (days > 0) {
    lines.push(`The recruiter has promised to reply within ${plural(days, 'day')}.`);
  }
  return lines;
}

// A short, folded list of the rules, for the recruiter's own job cards.
export function JobRulesSummary({ job }) {
  return (
    <details className="u-hint" style={{ marginTop: 8 }}>
      <summary>Application rules</summary>
      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {describeJobRules(job).map(line => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </details>
  );
}

// What the candidate sees before applying: the rules, and a box to accept them.
export function JobRulesBox({ job, accepted, onChange, disabled = false }) {
  return (
    <div className="u-sec" style={{ marginBottom: 12 }}>
      <h5>Rules for this job</h5>
      <ul style={{ margin: '6px 0 12px', paddingLeft: 18 }}>
        {describeJobRules(job).map(line => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <label className="u-check">
        <input type="checkbox" checked={Boolean(accepted)} onChange={event => onChange(event.target.checked)} disabled={disabled} />
        I have read and accept these rules.
      </label>
    </div>
  );
}

// What the recruiter fills in when posting a job.
export function JobRulesForm({ rules, onChange, disabled = false }) {
  const set = patch => onChange({ ...rules, ...patch });

  return (
    <div className="u-sec">
      <h5>Application rules</h5>
      <p className="u-hint">Candidates see these rules before they apply and must accept them. They cannot be changed after posting.</p>
      <div className="u-stack">
        <label className="u-check">
          <input
            type="checkbox"
            checked={rules.exclusiveApplication}
            onChange={event => set({ exclusiveApplication: event.target.checked })}
            disabled={disabled}
          />
          One job at a time: a candidate with an open application to one of my jobs cannot apply to my other jobs until I reply.
        </label>

        <div className="u-row2">
          <div className="u-field">
            <label className="u-label" htmlFor="rule-lock">After a hire, pause new applications for</label>
            <select
              id="rule-lock"
              className="u-select sm"
              value={rules.hireLockMonths}
              onChange={event => set({ hireLockMonths: Number(event.target.value) })}
              disabled={disabled}
            >
              {LOCK_OPTIONS.map(months => (
                <option key={months} value={months}>
                  {months === 0 ? 'No pause' : plural(months, 'month')}
                </option>
              ))}
            </select>
          </div>
          {rules.hireLockMonths > 0 && (
            <div className="u-field">
              <label className="u-label" htmlFor="rule-scope">The pause applies to</label>
              <select
                id="rule-scope"
                className="u-select sm"
                value={rules.hireLockScope}
                onChange={event => set({ hireLockScope: event.target.value })}
                disabled={disabled}
              >
                <option value="Recruiter">Only my jobs</option>
                <option value="Platform">The whole platform</option>
              </select>
            </div>
          )}
        </div>
        {rules.hireLockMonths > 0 && rules.hireLockScope === 'Platform' && (
          <p className="u-hint">A hired candidate will not be able to apply for any job, at any company, during this time. Candidates see this before they apply.</p>
        )}

        <div className="u-row2">
          <div className="u-field">
            <label className="u-label" htmlFor="rule-wait">After a rejection, my other jobs are closed to that candidate for</label>
            <select
              id="rule-wait"
              className="u-select sm"
              value={rules.rejectWaitDays}
              onChange={event => set({ rejectWaitDays: Number(event.target.value) })}
              disabled={disabled}
            >
              {WAIT_OPTIONS.map(days => (
                <option key={days} value={days}>
                  {days === 0 ? 'No wait' : plural(days, 'day')}
                </option>
              ))}
            </select>
          </div>
          <div className="u-field">
            <label className="u-label" htmlFor="rule-deadline">I promise to reply within</label>
            <select
              id="rule-deadline"
              className="u-select sm"
              value={rules.responseDeadlineDays}
              onChange={event => set({ responseDeadlineDays: Number(event.target.value) })}
              disabled={disabled}
            >
              {DEADLINE_OPTIONS.map(days => (
                <Fragment key={days}>
                  <option value={days}>{plural(days, 'day')}</option>
                </Fragment>
              ))}
            </select>
          </div>
        </div>

        <label className="u-check">
          <input
            type="checkbox"
            checked={rules.acceptedPolicies}
            onChange={event => set({ acceptedPolicies: event.target.checked })}
            disabled={disabled}
          />
          I confirm these rules. Candidates will see them before applying, and I will follow them.
        </label>
      </div>
    </div>
  );
}
