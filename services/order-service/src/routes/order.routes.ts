import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { config } from '../config.js'
import { processPaymentWebhook } from '../services/supabase.service.js'
import { mapMidtransStatus, verifyMidtransSignature } from '../utils/midtrans.js'

export const webhookPayloadSchema = z.object({
  order_id: z.string().min(1, 'order_id wajib diisi'),
  status_code: z.string().min(1, 'status_code wajib diisi'),
  gross_amount: z.string().min(1, 'gross_amount wajib diisi'),
  signature_key: z.string().min(1, 'signature_key wajib diisi'),
  transaction_status: z.string().min(1, 'transaction_status wajib diisi'),
  fraud_status: z.string().nullable().optional(),
  payment_type: z.string().nullable().optional(),
  transaction_id: z.string().nullable().optional(),
})

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>

export const orderRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/api/v1/orders/webhook',
    {
      schema: {
        body: webhookPayloadSchema,
      },
    },
    async (request, reply) => {
      const payload = request.body as WebhookPayload

      // 1. Verifikasi Signature jika server key terkonfigurasi
      if (config.MIDTRANS_SERVER_KEY) {
        const isValid = verifyMidtransSignature({
          orderId: payload.order_id,
          statusCode: payload.status_code,
          grossAmount: payload.gross_amount,
          serverKey: config.MIDTRANS_SERVER_KEY,
          signatureKey: payload.signature_key,
        })

        if (!isValid) {
          return reply.status(403).send({
            status: 'error',
            message: 'Signature tidak valid. Akses webhook ditolak.',
            data: null,
            errors: null,
          })
        }
      }

      // 2. Map Midtrans Status ke Order Status
      const targetStatus = mapMidtransStatus(payload.transaction_status, payload.fraud_status)

      // 3. Proses update order secara atomik di database
      try {
        const result = await processPaymentWebhook({
          orderId: payload.order_id,
          targetStatus,
          paymentType: payload.payment_type,
          midtransId: payload.transaction_id,
        })

        return reply.status(200).send({
          status: 'success',
          message: 'Status pesanan berhasil diproses',
          data: result,
        })
      } catch (error: any) {
        request.log.error({ err: error }, 'Failed to process payment webhook')
        return reply.status(500).send({
          status: 'error',
          message: error.message || 'Gagal memproses status pembayaran',
          data: null,
          errors: null,
        })
      }
    },
  )

  // 4. Endpoint worker untuk membatalkan pesanan kedaluwarsa & restock otomatis
  app.post(
    '/api/v1/orders/sweep-expiry',
    {
      schema: {
        body: z
          .object({
            expiry_minutes: z.number().min(1).default(30),
          })
          .optional(),
      },
    },
    async (request, reply) => {
      const body = (request.body as { expiry_minutes?: number } | undefined) || {}
      const expiryMinutes = body.expiry_minutes ?? 30

      try {
        const { OrderExpiryWorker } = await import('../workers/order-expiry.worker.js')
        const sweepResult = await OrderExpiryWorker.sweepExpiredOrders(expiryMinutes)

        return reply.status(200).send({
          status: 'success',
          message: 'Pemeriksaan pesanan kedaluwarsa selesai',
          data: sweepResult,
        })
      } catch (error: any) {
        request.log.error({ err: error }, 'Failed to sweep expired orders')
        return reply.status(500).send({
          status: 'error',
          message: error.message || 'Gagal memeriksa pesanan kedaluwarsa',
          data: null,
          errors: null,
        })
      }
    },
  )

  // 5. Endpoint invalidasi cache katalog (O(1) version tag increment)
  app.post('/api/v1/orders/invalidate-cache', async (_request, reply) => {
    try {
      const { CacheService } = await import('../cache/redis.client.js')
      await CacheService.invalidateCatalog()

      return reply.status(200).send({
        status: 'success',
        message: 'Cache katalog berhasil di-invalidasi',
        data: null,
      })
    } catch (error: any) {
      return reply.status(500).send({
        status: 'error',
        message: error.message || 'Gagal menginvalidasi cache katalog',
        data: null,
        errors: null,
      })
    }
  })
}
