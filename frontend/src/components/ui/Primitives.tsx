import { cn } from '@/utils/format'
import type { ReactNode } from 'react'

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('surface rounded-2xl p-6', className)}>{children}</div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string
  title: string
  body?: string
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="mb-3 text-xs font-medium tracking-[0.18em] text-brass uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="font-serif text-3xl tracking-tight text-[var(--fg)] md:text-4xl">{title}</h2>
      {body && <p className="mt-3 text-[var(--muted)]">{body}</p>}
    </div>
  )
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.min(100, Math.max(0, value)))
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-[var(--muted)]">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-700 dark:bg-brass"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-2xl bg-[var(--line)]', className)} />
  )
}
