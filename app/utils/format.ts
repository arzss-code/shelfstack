export const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatReviewerName = (name?: string | null): string => {
  if (!name || !name.trim()) return 'Pelanggan ShelfStack'
  let clean = name.trim()
  if (clean.includes('@')) {
    clean = (clean.split('@')[0] ?? '').replace(/[._-]/g, ' ')
  }
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0 || !parts[0]) return 'Pelanggan ShelfStack'
  const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  if (parts.length === 1) {
    return firstName
  }
  const lastPart = parts[parts.length - 1] ?? ''
  const lastInitial = lastPart.charAt(0).toUpperCase()
  return `${firstName} ${lastInitial}.`
}

export const formatReviewDate = (dateStr?: string | null): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
