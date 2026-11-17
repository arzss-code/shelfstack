import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import {
  type FlashDealItem,
  type FlashSaleCampaign,
  calculateDiscountPrice,
} from '../../shared/schemas/flash-deals'

/**
 * Menghitung batas waktu aktif kampanye flash sale harian.
 */
export function getFlashSaleTimeWindow(): { startsAt: string; endsAt: string; isActive: boolean } {
  const now = new Date()

  const startsAtDate = new Date(now)
  startsAtDate.setHours(0, 0, 0, 0)

  const endsAtDate = new Date(now)
  endsAtDate.setHours(23, 59, 59, 999)

  const startsAt = startsAtDate.toISOString()
  const endsAt = endsAtDate.toISOString()
  const isActive = now >= startsAtDate && now <= endsAtDate

  return { startsAt, endsAt, isActive }
}

/**
 * Menghasilkan persentase diskon promo deterministik antara 15% sampai 35%.
 */
export function calculateDeterministicDiscount(productId: number, index = 0): number {
  return 15 + ((productId * 7 + index * 5) % 21)
}

/**
 * Membangun representasi FlashDealItem dari data produk.
 */
export function buildFlashDealItem(
  p: {
    id: number
    name: string
    slug?: string | null
    price?: number | null
    price_cents?: number | null
    stock?: number | null
    image_url?: string | null
    sold_count?: number | null
  },
  index = 0,
): FlashDealItem {
  const { startsAt, endsAt, isActive } = getFlashSaleTimeWindow()
  const originalPriceCents = p.price_cents || Math.round(Number(p.price || 0) * 100)
  const discountPercentage = calculateDeterministicDiscount(p.id, index)
  const promoPriceCents = calculateDiscountPrice(originalPriceCents, discountPercentage)
  const stock = Math.max(0, p.stock || 0)
  const quota = Math.min(25, Math.max(5, stock))
  const claimed = Math.min(quota - 1, Math.max(2, ((p.sold_count || 5) * 3 + index * 4) % quota))

  return {
    product_id: p.id,
    product_slug: p.slug || String(p.id),
    product_name: p.name,
    image_url: p.image_url || null,
    original_price_cents: originalPriceCents,
    promo_price_cents: promoPriceCents,
    discount_percentage: discountPercentage,
    quota,
    claimed,
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: isActive && claimed < quota,
  }
}

/**
 * Mengambil kampanye flash sale aktif untuk ditampilkan di beranda dan PDP.
 */
export async function getActiveFlashSaleCampaign(
  client: SupabaseClient<Database>,
): Promise<FlashSaleCampaign> {
  const { startsAt, endsAt, isActive } = getFlashSaleTimeWindow()
  const nowIso = new Date().toISOString()

  // 1. Ambil dari tabel fisik public.flash_deals terlebih dahulu (Authoritative DB Deals)
  try {
    const { data: dbDeals } = await client
      .from('flash_deals')
      .select(
        'id, product_id, promo_price_cents, discount_percentage, quota, claimed, starts_at, ends_at, is_active, products(id, name, slug, price, price_cents, stock, image_url)',
      )
      .eq('is_active', true)
      .lte('starts_at', nowIso)
      .gte('ends_at', nowIso)

    if (dbDeals && dbDeals.length > 0) {
      const items: FlashDealItem[] = dbDeals.map((deal) => {
        const p = deal.products as unknown as {
          id: number
          name: string
          slug?: string | null
          price?: number | null
          price_cents?: number | null
          stock?: number | null
          image_url?: string | null
        } | null
        const originalPrice = p?.price_cents || Math.round(Number(p?.price || 0) * 100)
        return {
          product_id: deal.product_id,
          product_slug: p?.slug || String(deal.product_id),
          product_name: p?.name || 'Produk Flash Sale',
          image_url: p?.image_url || null,
          original_price_cents: originalPrice,
          promo_price_cents: deal.promo_price_cents,
          discount_percentage: deal.discount_percentage,
          quota: deal.quota,
          claimed: deal.claimed,
          starts_at: deal.starts_at,
          ends_at: deal.ends_at,
          is_active: deal.is_active && deal.claimed < deal.quota,
        }
      })

      const campaignDate = startsAt.slice(0, 10)
      return {
        id: `flash-sale-${campaignDate}`,
        title: 'Flash Sale Hari Ini',
        tagline: 'Koleksi kurasi eksklusif dengan harga promo terbatas. Stok diperbarui otomatis.',
        ends_at: endsAt,
        is_active: isActive && items.length > 0,
        items,
      }
    }
  } catch {
    // Fail-safe: jika query tabel gagal, kembalikan kampanye non-aktif tanpa promo sintetis
  }

  // Jika tidak ada promo flash sale aktif di database, jangan buat diskon sintetis (Audit 3.2)
  const campaignDate = startsAt.slice(0, 10)
  return {
    id: `flash-sale-${campaignDate}`,
    title: 'Flash Sale Hari Ini',
    tagline: 'Koleksi kurasi eksklusif dengan harga promo terbatas. Stok diperbarui otomatis.',
    ends_at: endsAt,
    is_active: false,
    items: [],
  }
}

/**
 * Mencari tahu apakah produk tertentu sedang dalam flash sale aktif.
 * Mengembalikan harga promo yang sah jika ada, atau null jika harga normal.
 */
export async function resolveProductPromoPrice(
  client: SupabaseClient<Database>,
  productId: number,
): Promise<{ isPromo: boolean; promoPriceCents: number | null; deal: FlashDealItem | null }> {
  try {
    const campaign = await getActiveFlashSaleCampaign(client)
    const deal = campaign.items.find((item) => item.product_id === productId)

    if (deal && deal.is_active && deal.claimed < deal.quota) {
      return {
        isPromo: true,
        promoPriceCents: deal.promo_price_cents,
        deal,
      }
    }
  } catch {
    // Fail-open: jika gagal memeriksa promo, gunakan harga normal
  }

  return {
    isPromo: false,
    promoPriceCents: null,
    deal: null,
  }
}
