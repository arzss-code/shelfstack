import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { successResponse, errorResponse } from '../../utils/response'
import {
  CURATED_PRODUCTS,
  CURATED_VARIANTS,
  DEMO_REVIEWERS,
  CURATED_REVIEWS,
} from '../../utils/seed-catalog-data'

export default defineEventHandler(async (event) => {
  // Hanya izinkan dieksekusi di dev server atau lingkungan internal
  if (process.env.NODE_ENV === 'production' && !import.meta.dev) {
    return errorResponse(event, 'Forbidden in production', null, 403)
  }

  const client = serverSupabaseServiceRole<Database>(event)

  // 1. Ambil data kategori untuk mapping category_id secara dinamis
  const { data: dbCategories, error: catError } = await client.from('categories').select('id, slug')

  if (catError || !dbCategories) {
    return errorResponse(event, 'Gagal memuat data kategori', catError?.message, 500)
  }

  const categoryMap = new Map<string, string>()
  for (const cat of dbCategories) {
    categoryMap.set(cat.slug, cat.id)
  }

  // 2. Soft-delete dummy testing products (id 8, 10, 11, 12 dan nama-nama dummy)
  const dummyIds = [8, 10, 11, 12]
  const nowIso = new Date().toISOString()

  let deletedDummyCount = 0
  const deleteErrors: Record<string, string> = {}
  for (const dummyId of dummyIds) {
    const { error: delErr } = await client
      .from('products')
      .update({ deleted_at: nowIso })
      .eq('id', dummyId)
    if (!delErr) {
      deletedDummyCount++
    } else {
      deleteErrors[`id_${dummyId}`] = delErr.message
    }
  }

  const dummyNames = ['Tambah baru', 'test edit lagi', 'tambah edit', 'Produk baru lagi']
  for (const dummyName of dummyNames) {
    await client.from('products').update({ deleted_at: nowIso }).eq('name', dummyName)
  }

  // 3. Masukkan produk kurasi baru secara idempoten
  let insertedCount = 0
  let skippedCount = 0

  for (const item of CURATED_PRODUCTS) {
    const categoryId = categoryMap.get(item.categorySlug)
    if (!categoryId) {
      continue
    }

    // Periksa apakah produk aktif dengan nama yang sama sudah ada
    const { data: existing } = await client
      .from('products')
      .select('id')
      .eq('name', item.name)
      .is('deleted_at', null)
      .maybeSingle()

    if (existing) {
      await client
        .from('products')
        .update({
          image_url: item.image_url,
          gallery_urls: item.gallery_urls || [item.image_url],
          specs: item.specs as Database['public']['Tables']['products']['Row']['specs'],
          description: item.description,
          price: item.price,
          stock: item.stock,
          rating: item.rating,
          review_count: item.review_count,
        })
        .eq('id', existing.id)
      skippedCount++
      continue
    }

    const { error: insertError } = await client.from('products').insert({
      name: item.name,
      price: item.price,
      stock: item.stock,
      description: item.description,
      image_url: item.image_url,
      category_id: categoryId,
      weight_grams: item.weight_grams,
      specs: item.specs as Database['public']['Tables']['products']['Row']['specs'],
      gallery_urls: item.gallery_urls || [item.image_url],
      rating: item.rating,
      review_count: item.review_count,
      sold_count: item.sold_count,
      is_featured: item.is_featured,
    })

    if (insertError) {
      return errorResponse(event, `Gagal menambahkan produk ${item.name}`, insertError.message, 500)
    }

    insertedCount++
  }

  // 4. Seed varian produk dinamis (product_variants)
  let seededVariantsCount = 0
  for (const v of CURATED_VARIANTS) {
    const { data: prod } = await client
      .from('products')
      .select('id')
      .eq('name', v.productName)
      .is('deleted_at', null)
      .maybeSingle()

    if (!prod) continue

    const { error: varErr } = await client.from('product_variants').upsert(
      {
        product_id: prod.id,
        sku: v.sku,
        name: v.name,
        attributes: v.attributes,
        price_cents: v.price_cents,
        stock: v.stock,
        is_active: true,
        deleted_at: null,
      },
      { onConflict: 'sku' },
    )

    if (!varErr) {
      seededVariantsCount++
    }
  }

  // 5. Pastikan akun demo reviewer terdaftar di auth.users & profiles
  const validReviewerIds = new Set<string>()
  for (const rev of DEMO_REVIEWERS) {
    try {
      await client.auth.admin.createUser({
        email: rev.email,
        password: 'Password123!',
        email_confirm: true,
        user_metadata: { full_name: rev.fullName },
      })
    } catch {
      // Abaikan jika sudah ada
    }

    const { data: userProfile } = await client
      .from('profiles')
      .upsert(
        {
          user_id: rev.id,
          full_name: rev.fullName,
          role: 'customer',
        },
        { onConflict: 'user_id' },
      )
      .select('user_id')
      .maybeSingle()

    if (userProfile?.user_id) {
      validReviewerIds.add(userProfile.user_id)
    }
  }

  // 6. Seed ulasan terverifikasi dan pesanan selesai (product_reviews)
  let seededReviewsCount = 0
  const fallbackUserId = '00000000-0000-0000-0000-000000000001'

  for (const r of CURATED_REVIEWS) {
    const { data: prod } = await client
      .from('products')
      .select('id, price, price_cents')
      .eq('name', r.productName)
      .is('deleted_at', null)
      .maybeSingle()

    if (!prod) continue

    const reviewer = DEMO_REVIEWERS[r.reviewerIndex] || DEMO_REVIEWERS[0]
    const effectiveUserId =
      reviewer && validReviewerIds.has(reviewer.id) ? reviewer.id : fallbackUserId
    const reviewerName = reviewer ? reviewer.fullName : 'Pelanggan Terverifikasi'
    const itemPriceCents = prod.price_cents || prod.price * 100

    // Cari pesanan selesai yang sudah ada untuk user dan produk ini
    let targetOrderId: string | null = null
    const { data: existingItems } = await client
      .from('order_items')
      .select('order_id, orders!inner(id, user_id, status)')
      .eq('product_id', prod.id)
      .eq('orders.user_id', effectiveUserId)
      .eq('orders.status', 'completed')
      .limit(1)

    if (existingItems && existingItems.length > 0 && existingItems[0]?.order_id) {
      targetOrderId = existingItems[0].order_id
    } else {
      // Buat draft pesanan selesai terverifikasi untuk menaungi ulasan
      const { data: newOrder, error: orderErr } = await client
        .from('orders')
        .insert({
          user_id: effectiveUserId,
          total_cents: itemPriceCents,
          subtotal_cents: itemPriceCents,
          status: 'completed',
          address: {
            name: reviewerName,
            city: 'Jakarta Selatan',
            street: 'Kawasan Bisnis Sudirman No. 28',
          },
          payment_type: 'bank_transfer',
          shipping_service: 'reguler',
          paid_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          delivered_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        })
        .select('id')
        .single()

      if (!orderErr && newOrder) {
        targetOrderId = newOrder.id
        await client.from('order_items').insert({
          order_id: newOrder.id,
          product_id: prod.id,
          qty: 1,
          price_cents: itemPriceCents,
        })
      }
    }

    if (targetOrderId) {
      const { error: revErr } = await client.from('product_reviews').upsert(
        {
          product_id: prod.id,
          user_id: effectiveUserId,
          order_id: targetOrderId,
          rating: r.rating,
          review_text: r.reviewText,
          deleted_at: null,
        },
        { onConflict: 'product_id,user_id,order_id' },
      )

      if (!revErr) {
        seededReviewsCount++
      }
    }
  }

  return successResponse('Seeding produk kurasi, varian, dan ulasan berhasil', {
    insertedCount,
    skippedCount,
    deletedDummyCount,
    seededVariantsCount,
    seededReviewsCount,
    deleteErrors,
    totalCuratedList: CURATED_PRODUCTS.length,
  })
})
