import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import {
  type FlashDealItem,
  type FlashSaleCampaign,
  calculateDiscountPrice,
} from '../../../shared/schemas/flash-deals'
import { successResponse, errorResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient<Database>(event)

    // Tentukan waktu akhir flash sale hari ini (pukul 23:59:59 WIB)
    const endsAtDate = new Date()
    endsAtDate.setHours(23, 59, 59, 999)
    const endsAt = endsAtDate.toISOString()

    const startsAtDate = new Date()
    startsAtDate.setHours(0, 0, 0, 0)
    const startsAt = startsAtDate.toISOString()

    // Ambil produk aktif yang tersedia untuk kampanye Flash Sale
    const { data: products, error } = await client
      .from('products')
      .select('id, name, slug, price, price_cents, stock, image_url, is_featured, sold_count')
      .is('deleted_at', null)
      .gt('stock', 0)
      .order('is_featured', { ascending: false })
      .order('sold_count', { ascending: false })
      .limit(6)

    if (error) {
      return errorResponse(event, 'Gagal mengambil data produk promo', error, 500)
    }

    const items: FlashDealItem[] = (products || []).map((p, index) => {
      const originalPriceCents = p.price_cents || Math.round(Number(p.price || 0) * 100)
      // Diskon deterministik antara 15% hingga 35%
      const discountPercentage = 15 + ((p.id * 7 + index * 5) % 21)
      const promoPriceCents = calculateDiscountPrice(originalPriceCents, discountPercentage)
      const quota = Math.min(25, Math.max(5, p.stock))
      const claimed = Math.min(
        quota - 1,
        Math.max(2, ((p.sold_count || 5) * 3 + index * 4) % quota),
      )

      return {
        product_id: p.id,
        product_slug: p.slug || String(p.id),
        product_name: p.name,
        image_url: p.image_url,
        original_price_cents: originalPriceCents,
        promo_price_cents: promoPriceCents,
        discount_percentage: discountPercentage,
        quota,
        claimed,
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: true,
      }
    })

    const campaign: FlashSaleCampaign = {
      id: `flash-sale-${startsAtDate.toISOString().slice(0, 10)}`,
      title: 'Flash Sale Hari Ini',
      tagline: 'Koleksi kurasi eksklusif dengan harga promo terbatas. Stok diperbarui otomatis.',
      ends_at: endsAt,
      is_active: true,
      items,
    }

    return successResponse('Data promo flash sale berhasil dimuat', campaign)
  } catch (err: unknown) {
    return errorResponse(
      event,
      'Terjadi kesalahan saat memproses promo flash sale',
      err instanceof Error ? err.message : String(err),
      500,
    )
  }
})
