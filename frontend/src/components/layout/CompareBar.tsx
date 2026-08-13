import { Button } from '@/components/ui/Button'
import { useCompareStore } from '@/stores/compareStore'
import { X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function CompareBar() {
  const slugs = useCompareStore((s) => s.slugs)
  const remove = useCompareStore((s) => s.remove)
  const clear = useCompareStore((s) => s.clear)
  const loc = useLocation()

  if (slugs.length === 0 || loc.pathname === '/compare') return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--bg)]/92 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{slugs.length} kalem seçili</p>
          {slugs.map((slug) => (
            <span
              key={slug}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-xs"
            >
              <Link to={`/pens/${slug}`} className="max-w-[10rem] truncate">
                {slug.replace(/-/g, ' ')}
              </Link>
              <button type="button" aria-label="Çıkar" onClick={() => remove(slug)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={clear}>
            Temizle
          </Button>
          {slugs.length < 2 ? (
            <Button disabled>Karşılaştır</Button>
          ) : (
            <Link to="/compare">
              <Button>Karşılaştır</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
