import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import {
  cartReconcileRequestSchema,
  type ReconciledItemResult,
} from '~~/shared/schemas/cart-reconcile'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const parsed = cartReconcileRequestSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse(
      event,
      'Validasi permintaan rekonsiliasi keranjang gagal',
      parsed.error.issues,
      400,
    )
  }

  const { items } = parsed.data
  if (items.length === 0) {
    return successResponse('Keranjang kosong, tidak ada rekonsiliasi yang diperlukan', {
      hasDrift: false,
      items: [],
      warnings: [],
      hasOutOfStockItems: false,
    })
  }

  const client = await serverSupabaseClient<Database>(event)
  const productIds = Array.from(new Set(items.map((i) => i.productId)))

  const { data: products, error } = await client
    .from('products')
    .select('id, name, price_cents, stock, deleted_at')
    .in('id', productIds)

  if (error) {
    return errorResponse(event, 'Gagal mengambil data produk terbaru', error, 500)
  }

  const productMap = new Map((products || []).map((p) => [p.id, p]))
  const reconciledItems: ReconciledItemResult[] = []
  const warnings: string[] = []

  for (const item of items) {
    const p = productMap.get(item.productId)

    if (!p || p.deleted_at !== null) {
      reconciledItems.push({
        productId: item.productId,
        variantId: item.variantId,
        name: p?.name || `Produk #${item.productId}`,
        requestedQuantity: item.quantity,
        currentStock: 0,
        adjustedQuantity: 0,
        currentPriceCents: p?.price_cents ?? item.priceCents ?? 0,
        previousPriceCents: item.priceCents,
        priceChanged: false,
        stockReduced: true,
        isOutOfStock: true,
        isUnavailable: true,
      })
      warnings.push(`Produk ${p?.name || `#${item.productId}`} sudah tidak tersedia di etalase.`)
      continue
    }

    const currentStock = Math.max(0, p.stock ?? 0)
    const currentPriceCents = p.price_cents ?? item.priceCents ?? 0
    const isOutOfStock = currentStock === 0
    const stockReduced = currentStock < item.quantity
    const adjustedQuantity = isOutOfStock ? 0 : Math.min(item.quantity, currentStock)
    const priceChanged = Boolean(
      item.priceCents !== undefined && item.priceCents !== currentPriceCents,
    )

    reconciledItems.push({
      productId: item.productId,
      variantId: item.variantId,
      name: p.name,
      requestedQuantity: item.quantity,
      currentStock,
      adjustedQuantity,
      currentPriceCents,
      previousPriceCents: item.priceCents,
      priceChanged,
      stockReduced,
      isOutOfStock,
      isUnavailable: false,
    })

    if (isOutOfStock) {
      warnings.push(`Stok ${p.name} telah habis.`)
    } else if (stockReduced) {
      warnings.push(
        `Stok ${p.name} tersisa ${currentStock} unit. Kuantitas keranjang telah disesuaikan.`,
      )
    }

    if (priceChanged) {
      const prevRp = item.priceCents
        ? Math.round(item.priceCents / 100).toLocaleString('id-ID')
        : '0'
      const currRp = Math.round(currentPriceCents / 100).toLocaleString('id-ID')
      warnings.push(`Harga ${p.name} berubah dari Rp ${prevRp} menjadi Rp ${currRp}.`)
    }
  }

  const hasDrift = warnings.length > 0
  const hasOutOfStockItems = reconciledItems.some((i) => i.isOutOfStock || i.isUnavailable)

  return successResponse('Rekonsiliasi keranjang berhasil', {
    hasDrift,
    items: reconciledItems,
    warnings,
    hasOutOfStockItems,
  })
})
