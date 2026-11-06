import { Worker, type Job } from 'bullmq'
import { CacheService } from '../cache/redis.client.js'
import { config } from '../config.js'
import {
  DEFAULT_EXPIRY_ATTEMPTS,
  ORDER_EXPIRY_QUEUE_NAME,
  forwardFailedJobToDlq,
  getBullMqConnectionOptions,
  isBullMqActive,
  scheduleOrderExpiryJob,
  type OrderExpiryJobData,
  type OrderExpiryJobName,
} from '../queues/order-expiry.queue.js'
import { getSupabaseClient, processPaymentWebhook } from '../services/supabase.service.js'
import { extractBaseOrderId } from '../utils/midtrans.js'

export interface SingleOrderExpiryOutcome {
  orderId: string
  action: 'cancelled' | 'no_op'
  rpcResult: string
  cacheInvalidated: boolean
}

export interface ExpirySweepResult {
  checkedAt: string
  cutoffTime: string
  scannedCount: number
  cancelledCount: number
  queuedCount: number
  cancelledOrders: string[]
  queuedOrders: string[]
  errors: Array<{ orderId: string; error: string }>
}

export interface WorkerLogger {
  info: (obj: Record<string, unknown>, msg: string) => void
  warn: (obj: Record<string, unknown>, msg: string) => void
  error: (obj: Record<string, unknown>, msg: string) => void
}

const defaultLogger: WorkerLogger = {
  info: (obj, msg) => console.info(`[OrderExpiryWorker] ${msg}`, obj),
  warn: (obj, msg) => console.warn(`[OrderExpiryWorker] ${msg}`, obj),
  error: (obj, msg) => console.error(`[OrderExpiryWorker] ${msg}`, obj),
}

let bullWorkerInstance: Worker<OrderExpiryJobData, unknown, OrderExpiryJobName> | null = null

function isIdempotentNoOpRpcResult(rpcResult: string): boolean {
  return (
    rpcResult === 'ORDER_NOT_FOUND' ||
    rpcResult.startsWith('IGNORED_') ||
    rpcResult.startsWith('NO_CHANGE')
  )
}

function isCancelledSuccessRpcResult(rpcResult: string): boolean {
  return rpcResult === 'CANCELLED_SUCCESS' || rpcResult === 'UPDATED_TO_cancelled'
}

/**
 * Worker responsible for auto-cancelling expired pending orders, restoring inventory,
 * refunding vouchers/coins via canonical DB RPC, and forwarding exhausted failures to DLQ.
 */
