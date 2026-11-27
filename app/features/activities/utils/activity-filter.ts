import type { ActivityLog } from '../composables/useActivities'
export type { ActivityLog }

export interface ActivityFilter {
  entity: string
  action: string
  search?: string
  fromDate?: string
  toDate?: string
}

export const NO_FILTER: ActivityFilter = {
  entity: '',
  action: '',
  search: '',
  fromDate: '',
  toDate: '',
}

export const ACTIVITY_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'RESTORE'] as const

const ENTITY_LABELS: Record<string, string> = {
  order: 'Pesanan',
  orders: 'Pesanan',
  product: 'Produk',
  products: 'Produk',
  product_variant: 'Varian Produk',
  return_request: 'Komplain & Retur',
  coupon: 'Kupon Promo',
  coupons: 'Kupon Promo',
  flash_deal: 'Flash Sale',
  flash_deals: 'Flash Sale',
  category: 'Kategori',
  categories: 'Kategori',
  user: 'Pelanggan',
  users: 'Pelanggan',
  system: 'Sistem',
}

export function formatActivityEntityLabel(entityType: string): string {
  const key = entityType.trim().toLowerCase()
  if (ENTITY_LABELS[key]) return ENTITY_LABELS[key]
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatActivityIp(ipAddress: string | null | undefined): string {
  const cleaned = ipAddress?.trim()
  if (!cleaned || cleaned === '-' || cleaned === 'Unknown') return 'Sistem'
  return cleaned
}

export function formatActivityAgent(
  browser: string | null | undefined,
  platform: string | null | undefined,
): string {
  const ignore = new Set(['', '-', 'Unknown', 'Tidak tercatat', 'Tidak dikenal'])
  const cleanBrowser = browser?.trim() || ''
  const cleanPlatform = platform?.trim() || ''
  const validBrowser = !ignore.has(cleanBrowser) ? cleanBrowser : ''
  const validPlatform = !ignore.has(cleanPlatform) ? cleanPlatform : ''

  if (validBrowser && validPlatform) return `${validBrowser} · ${validPlatform}`
  if (validBrowser) return validBrowser
  if (validPlatform) return validPlatform
  return 'Sistem Otomatis'
}

export function distinctEntityTypes(logs: ActivityLog[]): string[] {
  const seen = new Set<string>()
  for (const log of logs) {
    if (log.entity_type) {
      seen.add(log.entity_type)
    }
  }
  return [...seen].sort()
}

function toLocalDateKey(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function filterActivities(logs: ActivityLog[], filter: ActivityFilter): ActivityLog[] {
  const search = filter.search?.trim().toLowerCase() || ''
  const fromDate = filter.fromDate?.trim() || ''
  const toDate = filter.toDate?.trim() || ''

  return logs.filter((log) => {
    if (filter.entity && log.entity_type !== filter.entity) return false
    if (filter.action && log.action !== filter.action) return false

    if (fromDate || toDate) {
      const dateKey = toLocalDateKey(log.created_at)
      if (!dateKey) return false
      if (fromDate && dateKey < fromDate) return false
      if (toDate && dateKey > toDate) return false
    }

    if (search) {
      const haystack = [
        log.description,
        log.entity_type,
        formatActivityEntityLabel(log.entity_type),
        log.ip_address || '',
        log.browser || '',
        log.platform || '',
        log.new_data ? JSON.stringify(log.new_data) : '',
        log.old_data ? JSON.stringify(log.old_data) : '',
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }

    return true
  })
}

export function isFiltering(filter: ActivityFilter): boolean {
  return Boolean(
    filter.entity !== '' ||
    filter.action !== '' ||
    filter.search?.trim() ||
    filter.fromDate?.trim() ||
    filter.toDate?.trim(),
  )
}
