import { api } from '@/services/api'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

const labels: Record<string, string> = {
  users: 'Kullanıcılar',
  brands: 'Markalar',
  categories: 'Kategoriler',
  pens: 'Kalemler',
  tags: 'Etiketler',
  reviews: 'Yorumlar',
  favorites: 'Favoriler',
  pen_tags: 'Kalem etiketleri',
  pen_categories: 'Kalem kategorileri',
  pen_features: 'Özellikler',
  pen_feature_values: 'Özellik değerleri',
  comparisons: 'Karşılaştırmalar',
  comparison_pens: 'Karşılaştırma kalemleri',
  refresh_tokens: 'Oturum jetonları',
  schema_migrations: 'Migrasyonlar',
}

function cell(v: unknown) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

export function AdminDbPage() {
  const [params, setParams] = useSearchParams()
  const table = params.get('table') ?? ''
  const offset = Number(params.get('offset') ?? '0') || 0
  const tables = useQuery({ queryKey: ['admin-tables'], queryFn: api.adminTables })
  const rows = useQuery({
    queryKey: ['admin-table', table, offset],
    queryFn: () => api.adminTable(table, { limit: 50, offset }),
    enabled: Boolean(table),
  })

  const open = (name: string) => {
    const next = new URLSearchParams()
    next.set('table', name)
    setParams(next)
  }

  if (!table) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs tracking-[0.18em] text-brass uppercase">Yönetim</p>
        <h1 className="mt-2 font-serif text-4xl">Veritabanı kayıtları</h1>
        <p className="mt-3 text-[var(--muted)]">Tablolara tıkla, satırları gör. Şifreler gizlenir.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(tables.data?.items ?? []).map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => open(t.name)}
              className="rounded-2xl border border-[var(--line)] p-5 text-left hover:border-brass"
            >
              <p className="font-medium">{labels[t.name] ?? t.name}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{t.name}</p>
              <p className="mt-3 text-2xl tabular-nums">{t.rows}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const data = rows.data
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1
  const page = data ? Math.floor(data.offset / data.limit) + 1 : 1

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12">
      <button type="button" className="text-sm text-[var(--muted)]" onClick={() => setParams(new URLSearchParams())}>
        ← Tüm tablolar
      </button>
      <h1 className="mt-3 font-serif text-4xl">{labels[table] ?? table}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {table} · {data?.total ?? '…'} kayıt
        {table === 'users' && (
          <>
            {' '}
            · <Link to="/admin/users" className="underline">özet görünüm</Link>
          </>
        )}
      </p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--line)] text-[var(--muted)] uppercase">
              {(data?.columns ?? []).map((c) => (
                <th key={c} className="py-3 pr-4 font-medium whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((row, i) => (
              <tr key={i} className="border-b border-[var(--line)] align-top">
                {(data?.columns ?? []).map((c) => (
                  <td key={c} className="max-w-[280px] truncate py-3 pr-4">
                    {cell(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-xl border border-[var(--line)] px-3 py-1 text-sm disabled:opacity-40"
            onClick={() => {
              const next = new URLSearchParams(params)
              next.set('offset', String(Math.max(0, offset - 50)))
              setParams(next)
            }}
          >
            Önceki
          </button>
          <button
            type="button"
            disabled={page >= pages}
            className="rounded-xl border border-[var(--line)] px-3 py-1 text-sm disabled:opacity-40"
            onClick={() => {
              const next = new URLSearchParams(params)
              next.set('offset', String(offset + 50))
              setParams(next)
            }}
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  )
}
