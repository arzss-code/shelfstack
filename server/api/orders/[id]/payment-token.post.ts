import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { isMidtransDuplicateOrderError } from '../../../utils/midtrans'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  if (method !== 'POST') {
    return errorResponse(event, 'Metode HTTP tidak diizinkan', null, 405)
  }

  const { user } = await requireUser(event)
  const client = await serverSupabaseClient<Database>(event)
  const config = useRuntimeConfig(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    return errorResponse(event, 'ID pesanan diperlukan', null, 400)
  }

  // 1. Cek Feature Flag Midtrans Sandbox
  if (!config.public.enableMidtransSandbox) {
    return errorResponse(
      event,
      'Fitur pembayaran Midtrans Sandbox saat ini dinonaktifkan.',
      null,
      503,
    )
  }

  const serverKey = config.midtransServerKey
  if (!serverKey) {
    return errorResponse(
      event,
      'Konfigurasi Midtrans Server Key belum disetel di server.',
      null,
      500,
    )
  }

  // 2. Ambil data order
  const { data: order, error } = await client.from('orders').select('*').eq('id', id).single()

  if (error || !order) {
    return errorResponse(event, 'Pesanan tidak ditemukan', error, 404)
  }

  if (order.user_id !== user.id) {
    return errorResponse(event, 'Akses pesanan ditolak', null, 403)
  }

  if (order.status !== 'pending') {
    return errorResponse(
      event,
      `Pesanan tidak dapat dibayar karena statusnya sudah: ${order.status}`,
      null,
      400,
    )
  }

  // 3. Jika sudah punya snap_token tersimpan, gunakan kembali (idempotent)
  if (order.snap_token) {
    return successResponse('Token pembayaran Midtrans tersedia', {
      token: order.snap_token,
      order_id: order.id,
    })
  }

  // 4. Request token baru ke Midtrans Snap API
  // total_cents dikonversi ke Rupiah (total_cents / 100)
  const grossAmount = Math.max(1, Math.round(order.total_cents / 100))
  const address = (order.address as Record<string, unknown>) || {}

  const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64')
  const snapUrl = config.midtransApiUrl || 'https://app.sandbox.midtrans.com/snap/v1/transactions'

  const requestSnapToken = async (orderIdToUse: string) => {
    return await $fetch<{ token: string; redirect_url: string }>(snapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
      },
      body: {
        transaction_details: {
          order_id: orderIdToUse,
          gross_amount: grossAmount,
        },
        customer_details: {
          first_name: (address.name as string) || 'Pelanggan',
          phone: (address.phone as string) || '',
        },
      },
    })
  }

  let midtransResponse: { token: string; redirect_url: string }
  let activeOrderId = order.id

  try {
    try {
      midtransResponse = await requestSnapToken(activeOrderId)
    } catch (primaryErr: unknown) {
      if (isMidtransDuplicateOrderError(primaryErr)) {
        // Jika order_id sebelumnya sudah terdaftar di Midtrans sandbox/production
        // (misal percobaan ulang checkout atau reset DB), gunakan suffix percobaan unik
        activeOrderId = `${order.id}-R${Date.now().toString().slice(-6)}`
        midtransResponse = await requestSnapToken(activeOrderId)
      } else {
        throw primaryErr
      }
    }

    // 5. Simpan snap_token ke database secara defensif (non-blocking)
    // Kegagalan caching ke DB tidak boleh menggagalkan proses checkout jika token sudah berhasil dibuat oleh Midtrans
    try {
      const adminClient = serverSupabaseServiceRole<Database>(event)
      await adminClient
        .from('orders')
        .update({ snap_token: midtransResponse.token })
        .eq('id', order.id)
    } catch (dbErr: unknown) {
      console.warn(
        '[payment-token] Tidak dapat menyimpan snap_token ke DB (service role key mungkin belum disetel):',
        dbErr instanceof Error ? dbErr.message : dbErr,
      )
    }

    return successResponse('Token pembayaran Midtrans berhasil dibuat', {
      token: midtransResponse.token,
      redirect_url: midtransResponse.redirect_url,
      order_id: activeOrderId,
    })
  } catch (err: unknown) {
    console.error('[payment-token] Midtrans API communication error:', err)
    return errorResponse(
      event,
      'Layanan pembayaran sedang mengalami kendala. Silakan coba beberapa saat lagi.',
      null,
      502,
    )
  }
})
