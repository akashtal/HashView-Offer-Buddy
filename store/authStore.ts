import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'vendor' | 'admin';
  phone?: string;
  avatar?: string;
  isVerified: boolean;
  location?: {
    coordinates: [number, number];
    address?: string;
    city?: string;
  };
  preferences?: {
    radius: number;
    categories: string[];
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  fetchUser: () => Promise<void>;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
        // Set axios default header
        if (typeof window !== 'undefined') {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const response = await axios.post('/api/auth/login', {
            email,
            password,
          });

          const { user, token } = response.data.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(
            error.response?.data?.error || 'Login failed'
          );
        }
      },

      register: async (data: any) => {
        try {
          set({ isLoading: true });
          const response = await axios.post('/api/auth/register', data);

          const { user, token } = response.data.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(
            error.response?.data?.error || 'Registration failed'
          );
        }
      },

      logout: async () => {
        try {
          await axios.post('/api/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          delete axios.defaults.headers.common['Authorization'];
        }
      },

      updateUser: (data: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      fetchUser: async () => {
        try {
          const { token } = get();
          if (!token) return;

          set({ isLoading: true });
          
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get('/api/auth/me');

          set({
            user: response.data.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Fetch user error:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

