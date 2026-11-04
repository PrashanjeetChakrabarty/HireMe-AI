import axiosClient from './axiosClient';

// Jobs
export const createJob = (data) => axiosClient.post('/api/Jobs', data);
export const getOpenJobs = () => axiosClient.get('/api/Jobs');
export const getMyJobs = () => axiosClient.get('/api/Jobs/my-jobs');
export const updateJob = (jobId, data) => axiosClient.put(`/api/Jobs/${jobId}`, data);
export const deleteJob = (jobId) => axiosClient.delete(`/api/Jobs/${jobId}`);

// Applications
export const applyToJob = (data) => axiosClient.post('/api/Applications', data);
export const getMyApplications = () => axiosClient.get('/api/Applications/my-applications');
export const getApplicantsForJob = (jobId) => axiosClient.get(`/api/Applications/job/${jobId}`);
export const getCandidateProfile = (applicationId) =>
  axiosClient.get(`/api/Applications/${applicationId}/candidate-profile`);
export const updateApplicationStatus = (applicationId, status) =>
  axiosClient.put(`/api/Applications/${applicationId}/status`, { status });
export const getActivityLog = (applicationId) =>
  axiosClient.get(`/api/Applications/${applicationId}/activity-log`);
export const getActivityFeed = () => axiosClient.get('/api/Applications/activity-feed');
export const getMyActivityFeed = () => axiosClient.get('/api/Applications/my-activity-feed');