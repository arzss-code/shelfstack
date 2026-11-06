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
      return 'bg-sky-500'
    case 'waiting_admin':
      return 'bg-amber-500'
    case 'waiting_customer':
      return 'bg-blue-500'
    case 'resolved':
      return 'bg-emerald-500'
    default:
      return 'bg-gray-400'
  }
}

export const statusPillClass = (status: string): string => {
  switch (status) {
    case 'open':
      return 'bg-sky-50 text-sky-700 border border-sky-200'
    case 'waiting_admin':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'waiting_customer':
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'resolved':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
