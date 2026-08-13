import { create } from 'zustand'

export type Toast = {
  id: string
  title: string
  description?: string
  tone?: 'default' | 'success' | 'error'
}

type ToastState = {
  items: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push: (t) => {
    const id = crypto.randomUUID()
    set({ items: [...get().items, { ...t, id }] })
    window.setTimeout(() => get().dismiss(id), 3200)
  },
  dismiss: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
}))
