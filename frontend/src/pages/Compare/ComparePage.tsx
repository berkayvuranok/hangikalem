import { Button } from '@/components/ui/Button'
import { PenMedia } from '@/components/pen/PenMedia'
import { ShopPills } from '@/components/pen/ExternalLinks'
import { api } from '@/services/api'
import { useCompareStore } from '@/stores/compareStore'
import { formatPrice, typeLabels } from '@/utils/format'
import { useQuery } from '@tanstack/react-query'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'

const groupOrder = ['identity', 'writing', 'feel', 'quality', 'price']

export function ComparePage() {
  const slugs = useCompareStore((s) => s.slugs)
  const remove = useCompareStore((s) => s.remove)
  const clear = useCompareStore((s) => s.clear)
  const enabled = slugs.length >= 2
  const q = useQuery({
    queryKey: ['compare', slugs],
    queryFn: () => api.compare(slugs),
    enabled,
  })

  if (slugs.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-serif text-4xl">Henüz karşılaştırılacak kalem yok.</h1>
        <p className="mt-3 text-[var(--muted)]">
          Explorer’dan + Karşılaştır ile en fazla 4 kalem ekle. Tablo fiyat, yazım hissi ve elde duruşu yan yana koyar.
        </p>
        <Link to="/pens" className="mt-8 inline-block">
          <Button>Kalemleri keşfet</Button>
        </Link>
      </div>
    )
  }

  const pens = q.data?.pens ?? []
  const metrics = q.data?.metrics ?? []
  const groups = groupOrder
    .map((key) => {
      const rows = metrics.filter((m) => m.group === key)
      return rows.length ? { key, label: rows[0]?.group_label ?? key, rows } : null
    })
    .filter((g): g is { key: string; label: string; rows: typeof metrics } => Boolean(g))

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-brass uppercase">Karşılaştırma</p>
          <h1 className="mt-2 font-serif text-4xl">{q.data?.title ?? 'Karşılaştır'}</h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            {q.data?.summary ??
              'Seçtiğin kalemler yazım, tutuş ve fiyat üzerinden yan yana. Vurgulu hücre o satırdaki kazananı gösterir.'}
          </p>
        </div>
        <button type="button" className="text-sm text-[var(--muted)]" onClick={clear}>
          Temizle
        </button>
      </div>
      {slugs.length === 1 && (
        <p className="mt-6 text-[var(--muted)]">Bir kalem daha ekle — en az iki kalem gerekir.</p>
      )}

      {(q.data?.verdict ?? []).length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {q.data!.verdict.map((v) => (
            <article key={v.key} className="rounded-2xl border border-[var(--line)] p-4">
              <p className="text-xs tracking-wide text-brass uppercase">{v.label}</p>
              <p className="mt-2 font-medium">{v.pen_name}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{v.reason}</p>
            </article>
          ))}
        </div>
      )}

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-[var(--bg)] p-3 text-left font-medium"> </th>
              {pens.map((p) => (
                <th key={p.slug} className="p-3">
                  <div className="flex flex-col items-center gap-2">
                    <PenMedia pen={p} className="h-28" tilt={-12} />
                    <Link to={`/pens/${p.slug}`} className="font-medium">
                      {p.brand_name} {p.name}
                    </Link>
                    <button type="button" className="text-xs text-[var(--muted)]" onClick={() => remove(p.slug)}>
                      Kaldır
                    </button>
                    <ShopPills links={p.shop_links} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Fragment key={g.key}>
                <tr>
                  <td
                    colSpan={pens.length + 1}
                    className="sticky left-0 bg-[var(--bg)] pt-6 pb-2 text-xs tracking-[0.16em] text-brass uppercase"
                  >
                    {g.label}
                  </td>
                </tr>
                {g.rows.map((m) => (
                  <tr key={m.key} className="border-t border-[var(--line)]">
                    <td className="sticky left-0 bg-[var(--bg)] p-3 text-[var(--muted)]">{m.label}</td>
                    {pens.map((p) => {
                      const raw = m.values[p.slug]
                      const best = m.best_slug === p.slug
                      const display =
                        m.key === 'price' && typeof raw === 'number'
                          ? formatPrice(raw)
                          : m.key === 'weight' && typeof raw === 'number'
                            ? `${raw}g`
                            : m.key === 'type'
                              ? typeLabels[String(raw)] ?? String(raw ?? '')
                              : String(raw ?? '—')
                      return (
                        <td
                          key={p.slug}
                          className={`p-3 text-center ${best ? 'rounded-xl bg-brass/20 font-medium' : ''}`}
                        >
                          {display}
                          {best && <span className="mt-1 block text-[10px] tracking-wide text-brass uppercase">kazanan</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)]">
        Referans fiyat katalogdaki yaklaşık değerdir. Güncel en uygun fiyat için Cimri’yi kullan.
      </p>
    </div>
  )
}
