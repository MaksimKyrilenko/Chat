import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Dynamic import to avoid circular dependency
        const { useAuthStore } = await import('@/stores/auth');
        const authStore = useAuthStore();

        const success = await authStore.refreshToken();
        if (success) {
          originalRequest.headers['Authorization'] = `Bearer ${authStore.tokens?.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh failed, redirect to login
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  },
);
