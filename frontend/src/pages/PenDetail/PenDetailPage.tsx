import { Reveal } from '@/components/animations/Reveal'
import { PenMedia } from '@/components/pen/PenMedia'
import { LinkCards } from '@/components/pen/ExternalLinks'
import { Button } from '@/components/ui/Button'
import { ScoreBar, Skeleton } from '@/components/ui/Primitives'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { useCompareStore } from '@/stores/compareStore'
import { useToastStore } from '@/stores/toastStore'
import { useWizardStore } from '@/stores/wizardStore'
import { formatPrice, scorePct, typeLabels } from '@/utils/format'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const featureLabels: Record<string, string> = {
  refill: 'Yedek / doldurma',
  retractable: 'Mekanizma',
  clip: 'Klips',
}

export function PenDetailPage() {
  const { slug = '' } = useParams()
  const answers = useWizardStore((s) => s.answers)
  const user = useAuthStore((s) => s.user)
  const toggle = useCompareStore((s) => s.toggle)
  const inCompare = useCompareStore((s) => s.slugs.includes(slug))
  const push = useToastStore((s) => s.push)
  const qc = useQueryClient()
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')

  const pen = useQuery({ queryKey: ['pen', slug], queryFn: () => api.pen(slug), enabled: Boolean(slug) })
  const reviews = useQuery({ queryKey: ['reviews', slug], queryFn: () => api.reviews(slug), enabled: Boolean(slug) })
  const fit = useQuery({
    queryKey: ['fit', slug, answers],
    queryFn: () => api.fit(slug, answers!),
    enabled: Boolean(slug && answers),
  })
  const favorites = useQuery({ queryKey: ['favorites'], queryFn: api.favorites, enabled: Boolean(user) })
  const liked = Boolean(pen.data && favorites.data?.items.some((p) => p.id === pen.data.id))

  const fav = useMutation({
    mutationFn: async () => {
      if (!user || !pen.data) throw new Error('Giriş yapmalısın')
      if (liked) await api.removeFavorite(pen.data.id)
      else await api.addFavorite(pen.data.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
    onError: (e: Error) => push({ title: e.message, tone: 'error' }),
  })

  const reviewMut = useMutation({
    mutationFn: () => api.createReview(slug, { rating, body }),
    onSuccess: () => {
      setBody('')
      qc.invalidateQueries({ queryKey: ['reviews', slug] })
      qc.invalidateQueries({ queryKey: ['pen', slug] })
      push({ title: 'Yorumun yayınlandı', tone: 'success' })
    },
    onError: (e: Error) => push({ title: e.message, tone: 'error' }),
  })

  if (pen.isLoading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
        <Skeleton className="h-[480px]" />
        <Skeleton className="h-[480px]" />
      </div>
    )
  }
  if (!pen.data) {
    return <p className="py-32 text-center">Kalem bulunamadı.</p>
  }
  const p = pen.data
  const scores = [
    ['Yazım akıcılığı', p.smoothness_score],
    ['Konfor', p.comfort_score],
    ['Dayanıklılık', p.durability_score],
    ['Çizgi hassasiyeti', p.precision_score],
    ['Tutuş', p.grip_score],
    ['Tasarım', p.design_score],
    ['Mürekkep kalitesi', p.ink_quality],
  ] as const

  const specs = [
    ['Tip', typeLabels[p.type] ?? p.type],
    ['Uç', p.tip_size],
    ['Ağırlık', `${p.weight}g`],
    p.length ? ['Boy', `${p.length}mm`] : null,
    p.grip_material ? ['Tutuş', p.grip_material] : null,
    p.body_material ? ['Gövde', p.body_material] : null,
    p.color ? ['Renk', p.color] : null,
    ...(p.features
      ? Object.entries(p.features).map(([k, v]) => [featureLabels[k] ?? k, v] as [string, string])
      : []),
  ].filter(Boolean) as [string, string][]

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid items-start gap-12 md:grid-cols-2">
        <div className="surface flex h-[520px] items-center justify-center rounded-[28px]">
          <motion.div whileHover={{ rotate: 4, scale: 1.04 }}>
            <PenMedia pen={p} className="h-[420px]" tilt={-16} />
          </motion.div>
        </div>
        <div>
          <Link
            to={`/brands/${p.brand_slug}`}
            className="text-xs tracking-[0.18em] text-brass uppercase hover:underline"
          >
            {p.brand_name}
          </Link>
          <h1 className="mt-2 font-serif text-5xl">{p.name}</h1>
          <p className="mt-3 text-brass">
            {'★'.repeat(Math.round(p.avg_rating))}
            <span className="ml-2 text-sm text-[var(--muted)]">
              {p.avg_rating.toFixed(1)} · {p.review_count} yorum
            </span>
          </p>
          <p className="mt-4 text-2xl tabular-nums">{formatPrice(p.price)}</p>
          <p className="text-xs text-[var(--muted)]">Referans fiyat (yaklaşık) · güncel karşılaştırma için Cimri</p>
          <p className="mt-4 text-[var(--muted)]">{p.description}</p>
          <p className="mt-3 text-sm">
            {typeLabels[p.type]} · {p.tip_size} · {p.weight}g
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => fav.mutate()}>
              <Heart className={liked ? 'h-4 w-4 fill-red-500 text-red-500' : 'h-4 w-4'} />
              {liked ? 'Favoride' : 'Favorile'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const ok = toggle(p.slug)
                push({ title: ok ? (inCompare ? 'Çıkarıldı' : 'Karşılaştırmaya eklendi') : 'En fazla 4 kalem' })
              }}
            >
              {inCompare ? 'Karşılaştırmada' : '+ Karşılaştır'}
            </Button>
          </div>
          {fit.data && (
            <div className="mt-8 rounded-2xl border border-[var(--line)] p-5">
              <p className="font-medium">Bu kalem sana %{fit.data.overall} uygun.</p>
              <div className="mt-4 space-y-3">
                <ScoreBar label="Konfor" value={fit.data.comfort} />
                <ScoreBar label="Akıcılık" value={fit.data.smoothness} />
                <ScoreBar label="Bütçe" value={fit.data.budget} />
                <ScoreBar label="Ağırlık" value={fit.data.weight} />
              </div>
              <Link to="/find" className="mt-3 inline-block text-xs text-[var(--muted)]">
                Tercihlerini güncelle
              </Link>
            </div>
          )}
        </div>
      </div>

      <Reveal>
        <section className="mt-20">
          <h2 className="font-serif text-3xl">Bu kalem neden iyi?</h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">{p.why_good}</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {scores.map(([label, v]) => (
              <ScoreBar key={label} label={label} value={scorePct(v)} />
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-16">
          <h2 className="font-serif text-3xl">Özellikler</h2>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between rounded-2xl border border-[var(--line)] px-4 py-3 text-sm">
                <dt className="text-[var(--muted)]">{k}</dt>
                <dd className="capitalize">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] p-6">
            <h3 className="font-medium">Kimler için uygun?</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              {(p.suitable_for ?? '').split('|').filter(Boolean).map((s) => (
                <li key={s}>✦ {s}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[var(--line)] p-6">
            <h3 className="font-medium">Kimler için uygun değil?</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              {(p.not_suitable_for ?? '').split('|').filter(Boolean).map((s) => (
                <li key={s}>— {s}</li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-16">
          <LinkCards
            title="Fiyatı nereden bakmalı"
            intro="Canlı fiyat çekmiyoruz. Cimri tüm siteleri yan yana koyar; diğer linkler mağaza aramasıdır."
            links={p.shop_links}
          />
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-16">
          <LinkCards
            title="Dışarıda ne diyorlar?"
            intro="Buradaki cümleler skorlardan özet; asıl yorumlar bağlantıdaki sitede."
            links={p.review_links}
          />
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-16">
          <h2 className="font-serif text-3xl">HangiKalem yorumları</h2>
          <div className="mt-6 space-y-4">
            {(reviews.data?.items ?? []).map((r) => (
              <article key={r.id} className="rounded-2xl border border-[var(--line)] p-5">
                <p className="text-sm text-brass">{'★'.repeat(r.rating)} · {r.user_name}</p>
                {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                <p className="mt-2 text-sm text-[var(--muted)]">{r.body}</p>
              </article>
            ))}
          </div>
          {user ? (
            <form
              className="mt-8 max-w-lg space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                reviewMut.mutate()
              }}
            >
              <p className="text-sm font-medium">Yorum yaz</p>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} yıldız
                  </option>
                ))}
              </select>
              <textarea
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="h-28 w-full rounded-2xl border border-[var(--line)] bg-transparent p-3 text-sm"
                placeholder="Yazım hissi, konfor, günlük kullanım…"
              />
              <Button type="submit" disabled={reviewMut.isPending}>
                Gönder
              </Button>
            </form>
          ) : (
            <p className="mt-6 text-sm">
              Yorum için <Link to="/login" className="underline">giriş yap</Link>.
            </p>
          )}
        </section>
      </Reveal>
    </div>
  )
}
