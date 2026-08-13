import { useAuthStore } from '@/stores/authStore'
import type {
  Brand,
  CompareResponse,
  FitBreakdown,
  GuideItem,
  AdminUser,
  AdminTable,
  AdminTableRows,
  PaginatedPens,
  Pen,
  PenFilters,
  RecommendationItem,
  Review,
  SearchResult,
  User,
  WizardAnswers,
} from '@/types'

import { catalogApi } from '@/services/catalogApi'

const base = import.meta.env.VITE_API_URL ?? ''
const useCatalog = !base

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${base}${path}`, { ...init, headers, credentials: 'include' })

  if (res.status === 401 && retry && !path.startsWith('/api/auth/login') && !path.startsWith('/api/auth/register')) {
    const ok = await refreshSession()
    if (ok) return request<T>(path, init, false)
  }

  if (res.status === 204) return undefined as T
  const data: unknown = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? 'İstek başarısız')
  }
  return data as T
}

export async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch(`${base}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
    if (!res.ok) {
      useAuthStore.getState().clear()
      return false
    }
    const data = (await res.json()) as { access_token: string; user: User }
    useAuthStore.getState().setSession(data.access_token, data.user)
    return true
  } catch {
    useAuthStore.getState().clear()
    return false
  }
}

function qs(filters: Record<string, string | number | undefined | null>): string {
  const p = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p.set(k, String(v))
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const api = useCatalog
  ? catalogApi
  : {
      pens: (filters: PenFilters = {}) => request<PaginatedPens>(`/api/pens${qs(filters)}`),
      pen: (slug: string) => request<Pen>(`/api/pens/${slug}`),
      popular: () => request<{ items: Pen[] }>('/api/pens/popular'),
      brands: () => request<{ items: Brand[] }>('/api/brands'),
      brand: (slug: string) => request<Brand>(`/api/brands/${slug}`),
      search: (q: string) => request<SearchResult>(`/api/search?q=${encodeURIComponent(q)}`),
      recommend: (body: WizardAnswers) =>
        request<{ recommendations: RecommendationItem[] }>('/api/recommendations', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      fit: (slug: string, body: WizardAnswers) =>
        request<FitBreakdown>(`/api/pens/${slug}/fit`, { method: 'POST', body: JSON.stringify(body) }),
      compare: (slugs: string[]) =>
        request<CompareResponse>('/api/compare', { method: 'POST', body: JSON.stringify({ slugs }) }),
      guides: () => request<{ items: GuideItem[] }>('/api/guides'),
      reviews: (slug: string) => request<{ items: Review[] }>(`/api/pens/${slug}/reviews`),
      createReview: (slug: string, body: { rating: number; title?: string; body: string }) =>
        request<Review>(`/api/pens/${slug}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
      recentReviews: () => request<{ items: Review[] }>('/api/reviews/recent'),
      favorites: () => request<{ items: Pen[] }>('/api/favorites'),
      addFavorite: (penId: string) => request<void>(`/api/favorites/${penId}`, { method: 'POST' }),
      removeFavorite: (penId: string) => request<void>(`/api/favorites/${penId}`, { method: 'DELETE' }),
      login: (email: string, password: string) =>
        request<{ access_token: string; user: User }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }),
      register: (name: string, email: string, password: string) =>
        request<{ access_token: string; user: User }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        }),
      logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
      me: () => request<User>('/api/auth/me'),
      adminUsers: () => request<{ items: AdminUser[] }>('/api/admin/users'),
      adminTables: () => request<{ items: AdminTable[] }>('/api/admin/db'),
      adminTable: (name: string, q: { limit?: number; offset?: number } = {}) =>
        request<AdminTableRows>(`/api/admin/db/${name}${qs(q)}`),
    }
