import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteAccount, requestDeleteOtp } from '../api/authApi';
import { getProfile, updateProfile } from '../api/userApi';
import ProfilePage from './ProfilePage';

const loginUser = vi.fn();
const logout = vi.fn();
let currentUser;

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: currentUser, loginUser, logout }) }));
vi.mock('../api/userApi', () => ({ getProfile: vi.fn(), updateProfile: vi.fn(), requestPasswordCode: vi.fn(), changePassword: vi.fn() }));
vi.mock('../api/authApi', () => ({ deleteAccount: vi.fn(), requestDeleteOtp: vi.fn() }));
// Simple stand-ins for the shared page pieces, so this test is only about the profile page itself.
vi.mock('../components/ui', () => ({
  Avatar: ({ name }) => <span>{name}</span>,
  Badge: ({ children }) => <span>{children}</span>,
  Card: ({ children }) => <section>{children}</section>,
  CardHead: ({ title }) => <h2>{title}</h2>,
  Notice: ({ message }) => (message ? <div role="status">{message}</div> : null),
  PageHead: ({ title }) => <h1>{title}</h1>,
  Skeleton: () => <div>loading</div>,
}));

const candidate = { userId: 5, fullName: 'Asha Rao', email: 'asha@example.test', roleName: 'Candidate' };
const recruiter = { userId: 9, fullName: 'Ravi Kumar', email: 'ravi@example.test', roleName: 'Recruiter' };

function show() {
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  currentUser = candidate;
  getProfile.mockResolvedValue({ data: { fullName: 'Asha Rao', phone: '9876543210', address: 'Pune' } });
  updateProfile.mockResolvedValue({});
  requestDeleteOtp.mockResolvedValue({});
  deleteAccount.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProfilePage', () => {
  it('shows the details the server has', async () => {
    show();
    expect(await screen.findByText('9876543210')).toBeTruthy();
    expect(screen.getByText('Pune')).toBeTruthy();
    expect(getProfile).toHaveBeenCalledWith(5);
  });

  it('saves the edited details and refreshes the name used in the navbar', async () => {
    show();
    await screen.findByText('9876543210');
    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: '  Asha R. Rao  ' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    expect(updateProfile).toHaveBeenCalledWith(5, { fullName: 'Asha R. Rao', phone: '9876543210', address: null });
    expect(loginUser).toHaveBeenCalledWith({ ...candidate, fullName: 'Asha R. Rao' });
    expect(await screen.findByText('Profile updated.')).toBeTruthy();
  });

  it('shows a message for a wrong phone number and sends nothing', async () => {
    show();
    await screen.findByText('9876543210');
    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(await screen.findByText(/valid 10-digit phone number/)).toBeTruthy();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('does not ask a recruiter for a phone number or an address', async () => {
    currentUser = recruiter;
    getProfile.mockResolvedValue({ data: { fullName: 'Ravi Kumar' } });
    show();
    await waitFor(() => expect(getProfile).toHaveBeenCalledWith(9));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit profile' }));

    expect(screen.queryByLabelText('Phone')).toBeNull();
    expect(screen.queryByLabelText('Address')).toBeNull();
  });

  it('deletes the account only after the code from the email is entered', async () => {
    show();
    await screen.findByText('9876543210');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Account' }));
    await waitFor(() => expect(requestDeleteOtp).toHaveBeenCalledTimes(1));
    expect(deleteAccount).not.toHaveBeenCalled();

    fireEvent.change(await screen.findByPlaceholderText('Verification Code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith('123456'));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
