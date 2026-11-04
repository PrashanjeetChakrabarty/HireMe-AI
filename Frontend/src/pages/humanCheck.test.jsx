import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { login, registerCandidate } from '../api/authApi';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

vi.mock('@react-oauth/google', () => ({ GoogleLogin: () => null }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ loginUser: () => {} }) }));
// The real box talks to Cloudflare. This stand-in is a button that "passes" the check when pressed.
vi.mock('../components/TurnstileBox', () => ({
  default: ({ onToken }) => (
    <button type="button" onClick={() => onToken('good-token')}>
      pass the human check
    </button>
  ),
  isTurnstileEnabled: () => true,
}));
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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function show(page) {
  render(<MemoryRouter>{page}</MemoryRouter>);
}

describe('Login with the human check', () => {
  it('stays off until the check is passed, then sends the answer', async () => {
    show(<LoginPage />);
    const button = screen.getByRole('button', { name: 'Log in' });
    expect(button.disabled).toBe(true);

    fireEvent.change(document.querySelector('input[type="email"]'), { target: { value: 'asha@example.com' } });
    fireEvent.change(document.querySelector('input[type="password"]'), { target: { value: 'Strong1!pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'pass the human check' }));
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    await waitFor(() => expect(login).toHaveBeenCalledTimes(1));
    expect(login.mock.calls[0][0]).toEqual({
      email: 'asha@example.com',
      password: 'Strong1!pass',
      turnstileToken: 'good-token',
    });
  });
});

describe('Register with the human check', () => {
  it('stays off until the check is passed, then sends the answer', async () => {
    show(<RegisterPage />);
    await waitFor(() => expect(screen.getAllByRole('option').length).toBe(2));
    const inputs = document.querySelectorAll('input');
    // The order on the page: full name, email, password, phone, then the tick box.
    fireEvent.change(inputs[0], { target: { value: 'Asha Rao' } });
    fireEvent.change(inputs[1], { target: { value: 'asha@example.com' } });
    fireEvent.change(inputs[2], { target: { value: 'Strong1!pass' } });
    fireEvent.change(inputs[3], { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('checkbox'));

    const button = screen.getByRole('button', { name: 'Create account' });
    expect(button.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'pass the human check' }));
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    await waitFor(() => expect(registerCandidate).toHaveBeenCalledTimes(1));
    expect(registerCandidate.mock.calls[0][0]).toMatchObject({ acceptedTerms: true, turnstileToken: 'good-token' });
  });
});
