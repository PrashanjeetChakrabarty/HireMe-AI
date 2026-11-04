import axios from 'axios';

// Backend address. Local default is the dotnet dev server; Vercel sets VITE_API_URL.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5140';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

axiosClient.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

// The login token lasts 8 hours. When it runs out, every call answers 401. Tell the app, so it can log out and go to the login page.
// Calls under /api/Auth/ are skipped: there a 401 only means "wrong email or password".
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/api/Auth/') && localStorage.getItem('user')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

export default axiosClient;