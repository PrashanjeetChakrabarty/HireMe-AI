import axiosClient from './axiosClient';

export const scheduleInterview = (data) => axiosClient.post('/api/Interviews', data);

export const updateInterview = (interviewId, data) =>
  axiosClient.put(`/api/Interviews/${interviewId}`, data);

export const getMyInterviews = () => axiosClient.get('/api/Interviews/my-interviews');

export const getRecruiterInterviews = () => axiosClient.get('/api/Interviews');