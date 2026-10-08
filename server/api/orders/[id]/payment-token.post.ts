import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

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
      const fetchErr = primaryErr as { data?: { error_messages?: string[] }; message?: string }
      const errorMessages = Array.isArray(fetchErr.data?.error_messages)
        ? fetchErr.data!.error_messages
        : []
      const isDuplicateOrderId =
        errorMessages.some((msg) => msg.includes('order_id sudah digunakan')) ||
        Boolean(fetchErr.message?.includes('order_id sudah digunakan'))

      if (isDuplicateOrderId) {
        // Jika order_id sebelumnya sudah terdaftar di Midtrans sandbox/production
        // (misal percobaan ulang checkout atau reset DB), gunakan suffix percobaan unik
        activeOrderId = `${order.id}-R${Date.now().toString().slice(-6)}`
        midtransResponse = await requestSnapToken(activeOrderId)
      } else {
        throw primaryErr
      }
    }

    // 5. Simpan snap_token ke database menggunakan Service Role
    // Memerlukan service role karena RLS orders membatasi update untuk user biasa
    const adminClient = serverSupabaseServiceRole<Database>(event)
    await adminClient
      .from('orders')
      .update({ snap_token: midtransResponse.token })
      .eq('id', order.id)

    return successResponse('Token pembayaran Midtrans berhasil dibuat', {
      token: midtransResponse.token,
      redirect_url: midtransResponse.redirect_url,
      order_id: activeOrderId,
    })
  } catch (err: unknown) {
    const fetchErr = err as { data?: unknown; message?: string }
    return errorResponse(
      event,
      fetchErr.message || 'Gagal berkomunikasi dengan Midtrans API',
      fetchErr.data,
      502,
    )
  }
})
