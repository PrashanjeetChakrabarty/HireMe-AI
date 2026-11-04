import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { login, registerCandidate, registerRecruiter } from '../api/authApi';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

vi.mock('@react-oauth/google', () => ({ GoogleLogin: () => null }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ loginUser: () => {} }) }));
vi.mock('../api/authApi', () => ({
  registerCandidate: vi.fn(() => Promise.resolve({})),
  registerRecruiter: vi.fn(() => Promise.resolve({})),
  getRegisterableRoles: vi.fn(() =>
    Promise.resolve({ data: [{ roleId: 1, roleName: 'Candidate' }, { roleId: 2, roleName: 'Recruiter' }] })
  ),
  googleLogin: vi.fn(),
  googleRegister: vi.fn(),
  login: vi.fn(() => Promise.resolve({ data: {} })),
}));

// These tests are about the form checks only, so the human check is switched off, even when a local key exists.
beforeEach(() => {
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '');
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

function show(page) {
  render(<MemoryRouter>{page}</MemoryRouter>);
}

describe('Register form checks', () => {
  it('shows a message under every wrong field and sends nothing', async () => {
    show(<RegisterPage />);
    await waitFor(() => expect(screen.getAllByRole('option').length).toBe(2));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    const alerts = await screen.findAllByRole('alert');
    const text = alerts.map((alert) => alert.textContent).join(' | ');
    expect(text).toContain('Full name must be between 2 and 100 characters.');
    expect(text).toContain('Enter your email.');
    expect(text).toContain('Enter a password.');
    expect(text).toContain('Enter your phone number.');
    expect(registerCandidate).not.toHaveBeenCalled();
  });

  it('sends the form, with the terms answer, when everything is right', async () => {
    show(<RegisterPage />);
    await waitFor(() => expect(screen.getAllByRole('option').length).toBe(2));
    const inputs = document.querySelectorAll('input');
    // The order on the page: full name, email, password, phone, then the tick box.
    fireEvent.change(inputs[0], { target: { value: 'Asha Rao' } });
    fireEvent.change(inputs[1], { target: { value: 'asha@example.com' } });
    fireEvent.change(inputs[2], { target: { value: 'Strong1!pass' } });
    fireEvent.change(inputs[3], { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(registerCandidate).toHaveBeenCalledTimes(1));
    expect(registerCandidate.mock.calls[0][0]).toMatchObject({
      email: 'asha@example.com',
      phone: '9876543210',
      acceptedTerms: true,
    });
    expect(registerRecruiter).not.toHaveBeenCalled();
  });
});

describe('Login form checks', () => {
  it('shows messages for a broken email and an empty password and sends nothing', async () => {
    show(<LoginPage />);
    fireEvent.change(document.querySelector('input[type="email"]'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    const alerts = await screen.findAllByRole('alert');
    const text = alerts.map((alert) => alert.textContent).join(' | ');
    expect(text).toContain('valid email');
    expect(text).toContain('Enter your password.');
    expect(login).not.toHaveBeenCalled();
  });
});
