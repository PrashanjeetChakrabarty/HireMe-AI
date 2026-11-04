import axiosClient from './axiosClient';

export const getDashboardOverview = () => axiosClient.get('/api/Dashboard/overview');