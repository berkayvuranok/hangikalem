import { CommandPalette } from '@/components/layout/CommandPalette'
import { CompareBar } from '@/components/layout/CompareBar'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { Toasts } from '@/components/layout/Toasts'
import { useCompareStore } from '@/stores/compareStore'
import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

export function Layout() {
  const loc = useLocation()
  const compareCount = useCompareStore((s) => s.slugs.length)
  const padCompare = compareCount > 0 && loc.pathname !== '/compare'
  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-[var(--fg)] focus:px-3 focus:py-2 focus:text-[var(--bg)]"
      >
        İçeriğe geç
      </a>
      <Navbar />
      <motion.main
        id="main"
        key={loc.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={padCompare ? 'pt-16 pb-24' : 'pt-16'}
      >
        <Outlet />
      </motion.main>
      <Footer />
      <CompareBar />
      <CommandPalette />
      <Toasts />
    </div>
  )
}
