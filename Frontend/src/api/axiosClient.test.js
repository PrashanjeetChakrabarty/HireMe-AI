import { describe, it, expect, beforeEach } from 'vitest';
import axiosClient from './axiosClient';

// This grabs the interceptor function from axiosClient.js directly
// (the one that runs before every request and adds the auth token)
// so we can test it without actually calling a real server.
const requestInterceptor = axiosClient.interceptors.request.handlers[0].fulfilled;

describe('axiosClient request interceptor', () => {
  beforeEach(() => {
    // Clear localStorage before each test so one test doesn't
    // affect the next one.
    localStorage.clear();
  });

  it('adds Authorization header when a logged-in user exists in localStorage', () => {
    localStorage.setItem('user', JSON.stringify({ token: 'my-fake-token' }));

    const config = requestInterceptor({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer my-fake-token');
  });

  it('does not add Authorization header when no user is logged in', () => {
    const config = requestInterceptor({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });

  it('does not crash when user exists in localStorage but has no token', () => {
    localStorage.setItem('user', JSON.stringify({ fullName: 'Test User' }));

    const config = requestInterceptor({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });
});