export const OrderExpiryWorker = {
  /**
   * Idempotently processes expiry for a single order ID.
   * Safe against paid/shipped/completed/already-cancelled orders (no double-restock).
   * Throws on transient database or RPC errors so BullMQ retries with exponential backoff.
   */
  async processSingleOrderExpiry(orderId: string): Promise<SingleOrderExpiryOutcome> {
    const baseOrderId = extractBaseOrderId(orderId)

    const outcome = await processPaymentWebhook({
      orderId: baseOrderId,
      targetStatus: 'cancelled',
      paymentType: 'auto_timeout',
      midtransId: null,
    })

    if (isCancelledSuccessRpcResult(outcome.rpcResult)) {
      const cacheInvalidated = await CacheService.invalidateCatalog()
      return {
        orderId: baseOrderId,
        action: 'cancelled',
        rpcResult: outcome.rpcResult,
        cacheInvalidated,
      }
    }

    if (isIdempotentNoOpRpcResult(outcome.rpcResult)) {
      return {
        orderId: baseOrderId,
        action: 'no_op',
        rpcResult: outcome.rpcResult,
        cacheInvalidated: false,
      }
    }

    return {
      orderId: baseOrderId,
      action: 'no_op',
      rpcResult: outcome.rpcResult,
      cacheInvalidated: false,
    }
  },

  /**
   * Sweeps pending orders older than expiryMinutes.
   * When enqueueToQueue is true and BullMQ is active, dispatches individual delayed(0)
   * jobs per order so each order has isolated retry + DLQ semantics.
   * Otherwise executes atomic cancellation directly in-process.
   */
  async sweepExpiredOrders(
    expiryMinutes = config.ORDER_EXPIRY_MINUTES,
    options?: { enqueueToQueue?: boolean },
  ): Promise<ExpirySweepResult> {
    const client = getSupabaseClient()
    const now = new Date()
    const cutoffDate = new Date(now.getTime() - expiryMinutes * 60 * 1_000)
    const cutoffIso = cutoffDate.toISOString()

    const result: ExpirySweepResult = {
      checkedAt: now.toISOString(),
      cutoffTime: cutoffIso,
      scannedCount: 0,
      cancelledCount: 0,
      queuedCount: 0,
      cancelledOrders: [],
      queuedOrders: [],
      errors: [],
    }

    const { data: expiredOrders, error: queryError } = await client
      .from('orders')
      .select('id, created_at, status')
      .eq('status', 'pending')
      .lt('created_at', cutoffIso)

    if (queryError) {
      throw new Error(`Failed to query expired orders: ${queryError.message}`)
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return result
    }

    result.scannedCount = expiredOrders.length
    const shouldEnqueue = Boolean(options?.enqueueToQueue) && isBullMqActive()

    for (const order of expiredOrders) {
      const orderId = String(order.id)
      try {
        if (shouldEnqueue) {
          const scheduled = await scheduleOrderExpiryJob({
            orderId,
            delayMs: 0,
            correlationId: 'periodic-sweep-reconciliation',
          })
          if (scheduled.scheduled) {
            result.queuedCount++
            result.queuedOrders.push(orderId)
            continue
          }
        }

        const outcome = await OrderExpiryWorker.processSingleOrderExpiry(orderId)
        if (outcome.action === 'cancelled') {
          result.cancelledCount++
          result.cancelledOrders.push(orderId)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        result.errors.push({ orderId, error: message })
      }
    }

    return result
  },

  /**
   * Executes a BullMQ job payload (used by the BullMQ Worker processor and unit tests).
   */
  async processJobData(
    data: OrderExpiryJobData,
  ): Promise<SingleOrderExpiryOutcome | ExpirySweepResult> {
    if (data.kind === 'sweep') {
      return OrderExpiryWorker.sweepExpiredOrders(data.expiryMinutes, { enqueueToQueue: true })
    }
    return OrderExpiryWorker.processSingleOrderExpiry(data.orderId)
  },

  /**
   * Evaluates a failed BullMQ job and forwards it to order-expiry-dlq once attempts are exhausted.
   */
  async handleFailedJob(
    job:
      | Pick<
          Job<OrderExpiryJobData, unknown, OrderExpiryJobName>,
          'id' | 'name' | 'data' | 'attemptsMade' | 'opts' | 'stacktrace'
        >
      | undefined,
    error: Error,
    logger: WorkerLogger = defaultLogger,
  ): Promise<string | null> {
    if (!job) {
      logger.error({ error: error.message }, 'BullMQ worker reported failure without job context')
      return null
    }

    const maxAttempts = job.opts.attempts ?? DEFAULT_EXPIRY_ATTEMPTS
    if (job.attemptsMade < maxAttempts) {
      logger.warn(
        {
          jobId: job.id,
          jobName: job.name,
          attemptsMade: job.attemptsMade,
          maxAttempts,
          error: error.message,
        },
        'Order expiry job failed; BullMQ exponential retry scheduled',
      )
      return null
    }

    const dlqId = await forwardFailedJobToDlq({
      originalJobId: String(job.id ?? 'unknown'),
      jobName: job.name,
      data: job.data,
      failedReason: error.message,
      stacktrace: job.stacktrace ?? [],
      attemptsMade: job.attemptsMade,
      maxAttempts,
      failedAt: new Date().toISOString(),
    })

    logger.error(
      {
        jobId: job.id,
        dlqId,
        jobName: job.name,
        attemptsMade: job.attemptsMade,
        error: error.message,
      },
      'Order expiry job exhausted retries and was moved to Dead Letter Queue (DLQ)',
    )

    return dlqId
  },
}

export function startOrderExpiryBullWorker(
  logger: WorkerLogger = defaultLogger,
): Worker<OrderExpiryJobData, unknown, OrderExpiryJobName> | null {
  if (bullWorkerInstance) {
    return bullWorkerInstance
  }

  const connection = getBullMqConnectionOptions()
  if (!connection) {
    logger.info(
      { bullmqEnabled: config.BULLMQ_ENABLED, hasRedisUrl: Boolean(config.REDIS_URL) },
      'BullMQ worker skipped because REDIS_URL is not configured or BULLMQ_ENABLED=false',
    )
    return null
  }

  bullWorkerInstance = new Worker<OrderExpiryJobData, unknown, OrderExpiryJobName>(
    ORDER_EXPIRY_QUEUE_NAME,
    async (job) => OrderExpiryWorker.processJobData(job.data),
    {
      connection,
      concurrency: 5,
    },
  )

  bullWorkerInstance.on('completed', (job) => {
    logger.info(
      {
        jobId: job.id,
        jobName: job.name,
      },
      'Order expiry BullMQ job completed',
    )
  })

  bullWorkerInstance.on('failed', (job, error) => {
    void OrderExpiryWorker.handleFailedJob(job, error, logger)
  })

  bullWorkerInstance.on('error', (error) => {
    logger.error({ error: error.message }, 'BullMQ worker connection error')
  })

  logger.info({ queue: ORDER_EXPIRY_QUEUE_NAME }, 'Order expiry BullMQ worker started')
  return bullWorkerInstance
}

export async function stopOrderExpiryBullWorker(): Promise<void> {
  if (bullWorkerInstance) {
    await bullWorkerInstance.close()
    bullWorkerInstance = null
  }
}
