import type { ExternalLink } from '@/types'

export function LinkCards({
  title,
  intro,
  links,
}: {
  title: string
  intro?: string
  links?: ExternalLink[]
}) {
  if (!links?.length) return null
  return (
    <section>
      <h2 className="font-serif text-3xl">{title}</h2>
      {intro && <p className="mt-3 max-w-2xl text-[var(--muted)]">{intro}</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {links.map((l) => (
          <a
            key={l.key}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-[var(--line)] p-5 transition hover:border-brass"
          >
            <p className="text-xs tracking-wide text-brass uppercase">{l.hint ?? l.key}</p>
            <p className="mt-1 font-medium">{l.label}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{l.summary}</p>
            <p className="mt-3 text-xs underline">Git →</p>
          </a>
        ))}
      </div>
    </section>
  )
}

export function ShopPills({ links }: { links?: ExternalLink[] }) {
  if (!links?.length) return null
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {links.map((l) => (
        <a
          key={l.key}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          className={`rounded-full border px-3 py-1 text-xs ${l.key === 'cimri' ? 'border-brass bg-brass/15' : 'border-[var(--line)]'}`}
        >
          {l.label}
        </a>
      ))}
    </div>
  )
}
