import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { changePassword, getProfile, requestPasswordCode } from '../api/userApi';
import ProfilePage from './ProfilePage';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { userId: 5, fullName: 'Asha Rao', email: 'asha@example.test', roleName: 'Candidate' }, loginUser: vi.fn(), logout: vi.fn() }),
}));
vi.mock('../api/userApi', () => ({ getProfile: vi.fn(), updateProfile: vi.fn(), requestPasswordCode: vi.fn(), changePassword: vi.fn() }));
vi.mock('../api/authApi', () => ({ deleteAccount: vi.fn(), requestDeleteOtp: vi.fn() }));
// Simple stand-ins for the shared page pieces, so this test is only about the password part.
vi.mock('../components/ui', () => ({
  Avatar: ({ name }) => <span>{name}</span>,
  Badge: ({ children }) => <span>{children}</span>,
  Card: ({ children }) => <section>{children}</section>,
  CardHead: ({ title }) => <h2>{title}</h2>,
  Notice: ({ message }) => (message ? <div role="status">{message}</div> : null),
  PageHead: ({ title }) => <h1>{title}</h1>,
  Skeleton: () => <div>loading</div>,
}));

beforeEach(() => {
  getProfile.mockResolvedValue({ data: { fullName: 'Asha Rao', phone: '9876543210', address: 'Pune' } });
  requestPasswordCode.mockResolvedValue({});
  changePassword.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function openTheCodeStep() {
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Send verification code' }));
  await screen.findByLabelText('Verification code');
}

function fill(code, password, confirm) {
  fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: code } });
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: confirm } });
}

describe('Change password on the profile page', () => {
  it('emails a code first, then shows the code and password fields', async () => {
    await openTheCodeStep();

    expect(requestPasswordCode).toHaveBeenCalledTimes(1);
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('does not send two passwords that do not match', async () => {
    await openTheCodeStep();
    fill('123456', 'Strong1!pass', 'Different1!pass');
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(await screen.findByText('The two passwords do not match.')).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('does not send a weak password', async () => {
    await openTheCodeStep();
    fill('123456', 'weakpass', 'weakpass');
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(await screen.findByText(/at least 8 characters/i, { selector: '[role="status"]' })).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('sends the code with the new password and confirms it', async () => {
    await openTheCodeStep();
    fill('123456', 'Strong1!pass', 'Strong1!pass');
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

    await waitFor(() => expect(changePassword).toHaveBeenCalledTimes(1));
    expect(changePassword).toHaveBeenCalledWith({ otpCode: '123456', newPassword: 'Strong1!pass' });
    expect(await screen.findByText(/Your password was changed/)).toBeTruthy();
    expect(screen.queryByLabelText('Verification code')).toBeNull();
  });

  it('shows the message from the server when the code is wrong', async () => {
    changePassword.mockRejectedValue({ response: { data: { message: 'Invalid or expired verification code.' } } });
    await openTheCodeStep();
    fill('000000', 'Strong1!pass', 'Strong1!pass');
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(await screen.findByText('Invalid or expired verification code.')).toBeTruthy();
  });
});
