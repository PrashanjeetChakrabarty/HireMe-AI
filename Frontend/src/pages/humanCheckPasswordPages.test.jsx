import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { forgotPassword, resendOtp } from '../api/authApi';
import ForgotPasswordPage from './ForgotPasswordPage';
import OtpVerifyPage from './OtpVerifyPage';
import ResetPasswordPage from './ResetPasswordPage';

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
  forgotPassword: vi.fn(() => Promise.resolve({})),
  resendOtp: vi.fn(() => Promise.resolve({})),
  verifyOtp: vi.fn(),
  resetPassword: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function show(page, state) {
  render(<MemoryRouter initialEntries={[{ pathname: '/page', state }]}>{page}</MemoryRouter>);
}

describe('Forgot password with the human check', () => {
  it('stays off until the check is passed, then sends the answer', async () => {
    show(<ForgotPasswordPage />);
    const button = screen.getByRole('button', { name: 'Send Reset Code' });
    expect(button.disabled).toBe(true);

    fireEvent.change(document.querySelector('input[type="email"]'), { target: { value: 'asha@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'pass the human check' }));
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    await waitFor(() => expect(forgotPassword).toHaveBeenCalledTimes(1));
    expect(forgotPassword).toHaveBeenCalledWith('asha@example.com', 'good-token');
  });
});

describe('Resend the code with the human check', () => {
  it('on the reset password page, resend stays off until the check is passed', async () => {
    show(<ResetPasswordPage />, { email: 'asha@example.com' });
    const resend = screen.getByRole('button', { name: /Resend/ });
    expect(resend.disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'pass the human check' }));
    expect(resend.disabled).toBe(false);

    fireEvent.click(resend);
    await waitFor(() => expect(forgotPassword).toHaveBeenCalledTimes(1));
    expect(forgotPassword).toHaveBeenCalledWith('asha@example.com', 'good-token');
  });

  it('on the verify email page, resend stays off until the check is passed', async () => {
    show(<OtpVerifyPage />, { email: 'asha@example.com' });
    const resend = screen.getByRole('button', { name: /Resend/ });
    expect(resend.disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'pass the human check' }));
    expect(resend.disabled).toBe(false);

    fireEvent.click(resend);
    await waitFor(() => expect(resendOtp).toHaveBeenCalledTimes(1));
    expect(resendOtp).toHaveBeenCalledWith('asha@example.com', 'good-token');
  });
});
