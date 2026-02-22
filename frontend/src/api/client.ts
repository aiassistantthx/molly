import axios from 'axios';
import { getIdToken } from '../lib/firebase';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  // Check for direct login token first
  const directToken = localStorage.getItem('directToken');
  if (directToken) {
    config.headers.Authorization = `Bearer ${directToken}`;
    return config;
  }

  // Fall back to Firebase token
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
