import { Reveal } from '@/components/animations/Reveal'
import { PenIllustration } from '@/components/pen/PenIllustration'
import { PenCard } from '@/components/pen/PenCard'
import { Button } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/Primitives'
import { api } from '@/services/api'
import type { Pen } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Layers3, Search, Sparkles } from 'lucide-react'
import { useRef, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'

const demoPens: Pen[] = [
  {
    id: '1', brand_id: '1', brand_name: 'Uni-ball', brand_slug: 'uni', name: 'Jetstream', slug: 'uni-jetstream',
    description: '', type: 'ballpoint', ink_type: 'ballpoint', tip_size: '0.5mm', price: 249, weight: 11,
    smoothness_score: 9, comfort_score: 9, durability_score: 8, precision_score: 9, design_score: 8,
    grip_score: 8, ink_quality: 9, image_url: '#1E3A5F', avg_rating: 4.8, review_count: 12,
  },
  {
    id: '2', brand_id: '2', brand_name: 'Lamy', brand_slug: 'lamy', name: 'Safari', slug: 'lamy-safari',
    description: '', type: 'fountain', ink_type: 'fountain', tip_size: 'M', price: 890, weight: 16,
    smoothness_score: 8, comfort_score: 9, durability_score: 9, precision_score: 8, design_score: 9,
    grip_score: 9, ink_quality: 8, image_url: '#C45C26', avg_rating: 4.7, review_count: 9,
  },
  {
    id: '3', brand_id: '3', brand_name: 'Pilot', brand_slug: 'pilot', name: 'G2', slug: 'pilot-g2',
    description: '', type: 'gel', ink_type: 'gel', tip_size: '0.5mm', price: 89, weight: 12,
    smoothness_score: 9, comfort_score: 8, durability_score: 7, precision_score: 8, design_score: 7,
    grip_score: 9, ink_quality: 8, image_url: '#111111', avg_rating: 4.6, review_count: 20,
  },
]

export function HomePage() {
  const reduce = useReducedMotion()
  const stage = useRef<HTMLDivElement>(null)
  const popular = useQuery({ queryKey: ['popular'], queryFn: api.popular })
  const catalog = useQuery({ queryKey: ['pens', { limit: 500 }], queryFn: () => api.pens({ limit: 500 }) })
  const brands = useQuery({ queryKey: ['brands'], queryFn: api.brands })
  const reviews = useQuery({ queryKey: ['recent-reviews'], queryFn: api.recentReviews })
  const guides = useQuery({ queryKey: ['guides'], queryFn: api.guides })
  const [guidePurpose, setGuidePurpose] = useState('study')
  const pens = popular.data?.items?.length ? popular.data.items.slice(0, 8) : demoPens
  const catalogItems = catalog.data?.items ?? []
  const catalogTotal = catalog.data?.total ?? catalogItems.length
  const guide = (guides.data?.items ?? []).find((g) => g.purpose === guidePurpose) ?? guides.data?.items?.[0]

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce || !stage.current) return
    const r = stage.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    stage.current.style.setProperty('--mx', String(x))
    stage.current.style.setProperty('--my', String(y))
  }

  return (
    <div>
      <section
        ref={stage}
        onMouseMove={onMove}
        className="relative mx-auto grid min-h-[88vh] max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2"
        style={{ ['--mx' as string]: 0, ['--my' as string]: 0 }}
      >
        <div>
          <p className="mb-4 text-xs tracking-[0.2em] text-brass uppercase">Ürün keşfi</p>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Sana uygun kalemi bul.
          </h1>
          <p className="mt-5 max-w-md text-lg text-[var(--muted)]">
            Yazım tarzına, kullanım amacına ve tercihlerinize göre en uygun kalemi keşfet.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/find">
              <Button>Kalemimi Bul</Button>
            </Link>
            <Link to="/pens">
              <Button variant="outline">Kalemleri Keşfet</Button>
            </Link>
          </div>
        </div>
        <div className="relative hidden h-[480px] md:block">
          {demoPens.map((pen, i) => (
            <motion.div
              key={pen.slug}
              className="absolute"
              style={{
                left: `${18 + i * 22}%`,
                top: `${8 + i * 10}%`,
                transform: reduce
                  ? undefined
                  : `translate(calc(var(--mx) * ${12 + i * 8}px), calc(var(--my) * ${10 + i * 6}px)) rotateY(calc(var(--mx) * 8deg))`,
              }}
            >
              <PenIllustration pen={pen} className="h-96 w-auto drop-shadow-2xl" tilt={-24 + i * 8} />
            </motion.div>
          ))}
        </div>
      </section>

      <Reveal>
        <section className="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            eyebrow="Sorun"
            title="Kalem seçmek neden bu kadar zor?"
            body="Yüzlerce model, benzer fotoğraflar, çelişen yorumlar. Asıl soru hâlâ aynı: hangisi bana uygun?"
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              ['Sonsuz seçenek', 'Jetstream mı, EnerGel mi, Safari mi? Liste uzadıkça karar felci başlar.'],
              ['Hissiyat görünmez', 'Akıcılık, ağırlık ve tutuş bir kutunun üzerinde yazmaz.'],
              ['Yanlış kalem pahalıdır', 'Beğenmediğin bir dolma kalem çekmecede unutulur.'],
            ].map(([t, b]) => (
              <div key={t} className="surface rounded-2xl p-6">
                <h3 className="font-medium">{t}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{b}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="Hissiyat" title="Kalemi çevir, ışığı yakala" />
          <div className="mt-10 flex justify-center gap-8 overflow-hidden py-10">
            {demoPens.map((p) => (
              <motion.div key={p.slug} whileHover={{ rotate: 6, y: -8 }} className="h-64">
                <PenIllustration pen={p} className="h-full" />
              </motion.div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="surface overflow-hidden rounded-[28px] p-8 md:flex md:items-center md:justify-between md:p-12">
            <div className="max-w-lg">
              <p className="text-xs tracking-[0.18em] text-brass uppercase">İhtiyacını söyle</p>
              <h2 className="mt-3 font-serif text-4xl">Yedi kısa soru. Net bir öneri.</h2>
              <p className="mt-3 text-[var(--muted)]">
                Amaç, uç, mürekkep, hissiyat, ağırlık, bütçe ve öncelik. Motor gerisini hesaplar.
              </p>
              <Link to="/find" className="mt-6 inline-flex items-center gap-2 text-sm">
                Sihirbazı başlat <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 md:mt-0">
              {['Ders', 'Ofis', 'Çizim', 'İmza'].map((l) => (
                <div key={l} className="rounded-2xl border border-[var(--line)] px-5 py-6 text-center">
                  {l}
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading
            eyebrow="Kategori"
            title="Kategoriye göre en mantıklısı"
            body="Ders, ofis, çizim veya imza: her amaç için skorlara göre öne çıkan kalem."
          />
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {(guides.data?.items ?? []).map((g) => (
              <button
                key={g.purpose}
                type="button"
                onClick={() => setGuidePurpose(g.purpose)}
                className={`rounded-full border px-4 py-2 text-sm ${guidePurpose === g.purpose ? 'border-ink bg-ink text-white dark:border-brass dark:bg-brass dark:text-black' : 'border-[var(--line)]'}`}
              >
                {g.label}
              </button>
            ))}
          </div>
          {guide && (
            <div className="mt-10">
              <p className="mb-4 max-w-2xl text-sm text-[var(--muted)]">{guide.reason}</p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <PenCard pen={guide.winner} />
                {guide.alternatives.map((p) => (
                  <PenCard key={p.id} pen={p} />
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link to={`/pens?purpose=${guide.purpose}`} className="text-sm underline">
                  {guide.label} kalemlerinin tümü
                </Link>
              </div>
            </div>
          )}
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="Öne çıkanlar" title="Popüler kalemler" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pens.map((p) => (
              <PenCard key={p.id} pen={p} />
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading
            eyebrow="Katalog"
            title={`${catalogTotal || 'Tüm'} kalem, API’den`}
            body="Liste statik değil. Keşif sayfasındaki her model canlı katalogdan geliyor."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {catalogItems.slice(0, 8).map((p) => (
              <PenCard key={p.id} pen={p} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/pens" className="text-sm underline">
              {catalogTotal} kalemin tümünü gör
            </Link>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading
            eyebrow="Karar"
            title="Yan yana koy, kazananı gör"
            body="İki ila dört kalemi yazım hissi, elde duruş ve fiyat üzerinden karşılaştır. Vurgulu hücre o satırdaki kazananı gösterir."
          />
          <div className="mt-8 text-center">
            <Link to="/compare">
              <Button variant="outline">
                <Layers3 className="h-4 w-4" /> Karşılaştırmaya git
              </Button>
            </Link>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="Akış" title="Nasıl çalışır" />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { icon: Search, t: '1. Anlat', d: 'Ne için yazdığını ve nasıl hissetmek istediğini seç.' },
              { icon: Sparkles, t: '2. Eşleştir', d: 'Motor her kalemi normalize skorlarla puanlar.' },
              { icon: Layers3, t: '3. Karar ver', d: 'Nedenleri oku, karşılaştır, favorile.' },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl border border-[var(--line)] p-6">
                <s.icon className="mb-4 h-5 w-5 text-brass" />
                <h3 className="font-medium">{s.t}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="brands" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16">
          <SectionHeading eyebrow="Atölye" title="Markalar" />
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {(brands.data?.items ?? []).map((b) => (
              <Link
                key={b.id}
                to={`/brands/${b.slug}`}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm hover:border-brass"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="Sesler" title="Kullanıcı yorumları" />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {(reviews.data?.items ?? []).slice(0, 3).map((r) => (
              <blockquote key={r.id} className="surface rounded-2xl p-6">
                <p className="text-brass">{'★'.repeat(r.rating)}</p>
                <p className="mt-3 text-sm">{r.body}</p>
                <footer className="mt-4 text-xs text-[var(--muted)]">
                  {r.user_name}
                  {r.title ? ` · ${r.title}` : ''}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="font-serif text-4xl md:text-5xl">Hangi kalemi almalıyım?</h2>
          <p className="mx-auto mt-4 max-w-md text-[var(--muted)]">
            Tahmin etme. Yedi soruda, sana göre skorlanmış bir cevap al.
          </p>
          <Link to="/find" className="mt-8 inline-block">
            <Button>Kalemimi Bul</Button>
          </Link>
        </section>
      </Reveal>
    </div>
  )
}
