import type { Pen } from '@/types'

type Props = {
  pen: Pick<Pen, 'type' | 'image_url' | 'name'>
  className?: string
  tilt?: number
}

export function PenIllustration({ pen, className, tilt = -28 }: Props) {
  const color = pen.image_url && pen.image_url.startsWith('#') ? pen.image_url : '#1E3A5F'
  const tip = pen.type === 'fountain' ? 'fountain' : pen.type === 'mechanical' ? 'mechanical' : 'ball'
  const gid = `g-${pen.name.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg
      viewBox="0 0 120 520"
      className={className}
      style={{ transform: `rotate(${tilt}deg)` }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" x2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="55%" stopColor={color} />
          <stop offset="100%" stopColor="#f5f0e8" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <g>
        <rect x="48" y="40" width="24" height="360" rx="12" fill={`url(#${gid})`} />
        <rect x="50" y="52" width="6" height="300" rx="3" fill="white" opacity="0.18" />
        <rect x="70" y="70" width="4" height="70" rx="1" fill="#C4A574" opacity="0.9" />
        {tip === 'fountain' ? (
          <>
            <path d="M48 400 h24 l-8 70 h-8 z" fill="#c9c3b8" />
            <path d="M58 430 v28" stroke="#1a1a1a" strokeWidth="1.4" />
            <ellipse cx="60" cy="458" rx="3" ry="5" fill="#1a1a1a" />
          </>
        ) : tip === 'mechanical' ? (
          <>
            <rect x="52" y="400" width="16" height="48" fill="#9aa3ad" />
            <polygon points="52,448 68,448 60,500" fill="#d9d4cc" />
            <polygon points="57,478 63,478 60,500" fill="#333" />
          </>
        ) : (
          <>
            <rect x="51" y="400" width="18" height="40" rx="4" fill="#2a2a2a" />
            <polygon points="51,440 69,440 60,498" fill="#d7d1c7" />
            <circle cx="60" cy="496" r="3" fill="#111" />
          </>
        )}
        <rect x="44" y="28" width="32" height="22" rx="6" fill={color} />
      </g>
    </svg>
  )
}
