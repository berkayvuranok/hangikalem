const BRAND_KEYS: Record<string, string[]> = {
  uni: ['uni', 'uniball', 'uni-ball', 'uni_ball'],
  pilot: ['pilot'],
  lamy: ['lamy'],
  pentel: ['pentel', 'energel'],
  zebra: ['zebra', 'sarasa'],
  parker: ['parker'],
  kaweco: ['kaweco'],
  rotring: ['rotring'],
  tombow: ['tombow'],
  'faber-castell': ['faber', 'castell'],
  sailor: ['sailor'],
  'caran-dache': ['caran', 'dache'],
  staedtler: ['staedtler'],
  muji: ['muji'],
  cross: ['cross'],
  bic: ['bic', 'cristal'],
  platinum: ['platinum', 'preppy', 'plaisir', 'prefounte'],
  twsbi: ['twsbi'],
  pelikan: ['pelikan'],
  waterman: ['waterman'],
  montblanc: ['montblanc', 'meisterstuck', 'meisterstück'],
  sakura: ['sakura', 'gelly'],
  'paper-mate': ['papermate', 'paper_mate', 'paper-mate', 'inkjoy'],
  schneider: ['schneider'],
  ohto: ['ohto'],
  serve: ['serve'],
  adel: ['adel'],
  diplomat: ['diplomat'],
  fisher: ['fisher', 'space'],
  jinhao: ['jinhao'],
  hongdian: ['hongdian'],
  sheaffer: ['sheaffer'],
  leuchtturm: ['leuchtturm', 'drehgriffel'],
  sharpie: ['sharpie'],
  stabilo: ['stabilo'],
  monami: ['monami'],
  'graf-von-faber': ['faber', 'graf'],
}

const WEAK = new Set([
  'large', 'standard', 'slim', 'light', 'classic', 'century', 'easy', 'bold',
  'student', 'urban', 'studio', 'forest', 'logo', 'twist', 'special', 'expert',
  'juice', 'explorer', 'elite', 'micro', 'change', 'casual', 'power', 'tank',
  'style', 'fit', 'grip', 'super', 'ball', 'pen', 'gel', 'ink', 'clip', 'type',
  'black', 'white', 'mini', 'pro', 'gear', 'the', 'and', 'for', 'roll', 'roller',
])

const JUNK = [
  'collage', 'collection', 'newspaper', 'zeitung', 'giornale', 'magazine',
  'daily_times', 'victoria_daily', 'fun_pen', '.djvu', '.pdf', 'page1-',
  'album_cover', 'aerial_view', 'high_school', 'census', 'rainforest',
  'statutes', 'world_in_', 'newtonian', 'japan_gp', 'japangp',
  'pentip', 'pen_tip',
]

function tokens(name: string) {
  return (name.toLowerCase().match(/[a-z]{3,}|\d{2,}/g) ?? []).filter((t) => !WEAK.has(t))
}

function haystack(url: string) {
  return decodeURIComponent(url).toLowerCase().replace(/[^a-z0-9]+/g, ' ')
}

export function isTrustedPenPhoto(url: string | undefined, brandSlug: string, name: string) {
  if (!url || !/^https?:\/\//.test(url)) return false
  const low = url.toLowerCase()
  if (JUNK.some((part) => low.includes(part))) return false
  const text = haystack(url)
  const brands = BRAND_KEYS[brandSlug] ?? [brandSlug]
  const hasBrand = brands.some((b) => text.includes(b.replace(/-/g, ' ')) || text.includes(b.replace(/-/g, '')))
  const strong = tokens(name).filter((t) => text.includes(t))
  const nameBits = (name.toLowerCase().match(/[a-z]{4,}|\d{2,}/g) ?? []).filter((t) => text.includes(t))
  if (strong.length && (hasBrand || Math.max(...strong.map((t) => t.length)) >= 5)) return true
  if (hasBrand && nameBits.length) return true
  if (hasBrand && !tokens(name).length && (text.includes('pen') || text.includes('fountain') || text.includes('ballpoint'))) {
    return true
  }
  return false
}
