import type { User } from '@/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthState = {
  accessToken: string | null
  user: User | null
  setSession: (token: string, user: User) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      clear: () => set({ accessToken: null, user: null }),
    }),
    { name: 'hangikalem-auth', partialize: (s) => ({ accessToken: s.accessToken, user: s.user }) },
  ),
)
