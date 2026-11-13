import type { ShippingService } from '../schemas/shipping'

export interface DeliveryEtaResult {
  service: ShippingService
  minDays: number
  maxDays: number
  label: string
  arrivalRange: string
  badgeText: string
  etaDescription: string
}

const INDONESIA_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

const INDONESIA_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function addDays(base: Date, days: number): Date {
  const result = new Date(base.getTime())
  result.setDate(result.getDate() + days)
  return result
}

function formatShortDate(date: Date): string {
  const day = date.getDate()
  const month = INDONESIA_MONTHS_SHORT[date.getMonth()]
  return `${day} ${month}`
}

function formatFullDate(date: Date): string {
  const dayName = INDONESIA_DAYS[date.getDay()]
  const day = date.getDate()
  const month = INDONESIA_MONTHS_SHORT[date.getMonth()]
  return `${dayName}, ${day} ${month}`
}

/**
 * Menghitung estimasi waktu tiba (ETA) pengiriman berdasarkan tier layanan dan tanggal pesanan.
 * Menggunakan format tanggal Indonesia ringkas dan bebas em dash.
 */
export function calculateDeliveryEta(
  service?: ShippingService | string | null,
  orderDate: Date = new Date(),
): DeliveryEtaResult {
  const normalized = (service || '').trim().toLowerCase()

  let resolvedService: ShippingService
  let minDays: number
  let maxDays: number
  let label: string

  if (normalized === 'instant') {
    resolvedService = 'instant'
    minDays = 0
    maxDays = 0
    label = 'Tiba Hari Ini'
  } else if (normalized === 'express' || normalized === 'next_day') {
    resolvedService = 'express'
    minDays = 1
    maxDays = 1
    label = 'Tiba Besok (1 Hari)'
  } else if (normalized === 'cargo') {
    resolvedService = 'cargo'
    minDays = 4
    maxDays = 7
    label = '4 - 7 Hari Kerja'
  } else {
    resolvedService = 'reguler'
    minDays = 2
    maxDays = 3
    label = '2 - 3 Hari Kerja'
  }

  const minDate = addDays(orderDate, minDays)
  const maxDate = addDays(orderDate, maxDays)

  let arrivalRange: string
  let etaDescription: string

  if (minDays === 0 && maxDays === 0) {
    arrivalRange = `Hari Ini (${formatShortDate(minDate)})`
    etaDescription = `Estimasi tiba hari ini dalam 3 - 6 jam (${formatFullDate(minDate)})`
  } else if (minDays === maxDays) {
    arrivalRange = formatShortDate(minDate)
    etaDescription = `Estimasi tiba besok (${formatFullDate(minDate)})`
  } else {
    const minDay = minDate.getDate()
    const maxDay = maxDate.getDate()
    const minMonth = INDONESIA_MONTHS_SHORT[minDate.getMonth()]
    const maxMonth = INDONESIA_MONTHS_SHORT[maxDate.getMonth()]

    if (minMonth === maxMonth) {
      arrivalRange = `${minDay} - ${maxDay} ${minMonth}`
    } else {
      arrivalRange = `${minDay} ${minMonth} - ${maxDay} ${maxMonth}`
    }

    etaDescription = `Estimasi tiba antara ${formatFullDate(minDate)} - ${formatFullDate(maxDate)}`
  }

  const badgeText = `Tiba ${arrivalRange}`

  return {
    service: resolvedService,
    minDays,
    maxDays,
    label,
    arrivalRange,
    badgeText,
    etaDescription,
  }
}
