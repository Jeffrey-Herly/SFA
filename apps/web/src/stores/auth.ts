import { defineStore } from 'pinia';
import api from '../services/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken') || (null as string | null),
    user: JSON.parse(localStorage.getItem('user') || 'null') as UserProfile | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    userRole: (state) => state.user?.role || null,
  },

  actions: {
    setAccessToken(token: string) {
      this.accessToken = token;
      localStorage.setItem('accessToken', token);
    },

    setUser(user: UserProfile) {
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },

    async login(email: string, password: string) {
      try {
        const response = await api.post('/auth/login', { email, password });
        const { accessToken, user } = response.data;

        this.setAccessToken(accessToken);
        this.setUser(user);
        return user;
      } catch (error: any) {
        throw error.response?.data || { message: 'Network connection failed' };
      }
    },

    async logout() {
      try {
        // Inform backend to clear cookie, but always clear local state
        await api.post('/auth/logout');
      } catch (error) {
        console.error('Logout error on backend:', error);
      } finally {
        this.clearAuth();
      }
    },

    async checkAuth() {
      if (!this.accessToken) return null;
      try {
        const response = await api.get('/auth/me');
        const user = response.data;
        this.setUser(user);
        return user;
      } catch (error) {
        // If profile fetch fails (e.g. token expired and refresh failed), clean local state
        this.clearAuth();
        throw error;
      }
    },

    clearAuth() {
      this.accessToken = null;
      this.user = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },
  },
});
