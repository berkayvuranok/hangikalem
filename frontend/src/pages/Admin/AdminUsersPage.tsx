import { api } from '@/services/api'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function AdminUsersPage() {
  const users = useQuery({ queryKey: ['admin-users'], queryFn: api.adminUsers })
  const items = users.data?.items ?? []
  const admins = items.filter((u) => u.role === 'admin').length

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs tracking-[0.18em] text-brass uppercase">Yönetim</p>
      <h1 className="mt-2 font-serif text-4xl">Kullanıcılar</h1>
      <p className="mt-3 text-[var(--muted)]">
        {users.isLoading ? 'Yükleniyor…' : `${items.length} hesap · ${admins} yönetici`}
        {' · '}
        <Link to="/admin/db" className="underline">
          tüm tablolar
        </Link>
      </p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-xs tracking-wide text-[var(--muted)] uppercase">
              <th className="py-3 pr-4 font-medium">Ad</th>
              <th className="py-3 pr-4 font-medium">E-posta</th>
              <th className="py-3 pr-4 font-medium">Rol</th>
              <th className="py-3 pr-4 font-medium">Kayıt</th>
              <th className="py-3 pr-4 font-medium">Yorum</th>
              <th className="py-3 font-medium">Favori</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-b border-[var(--line)]">
                <td className="py-3 pr-4 font-medium">{u.name}</td>
                <td className="py-3 pr-4">{u.email}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${u.role === 'admin' ? 'bg-brass/20 text-brass' : 'border border-[var(--line)]'}`}
                  >
                    {u.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-[var(--muted)]">{formatDate(u.created_at)}</td>
                <td className="py-3 pr-4 tabular-nums">{u.review_count}</td>
                <td className="py-3 tabular-nums">{u.favorite_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!users.isLoading && items.length === 0 && (
        <p className="py-16 text-center text-[var(--muted)]">Henüz kullanıcı yok.</p>
      )}
    </div>
  )
}
