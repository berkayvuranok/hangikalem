import catalog from '@/data/catalog.json'
import type {
  Brand,
  CompareResponse,
  FitBreakdown,
  GuideItem,
  PaginatedPens,
  Pen,
  PenFilters,
  RecommendationItem,
  Review,
  SearchResult,
  User,
  WizardAnswers,
} from '@/types'

const pens = catalog.pens as Pen[]
const brands = catalog.brands as Brand[]

function q(brand: string, name: string) {
  return encodeURIComponent(`${brand} ${name}`.trim())
}

function withLinks(p: Pen): Pen {
  const query = q(p.brand_name, p.name)
  const pen = `${p.brand_name} ${p.name}`.trim()
  return {
    ...p,
    shop_links: [
      { key: 'cimri', label: 'Cimri', url: `https://www.cimri.com/arama?q=${query}`, summary: 'Tüm sitelerdeki fiyatı burada karşılaştır.', hint: 'Önerilen ilk durak' },
      { key: 'trendyol', label: 'Trendyol', url: `https://www.trendyol.com/sr?q=${query}`, summary: 'Mağaza fiyatı ve Türkiye yorumları.', hint: 'Mağaza' },
      { key: 'hepsiburada', label: 'Hepsiburada', url: `https://www.hepsiburada.com/ara?q=${query}`, summary: 'Güncel mağaza fiyatına bak.', hint: 'Mağaza' },
      { key: 'amazon', label: 'Amazon TR', url: `https://www.amazon.com.tr/s?k=${query}`, summary: 'Amazon Türkiye araması.', hint: 'Mağaza' },
    ],
    review_links: [
      { key: 'jetpens', label: 'JetPens', url: `https://www.jetpens.com/search?q=${query}`, summary: p.smoothness_score >= 8.5 ? 'Kaygan yazım ve mürekkep akışı övülüyor.' : 'Uç hissi ve günlük kullanım konuşuluyor.', hint: 'Uzman inceleme' },
      { key: 'reddit', label: 'Reddit', url: `https://www.reddit.com/search/?q=${encodeURIComponent(pen + ' pen')}`, summary: 'Gerçek kullanıcı deneyimleri.', hint: 'Kullanıcı deneyimi' },
      { key: 'youtube', label: 'YouTube', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(pen + ' pen review')}`, summary: 'Yazım testleri ve yakın çekimler.', hint: 'Video' },
    ],
  }
}

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n))
}

function matchPen(p: Pen, f: PenFilters) {
  if (f.brand && p.brand_slug !== f.brand) return false
  if (f.type && p.type !== f.type) return false
  if (f.ink_type && p.ink_type !== f.ink_type) return false
  if (f.tip_size && p.tip_size !== f.tip_size) return false
  if (f.color && p.color !== f.color) return false
  if (f.purpose && !(p.tags ?? []).includes(f.purpose)) return false
  if (f.min_price != null && p.price < f.min_price) return false
  if (f.max_price != null && p.price > f.max_price) return false
  if (f.min_weight != null && p.weight < f.min_weight) return false
  if (f.max_weight != null && p.weight > f.max_weight) return false
  if (f.min_rating != null && p.avg_rating < f.min_rating) return false
  return true
}

function thicknessScore(pref: string, tip: string) {
  const groups: Record<string, string[]> = {
    extra_fine: ['0.28mm', '0.3mm', '0.38mm', 'EF'],
    fine: ['0.4mm', '0.5mm', 'F'],
    medium: ['0.7mm', 'M'],
    bold: ['1.0mm', '1.2mm', '1.4mm', 'B'],
  }
  if ((groups[pref] ?? []).some((t) => t.toLowerCase() === tip.toLowerCase())) return 100
  const neighbors: Record<string, string[]> = {
    extra_fine: ['fine'],
    fine: ['extra_fine', 'medium'],
    medium: ['fine', 'bold'],
    bold: ['medium'],
  }
  for (const n of neighbors[pref] ?? []) {
    if ((groups[n] ?? []).some((t) => t.toLowerCase() === tip.toLowerCase())) return 72
  }
  return 42
}

function scoreOne(req: WizardAnswers, p: Pen) {
  const w = {
    ink: 1.3, purpose: 1.1, thickness: 1.15, smooth: 1.0,
    weight: 0.9, budget: 1.2, comfort: 0.85, durability: 0.55,
    design: 0.45, precision: 0.7, grip: 0.6,
  }
  for (const pr of req.priorities) {
    if (pr === 'comfort') { w.comfort *= 1.4; w.grip *= 1.3 }
    if (pr === 'writing_quality') { w.smooth *= 1.4; w.precision *= 1.35 }
    if (pr === 'design') w.design *= 1.5
    if (pr === 'durability') w.durability *= 1.5
    if (pr === 'value') w.budget *= 1.4
    if (pr === 'premium') w.design *= 1.35
    if (pr === 'long_use') { w.comfort *= 1.35; w.durability *= 1.3; w.grip *= 1.25 }
  }
  const ink = p.ink_type === req.ink_type || p.type === req.ink_type ? 100 : 40
  const purpose = (p.tags ?? []).includes(req.purpose) ? 100 : 55
  const thick = thicknessScore(req.writing_thickness, p.tip_size)
  const smooth = clamp(100 - Math.abs(req.smoothness - p.smoothness_score) * 10, 0, 100)
  const prefW = 8 + (req.weight_preference - 1) * 2.4
  const weight = clamp(100 - Math.min(70, Math.abs(prefW - p.weight) * 5), 0, 100)
  const budget = p.price <= req.budget
    ? 100 - ((req.budget - p.price) / req.budget) * 18
    : clamp(50 - ((p.price - req.budget) / req.budget) * 80, 0, 100)
  const parts = {
    ink, purpose, thickness: thick, smooth,
    weight, budget,
    comfort: p.comfort_score * 10,
    durability: p.durability_score * 10,
    design: p.design_score * 10,
    precision: p.precision_score * 10,
    grip: p.grip_score * 10,
  }
  let sum = 0
  let sumW = 0
  for (const [k, v] of Object.entries(parts) as [keyof typeof w, number][]) {
    sum += v * w[k]
    sumW += w[k]
  }
  const raw = sum / sumW
  const reasons: string[] = []
  if (parts.comfort >= 82) reasons.push('Uzun süreli yazım için oldukça rahat')
  if (parts.smooth >= 80 && req.smoothness >= 6) reasons.push('Kaygan ve akıcı bir yazım hissi sunuyor')
  if (parts.thickness >= 90) reasons.push('Tercih ettiğiniz uç kalınlığıyla uyumlu')
  if (parts.budget >= 80) reasons.push('Bütçenize uygun')
  if (parts.ink >= 90) reasons.push('Seçtiğiniz mürekkep tipi ile birebir eşleşiyor')
  if (!reasons.length) reasons.push('Genel tercihlerinizle dengeli bir uyum gösteriyor')
  const strengths: string[] = []
  if (p.comfort_score >= 8.5) strengths.push('Uzun yazım seanslarında eli yormaz')
  if (p.smoothness_score >= 8.6) strengths.push('Yüksek yazım akıcılığı')
  if (p.price < 150) strengths.push('Güçlü fiyat/performans')
  if (!strengths.length) strengths.push('Dengeli ve güvenilir günlük kullanım')
  const weaknesses: string[] = []
  if (p.weight >= 22) weaknesses.push('Bazı kullanıcılar için biraz ağır gelebilir')
  if (p.price >= 1500) weaknesses.push('Giriş seviyesi bütçenin üzerinde')
  if (p.type === 'fountain') weaknesses.push('Bakım ve mürekkep alışkanlığı ister')
  if (!weaknesses.length) weaknesses.push('Belirgin bir zayıf yönü yok; tercih meselesi')
  const item: RecommendationItem = {
    pen: withLinks(p),
    score: Math.round(clamp(raw, 35, 98)),
    reasons: reasons.slice(0, 4),
    strengths,
    weaknesses: weaknesses.slice(0, 3),
    suitable_for: (p.suitable_for ?? '').split('|').filter(Boolean),
    not_suitable_for: (p.not_suitable_for ?? '').split('|').filter(Boolean),
  }
  return { item, raw }
}

function recommend(req: WizardAnswers): RecommendationItem[] {
  return pens
    .filter((p) => p.price <= req.budget * 1.15)
    .map((p) => scoreOne(req, p))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 6)
    .map((r) => r.item)
}

const guidePresets: { purpose: string; label: string; req: WizardAnswers }[] = [
  { purpose: 'study', label: 'Ders', req: { purpose: 'study', writing_thickness: 'fine', ink_type: 'gel', smoothness: 7, weight_preference: 4, budget: 400, priorities: ['value', 'comfort', 'long_use'] } },
  { purpose: 'university', label: 'Üniversite', req: { purpose: 'university', writing_thickness: 'fine', ink_type: 'fountain', smoothness: 7, weight_preference: 5, budget: 1400, priorities: ['writing_quality', 'comfort'] } },
  { purpose: 'office', label: 'Ofis', req: { purpose: 'office', writing_thickness: 'medium', ink_type: 'ballpoint', smoothness: 8, weight_preference: 5, budget: 900, priorities: ['value', 'durability'] } },
  { purpose: 'drawing', label: 'Çizim', req: { purpose: 'drawing', writing_thickness: 'fine', ink_type: 'mechanical', smoothness: 6, weight_preference: 6, budget: 1600, priorities: ['writing_quality', 'durability'] } },
  { purpose: 'signature', label: 'İmza', req: { purpose: 'signature', writing_thickness: 'medium', ink_type: 'fountain', smoothness: 8, weight_preference: 6, budget: 8000, priorities: ['design', 'premium'] } },
  { purpose: 'professional', label: 'Profesyonel', req: { purpose: 'professional', writing_thickness: 'fine', ink_type: 'fountain', smoothness: 8, weight_preference: 5, budget: 5000, priorities: ['writing_quality', 'design'] } },
  { purpose: 'daily', label: 'Günlük', req: { purpose: 'daily', writing_thickness: 'fine', ink_type: 'gel', smoothness: 7, weight_preference: 4, budget: 350, priorities: ['value', 'comfort'] } },
]

const demoUsers: Record<string, User & { password: string }> = {
  'admin@hangikalem.com': { id: 'admin', email: 'admin@hangikalem.com', name: 'Admin', role: 'admin', password: 'password123' },
  'ayse@example.com': { id: 'ayse', email: 'ayse@example.com', name: 'Ayşe Yılmaz', role: 'user', password: 'password123' },
  'mert@example.com': { id: 'mert', email: 'mert@example.com', name: 'Mert Kaya', role: 'user', password: 'password123' },
  'elif@example.com': { id: 'elif', email: 'elif@example.com', name: 'Elif Demir', role: 'user', password: 'password123' },
}

function favKey() {
  return 'hangikalem-favorites'
}

export const catalogApi = {
  async pens(filters: PenFilters = {}): Promise<PaginatedPens> {
    const filtered = pens.filter((p) => matchPen(p, filters)).map(withLinks)
    const limit = Math.min(filters.limit ?? 200, 500)
    const page = Math.max(1, filters.page ?? 1)
    const start = (page - 1) * limit
    return { items: filtered.slice(start, start + limit), total: filtered.length, page, limit }
  },
  async pen(slug: string): Promise<Pen> {
    const p = pens.find((x) => x.slug === slug)
    if (!p) throw new Error('Kalem bulunamadı')
    return withLinks(p)
  },
  async popular() {
    const items = [...pens].sort((a, b) => b.avg_rating * 10 + b.review_count - (a.avg_rating * 10 + a.review_count)).slice(0, 16).map(withLinks)
    return { items }
  },
  async brands() {
    return { items: brands }
  },
  async brand(slug: string): Promise<Brand> {
    const b = brands.find((x) => x.slug === slug)
    if (!b) throw new Error('Marka bulunamadı')
    return b
  },
  async search(q: string): Promise<SearchResult> {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return { brands: [], pens: [] }
    return {
      brands: brands.filter((b) => b.name.toLowerCase().includes(s) || b.slug.includes(s)).slice(0, 6),
      pens: pens.filter((p) => `${p.brand_name} ${p.name} ${p.slug}`.toLowerCase().includes(s)).slice(0, 8).map(withLinks),
    }
  },
  async recommend(body: WizardAnswers) {
    return { recommendations: recommend(body) }
  },
  async fit(slug: string, body: WizardAnswers): Promise<FitBreakdown> {
    const p = pens.find((x) => x.slug === slug)
    if (!p) throw new Error('Kalem bulunamadı')
    const smoothness = Math.round(clamp(100 - Math.abs(body.smoothness - p.smoothness_score) * 10, 0, 100))
    const prefW = 8 + (body.weight_preference - 1) * 2.4
    const weight = Math.round(clamp(100 - Math.min(70, Math.abs(prefW - p.weight) * 5), 0, 100))
    const budget = p.price > body.budget ? Math.round(clamp(50 - ((p.price - body.budget) / body.budget) * 80, 0, 100)) : 100
    const comfort = Math.round(clamp(p.comfort_score * 10, 0, 100))
    return { comfort, smoothness, budget, weight, overall: Math.round((comfort + smoothness + budget + weight) / 4) }
  },
  async compare(slugs: string[]): Promise<CompareResponse> {
    const selected = slugs.map((s) => pens.find((p) => p.slug === s)).filter((p): p is Pen => Boolean(p))
    if (selected.length < 2) throw new Error('En az 2 kalem seç')
    const first = selected[0]
    if (!first) throw new Error('En az 2 kalem seç')
    const names = selected.map((p) => `${p.brand_name} ${p.name}`)
    const metric = (key: string, label: string, group: string, group_label: string, get: (p: Pen) => number, higher: boolean) => {
      const values: Record<string, number> = {}
      let best = first.slug
      let bestVal = get(first)
      for (const p of selected) {
        const v = get(p)
        values[p.slug] = v
        if (higher ? v > bestVal : v < bestVal) {
          bestVal = v
          best = p.slug
        }
      }
      return { key, label, group, group_label, values, best_slug: best, higher_is_better: higher }
    }
    const metrics = [
      metric('smoothness', 'Akıcılık', 'writing', 'Yazım', (p) => p.smoothness_score, true),
      metric('comfort', 'Konfor', 'feel', 'Elde duruş', (p) => p.comfort_score, true),
      metric('weight', 'Ağırlık', 'feel', 'Elde duruş', (p) => p.weight, false),
      metric('price', 'Referans fiyat', 'price', 'Fiyat', (p) => p.price, false),
      metric('durability', 'Dayanıklılık', 'quality', 'Kalite', (p) => p.durability_score, true),
      metric('design', 'Tasarım', 'quality', 'Kalite', (p) => p.design_score, true),
    ]
    const cheapest = [...selected].sort((a, b) => a.price - b.price)[0] ?? first
    const smoothest = [...selected].sort((a, b) => b.smoothness_score - a.smoothness_score)[0] ?? first
    const comfort = [...selected].sort((a, b) => b.comfort_score - a.comfort_score)[0] ?? first
    return {
      title: names.join(' vs '),
      summary: `${names[0]} ile ${names[1]} yazım hissi, tutuş ve referans fiyat üzerinden karşılaştırıldı.`,
      pens: selected.map(withLinks),
      metrics,
      verdict: [
        { key: 'cheap', label: 'En uygun referans fiyat', pen_slug: cheapest.slug, pen_name: `${cheapest.brand_name} ${cheapest.name}`, reason: 'Bu sette en düşük referans fiyat.' },
        { key: 'smooth', label: 'En akıcı yazım', pen_slug: smoothest.slug, pen_name: `${smoothest.brand_name} ${smoothest.name}`, reason: 'Akıcılık skoru en yüksek.' },
        { key: 'comfort', label: 'En konforlu tutuş', pen_slug: comfort.slug, pen_name: `${comfort.brand_name} ${comfort.name}`, reason: 'Konfor skoru en yüksek.' },
      ],
    }
  },
  async guides(): Promise<{ items: GuideItem[] }> {
    const items = guidePresets.map((g) => {
      const recs = recommend(g.req)
      const winner = recs[0]?.pen
      if (!winner) return null
      return {
        purpose: g.purpose,
        label: g.label,
        reason: winner.why_good || recs[0]?.reasons[0] || `${winner.brand_name} ${winner.name} bu kategoride öne çıkıyor.`,
        winner,
        alternatives: recs.slice(1, 3).map((r) => r.pen),
      }
    }).filter(Boolean) as GuideItem[]
    return { items }
  },
  async reviews(): Promise<{ items: Review[] }> {
    return { items: [] }
  },
  async createReview(): Promise<Review> {
    throw new Error('Canlı sitede yorum için backend gerekir')
  },
  async recentReviews(): Promise<{ items: Review[] }> {
    return { items: [] }
  },
  async favorites(): Promise<{ items: Pen[] }> {
    const ids = JSON.parse(localStorage.getItem(favKey()) || '[]') as string[]
    return { items: pens.filter((p) => ids.includes(p.id)).map(withLinks) }
  },
  async addFavorite(penId: string) {
    const ids = new Set(JSON.parse(localStorage.getItem(favKey()) || '[]') as string[])
    ids.add(penId)
    localStorage.setItem(favKey(), JSON.stringify([...ids]))
  },
  async removeFavorite(penId: string) {
    const ids = (JSON.parse(localStorage.getItem(favKey()) || '[]') as string[]).filter((id) => id !== penId)
    localStorage.setItem(favKey(), JSON.stringify(ids))
  },
  async login(email: string, password: string) {
    const u = demoUsers[email]
    if (!u || u.password !== password) throw new Error('E-posta veya şifre hatalı')
    return { access_token: 'local', user: { id: u.id, email: u.email, name: u.name, role: u.role } }
  },
  async register(name: string, email: string) {
    const user: User = { id: email, email, name, role: 'user' }
    return { access_token: 'local', user }
  },
  async logout() {},
  async me(): Promise<User> {
    throw new Error('Oturum yok')
  },
  async adminUsers() {
    return {
      items: Object.values(demoUsers).map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        created_at: '2026-01-01',
        review_count: 0,
        favorite_count: 0,
      })),
    }
  },
  async adminTables() {
    return { items: [{ name: 'pens', rows: pens.length }, { name: 'brands', rows: brands.length }] }
  },
  async adminTable() {
    return { name: 'pens', columns: ['slug', 'name', 'brand_name', 'price'], items: pens.slice(0, 50) as unknown as Record<string, unknown>[], total: pens.length, limit: 50, offset: 0 }
  },
}
