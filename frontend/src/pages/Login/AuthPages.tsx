import { Button } from '@/components/ui/Button'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export function LoginPage() {
  const nav = useNavigate()
  const loc = useLocation()
  const from = (loc.state as { from?: string } | null)?.from ?? '/profile'
  const setSession = useAuthStore((s) => s.setSession)
  const push = useToastStore((s) => s.push)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-serif text-4xl">Giriş</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Favoriler ve yorumlar için hesabın olsun.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setPending(true)
          try {
            const res = await api.login(email, password)
            setSession(res.access_token, res.user)
            nav(from, { replace: true })
          } catch (err) {
            push({ title: err instanceof Error ? err.message : 'Giriş başarısız', tone: 'error' })
          } finally {
            setPending(false)
          }
        }}
      >
        <label className="block text-sm">
          E-posta
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3"
          />
        </label>
        <label className="block text-sm">
          Şifre
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3"
          />
        </label>
        <Button type="submit" disabled={pending} className="w-full">
          Giriş yap
        </Button>
      </form>
      <p className="mt-6 text-sm text-[var(--muted)]">
        Hesabın yok mu? <Link to="/register" className="text-[var(--fg)] underline">Kayıt ol</Link>
      </p>
    </div>
  )
}

export function RegisterPage() {
  const nav = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const push = useToastStore((s) => s.push)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-serif text-4xl">Kayıt ol</h1>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setPending(true)
          try {
            const res = await api.register(name, email, password)
            setSession(res.access_token, res.user)
            nav('/profile', { replace: true })
          } catch (err) {
            push({ title: err instanceof Error ? err.message : 'Kayıt başarısız', tone: 'error' })
          } finally {
            setPending(false)
          }
        }}
      >
        <label className="block text-sm">
          Ad
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3"
          />
        </label>
        <label className="block text-sm">
          E-posta
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3"
          />
        </label>
        <label className="block text-sm">
          Şifre (min. 8)
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3"
          />
        </label>
        <Button type="submit" disabled={pending} className="w-full">
          Hesap oluştur
        </Button>
      </form>
    </div>
  )
}
