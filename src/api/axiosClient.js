import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/users` || "http://127.0.0.1:8787/api/v1/users";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/refresh-token') &&
      !originalRequest.url.includes('/login') &&
      !originalRequest.url.includes('/verify-device') &&
      !originalRequest.url.includes('/resend-device-otp') &&
      !originalRequest.url.includes('/register')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosClient.post('/refresh-token', {}); // Send empty object
        processQueue(null);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        // Only redirect if not on auth-related pages
        const authPages = ['/login', '/signup', '/verify-device', '/forgot-password', '/reset-password'];
        const isOnAuthPage = authPages.some(page => window.location.pathname.startsWith(page));

        if (!isOnAuthPage) {
          localStorage.removeItem('user');
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const normalizedError = {
      message: error.response?.data?.message || error.message || 'Something went wrong',
      details: error.response?.data?.errors || [],
      statusCode: error.response?.status,
    };

    return Promise.reject(normalizedError);
  }
);

export default axiosClient;