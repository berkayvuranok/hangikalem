import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useCompareStore } from '@/stores/compareStore'
import { cn } from '@/utils/format'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const links = [
  { to: '/pens', label: 'Kalemler' },
  { to: '/find', label: 'Kalemimi Bul' },
  { to: '/compare', label: 'Karşılaştır' },
  { to: '/#brands', label: 'Markalar' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { theme, toggleTheme, setSearchOpen, mobileNav, setMobileNav } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const compareCount = useCompareStore((s) => s.slugs.length)
  const loc = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileNav(false)
  }, [loc.pathname, setMobileNav])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-all',
        scrolled ? 'glass border-b border-[var(--line)]' : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:h-[4.25rem]">
        <Link to="/" className="font-serif text-xl tracking-tight">
          HangiKalem
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn('text-[var(--muted)] hover:text-[var(--fg)]', isActive && 'text-[var(--fg)]')
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Ara"
            className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/8"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Tema"
            className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/8"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/favorites" aria-label="Favoriler" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/8">
            <Heart className="h-4 w-4" />
          </Link>
          <Link
            to="/compare"
            className="relative hidden rounded-full px-3 py-1.5 text-sm md:inline"
          >
            Karşılaştır
            {compareCount > 0 && (
              <span className="ml-1 rounded-full bg-ink px-1.5 text-[10px] text-white dark:bg-brass dark:text-black">
                {compareCount}
              </span>
            )}
          </Link>
          <Link
            to={user ? '/profile' : '/login'}
            className="hidden rounded-full border border-[var(--line)] px-3 py-1.5 text-sm md:inline"
          >
            {user ? user.name.split(' ')[0] : 'Giriş'}
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin/db"
              className="hidden rounded-full bg-ink px-3 py-1.5 text-sm text-white md:inline dark:bg-brass dark:text-black"
            >
              Kayıtlar
            </Link>
          )}
          <button
            type="button"
            className="rounded-full p-2 md:hidden"
            aria-label="Menü"
            aria-expanded={mobileNav}
            onClick={() => setMobileNav(!mobileNav)}
          >
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileNav && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[var(--line)] md:hidden"
          >
            <div className="flex flex-col gap-2 px-4 py-4">
              {links.map((l) => (
                <Link key={l.to} to={l.to} className="py-2">
                  {l.label}
                </Link>
              ))}
              <Link to={user ? '/profile' : '/login'} className="py-2">
                {user ? 'Profil' : 'Giriş'}
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin/db" className="py-2">
                  Kayıtlar
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
