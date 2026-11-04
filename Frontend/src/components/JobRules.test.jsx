import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_RULES, JobRulesBox, JobRulesForm, JobRulesSummary, describeJobRules } from './JobRules';

afterEach(cleanup);

describe('describeJobRules', () => {
  it('says there are no restrictions for an old job without rules', () => {
    expect(describeJobRules({ title: 'Old job' })).toEqual(['No extra restrictions. You can apply to other jobs as you like.']);
  });

  it('describes the one job at a time rule with its reply deadline', () => {
    const lines = describeJobRules({ exclusiveApplication: true, responseDeadlineDays: 14 });
    expect(lines[0]).toContain('One job at a time');
    expect(lines[0]).toContain('after 14 days');
    expect(lines).toContain('The recruiter has promised to reply within 14 days.');
  });

  it('describes a hire pause for one company and for the whole platform', () => {
    expect(describeJobRules({ hireLockMonths: 6, hireLockScope: 'Recruiter' })[0]).toBe(
      "If you are hired, you cannot apply to this company's other jobs for 6 months."
    );
    expect(describeJobRules({ hireLockMonths: 1, hireLockScope: 'Platform' })[0]).toBe(
      'If you are hired, you cannot apply for any job on HireMe AI for 1 month.'
    );
  });

  it('describes the wait after a rejection', () => {
    expect(describeJobRules({ rejectWaitDays: 90 })[0]).toBe(
      "If you are not selected, you cannot apply to this company's other jobs for 90 days."
    );
  });
});

describe('JobRulesBox', () => {
  it('shows the rules and reports the tick', () => {
    const onChange = vi.fn();
    render(<JobRulesBox job={{ hireLockMonths: 12, hireLockScope: 'Platform' }} accepted={false} onChange={onChange} />);
    expect(screen.getByText(/any job on HireMe AI for 12 months/)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('JobRulesSummary', () => {
  it('lists the rules of a job', () => {
    render(<JobRulesSummary job={{ rejectWaitDays: 30 }} />);
    expect(screen.getByText(/for 30 days/)).toBeTruthy();
  });
});

describe('JobRulesForm', () => {
  it('starts with no pause and hides the scope choice', () => {
    render(<JobRulesForm rules={DEFAULT_RULES} onChange={() => {}} />);
    expect(screen.queryByLabelText('The pause applies to')).toBeNull();
  });

  it('sends the chosen hire pause as a number and then shows the scope choice', () => {
    const onChange = vi.fn();
    const { rerender } = render(<JobRulesForm rules={DEFAULT_RULES} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('After a hire, pause new applications for'), { target: { value: '12' } });
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_RULES, hireLockMonths: 12 });

    rerender(<JobRulesForm rules={{ ...DEFAULT_RULES, hireLockMonths: 12 }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('The pause applies to'), { target: { value: 'Platform' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_RULES, hireLockMonths: 12, hireLockScope: 'Platform' });
  });

  it('warns about the platform wide pause', () => {
    render(<JobRulesForm rules={{ ...DEFAULT_RULES, hireLockMonths: 6, hireLockScope: 'Platform' }} onChange={() => {}} />);
    expect(screen.getByText(/not be able to apply for any job, at any company/)).toBeTruthy();
  });

  it('reports the wait, the deadline and the two ticks', () => {
    const onChange = vi.fn();
    render(<JobRulesForm rules={DEFAULT_RULES} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/After a rejection/), { target: { value: '90' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_RULES, rejectWaitDays: 90 });
    fireEvent.change(screen.getByLabelText('I promise to reply within'), { target: { value: '7' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_RULES, responseDeadlineDays: 7 });
    const [oneJob, confirm] = screen.getAllByRole('checkbox');
    fireEvent.click(oneJob);
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_RULES, exclusiveApplication: true });
    fireEvent.click(confirm);
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_RULES, acceptedPolicies: true });
  });
});
