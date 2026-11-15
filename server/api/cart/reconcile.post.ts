import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import {
  cartReconcileRequestSchema,
  type ReconciledItemResult,
} from '~~/shared/schemas/cart-reconcile'
import { getActiveFlashSaleCampaign } from '../../utils/flash-sale'
import { successResponse, errorResponse } from '../../utils/response'

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

  // Ambil data produk fisik dari database
  const { data: products, error } = await client
    .from('products')
    .select('id, name, price_cents, stock, deleted_at')
    .in('id', productIds)

  if (error) {
    return errorResponse(event, 'Gagal mengambil data produk terbaru', error, 500)
  }

  // Ambil kampanye flash sale aktif untuk validasi harga diskon yang sah
  const flashCampaign = await getActiveFlashSaleCampaign(client).catch(() => null)
  const flashDealsMap = new Map(
    (flashCampaign?.items || [])
      .filter((deal) => deal.is_active && deal.claimed < deal.quota)
      .map((deal) => [deal.product_id, deal]),
  )

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
    const basePriceCents = p.price_cents ?? 0
    const activeFlashDeal = flashDealsMap.get(item.productId)

    // Jika produk terdaftar dalam Flash Sale aktif, harga resmi adalah harga promo
    const currentPriceCents = activeFlashDeal ? activeFlashDeal.promo_price_cents : basePriceCents

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
      if (activeFlashDeal) {
        warnings.push(`Harga ${p.name} disesuaikan dengan diskon Flash Sale aktif.`)
      } else {
        warnings.push(`Harga ${p.name} telah kembali ke harga normal.`)
      }
    }
  }

  const hasDrift = reconciledItems.some(
    (i) => i.priceChanged || i.stockReduced || i.isOutOfStock || i.isUnavailable,
  )
  const hasOutOfStockItems = reconciledItems.some((i) => i.isOutOfStock || i.isUnavailable)

  return successResponse('Rekonsiliasi keranjang belanja berhasil', {
    hasDrift,
    items: reconciledItems,
    warnings,
    hasOutOfStockItems,
  })
})
