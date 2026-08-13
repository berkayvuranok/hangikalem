export type Pen = {
  id: string
  brand_id: string
  brand_name: string
  brand_slug: string
  name: string
  slug: string
  description: string
  type: string
  ink_type: string
  tip_size: string
  price: number
  weight: number
  length?: number
  grip_material?: string
  body_material?: string
  color?: string
  smoothness_score: number
  comfort_score: number
  durability_score: number
  precision_score: number
  design_score: number
  grip_score: number
  ink_quality: number
  image_url?: string
  why_good?: string
  suitable_for?: string
  not_suitable_for?: string
  avg_rating: number
  review_count: number
  tags?: string[]
  features?: Record<string, string>
  shop_links?: ExternalLink[]
  review_links?: ExternalLink[]
}

export type ExternalLink = {
  key: string
  label: string
  url: string
  summary: string
  hint?: string
}

export type Brand = {
  id: string
  name: string
  slug: string
  logo_url?: string
  description?: string
}

export type User = {
  id: string
  email: string
  name: string
  role: string
}

export type AdminUser = {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  review_count: number
  favorite_count: number
}

export type AdminTable = {
  name: string
  rows: number
}

export type AdminTableRows = {
  name: string
  columns: string[]
  items: Record<string, unknown>[]
  total: number
  limit: number
  offset: number
}

export type Review = {
  id: string
  pen_id: string
  user_name: string
  rating: number
  title?: string
  body: string
  created_at: string
}

export type PaginatedPens = {
  items: Pen[]
  total: number
  page: number
  limit: number
}

export type SearchResult = {
  brands: Brand[]
  pens: Pen[]
}

export type WizardAnswers = {
  purpose: string
  writing_thickness: string
  ink_type: string
  smoothness: number
  weight_preference: number
  budget: number
  priorities: string[]
}

export type RecommendationItem = {
  pen: Pen
  score: number
  reasons: string[]
  strengths: string[]
  weaknesses: string[]
  suitable_for: string[]
  not_suitable_for: string[]
}

export type FitBreakdown = {
  comfort: number
  smoothness: number
  budget: number
  weight: number
  overall: number
}

export type CompareMetric = {
  key: string
  label: string
  group: string
  group_label: string
  values: Record<string, string | number>
  best_slug?: string
  higher_is_better: boolean
}

export type CompareVerdict = {
  key: string
  label: string
  pen_slug: string
  pen_name: string
  reason: string
}

export type CompareResponse = {
  title: string
  summary: string
  pens: Pen[]
  metrics: CompareMetric[]
  verdict: CompareVerdict[]
}

export type GuideItem = {
  purpose: string
  label: string
  reason: string
  winner: Pen
  alternatives: Pen[]
}

export type PenFilters = {
  brand?: string
  type?: string
  ink_type?: string
  tip_size?: string
  color?: string
  purpose?: string
  min_price?: number
  max_price?: number
  min_weight?: number
  max_weight?: number
  min_rating?: number
  page?: number
  limit?: number
}
