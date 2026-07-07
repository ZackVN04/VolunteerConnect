import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

if (typeof window !== 'undefined' && window.location) {
  const hostname = window.location.hostname;
  if (hostname.endsWith('.run.app') && hostname.includes('volunteer-connect-frontend')) {
    const backendHostname = hostname.replace('volunteer-connect-frontend', 'volunteer-connect-backend');
    baseURL = `https://${backendHostname}/api/v1`;
  }
}

// Base Axios instance
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject bearer token on every outbound HTTP request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

export default api;
