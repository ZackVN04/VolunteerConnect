import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

if (typeof window !== 'undefined' && window.location) {
  const hostname = window.location.hostname;
  if (hostname.endsWith('.run.app') && hostname.includes('volunteer-connect-frontend')) {
    const backendHostname = hostname.replace('volunteer-connect-frontend', 'volunteer-connect-backend');
    baseURL = `https://${backendHostname}/api/v1`;
  }
}

// Base Axios instance
const api: AxiosInstance = axios.create({
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

// Flag to prevent multiple simultaneous refresh calls (race condition guard)
let isRefreshing = false;
// Queue of requests waiting for the token to be refreshed
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * Drains the failed request queue after a token refresh attempt.
 * @param error - If provided, all queued requests are rejected with this error.
 * @param token - If provided, all queued requests are retried with this new token.
 */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Response Interceptor — Silent Token Refresh (Gap 3 Fix)
 *
 * Flow:
 * 1. A request receives a 401 Unauthorized response.
 * 2. Interceptor checks for a stored refresh_token in localStorage.
 * 3. Calls POST /auth/refresh-token with the refresh_token.
 * 4. On success: saves new tokens and retries the original request seamlessly.
 * 5. On failure (refresh also expired): clears storage and forces re-login.
 * 6. If a refresh is already in progress, any other 401s are queued and
 *    resolved/rejected in bulk once the refresh completes.
 */
api.interceptors.response.use(
  // Pass through all successful responses unchanged
  (response) => response,

  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh for 401 errors that have not already been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token');

      // No refresh token available — cannot recover, force logout
      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // A refresh is already in-flight: queue this request and wait
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      // Mark the original request so it is not retried more than once
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh endpoint using a plain axios call (not 'api') to
        // avoid triggering this same interceptor recursively on a 401.
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh-token`, {
          refresh_token: refreshToken,
        });

        const newAccessToken: string = refreshResponse.data.access_token;
        const newRefreshToken: string = refreshResponse.data.refresh_token;

        // Persist the new token pair
        localStorage.setItem('token', newAccessToken);
        localStorage.setItem('refresh_token', newRefreshToken);

        // Update the default Authorization header for all future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

        // Unblock all queued requests with the new token
        processQueue(null, newAccessToken);

        // Retry the original failed request with the fresh token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is invalid or expired — reject all queued requests
        processQueue(refreshError, null);

        // Clear all auth state and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors (400, 403, 404, 500, etc.), pass them through
    return Promise.reject(error);
  }
);

export default api;
