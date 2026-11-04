import axiosClient from './axiosClient';

export const login = (data) => axiosClient.post('/api/Auth/login', data);

export const googleLogin = (idToken) => axiosClient.post('/api/Auth/google-login', { idToken });

export const googleRegister = (idToken, role, phone, companyName, acceptedTerms) =>
  axiosClient.post('/api/Auth/google-register', { idToken, role, phone, companyName, acceptedTerms });

export const registerCandidate = (data) => axiosClient.post('/api/Auth/register/candidate', data);

export const registerRecruiter = (data) => axiosClient.post('/api/Auth/register/recruiter', data);

export const getRegisterableRoles = () => axiosClient.get('/api/Roles/register-options');

export const verifyOtp = (data) => axiosClient.post('/api/Auth/verify-otp', data);

export const resendOtp = (email, turnstileToken) => axiosClient.post('/api/Auth/resend-otp', { email, turnstileToken });

export const forgotPassword = (email, turnstileToken) =>
  axiosClient.post('/api/Auth/forgot-password', { email, turnstileToken });

export const resetPassword = (data) => axiosClient.post('/api/Auth/reset-password', data);

// Sends an OTP to the logged-in user's own email, so they can confirm
// account deletion without needing to know a password (important for
// Google accounts, which never had a real one).
export const requestDeleteOtp = () => axiosClient.post('/api/Users/me/request-delete-otp');

// DELETE requests need the body wrapped in a { data: {...} } config object in axios —
// unlike GET/POST, you can't pass the body directly as the second argument.
export const deleteAccount = (otpCode) =>
  axiosClient.delete('/api/Users/me', { data: { otpCode } });