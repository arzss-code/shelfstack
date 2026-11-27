import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { enrichRecentOrderActivityDevice } from '../../../utils/activity-log'
import type { OrderStatus } from '../../../../shared/constants/order-transitions'
import type { CourierCode } from '../../../../shared/schemas/shipping'

export default defineEventHandler(async (event) => {
  // Hanya administrator yang dapat memperbarui status pesanan secara manual
  await requireAdmin(event)

  const orderId = getRouterParam(event, 'id')
  if (!orderId) {
    return errorResponse(event, 'ID pesanan tidak valid', null, 400)
  }

  const body = await readBody(event)
  const targetStatus = body?.status as OrderStatus
  const reason = (body?.reason as string) || ''

  if (!targetStatus) {
    return errorResponse(event, 'Status target wajib disertakan', null, 400)
  }

  const validStatuses: OrderStatus[] = [
    'pending',
    'paid',
    'shipped',
    'completed',
    'cancelled',
    'refunded',
  ]
  if (!validStatuses.includes(targetStatus)) {
    return errorResponse(event, `Status target tidak valid: ${targetStatus}`, null, 400)
  }

  // Task 07.4: Jalur admin terisolasi menggunakan service role setelah otorisasi requireAdmin lulus
  const client = serverSupabaseServiceRole<Database>(event)

  // Eksekusi transisi status atomik via database RPC transition_order_status
  // RPC mengunci baris order dengan FOR UPDATE untuk mencegah TOCTOU race conditions
  const { data, error: rpcError } = await client.rpc('transition_order_status', {
    p_order_id: orderId,
    p_target_status: targetStatus,
    p_reason: reason || undefined,
  })

  if (rpcError) {
    const errorMsg = rpcError.message || 'Gagal memperbarui status pesanan'

    if (errorMsg.includes('ORDER_NOT_FOUND')) {
      return errorResponse(event, 'Pesanan tidak ditemukan', rpcError, 404)
    }

    if (errorMsg.includes('FORBIDDEN_NOT_ADMIN')) {
      return errorResponse(event, 'Akses ditolak. Hanya admin.', rpcError, 403)
    }

    if (
      errorMsg.includes('INVALID_ORDER_TRANSITION') ||
      errorMsg.includes('ADMIN_PAYMENT_OVERRIDE_DISABLED') ||
      errorMsg.includes('DIRECT_STATUS_MUTATION_FORBIDDEN') ||
      errorMsg.includes('TERMINAL_ORDER_STATE') ||
      errorMsg.includes('REFUND_PENDING_CONFLICT')
    ) {
      return errorResponse(event, errorMsg, rpcError, 409)
    }

    return errorResponse(event, errorMsg, rpcError, 500)
  }

  const result = data as {
    order_id: string
    current_status: string
    previous_status: string
    no_op: boolean
    message: string
  }

  await enrichRecentOrderActivityDevice(event, orderId, client)

  // Buat notifikasi otomatis dan kelola checkpoint pengiriman ke pelanggan saat status berubah
  if (!result.no_op && result.current_status !== result.previous_status) {
    const { data: orderData } = await client
      .from('orders')
      .select('user_id, address, tracking_number, courier_name, courier_code')
      .eq('id', orderId)
      .maybeSingle()

    if (orderData?.user_id) {
      let notifTitle = 'Pembaruan Pesanan'
      let notifMessage = `Status pesanan ${orderId} telah diperbarui menjadi ${result.current_status}.`
      let notifType: 'order_shipped' | 'order_completed' | 'order_cancelled' | 'system' = 'system'

      if (result.current_status === 'shipped') {
        const courierCode = (body?.courier_code as CourierCode) || 'jne'
        const courierName = (body?.courier_name as string) || 'JNE Express'
        const trackingNumber =
          (body?.tracking_number as string)?.trim() || generateTrackingNumber(courierCode)
        const shippedAt = new Date().toISOString()

        // 1. Simpan data resi dan kurir ke tabel orders
        const { error: trackingUpdateError } = await client
          .from('orders')
          .update({
            tracking_number: trackingNumber,
            courier_code: courierCode,
            courier_name: courierName,
            shipped_at: shippedAt,
          })
          .eq('id', orderId)

        if (trackingUpdateError) {
          console.error(
            '[Admin Fulfillment] Gagal memperbarui resi pengiriman:',
            trackingUpdateError,
          )
        }

        // 2. Generate initial checkpoints ekspedisi
        const destinationCity =
          (orderData.address as { city?: string } | null)?.city || 'Kota Tujuan'
        const initialCheckpoints = buildInitialShippingCheckpoints(
          orderId,
          trackingNumber,
          courierName,
          destinationCity,
        )

        try {
          await client.from('shipping_checkpoints').insert(initialCheckpoints)
        } catch (err: unknown) {
          logger.warn(
            'Gagal mencatat checkpoint pengiriman awal',
            {},
            err instanceof Error ? err.message : String(err),
          )
        }

        notifTitle = 'Pesanan Sedang Dikirim'
        notifMessage = `Pesanan Anda telah diserahkan ke kurir ${courierName} dengan no resi ${trackingNumber}. Paket sedang dalam perjalanan.`
        notifType = 'order_shipped'

        // Kirim email notifikasi pesanan dikirim (order_shipped) secara fail-open
        void dispatchOrderTransactionalEmail(client, orderId, 'order_shipped')
      } else if (result.current_status === 'completed') {
        const deliveredAt = new Date().toISOString()

        // 1. Catat timestamp delivered_at di tabel orders
        await client.from('orders').update({ delivered_at: deliveredAt }).eq('id', orderId)

        // 2. Generate checkpoint delivered jika pesanan memiliki resi
        const activeTrackingNumber = orderData.tracking_number || (body?.tracking_number as string)
        if (activeTrackingNumber) {
          const parsedAddress = orderData.address as { name?: string; city?: string } | null
          const recipientName = parsedAddress?.name || 'Penerima'
          const destinationCity = parsedAddress?.city || 'Kota Tujuan'
          const deliveredCheckpoints = buildDeliveredShippingCheckpoints(
            orderId,
            activeTrackingNumber,
            recipientName,
            destinationCity,
          )

          try {
            await client.from('shipping_checkpoints').insert(deliveredCheckpoints)
          } catch (err: unknown) {
            logger.warn(
              'Gagal mencatat checkpoint delivered',
              {},
              err instanceof Error ? err.message : String(err),
            )
          }
        }

        notifTitle = 'Pesanan Telah Selesai'
        notifMessage = `Pesanan ${orderId} telah selesai dan paket berhasil diterima. Terima kasih telah berbelanja di ShelfStack!`
        notifType = 'order_completed'
      } else if (result.current_status === 'cancelled') {
        notifTitle = 'Pesanan Dibatalkan'
        notifMessage = `Pesanan ${orderId} telah dibatalkan.${reason ? ` Alasan: ${reason}` : ''}`
        notifType = 'order_cancelled'
      }

      await createNotification(client, {
        user_id: orderData.user_id,
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        reference_id: orderId,
        reference_url: `/orders/${orderId}`,
      }).catch((err) => {
        logger.warn('Gagal membuat notifikasi transisi status order', {}, err)
      })
    }
  }

  return successResponse(
    result.message || `Status pesanan berhasil diperbarui menjadi ${targetStatus}`,
    {
      order_id: orderId,
      status: result.current_status,
      previous_status: result.previous_status,
      no_op: result.no_op,
    },
  )
})
