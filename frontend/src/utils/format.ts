export function formatPrice(n: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n)
}

export const typeLabels: Record<string, string> = {
  gel: 'Jel',
  ballpoint: 'Tükenmez',
  rollerball: 'Rollerball',
  fountain: 'Dolma kalem',
  mechanical: 'Mekanik kalem',
}

export const purposeLabels: Record<string, string> = {
  study: 'Ders',
  university: 'Üniversite',
  office: 'Ofis',
  drawing: 'Çizim',
  daily: 'Günlük kullanım',
  signature: 'İmza',
  professional: 'Profesyonel',
}

export const thicknessLabels: Record<string, string> = {
  extra_fine: 'Çok ince',
  fine: 'İnce',
  medium: 'Orta',
  bold: 'Kalın',
}

export const inkLabels: Record<string, string> = {
  gel: 'Jel',
  ballpoint: 'Tükenmez',
  rollerball: 'Rollerball',
  fountain: 'Dolma kalem',
  mechanical: 'Mekanik kalem',
}

export const priorityLabels: Record<string, string> = {
  comfort: 'Konfor',
  writing_quality: 'Yazım kalitesi',
  design: 'Tasarım',
  durability: 'Dayanıklılık',
  value: 'Fiyat/performans',
  premium: 'Premium his',
  long_use: 'Uzun süre kullanım',
}

export function scorePct(score: number): number {
  return Math.round(Math.min(10, Math.max(0, score)) * 10)
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
