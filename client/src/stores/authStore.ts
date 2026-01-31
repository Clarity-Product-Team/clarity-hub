import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;
          
          localStorage.setItem('token', token);
          set({ user, token, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || 'Login failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ user: null, token: null });
          return;
        }

        try {
          const response = await api.get('/auth/me');
          set({ user: response.data, token });
        } catch {
          localStorage.removeItem('token');
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
