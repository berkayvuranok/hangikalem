import { PenCard } from '@/components/pen/PenCard'
import { Button } from '@/components/ui/Button'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { useWizardStore } from '@/stores/wizardStore'
import { inkLabels, purposeLabels } from '@/utils/format'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const clear = useAuthStore((s) => s.clear)
  const answers = useWizardStore((s) => s.answers)
  const nav = useNavigate()
  const favorites = useQuery({ queryKey: ['favorites'], queryFn: api.favorites })
  const items = favorites.data?.items ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-serif text-4xl">Profil</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[20rem_1fr]">
        <div>
          <div className="surface rounded-2xl p-6">
            <p className="text-sm text-[var(--muted)]">Ad</p>
            <p className="font-medium">{user?.name}</p>
            <p className="mt-4 text-sm text-[var(--muted)]">E-posta</p>
            <p>{user?.email}</p>
            <p className="mt-4 text-sm text-[var(--muted)]">Rol</p>
            <p>{user?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}</p>
          </div>
          {user?.role === 'admin' && (
            <Link to="/admin/db" className="mt-6 inline-block text-sm underline">
              Veritabanı kayıtlarını gör
            </Link>
          )}
          {answers && (
            <div className="mt-6 rounded-2xl border border-[var(--line)] p-6 text-sm">
              <p className="font-medium">Son sihirbaz özeti</p>
              <p className="mt-2 text-[var(--muted)]">
                {purposeLabels[answers.purpose]} · ₺{answers.budget} · {inkLabels[answers.ink_type] ?? answers.ink_type}
              </p>
              <Link to="/find" className="mt-3 inline-block text-xs underline">
                Tercihleri güncelle
              </Link>
            </div>
          )}
          <Button
            className="mt-8"
            variant="outline"
            onClick={async () => {
              await api.logout().catch(() => undefined)
              clear()
              nav('/')
            }}
          >
            Çıkış
          </Button>
        </div>
        <div>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl">Favoriler</h2>
            {items.length > 3 && (
              <Link to="/favorites" className="text-sm underline">
                Tümünü gör
              </Link>
            )}
          </div>
          {favorites.isLoading ? (
            <p className="mt-6 text-sm text-[var(--muted)]">Yükleniyor…</p>
          ) : items.length === 0 ? (
            <p className="mt-6 text-sm text-[var(--muted)]">
              Henüz favori yok.{' '}
              <Link to="/pens" className="underline">
                Kalem keşfet
              </Link>
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.slice(0, 6).map((p) => (
                <PenCard key={p.id} pen={p} favoriteIds={items.map((i) => i.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
