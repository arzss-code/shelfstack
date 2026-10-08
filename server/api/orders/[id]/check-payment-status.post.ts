import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { mapMidtransStatus } from '../../../utils/midtrans'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  if (method !== 'POST') {
    return errorResponse(event, 'Metode HTTP tidak diizinkan', null, 405)
  }

  const { user, profile } = await requireUser(event)
  const client = await serverSupabaseClient<Database>(event)
  const config = useRuntimeConfig(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    return errorResponse(event, 'ID pesanan diperlukan', null, 400)
  }

  // 1. Ambil data order dari database
  const { data: order, error } = await client.from('orders').select('*').eq('id', id).single()

  if (error || !order) {
    return errorResponse(event, 'Pesanan tidak ditemukan', error, 404)
  }

  // Otorisasi: hanya pemilik atau admin yang bisa mengakses
  if (order.user_id !== user.id && profile.role !== 'admin') {
    return errorResponse(event, 'Akses pesanan ditolak', null, 403)
  }

  // Jika pesanan sudah lunas atau dibatalkan, tidak perlu sinkronisasi ulang
  if (order.status !== 'pending') {
    return successResponse('Status pesanan sudah terverifikasi', {
      order_id: order.id,
      status: order.status,
      is_paid: order.status === 'paid',
    })
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

  // 2. Request status transaksi ke Midtrans Transaction Status API
  const baseUrl = config.public.enableMidtransSandbox
    ? 'https://api.sandbox.midtrans.com/v2'
    : 'https://api.midtrans.com/v2'

  const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64')

  try {
    let midtransData: any = null
    try {
      midtransData = await $fetch<any>(`${baseUrl}/${order.id}/status`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: authHeader,
        },
      })
    } catch (fetchErr: any) {
      console.warn(
        `[check-payment-status] Lookup Midtrans status untuk order ${order.id} menghasilkan respons:`,
        fetchErr?.data || fetchErr?.message,
      )
    }

    if (!midtransData || !midtransData.transaction_status) {
      return successResponse('Status pembayaran belum diperbarui oleh Payment Gateway', {
        order_id: order.id,
        status: order.status,
        is_paid: false,
      })
    }

    // 3. Map status dari Midtrans ke order_status resmi ShelfStack
    const targetStatus = mapMidtransStatus(
      midtransData.transaction_status,
      midtransData.fraud_status,
    )

    if (targetStatus !== order.status) {
      // 4. Update status menggunakan RPC atomik handle_payment_webhook (Security Definer)
      const { error: rpcErr } = await client.rpc('handle_payment_webhook', {
        p_order_id: order.id,
        p_target_status: targetStatus,
        p_payment_type: midtransData.payment_type || null,
        p_midtrans_id: midtransData.transaction_id || null,
      })

      if (rpcErr) {
        console.warn('[check-payment-status] RPC gagal, mencoba fallback service role:', rpcErr)
        try {
          const adminClient = serverSupabaseServiceRole<Database>(event)
          await adminClient
            .from('orders')
            .update({
              status: targetStatus,
              payment_type: midtransData.payment_type || null,
              midtrans_id: midtransData.transaction_id || null,
              paid_at: targetStatus === 'paid' ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)
        } catch (fallbackErr) {
          console.error('[check-payment-status] Fallback update juga gagal:', fallbackErr)
        }
      }
    }

    return successResponse('Pemeriksaan status pembayaran berhasil', {
      order_id: order.id,
      status: targetStatus,
      is_paid: targetStatus === 'paid',
      transaction_status: midtransData.transaction_status,
      payment_type: midtransData.payment_type,
    })
  } catch (err: unknown) {
    console.error('[check-payment-status] Error saat memeriksa status ke Midtrans:', err)
    return errorResponse(
      event,
      'Gagal memeriksa status pembayaran ke payment gateway. Silakan coba beberapa saat lagi.',
      null,
      502,
    )
  }
})
