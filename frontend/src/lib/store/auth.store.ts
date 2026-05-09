import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser, accessToken?: string) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setUser: (user, accessToken) => set({ user, accessToken: accessToken ?? null, isAuthenticated: true }),
      clearUser: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'vigil-auth',
      // Only persist on client — avoids SSR hydration mismatch
      skipHydration: true,
    },
  ),
);
