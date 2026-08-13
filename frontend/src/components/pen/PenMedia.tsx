import { PenIllustration } from '@/components/pen/PenIllustration'
import type { Pen } from '@/types'
import { cn } from '@/utils/format'
import { useEffect, useState } from 'react'

type Props = {
  pen: Pick<Pen, 'type' | 'image_url' | 'name' | 'brand_name'>
  className?: string
  tilt?: number
}

const BAD = [
  'collage',
  'collection',
  'newspaper',
  'zeitung',
  'giornale',
  'magazine',
  'daily_times',
  'victoria_daily',
  'fun_pen',
]

function isPhoto(url?: string) {
  if (!url || !/^https?:\/\//.test(url)) return false
  const low = url.toLowerCase()
  return !BAD.some((part) => low.includes(part))
}

const memory = new Map<string, string>()

async function wikiPhoto(pen: Pick<Pen, 'brand_name' | 'name'>): Promise<string> {
  const key = `${pen.brand_name} ${pen.name}`
  const cached = memory.get(key) ?? sessionStorage.getItem(`hk-img:${key}`)
  if (cached) return cached
  const titles = [key, `${pen.brand_name} ${pen.name.split(' ')[0] ?? ''}`.trim(), pen.name]
  for (const host of ['https://en.wikipedia.org', 'https://tr.wikipedia.org']) {
    for (const title of titles) {
      try {
        const res = await fetch(`${host}/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(' ', '_'))}`)
        if (!res.ok) continue
        const data = (await res.json()) as {
          originalimage?: { source?: string }
          thumbnail?: { source?: string }
        }
        const src = data.originalimage?.source || data.thumbnail?.source || ''
        if (isPhoto(src)) {
          memory.set(key, src)
          sessionStorage.setItem(`hk-img:${key}`, src)
          return src
        }
      } catch {
        /* next candidate */
      }
    }
  }
  return ''
}

export function PenMedia({ pen, className, tilt }: Props) {
  const ready = isPhoto(pen.image_url) ? pen.image_url : ''
  const [src, setSrc] = useState(ready)

  useEffect(() => {
    if (ready) {
      setSrc(ready)
      return
    }
    let live = true
    wikiPhoto(pen).then((url) => {
      if (live && url) setSrc(url)
    })
    return () => {
      live = false
    }
  }, [pen.brand_name, pen.name, ready])

  if (src) {
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
