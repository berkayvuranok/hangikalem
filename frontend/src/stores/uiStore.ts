import { create } from 'zustand'

type Theme = 'light' | 'dark'

type UIState = {
  theme: Theme
  searchOpen: boolean
  mobileNav: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setSearchOpen: (open: boolean) => void
  setMobileNav: (open: boolean) => void
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

const initial: Theme =
  typeof window !== 'undefined' && localStorage.getItem('hangikalem-theme') === 'dark'
    ? 'dark'
    : 'light'

if (typeof document !== 'undefined') applyTheme(initial)

export const useUIStore = create<UIState>((set, get) => ({
  theme: initial,
  searchOpen: false,
  mobileNav: false,
  setTheme: (theme) => {
    localStorage.setItem('hangikalem-theme', theme)
    applyTheme(theme)
    set({ theme })
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setMobileNav: (mobileNav) => set({ mobileNav }),
}))
