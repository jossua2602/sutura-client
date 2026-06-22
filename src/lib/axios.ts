import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sutura_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't trigger auto-logout redirect if the user is actively trying to log in
      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && !error.config.url.includes('/auth/login')) {
        localStorage.removeItem('sutura_token');
        localStorage.removeItem('auth-storage'); 
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
