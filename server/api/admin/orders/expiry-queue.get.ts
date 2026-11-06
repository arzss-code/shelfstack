import { fetchOrderExpiryQueueTelemetry } from '../../../utils/order-service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const telemetry = await fetchOrderExpiryQueueTelemetry(event.context?.requestId)
  return successResponse('Telemetri antrean kedaluwarsa pesanan berhasil dimuat', telemetry)
})
