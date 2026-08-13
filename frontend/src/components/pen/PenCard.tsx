import { PenMedia } from '@/components/pen/PenMedia'
import { useAuthStore } from '@/stores/authStore'
import { useCompareStore } from '@/stores/compareStore'
import { useToastStore } from '@/stores/toastStore'
import { api } from '@/services/api'
import type { Pen } from '@/types'
import { cn, formatPrice, typeLabels } from '@/utils/format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Heart, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PenCard({ pen, favoriteIds = [] }: { pen: Pen; favoriteIds?: string[] }) {
  const liked = favoriteIds.includes(pen.id)
  const inCompare = useCompareStore((s) => s.slugs.includes(pen.slug))
  const toggle = useCompareStore((s) => s.toggle)
  const push = useToastStore((s) => s.push)
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()

  const fav = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Giriş yapmalısın')
      if (liked) await api.removeFavorite(pen.id)
      else await api.addFavorite(pen.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
    onError: (e: Error) => push({ title: e.message, tone: 'error' }),
  })

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      className="group surface relative overflow-hidden rounded-2xl p-4"
    >
      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.04))]">
        <motion.div
          className="h-52"
          whileHover={{ scale: 1.08, rotate: -6 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        >
          <PenMedia pen={pen} className="h-full w-auto" tilt={-18} />
        </motion.div>
        <button
          type="button"
          aria-label={liked ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          onClick={() => fav.mutate()}
          className="absolute top-3 right-3 rounded-full bg-[var(--card)]/80 p-2 backdrop-blur-sm"
        >
          <Heart
            className={cn('h-4 w-4', liked && 'fill-red-500 text-red-500')}
          />
        </button>
      </div>
      <Link
        to={`/brands/${pen.brand_slug}`}
        className="mt-4 inline-block text-xs tracking-wide text-[var(--muted)] uppercase hover:text-brass"
      >
        {pen.brand_name}
      </Link>
      <h3 className="mt-1 font-medium">{pen.name}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {typeLabels[pen.type] ?? pen.type} · {pen.tip_size}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="tabular-nums">{formatPrice(pen.price)}</span>
        <span className="text-sm text-brass">★ {pen.avg_rating.toFixed(1)}</span>
      </div>
      <div className="mt-4 flex gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
        <Link
          to={`/pens/${pen.slug}`}
          className="flex-1 rounded-xl bg-[var(--fg)] py-2 text-center text-sm text-[var(--bg)]"
        >
          Detay
        </Link>
        <button
          type="button"
          onClick={() => {
            const ok = toggle(pen.slug)
            push({
              title: ok
                ? inCompare
                  ? 'Karşılaştırmadan çıkarıldı'
                  : 'Karşılaştırmaya eklendi'
                : 'En fazla 4 kalem',
              tone: ok ? 'success' : 'error',
            })
          }}
          className={cn(
            'rounded-xl border border-[var(--line)] px-3',
            inCompare && 'border-brass bg-brass/15',
          )}
          aria-label="Karşılaştırmaya ekle"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  )
}
