import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  JourneyCard,
  NextStepsCard,
  WaitingCard,
  buildChecklist,
  daysToReply,
  describeReply,
  greetingFor,
  journeyCounts,
  waitingForCandidate,
  waitingForRecruiter,
} from './DashboardParts';

// Simple stand-ins for the shared page pieces, so this test is only about the dashboard cards.
vi.mock('./ui', () => ({
  Card: ({ children }) => <section>{children}</section>,
  CardHead: ({ title, children }) => (
    <header>
      <h2>{title}</h2>
      {children}
    </header>
  ),
}));

afterEach(cleanup);

const NOW = Date.parse('2026-11-10T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const ago = days => new Date(NOW - days * DAY).toISOString();

describe('daysToReply and describeReply', () => {
  it('counts the days left of a promised reply', () => {
    expect(daysToReply(ago(2), 7, NOW)).toBe(5);
    expect(describeReply(5)).toBe('5 days left');
    expect(describeReply(1)).toBe('1 day left');
  });

  it('says when the promise is late or due today', () => {
    expect(daysToReply(ago(10), 7, NOW)).toBe(-3);
    expect(describeReply(-3)).toBe('3 days late');
    expect(describeReply(-1)).toBe('1 day late');
    expect(describeReply(0)).toBe('Due today');
  });

  it('has no days when there is no deadline', () => {
    expect(daysToReply(ago(2), 0, NOW)).toBeNull();
    expect(daysToReply(ago(2), undefined, NOW)).toBeNull();
    expect(describeReply(null)).toBe('No reply deadline');
  });
});

describe('waiting lists', () => {
  it('lists the candidate applications with no answer yet, most urgent first', () => {
    const applications = [
      { applicationId: 1, jobId: 10, jobTitle: 'Tester', companyName: 'Acme', statusName: 'Applied', appliedAt: ago(1) },
      { applicationId: 2, jobId: 11, jobTitle: 'Developer', companyName: 'Beta', statusName: 'Applied', appliedAt: ago(9) },
      { applicationId: 3, jobId: 12, jobTitle: 'Designer', companyName: 'Gamma', statusName: 'Shortlisted', appliedAt: ago(3) },
    ];
    const jobs = [
      { jobId: 10, responseDeadlineDays: 14 },
      { jobId: 11, responseDeadlineDays: 7 },
      { jobId: 12, responseDeadlineDays: 7 },
    ];

    const items = waitingForCandidate(applications, jobs, NOW);

    expect(items.map(item => item.title)).toEqual(['Developer', 'Tester']);
    expect(items[0].daysLeft).toBe(-2);
    expect(items[1].daysLeft).toBe(13);
  });

  it('puts applications of jobs with no deadline last', () => {
    const applications = [
      { applicationId: 1, jobId: 10, jobTitle: 'A', statusName: 'Applied', appliedAt: ago(1) },
      { applicationId: 2, jobId: 99, jobTitle: 'B', statusName: 'Applied', appliedAt: ago(1) },
    ];
    const items = waitingForCandidate(applications, [{ jobId: 10, responseDeadlineDays: 14 }], NOW);
    expect(items.map(item => item.title)).toEqual(['A', 'B']);
    expect(items[1].daysLeft).toBeNull();
  });

  it('lists the applicants a recruiter has not answered yet, the most late first', () => {
    const lists = [
      {
        job: { jobId: 10, title: 'Tester', responseDeadlineDays: 7 },
        applicants: [
          { applicationId: 1, candidateName: 'Asha', statusName: 'Applied', appliedAt: ago(2) },
          { applicationId: 2, candidateName: 'Ravi', statusName: 'Rejected', appliedAt: ago(20) },
        ],
      },
      {
        job: { jobId: 11, title: 'Developer', responseDeadlineDays: 7 },
        applicants: [{ applicationId: 3, candidateName: 'Meera', statusName: 'Applied', appliedAt: ago(8) }],
      },
    ];

    const items = waitingForRecruiter(lists, NOW);

    expect(items.map(item => item.title)).toEqual(['Meera', 'Asha']);
    expect(items[0].sub).toBe('Developer');
    expect(items[0].daysLeft).toBe(-1);
  });
});

describe('buildChecklist and journeyCounts', () => {
  it('marks the steps that are done', () => {
    const steps = buildChecklist({
      resumes: [{ resumeId: 1 }],
      applications: [{ statusName: 'Shortlisted' }],
      interviews: [],
      profile: { phone: '9876543210' },
    });
    expect(steps.map(step => [step.id, step.done])).toEqual([
      ['resume', true],
      ['phone', true],
      ['apply', true],
      ['shortlist', true],
      ['interview', false],
    ]);
  });

  it('starts with nothing done for a new candidate', () => {
    const steps = buildChecklist({ resumes: [], applications: [], interviews: [], profile: null });
    expect(steps.every(step => !step.done)).toBe(true);
  });

  it('counts the applications at each stage', () => {
    const counts = journeyCounts([
      { statusName: 'Applied' },
      { statusName: 'Applied' },
      { statusName: 'Scheduled' },
      { statusName: 'Completed' },
      { statusName: 'Hired' },
      { statusName: 'Rejected' },
    ]);
    expect(counts.map(row => [row.label, row.count])).toEqual([
      ['Applied', 2],
      ['Shortlisted', 0],
      ['Interview', 2],
      ['Hired', 1],
      ['Not selected', 1],
    ]);
  });
});

describe('greetingFor', () => {
  it('greets by the time of day', () => {
    expect(greetingFor(8)).toBe('Good morning');
    expect(greetingFor(12)).toBe('Good afternoon');
    expect(greetingFor(16)).toBe('Good afternoon');
    expect(greetingFor(17)).toBe('Good evening');
    expect(greetingFor(23)).toBe('Good evening');
  });
});

describe('the cards', () => {
  it('guides the candidate: the step to do now explains itself, and there are no Do it buttons', () => {
    const items = buildChecklist({ resumes: [{ resumeId: 1 }], applications: [], interviews: [], profile: null });
    render(
      <MemoryRouter>
        <NextStepsCard items={items} />
      </MemoryRouter>
    );
    expect(screen.getByText('1 of 5 done')).toBeTruthy();
    expect(screen.getByText('20%')).toBeTruthy();
    expect(screen.queryByText('Do it')).toBeNull();

    // The first step that is not done is the one to do now: only it shows its guide and the "Start here" hint.
    expect(screen.getAllByText('Start here').length).toBe(1);
    expect(screen.getByText(/phone number in your profile/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Add your phone number/ }).getAttribute('aria-current')).toBe('step');
    expect(screen.getByRole('link', { name: /Apply to your first job/ }).getAttribute('href')).toBe('/jobs');
  });

  it('shows nothing for the journey before the first application', () => {
    const { container } = render(
      <MemoryRouter>
        <JourneyCard counts={journeyCounts([])} />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows a late reply in the waiting card, and a friendly line when nothing waits', () => {
    const { rerender } = render(
      <MemoryRouter>
        <WaitingCard title="Waiting for your reply" hint="All caught up." items={[{ key: 1, title: 'Meera', sub: 'Developer', daysLeft: -1 }]} to="/my-jobs" linkLabel="Open my jobs" />
      </MemoryRouter>
    );
    expect(screen.getByText('1 day late')).toBeTruthy();

    rerender(
      <MemoryRouter>
        <WaitingCard title="Waiting for your reply" hint="All caught up." items={[]} to="/my-jobs" linkLabel="Open my jobs" />
      </MemoryRouter>
    );
    expect(screen.getByText('All caught up.')).toBeTruthy();
  });
});
