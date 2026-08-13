import { PenCard } from '@/components/pen/PenCard'
import { Skeleton } from '@/components/ui/Primitives'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { purposeLabels, typeLabels } from '@/utils/format'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const types = ['gel', 'ballpoint', 'rollerball', 'fountain', 'mechanical']
const tips = ['0.38mm', '0.4mm', '0.5mm', '0.7mm', '1.0mm', 'F', 'M']
const colors = ['siyah', 'mavi', 'gümüş', 'altın', 'yeşil', 'şeffaf', 'pirinç', 'kahverengi']
const purposes = Object.keys(purposeLabels)

export function PensPage() {
  const [params, setParams] = useSearchParams()
  const [minPrice, setMinPrice] = useState(params.get('min_price') ?? '0')
  const [maxPrice, setMaxPrice] = useState(params.get('max_price') ?? '30000')
  const [minWeight, setMinWeight] = useState(params.get('min_weight') ?? '5')
  const [maxWeight, setMaxWeight] = useState(params.get('max_weight') ?? '50')
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)
  const user = useAuthStore((s) => s.user)
  const favorites = useQuery({
    queryKey: ['favorites'],
    queryFn: api.favorites,
    enabled: Boolean(user),
  })
  const brands = useQuery({ queryKey: ['brands'], queryFn: api.brands })
  const guides = useQuery({ queryKey: ['guides'], queryFn: api.guides })
  const purpose = params.get('purpose') ?? ''
  const guide = guides.data?.items.find((g) => g.purpose === purpose)

  const priceTouched = minPrice !== '0' || maxPrice !== '30000'
  const weightTouched = minWeight !== '5' || maxWeight !== '50'

  const filters = useMemo(
    () => ({
      brand: params.get('brand') ?? undefined,
      type: params.get('type') ?? undefined,
      ink_type: params.get('ink_type') ?? undefined,
      tip_size: params.get('tip_size') ?? undefined,
      color: params.get('color') ?? undefined,
      purpose: purpose || undefined,
      min_price: priceTouched ? Number(minPrice) : undefined,
      max_price: priceTouched ? Number(maxPrice) : undefined,
      min_weight: weightTouched ? Number(minWeight) : undefined,
      max_weight: weightTouched ? Number(maxWeight) : undefined,
      min_rating: params.get('min_rating') ? Number(params.get('min_rating')) : undefined,
      page,
      limit: 500,
    }),
    [params, minPrice, maxPrice, minWeight, maxWeight, page, purpose, priceTouched, weightTouched],
  )

  const pens = useQuery({ queryKey: ['pens', filters], queryFn: () => api.pens(filters) })
  const favIds = favorites.data?.items.map((p) => p.id) ?? []
  const total = pens.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / 500))

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (!v) next.delete(k)
    else next.set(k, v)
    if (k !== 'page') next.delete('page')
    setParams(next)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:flex-row">
      <aside className="w-full shrink-0 space-y-6 lg:w-64">
        <h1 className="font-serif text-3xl">Kalemleri keşfet</h1>
        <Filter label="Marka">
          <select
            className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm"
            value={params.get('brand') ?? ''}
            onChange={(e) => set('brand', e.target.value)}
          >
            <option value="">Tümü</option>
            {(brands.data?.items ?? []).map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </Filter>
        <Filter label="Kalem tipi">
          <select
            className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm"
            value={params.get('type') ?? ''}
            onChange={(e) => set('type', e.target.value)}
          >
            <option value="">Tümü</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {typeLabels[t]}
              </option>
            ))}
          </select>
        </Filter>
        <Filter label="Mürekkep tipi">
          <select
            className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm"
            value={params.get('ink_type') ?? ''}
            onChange={(e) => set('ink_type', e.target.value)}
          >
            <option value="">Tümü</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {typeLabels[t]}
              </option>
            ))}
          </select>
        </Filter>
        <Filter label="Uç">
          <div className="flex flex-wrap gap-2">
            {tips.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('tip_size', params.get('tip_size') === t ? '' : t)}
                className={`rounded-full border px-3 py-1 text-xs ${params.get('tip_size') === t ? 'border-ink bg-ink text-white dark:border-brass dark:bg-brass dark:text-black' : 'border-[var(--line)]'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </Filter>
        <Filter label="Renk">
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', params.get('color') === c ? '' : c)}
                className={`rounded-full border px-3 py-1 text-xs ${params.get('color') === c ? 'border-brass' : 'border-[var(--line)]'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </Filter>
        <Filter label="Amaç">
          <select
            className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm"
            value={purpose}
            onChange={(e) => set('purpose', e.target.value)}
          >
            <option value="">Tümü</option>
            {purposes.map((p) => (
              <option key={p} value={p}>
                {purposeLabels[p]}
              </option>
            ))}
          </select>
        </Filter>
        <Filter label={`Fiyat ₺${minPrice} — ₺${maxPrice}`}>
          <input type="range" min={0} max={30000} step={50} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full" />
          <input type="range" min={0} max={30000} step={50} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full" />
        </Filter>
        <Filter label={`Ağırlık ${minWeight}–${maxWeight}g`}>
          <input type="range" min={5} max={50} value={minWeight} onChange={(e) => setMinWeight(e.target.value)} className="w-full" />
          <input type="range" min={5} max={50} value={maxWeight} onChange={(e) => setMaxWeight(e.target.value)} className="w-full" />
        </Filter>
        <Filter label="Minimum puan">
          <select
            className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm"
            value={params.get('min_rating') ?? ''}
            onChange={(e) => set('min_rating', e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="4.5">4.5+</option>
          </select>
        </Filter>
      </aside>
      <div className="flex-1">
        {guide && (
          <div className="mb-6 rounded-2xl border border-[var(--line)] p-5">
            <p className="text-xs tracking-wide text-brass uppercase">Bu kategoride öne çıkan</p>
            <p className="mt-1 font-medium">
              {purposeLabels[guide.purpose]} için en mantıklısı: {guide.winner.brand_name} {guide.winner.name}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">{guide.reason}</p>
            <Link to={`/pens/${guide.winner.slug}`} className="mt-3 inline-block text-sm underline">
              Detaya git
            </Link>
          </div>
        )}
        <p className="mb-4 text-sm text-[var(--muted)]">
          {total} kalem{pages > 1 ? ` · sayfa ${page}/${pages}` : ''}
        </p>
        {pens.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {(pens.data?.items ?? []).map((p) => (
              <PenCard key={p.id} pen={p} favoriteIds={favIds} />
            ))}
          </div>
        )}
        {!pens.isLoading && (pens.data?.items.length ?? 0) === 0 && (
          <p className="py-20 text-center text-[var(--muted)]">Bu filtrelere uyan kalem yok.</p>
        )}
        {pages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => set('page', String(page - 1))}
              className="rounded-xl border border-[var(--line)] px-3 py-1 text-sm disabled:opacity-40"
            >
              Önceki
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => set('page', String(page + 1))}
              className="rounded-xl border border-[var(--line)] px-3 py-1 text-sm disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Filter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs tracking-wide text-[var(--muted)] uppercase">{label}</p>
      {children}
    </div>
  )
}
