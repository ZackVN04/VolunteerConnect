import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

if (typeof window !== 'undefined' && window.location) {
  const hostname = window.location.hostname;
  if (hostname.endsWith('.run.app') && hostname.includes('volunteer-connect-frontend')) {
    const backendHostname = hostname.replace('volunteer-connect-frontend', 'volunteer-connect-backend');
    baseURL = `https://${backendHostname}/api/v1`;
  }
}

export const apiRootURL = baseURL.replace(/\/api\/v1\/?$/, '');

// Base Axios instance
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios instance dedicated to refreshing token to avoid triggering response interceptors recursively
const refreshClient = axios.create({
  baseURL: apiRootURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

refreshClient.interceptors.request.use(
  (config) => {
    if (config.url && config.url.startsWith('/') && !config.url.startsWith('/api/v1')) {
      config.url = `/api/v1${config.url}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to inject bearer token on every outbound HTTP request for api
api.interceptors.request.use(
  (config) => {
    if (config.url && config.url.startsWith('/') && !config.url.startsWith('/api/v1')) {
      config.url = `/api/v1${config.url}`;
    }
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

export const rootApi = axios.create({
  baseURL: apiRootURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject bearer token and prefix api/v1 on outbound request for rootApi
rootApi.interceptors.request.use(
  (config) => {
    if (config.url && config.url.startsWith('/') && !config.url.startsWith('/api/v1')) {
      config.url = `/api/v1${config.url}`;
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Queue system for handling multiple requests during token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor setup helper
const setupResponseInterceptor = (axiosInstance: any) => {
  axiosInstance.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      const originalRequest = error.config;
      if (!originalRequest) {
        return Promise.reject(error);
      }

      const isAuthUrl = originalRequest.url && (
        originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/refresh')
      );

      if (error.response && error.response.status === 401 && !isAuthUrl && !originalRequest._retry) {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.hash = '#/login';
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await refreshClient.post('/auth/refresh', {
            refresh_token: refreshToken,
          });

          const newAccessToken = res.data.access_token;
          const newRefreshToken = res.data.refresh_token;

          localStorage.setItem('token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          isRefreshing = false;

          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;

          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.hash = '#/login';
          return Promise.reject(refreshError);
        }
      }

      // If auth request gets 401 or retry attempt failed, clean tokens and redirect
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.hash = '#/login';
      }

      return Promise.reject(error);
    }
  );
};

// Register response interceptors
setupResponseInterceptor(api);
setupResponseInterceptor(rootApi);

export default api;
