import { api } from '@/services/api'
import { useUIStore } from '@/stores/uiStore'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function CommandPalette() {
  const open = useUIStore((s) => s.searchOpen)
  const setOpen = useUIStore((s) => s.setSearchOpen)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const nav = useNavigate()

  const { data } = useQuery({
    queryKey: ['search', q],
    queryFn: () => api.search(q),
    enabled: open && q.trim().length > 1,
  })

  const items = useMemo(() => {
    const brands = (data?.brands ?? []).map((b) => ({
      id: b.id,
      label: b.name,
      hint: 'Marka',
      href: `/brands/${b.slug}`,
    }))
    const pens = (data?.pens ?? []).map((p) => ({
      id: p.id,
      label: `${p.brand_name} ${p.name}`,
      hint: p.type,
      href: `/pens/${p.slug}`,
    }))
    return [...brands, ...pens]
  }, [data])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-label="Arama"
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className="glass w-full max-w-xl overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--line)] px-4">
              <Search className="h-4 w-4 text-[var(--muted)]" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setActive(0)
                }}
                placeholder="Pilot, Jetstream, dolma kalem…"
                className="h-14 w-full bg-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActive((a) => Math.min(items.length - 1, a + 1))
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActive((a) => Math.max(0, a - 1))
                  }
                  if (e.key === 'Enter' && items[active]) {
                    nav(items[active].href)
                    setOpen(false)
                    setQ('')
                  }
                }}
              />
              <kbd className="hidden rounded-md border border-[var(--line)] px-1.5 py-0.5 text-[10px] text-[var(--muted)] sm:inline">
                ESC
              </kbd>
            </div>
            <ul className="max-h-80 overflow-auto p-2">
              {items.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-[var(--muted)]">
                  {q.length > 1 ? 'Sonuç yok' : 'Marka veya model yaz'}
                </li>
              )}
              {items.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm ${i === active ? 'bg-black/5 dark:bg-white/8' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => {
                      nav(item.href)
                      setOpen(false)
                      setQ('')
                    }}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-[var(--muted)]">{item.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
