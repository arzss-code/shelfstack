import { formatRupiah } from '~/utils/format'

export const formatInvoiceDate = (dateStr: string): string => {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export const formatInvoiceNumber = (orderId: string): string => {
  return `INV-${orderId.slice(0, 8).toUpperCase()}`
}

export const getInvoiceShippingServiceName = (service?: string | null): string => {
  const svc = (service || 'reguler').toLowerCase()
  switch (svc) {
    case 'express':
      return 'Kilat / Next Day'
    case 'instant':
      return 'Instan / Sameday'
    case 'cargo':
      return 'Kargo Ekonomis'
    case 'reguler':
    default:
      return 'Reguler'
  }
}

export const getInvoiceShippingFeeDisplay = (costCents?: number | null): string => {
  const cost = costCents ?? 0
  if (cost === 0) return 'Gratis'
  return formatRupiah(cost / 100)
}
