import { create } from 'zustand';
import { apiFetch } from '@shared/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  refresh: (refreshToken: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>(() => ({
  isAuthenticated: false,
  isLoading: false,
  login: async (email: string, password: string) => {
    await apiFetch('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    useAuthStore.setState({ isAuthenticated: true });
  },
  refresh: async (refreshToken: string) => {
    await apiFetch('/admin/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    useAuthStore.setState({ isAuthenticated: true });
  },
}));
