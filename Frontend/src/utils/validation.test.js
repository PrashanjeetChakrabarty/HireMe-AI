import { describe, expect, it } from 'vitest';

import {
  validateEmail,
  validateFullName,
  validateLoginForm,
  validateOtp,
  validatePassword,
  validatePhone,
  validateRegisterForm,
} from './validation';

const goodCandidate = {
  role: 'candidate',
  fullName: 'Asha Rao',
  email: 'asha@example.com',
  password: 'Strong1!pass',
  phone: '9876543210',
  companyName: '',
};

describe('single field checks', () => {
  it('accepts a normal email and rejects a broken one', () => {
    expect(validateEmail('asha@example.com')).toBe('');
    expect(validateEmail('  asha@example.com  ')).toBe('');
    expect(validateEmail('')).toBe('Enter your email.');
    expect(validateEmail('asha@')).toContain('valid email');
    expect(validateEmail('asha example.com')).toContain('valid email');
  });

  it('wants a strong password', () => {
    expect(validatePassword('Strong1!pass')).toBe('');
    expect(validatePassword('')).toBe('Enter a password.');
    expect(validatePassword('weakpass')).toContain('at least 8 characters');
  });

  it('wants a 10-digit Indian mobile number', () => {
    expect(validatePhone('9876543210')).toBe('');
    expect(validatePhone('')).toBe('Enter your phone number.');
    expect(validatePhone('1234567890')).toContain('10-digit');
    expect(validatePhone('98765')).toContain('10-digit');
  });

  it('wants a name of 2 to 100 characters', () => {
    expect(validateFullName('Asha Rao')).toBe('');
    expect(validateFullName('A')).toContain('between 2 and 100');
    expect(validateFullName('x'.repeat(101))).toContain('between 2 and 100');
  });

  it('wants exactly 6 digits for the code', () => {
    expect(validateOtp('123456')).toBe('');
    expect(validateOtp('12345')).toContain('6-digit');
    expect(validateOtp('')).toContain('6-digit');
    expect(validateOtp('12345a')).toContain('6-digit');
  });
});

describe('validateRegisterForm', () => {
  it('has no errors for a good candidate', () => {
    expect(validateRegisterForm(goodCandidate)).toEqual({});
  });

  it('has no errors for a good recruiter', () => {
    const recruiter = { ...goodCandidate, role: 'recruiter', phone: '', companyName: 'Acme' };
    expect(validateRegisterForm(recruiter)).toEqual({});
  });

  it('asks for a phone number only from candidates', () => {
    expect(validateRegisterForm({ ...goodCandidate, phone: '' })).toHaveProperty('phone');
    const recruiter = { ...goodCandidate, role: 'recruiter', phone: '', companyName: 'Acme' };
    expect(validateRegisterForm(recruiter)).not.toHaveProperty('phone');
  });

  it('asks for a company name only from recruiters', () => {
    const recruiter = { ...goodCandidate, role: 'recruiter', companyName: '  ' };
    expect(validateRegisterForm(recruiter)).toHaveProperty('companyName');
    expect(validateRegisterForm(goodCandidate)).not.toHaveProperty('companyName');
  });

  it('reports every wrong field at once', () => {
    const errors = validateRegisterForm({ ...goodCandidate, fullName: '', email: 'x', password: 'x', phone: '1' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'fullName', 'password', 'phone']);
  });

  it('asks for a role when none is chosen', () => {
    expect(validateRegisterForm({ ...goodCandidate, role: '' })).toHaveProperty('role');
  });
});

describe('validateLoginForm', () => {
  it('accepts an email and a password', () => {
    expect(validateLoginForm({ email: 'asha@example.com', password: 'anything' })).toEqual({});
  });

  it('reports a broken email and an empty password', () => {
    const errors = validateLoginForm({ email: 'nope', password: '' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'password']);
  });
});
