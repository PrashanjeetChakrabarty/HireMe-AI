import axiosClient, { API_BASE_URL } from './axiosClient';

export const uploadResume = (userId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return axiosClient.post(`/api/Resumes/upload/${userId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getResumesByUser = (userId) =>
  axiosClient.get(`/api/Resumes/candidate/${userId}`);

export const downloadResumeUrl = (resumeId) =>
  `${API_BASE_URL}/api/Resumes/download/${resumeId}`;

export const downloadResumeBlob = (resumeId) =>
  axiosClient.get(`/api/Resumes/download/${resumeId}`, { responseType: 'blob' });

export const deleteResume = (resumeId) =>
  axiosClient.delete(`/api/Resumes/${resumeId}`);