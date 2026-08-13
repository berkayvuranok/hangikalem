import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CompareState = {
  slugs: string[]
  add: (slug: string) => boolean
  remove: (slug: string) => void
  toggle: (slug: string) => boolean
  clear: () => void
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      slugs: [],
      add: (slug) => {
        const cur = get().slugs
        if (cur.includes(slug)) return true
        if (cur.length >= 4) return false
        set({ slugs: [...cur, slug] })
        return true
      },
      remove: (slug) => set({ slugs: get().slugs.filter((s) => s !== slug) }),
      toggle: (slug) => {
        if (get().slugs.includes(slug)) {
          get().remove(slug)
          return true
        }
        return get().add(slug)
      },
      clear: () => set({ slugs: [] }),
    }),
    { name: 'hangikalem-compare' },
  ),
)
