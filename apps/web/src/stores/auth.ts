import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/shared/api';
import type { User, AuthTokens } from '@/shared/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const tokens = ref<AuthTokens | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!tokens.value?.accessToken);

  async function login(email: string, password: string) {
    loading.value = true;
    try {
      const response = await api.post<{ user: User } & AuthTokens>('/api/auth/login', {
        email,
        password,
      });

      user.value = response.data.user;
      tokens.value = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        expiresIn: response.data.expiresIn,
        tokenType: response.data.tokenType,
      };

      localStorage.setItem('refreshToken', response.data.refreshToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;

      return response.data;
    } finally {
      loading.value = false;
    }
  }

  async function register(data: { email: string; username: string; password: string; displayName?: string }) {
    loading.value = true;
    try {
      const response = await api.post<{ user: User } & AuthTokens>('/api/auth/register', data);

      user.value = response.data.user;
      tokens.value = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        expiresIn: response.data.expiresIn,
        tokenType: response.data.tokenType,
      };

      localStorage.setItem('refreshToken', response.data.refreshToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;

      return response.data;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      if (tokens.value?.refreshToken) {
        await api.post('/api/auth/logout', {
          refreshToken: tokens.value.refreshToken,
        });
      }
    } finally {
      user.value = null;
      tokens.value = null;
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
    }
  }

  async function refreshToken() {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) return false;

    try {
      const response = await api.post<AuthTokens>('/api/auth/refresh', {
        refreshToken: refreshTokenValue,
      });

      tokens.value = response.data;
      localStorage.setItem('refreshToken', response.data.refreshToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;

      return true;
    } catch {
      await logout();
      return false;
    }
  }

  async function checkAuth() {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) return;

    const success = await refreshToken();
    if (success) {
      try {
        const response = await api.get<User>('/api/auth/me');
        user.value = response.data;
      } catch {
        await logout();
      }
    }
  }

  return {
    user,
    tokens,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    checkAuth,
  };
});
