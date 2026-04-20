import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearAll,
} from '../AuthStorage/authStorage';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://radnus-android-distribution-backend-210s.onrender.com',
  timeout: 30000,
});

console.log("BASE URL:", process.env.REACT_APP_API_BASE_URL);

// ─── Request: Attach Access Token ────────────────────────────────────────────
API.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response: Token Refresh Logic ───────────────────────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token)
  );
  failedQueue = [];
};

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        const res = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/api/auth/refresh`,
          { refreshToken }
        );
        const newAccessToken = res.data.accessToken;
        setTokens(newAccessToken, refreshToken);
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearAll();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
