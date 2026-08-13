import { PenCard } from '@/components/pen/PenCard'
import { Button } from '@/components/ui/Button'
import { api } from '@/services/api'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

export function FavoritesPage() {
  const q = useQuery({ queryKey: ['favorites'], queryFn: api.favorites })
  const items = q.data?.items ?? []

  if (!q.isLoading && items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-4xl">Henüz favori kalemin yok.</h1>
        <p className="mt-3 text-[var(--muted)]">Beğendiğin modelleri kalp ile kaydet.</p>
        <Link to="/pens" className="mt-8 inline-block">
          <Button>Kalemleri keşfet</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-4xl">Favoriler</h1>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <PenCard key={p.id} pen={p} favoriteIds={items.map((i) => i.id)} />
        ))}
      </div>
    </div>
  )
}
