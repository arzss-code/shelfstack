export const formatStatusLabel = (status: string): string => {
  switch (status) {
    case 'open':
      return 'Baru'
    case 'waiting_admin':
      return 'Perlu Balasan'
    case 'waiting_customer':
      return 'Menunggu User'
    case 'resolved':
      return 'Selesai'
    default:
      return status
  }
}

export const statusDotClass = (status: string): string => {
  switch (status) {
    case 'open':
      return 'bg-brand-accent'
    case 'waiting_admin':
      return 'bg-brand-warning'
    case 'waiting_customer':
      return 'bg-brand-muted'
    case 'resolved':
      return 'bg-brand-success'
    default:
      return 'bg-brand-faint'
  }
}

export const statusPillClass = (status: string): string => {
  switch (status) {
    case 'open':
      return 'bg-brand-accent-tint text-brand-accent-text border border-brand-accent-edge'
    case 'waiting_admin':
      return 'bg-brand-warning-tint text-brand-warning-text border border-brand-warning-edge'
    case 'waiting_customer':
      return 'bg-brand-canvas-soft text-brand-ink border border-brand-hair'
    case 'resolved':
      return 'bg-brand-success-tint text-brand-success-text border border-brand-success-edge'
    default:
      return 'bg-brand-canvas-soft text-brand-muted border border-brand-hair'
  }
}

export const statusDescription = (status: string): string => {
  switch (status) {
    case 'open':
      return 'Tiket baru dibuat, belum ada balasan CS.'
    case 'waiting_admin':
      return 'Pelanggan telah mengirim pesan, perlu respon CS.'
    case 'waiting_customer':
      return 'CS telah merespon, menunggu konfirmasi pelanggan.'
    case 'resolved':
      return 'Kendala pelanggan telah terselesaikan.'
    default:
      return 'Status percakapan bantuan.'
  }
}

export const formatRelativeTime = (isoString?: string | null): string => {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffSec < 60) return 'Baru saja'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}j`
    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 7) return `${diffDay}h`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

export const getInitials = (name?: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}
