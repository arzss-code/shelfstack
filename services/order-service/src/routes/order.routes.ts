import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { config } from '../config.js'
import {
  getOrderExpiryQueueStats,
  listDlqJobs,
  retryDlqJob,
  scheduleOrderExpiryJob,
} from '../queues/order-expiry.queue.js'
import { processPaymentWebhook } from '../services/supabase.service.js'
import {
  extractBaseOrderId,
  mapMidtransStatus,
  verifyMidtransSignature,
} from '../utils/midtrans.js'

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

const scheduleExpiryBodySchema = z.object({
  order_id: z
    .string()
    .trim()
    .min(1, 'order_id wajib diisi')
    .refine(
      (val) => z.string().uuid().safeParse(extractBaseOrderId(val)).success,
      'order_id harus berupa UUID pesanan yang valid',
    ),
  delay_ms: z.number().int().min(0).optional(),
})

const sweepExpiryBodySchema = z
  .object({
    expiry_minutes: z.number().min(1).default(30),
    enqueue_to_queue: z.boolean().optional(),
  })
  .optional()

const dlqQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

const dlqRetryParamsSchema = z.object({
  jobId: z.string().min(1, 'jobId wajib diisi'),
})

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

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

      // 1. Fail-closed Midtrans signature verification
      if (!config.MIDTRANS_SERVER_KEY) {
        return reply.status(500).send({
          status: 'error',
          message: 'Konfigurasi Midtrans Server Key belum disetel di server.',
          data: null,
          errors: null,
        })
      }

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

      // 2. Map Midtrans status to canonical order target status
      const targetStatus = mapMidtransStatus(payload.transaction_status, payload.fraud_status)

      // 3. Execute atomic state transition RPC in PostgreSQL
      try {
        const baseOrderId = extractBaseOrderId(payload.order_id)
        const result = await processPaymentWebhook({
          orderId: baseOrderId,
          targetStatus,
          paymentType: payload.payment_type,
          midtransId: payload.transaction_id,
        })

        return reply.status(200).send({
          status: 'success',
          message: 'Status pesanan berhasil diproses',
          data: result,
        })
      } catch (error: unknown) {
        request.log.error({ err: error }, 'Failed to process payment webhook')
        return reply.status(500).send({
          status: 'error',
          message: extractErrorMessage(error, 'Gagal memproses status pembayaran'),
          data: null,
          errors: null,
        })
      }
    },
  )

  const checkInternalAuth = (request: FastifyRequest, reply: FastifyReply): boolean => {
    const secret = config.INTERNAL_SERVICE_KEY || process.env.INTERNAL_SERVICE_KEY
    if (secret) {
      const headerSecret = request.headers['x-internal-secret']
      if (typeof headerSecret !== 'string' || headerSecret !== secret) {
        void reply.status(403).send({
          status: 'error',
          message: 'Akses ditolak. Header x-internal-secret tidak valid.',
          data: null,
          errors: null,
        })
        return false
      }
    }
    return true
  }

  // 4. Internal endpoint: schedule per-order delayed BullMQ expiry job on checkout
  app.post(
    '/api/v1/orders/schedule-expiry',
    {
      schema: {
        body: scheduleExpiryBodySchema,
      },
    },
    async (request, reply) => {
      if (!checkInternalAuth(request, reply)) return

      const body = request.body as z.infer<typeof scheduleExpiryBodySchema>
      const correlationHeader =
        request.headers['x-correlation-id'] || request.headers['x-request-id']
      const correlationId = typeof correlationHeader === 'string' ? correlationHeader : undefined

      try {
        const scheduled = await scheduleOrderExpiryJob({
          orderId: body.order_id,
          delayMs: body.delay_ms,
          correlationId,
        })

        return reply.status(200).send({
          status: 'success',
          message: scheduled.scheduled
            ? 'Jadwal kedaluwarsa pesanan berhasil didaftarkan ke BullMQ'
            : 'Antrean BullMQ tidak aktif; mengandalkan rekonsiliasi sweep berkala',
          data: scheduled,
        })
      } catch (error: unknown) {
        request.log.error({ err: error }, 'Failed to schedule order expiry job')
        return reply.status(500).send({
          status: 'error',
          message: extractErrorMessage(error, 'Gagal menjadwalkan kedaluwarsa pesanan'),
          data: null,
          errors: null,
        })
      }
    },
  )

  // 5. Internal endpoint: sweep expired pending orders
  app.post(
    '/api/v1/orders/sweep-expiry',
    {
      schema: {
        body: sweepExpiryBodySchema,
      },
    },
    async (request, reply) => {
      if (!checkInternalAuth(request, reply)) return

      const body = (request.body as z.infer<typeof sweepExpiryBodySchema>) || {
        expiry_minutes: config.ORDER_EXPIRY_MINUTES,
      }
      const expiryMinutes = body.expiry_minutes ?? config.ORDER_EXPIRY_MINUTES

      try {
        const { OrderExpiryWorker } = await import('../workers/order-expiry.worker.js')
        const sweepResult = await OrderExpiryWorker.sweepExpiredOrders(expiryMinutes, {
          enqueueToQueue: body.enqueue_to_queue,
        })

        return reply.status(200).send({
          status: 'success',
          message: 'Pemeriksaan pesanan kedaluwarsa selesai',
          data: sweepResult,
        })
      } catch (error: unknown) {
        request.log.error({ err: error }, 'Failed to sweep expired orders')
        return reply.status(500).send({
          status: 'error',
          message: extractErrorMessage(error, 'Gagal memeriksa pesanan kedaluwarsa'),
          data: null,
          errors: null,
        })
      }
    },
  )

  // 6. Internal endpoint: BullMQ & DLQ operational telemetry
  app.get('/api/v1/orders/queue-stats', async (request, reply) => {
    if (!checkInternalAuth(request, reply)) return

    try {
      const stats = await getOrderExpiryQueueStats()
      return reply.status(200).send({
        status: 'success',
        message: 'Statistik antrean kedaluwarsa pesanan berhasil dimuat',
        data: stats,
      })
    } catch (error: unknown) {
      request.log.error({ err: error }, 'Failed to fetch order expiry queue stats')
      return reply.status(500).send({
        status: 'error',
        message: extractErrorMessage(error, 'Gagal memuat statistik antrean'),
        data: null,
        errors: null,
      })
    }
  })

  // 7. Internal endpoint: inspect Dead Letter Queue (DLQ) jobs
  app.get(
    '/api/v1/orders/dlq',
    {
      schema: {
        querystring: dlqQuerySchema,
      },
    },
    async (request, reply) => {
      if (!checkInternalAuth(request, reply)) return

      const query = request.query as z.infer<typeof dlqQuerySchema>

      try {
        const jobs = await listDlqJobs(query.limit)
        return reply.status(200).send({
          status: 'success',
          message: 'Daftar Dead Letter Queue berhasil dimuat',
          data: {
            jobs,
            count: jobs.length,
          },
        })
      } catch (error: unknown) {
        request.log.error({ err: error }, 'Failed to list DLQ jobs')
        return reply.status(500).send({
          status: 'error',
          message: extractErrorMessage(error, 'Gagal memuat daftar Dead Letter Queue'),
          data: null,
          errors: null,
        })
      }
    },
  )

  // 8. Internal endpoint: replay a specific DLQ job back into order-expiry queue
  app.post(
    '/api/v1/orders/dlq/:jobId/retry',
    {
      schema: {
        params: dlqRetryParamsSchema,
      },
    },
    async (request, reply) => {
      if (!checkInternalAuth(request, reply)) return

      const params = request.params as z.infer<typeof dlqRetryParamsSchema>

      try {
        const result = await retryDlqJob(params.jobId)
        if (!result.retried) {
          const statusCode = result.reason === 'DLQ_JOB_NOT_FOUND' ? 404 : 503
          return reply.status(statusCode).send({
            status: 'error',
            message:
              result.reason === 'DLQ_JOB_NOT_FOUND'
                ? 'Job DLQ tidak ditemukan'
                : 'Antrean BullMQ belum aktif',
            data: result,
            errors: null,
          })
        }

        return reply.status(200).send({
          status: 'success',
          message: 'Job DLQ berhasil dijadwalkan ulang ke antrean utama',
          data: result,
        })
      } catch (error: unknown) {
        request.log.error({ err: error }, 'Failed to retry DLQ job')
        return reply.status(500).send({
          status: 'error',
          message: extractErrorMessage(error, 'Gagal menjadwalkan ulang job DLQ'),
          data: null,
          errors: null,
        })
      }
    },
  )

  // 9. Internal endpoint: O(1) versioned catalog cache invalidation
  app.post('/api/v1/orders/invalidate-cache', async (request, reply) => {
    if (!checkInternalAuth(request, reply)) return

    try {
      const { CacheService } = await import('../cache/redis.client.js')
      await CacheService.invalidateCatalog()

      return reply.status(200).send({
        status: 'success',
        message: 'Cache katalog berhasil di-invalidasi',
        data: null,
      })
    } catch (error: unknown) {
      return reply.status(500).send({
        status: 'error',
        message: extractErrorMessage(error, 'Gagal menginvalidasi cache katalog'),
        data: null,
        errors: null,
      })
    }
  })
}
