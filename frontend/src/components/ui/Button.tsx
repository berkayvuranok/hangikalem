import { cn } from '@/utils/format'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'brass' | 'outline'
  children: ReactNode
}

export function Button({ variant = 'primary', className, children, ...props }: Props) {
  const styles = {
    primary: 'bg-[var(--fg)] text-[var(--bg)] hover:opacity-90',
    ghost: 'bg-transparent hover:bg-black/5 dark:hover:bg-white/8',
    brass: 'bg-brass text-[#1a140c] hover:brightness-105',
    outline: 'border border-[var(--line)] bg-transparent hover:bg-black/4 dark:hover:bg-white/6',
  }[variant]

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-[transform,background-color,opacity] duration-200 hover:scale-[1.02] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50',
        styles,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
