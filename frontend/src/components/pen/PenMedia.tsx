import { PenIllustration } from '@/components/pen/PenIllustration'
import type { Pen } from '@/types'
import { cn } from '@/utils/format'
import { isTrustedPenPhoto } from '@/utils/penImage'

type Props = {
  pen: Pick<Pen, 'type' | 'image_url' | 'name' | 'brand_name' | 'brand_slug'>
  className?: string
  tilt?: number
}

export function PenMedia({ pen, className, tilt }: Props) {
  const src = isTrustedPenPhoto(pen.image_url, pen.brand_slug, pen.name) ? pen.image_url : ''
  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className={cn('h-full w-full object-contain p-2', className)}
      />
    )
  }
  return <PenIllustration pen={pen} className={className} tilt={tilt} />
}
