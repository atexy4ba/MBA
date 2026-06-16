import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '@shared/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshToken: string | null;
  setAuthenticated: (authenticated: boolean) => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      refreshToken: null,
      setAuthenticated: (authenticated: boolean) => set({ isAuthenticated: authenticated }),
      logout: () => set({ isAuthenticated: false, refreshToken: null }),
      login: async (email: string, password: string) => {
        const res = await apiFetch<{ data: { refreshToken: string } }>('/admin/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        set({ isAuthenticated: true, refreshToken: res.data.refreshToken });
      },
      refresh: async () => {
        const token = get().refreshToken;
        if (!token) throw new Error('No refresh token');
        const res = await apiFetch<{ data: { refreshToken: string } }>('/admin/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: token }),
        });
        set({ isAuthenticated: true, refreshToken: res.data.refreshToken });
      },
    }),
    {
      name: 'mba-auth',
      partialize: (state) => ({ refreshToken: state.refreshToken }),
    },
  ),
);
