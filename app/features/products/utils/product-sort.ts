import type { Product } from '~/types/product'

export type SortKey = 'name' | 'price' | 'stock'
export type SortDir = 'asc' | 'desc'

function nameOf(p: Product | null | undefined): string {
  const name = (p as { name?: unknown } | null | undefined)?.name
  return typeof name === 'string' ? name : ''
}

function priceOf(p: Product | null | undefined): number {
  if (!p) return 0
  const cents = (p as { price_cents?: unknown }).price_cents
  if (typeof cents === 'number' && Number.isFinite(cents)) return cents
  const price = (p as { price?: unknown }).price
  if (typeof price === 'number' && Number.isFinite(price)) return price * 100
  return 0
}

function stockOf(p: Product | null | undefined): number {
  const stock = (p as { stock?: unknown } | null | undefined)?.stock
  return typeof stock === 'number' && Number.isFinite(stock) ? stock : 0
}

export function sortProducts(
  list: readonly Product[] | null | undefined,
  key: SortKey,
  dir: SortDir = 'asc',
): Product[] {
  if (!Array.isArray(list) || list.length === 0) return []
  const factor = dir === 'desc' ? -1 : 1
  return [...list].sort((a, b) => {
    if (key === 'name') return nameOf(a).localeCompare(nameOf(b), 'id') * factor
    if (key === 'price') return (priceOf(a) - priceOf(b)) * factor
    return (stockOf(a) - stockOf(b)) * factor
  })
}
