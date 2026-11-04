import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with no logged-in user when localStorage is empty', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toBeNull();
  });

  it('restores the user from localStorage on load', () => {
    localStorage.setItem('user', JSON.stringify({ fullName: 'Asha', token: 'abc123' }));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user.fullName).toBe('Asha');
  });

  it('loginUser saves the user to state and localStorage', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    act(() => {
      result.current.loginUser({ fullName: 'Asha', token: 'abc123' });
    });

    expect(result.current.user.fullName).toBe('Asha');
    expect(JSON.parse(localStorage.getItem('user')).token).toBe('abc123');
  });

  it('logout clears both state and localStorage', () => {
    localStorage.setItem('user', JSON.stringify({ fullName: 'Asha', token: 'abc123' }));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});