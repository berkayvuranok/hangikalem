import { PenCard } from '@/components/pen/PenCard'
import { Skeleton } from '@/components/ui/Primitives'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

export function BrandPage() {
  const { slug = '' } = useParams()
  const user = useAuthStore((s) => s.user)
  const brand = useQuery({
    queryKey: ['brand', slug],
    queryFn: () => api.brand(slug),
    enabled: Boolean(slug),
  })
  const pens = useQuery({
    queryKey: ['pens', { brand: slug, limit: 500 }],
    queryFn: () => api.pens({ brand: slug, limit: 500 }),
    enabled: Boolean(slug),
  })
  const favorites = useQuery({
    queryKey: ['favorites'],
    queryFn: api.favorites,
    enabled: Boolean(user),
  })
  const favIds = favorites.data?.items.map((p) => p.id) ?? []

  if (brand.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <Skeleton className="h-24" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    )
  }

  if (!brand.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-32 text-center">
        <h1 className="font-serif text-4xl">Marka bulunamadı.</h1>
        <Link to="/pens" className="mt-6 inline-block text-sm underline">
          Tüm kalemler
        </Link>
      </div>
    )
  }

  const b = brand.data
  const items = pens.data?.items ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs tracking-[0.18em] text-brass uppercase">Marka</p>
      <h1 className="mt-2 font-serif text-5xl">{b.name}</h1>
      {b.description && <p className="mt-4 max-w-2xl text-[var(--muted)]">{b.description}</p>}
      <p className="mt-3 text-sm text-[var(--muted)]">{pens.data?.total ?? items.length} model</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <PenCard key={p.id} pen={p} favoriteIds={favIds} />
        ))}
      </div>
      {!pens.isLoading && items.length === 0 && (
        <p className="py-20 text-center text-[var(--muted)]">Bu markada henüz kalem yok.</p>
      )}
    </div>
  )
}
