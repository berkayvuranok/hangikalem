import { PenIllustration } from '@/components/pen/PenIllustration'
import type { Pen } from '@/types'
import { cn } from '@/utils/format'

type Props = {
  pen: Pick<Pen, 'type' | 'image_url' | 'name'>
  className?: string
  tilt?: number
}

export function PenMedia({ pen, className, tilt }: Props) {
  const src = pen.image_url
  if (src && /^https?:\/\//.test(src)) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className={cn('h-full w-full object-contain', className)}
      />
    )
  }
  return <PenIllustration pen={pen} className={className} tilt={tilt} />
}
