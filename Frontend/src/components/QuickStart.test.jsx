import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import QuickStartCard, { useQuickStart } from './QuickStart';

// Simple stand-ins for the shared page pieces, so this test is only about the quick start.
vi.mock('./ui', () => ({
  Card: ({ children }) => <section>{children}</section>,
  CardHead: ({ title, children }) => (
    <header>
      <h2>{title}</h2>
      {children}
    </header>
  ),
}));

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(cleanup);

function Probe({ userId }) {
  const quickStart = useQuickStart(userId);
  return (
    <div>
      <span data-testid="state">{quickStart.visible ? 'visible' : 'hidden'}</span>
      <button type="button" onClick={quickStart.hide}>hide</button>
      <button type="button" onClick={quickStart.show}>show</button>
    </div>
  );
}

describe('QuickStartCard', () => {
  it('shows three steps for a candidate, each one a link', () => {
    render(
      <MemoryRouter>
        <QuickStartCard role="Candidate" onClose={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Upload your resume/ }).getAttribute('href')).toBe('/resumes');
    expect(screen.getByRole('link', { name: /Apply to a job/ }).getAttribute('href')).toBe('/jobs');
    expect(screen.getByRole('link', { name: /Track everything/ }).getAttribute('href')).toBe('/my-activity');
    expect(screen.getAllByRole('link').length).toBe(3);
  });

  it('shows three steps for a recruiter', () => {
    render(
      <MemoryRouter>
        <QuickStartCard role="Recruiter" onClose={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Post a job/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Review applicants/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Shortlist and schedule/ })).toBeTruthy();
    expect(screen.queryByText(/Upload your resume/)).toBeNull();
  });

  it('calls onClose from the hide button', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <QuickStartCard role="Candidate" onClose={onClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Got it, hide this' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('useQuickStart', () => {
  it('shows for a new person, and stays hidden after they hide it', () => {
    const { unmount } = render(<Probe userId={5} />);
    expect(screen.getByTestId('state').textContent).toBe('visible');

    fireEvent.click(screen.getByText('hide'));
    expect(screen.getByTestId('state').textContent).toBe('hidden');
    unmount();

    // A new visit to the page: it is still hidden.
    render(<Probe userId={5} />);
    expect(screen.getByTestId('state').textContent).toBe('hidden');
  });

  it('remembers the choice for each person on their own', () => {
    const { rerender } = render(<Probe userId={5} />);
    fireEvent.click(screen.getByText('hide'));
    expect(screen.getByTestId('state').textContent).toBe('hidden');

    act(() => {
      rerender(<Probe userId={6} />);
    });
    expect(screen.getByTestId('state').textContent).toBe('visible');
  });

  it('comes back when it is asked for', () => {
    render(<Probe userId={5} />);
    fireEvent.click(screen.getByText('hide'));
    fireEvent.click(screen.getByText('show'));

    expect(screen.getByTestId('state').textContent).toBe('visible');
    expect(window.localStorage.getItem('quickstart-hidden:5')).toBeNull();
  });
});
