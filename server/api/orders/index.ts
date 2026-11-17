import { defineEventHandler, getHeader, getMethod, getQuery, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { checkoutSchema } from '../../../shared/schemas/order'
import { calculateCheckoutHash, validateIdempotencyKey } from '../../utils/idempotency'
import { logger } from '../../utils/logger'
import { enqueueOrderExpiryNotification } from '../../utils/order-service'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const client = await serverSupabaseClient<Database>(event)

  // Autentikasi wajib untuk semua operasi order pelanggan
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  if (method === 'GET') {
    const query = getQuery(event)
    const from = query.from ? Math.max(0, parseInt(query.from as string, 10)) : 0
    const to = query.to ? Math.max(from, parseInt(query.to as string, 10)) : from + 4
    const status = query.status as string | undefined

    let dbQuery = client
      .from('orders')
      .select(
        `
        *,
        items:order_items (
          id,
          order_id,
          product_id,
          qty,
          price_cents,
          product:products (
            id,
            name,
            image_url
          )
        ),
        checkpoints:shipping_checkpoints (
          id,
          status,
          title,
          description,
          location,
          created_at
        )
      `,
      )
      .eq('user_id', targetUserId)

    if (status && status !== 'all') {
      dbQuery = dbQuery.eq('status', status as Database['public']['Enums']['order_status'])
    }

    const { data, error } = await dbQuery.order('created_at', { ascending: false }).range(from, to)

    if (error) {
      return errorResponse(event, 'Gagal memuat riwayat pesanan', error, 500)
    }

    // Ambil ringkasan jumlah status pesanan milik pengguna
    const { data: statusRows } = await client
      .from('orders')
      .select('status')
      .eq('user_id', targetUserId)

    const counts = {
      all: statusRows?.length || 0,
      pending: statusRows?.filter((o) => o.status === 'pending').length || 0,
      paid: statusRows?.filter((o) => o.status === 'paid').length || 0,
      shipped: statusRows?.filter((o) => o.status === 'shipped').length || 0,
      completed: statusRows?.filter((o) => o.status === 'completed').length || 0,
      cancelled: statusRows?.filter((o) => o.status === 'cancelled').length || 0,
    }

    const requestedLimit = to - from + 1
    const hasMore = (data?.length || 0) === requestedLimit

    return successResponse('Riwayat pesanan berhasil dimuat', {
      orders: data || [],
      counts,
      has_more: hasMore,
    })
  }

  if (method === 'POST') {
    // 1. Validasi Header Idempotency-Key (Optional untuk backward compatibility)
    const rawIdempotencyKey = getHeader(event, 'idempotency-key')
    const keyValidation = validateIdempotencyKey(rawIdempotencyKey)

    if (!keyValidation.isValid) {
      return errorResponse(event, keyValidation.error || 'Idempotency-Key tidak valid', null, 400)
    }

    const idempotencyKey = keyValidation.key

    // 2. Validasi Payload Checkout
    const body = await readBody(event)
    const parsed = checkoutSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(
        event,
        'Validasi data pesanan gagal',
        parsed.error.flatten().fieldErrors,
        400,
      )
    }

    // 3. Hitung Request Hash Deterministik jika Idempotency-Key disediakan
    const requestHash = idempotencyKey ? calculateCheckoutHash(parsed.data) : null

    // 4. Panggil RPC create_order yang atomik di Postgres (Security Definer)
    let { data: orderId, error } = await client.rpc('create_order', {
      p_items: parsed.data.items,
      p_address: parsed.data.address,
      p_idempotency_key: idempotencyKey,
      p_request_hash: requestHash,
      p_coupon_code: parsed.data.coupon_code || null,
      p_shipping_service: parsed.data.shipping_service || 'reguler',
      p_courier_code: parsed.data.courier_code || null,
      p_coins_used: parsed.data.coins_used || 0,
    })

    // Fallback kompatibilitas jika RPC signature 7-parameter belum tersedia di schema cache (PGRST202)
    if (error && (error.code === 'PGRST202' || error.message?.includes('schema cache'))) {
      logger.warn(
        `[Checkout] RPC create_order signature 7-parameter tidak ditemukan di schema cache (PGRST202). Melakukan fallback ke signature 5-parameter.`,
        { requestId: event.context?.requestId, error: error.message },
      )
      const legacyRpc = await client.rpc('create_order', {
        p_items: parsed.data.items,
        p_address: parsed.data.address,
        p_idempotency_key: idempotencyKey,
        p_request_hash: requestHash,
        p_coupon_code: parsed.data.coupon_code || null,
      })
      orderId = legacyRpc.data
      error = legacyRpc.error
    }

    if (error) {
      if (error.message?.includes('IDEMPOTENCY_CONFLICT')) {
        logger.warn(`[Checkout] Idempotency conflict for key "${idempotencyKey}"`, {
          requestId: event.context?.requestId,
          idempotencyKey,
          userId: targetUserId,
        })
        return errorResponse(
          event,
          error.message,
          { code: 'IDEMPOTENCY_CONFLICT', idempotency_key: idempotencyKey },
          409,
        )
      }

      return errorResponse(
        event,
        error.message || 'Gagal memproses pesanan di database',
        error,
        400,
      )
    }

    if (idempotencyKey) {
      logger.info(`[Checkout] Order ${orderId} processed with Idempotency-Key: ${idempotencyKey}`, {
        requestId: event.context?.requestId,
        orderId,
        idempotencyKey,
        userId: targetUserId,
      })
    }

    // Jadwalkan job kedaluwarsa pesanan di BullMQ (@shelfstack/order-service) secara fail-open
    void enqueueOrderExpiryNotification(String(orderId), event.context?.requestId)

    // Kirim notifikasi email konfirmasi pesanan (order_placed) secara fail-open
    void dispatchOrderTransactionalEmail(client, String(orderId), 'order_placed', {
      customerEmail: user.email,
    })

    // Buat notifikasi otomatis pesanan dibuat
    await createNotification(client, {
      user_id: targetUserId,
      title: 'Pesanan Berhasil Dibuat',
      message: `Pesanan ${orderId} telah dibuat. Silakan selesaikan pembayaran.`,
      type: 'order_created',
      reference_id: String(orderId),
      reference_url: `/orders/${orderId}`,
    }).catch((err) => {
      logger.warn('Gagal membuat notifikasi order_created', {}, err)
    })

    let orderSummary: Record<string, unknown> | null = null
    try {
      const { data: fetchedSummary } = await client
        .from('orders')
        .select(
          'id, total_cents, subtotal_cents, discount_cents, coupon_code, coins_used, coins_discount_cents, shipping_cost_cents, shipping_service',
        )
        .eq('id', String(orderId))
        .maybeSingle()
      if (fetchedSummary) orderSummary = fetchedSummary
    } catch {
      // Optional enrichment fallback for minimal unit test client mocks
    }

    return successResponse('Pesanan berhasil dibuat', {
      order_id: orderId,
      summary: orderSummary,
    })
  }

  return errorResponse(event, 'Metode HTTP tidak diizinkan', null, 405)
})
