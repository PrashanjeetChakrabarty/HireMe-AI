import axiosClient from './axiosClient';

// The backend only lets you read and change your own profile (it answers 403 for any other id).
export const getProfile = (userId) => axiosClient.get(`/api/Users/profile/${userId}`);

// Warning: the server overwrites phone and address with whatever is sent, so always send the current values too.
export const updateProfile = (userId, data) => axiosClient.put(`/api/Users/profile/${userId}`, data);

// Change the password with a code emailed to the person's own address. The code is asked for first, then sent with the new password.
export const requestPasswordCode = () => axiosClient.post('/api/Users/me/password-code');

export const changePassword = (data) => axiosClient.put('/api/Users/me/password', data);