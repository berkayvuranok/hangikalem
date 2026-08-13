import { useToastStore } from '@/stores/toastStore'
import { AnimatePresence, motion } from 'framer-motion'

export function Toasts() {
  const items = useToastStore((s) => s.items)
  const dismiss = useToastStore((s) => s.dismiss)
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto surface rounded-2xl px-4 py-3 text-sm"
            onClick={() => dismiss(t.id)}
            role="status"
          >
            <p className="font-medium">{t.title}</p>
            {t.description && <p className="text-[var(--muted)]">{t.description}</p>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
