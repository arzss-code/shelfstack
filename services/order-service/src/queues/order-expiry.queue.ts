import { Queue, type ConnectionOptions } from 'bullmq'
import { config } from '../config.js'
import { extractBaseOrderId } from '../utils/midtrans.js'

export const ORDER_EXPIRY_QUEUE_NAME = 'order-expiry' as const
export const ORDER_EXPIRY_DLQ_NAME = 'order-expiry-dlq' as const
export const DEFAULT_EXPIRY_ATTEMPTS = 3
export const DEFAULT_EXPIRY_BACKOFF_MS = 5_000

export type OrderExpiryJobName = 'expire-order' | 'sweep-expired-orders'

export interface OrderExpirySingleJobData {
  kind: 'single'
  orderId: string
  correlationId?: string
  scheduledAt: string
}

export interface OrderExpirySweepJobData {
  kind: 'sweep'
  expiryMinutes: number
  correlationId?: string
}

export type OrderExpiryJobData = OrderExpirySingleJobData | OrderExpirySweepJobData

export interface OrderExpiryDlqRecord {
  originalJobId: string
  jobName: OrderExpiryJobName
  data: OrderExpiryJobData
  failedReason: string
  stacktrace: string[]
  attemptsMade: number
  maxAttempts: number
  failedAt: string
}

export interface QueueCounts {
  waiting: number
  active: number
  delayed: number
  completed: number
  failed: number
  paused: number
}

export interface OrderExpiryQueueStats {
  enabled: boolean
  mainQueue: QueueCounts
  dlq: QueueCounts
}

export interface DlqJobItem {
  id: string
  payload: OrderExpiryDlqRecord
  timestamp: number
}

export interface ScheduleExpiryResult {
  scheduled: boolean
  jobId: string
  delayMs: number
  mode: 'bullmq' | 'disabled_or_no_redis'
}

export interface RetryDlqResult {
  retried: boolean
  dlqJobId: string
  newJobId: string | null
  reason?: string
}

export interface OrderExpiryQueueAdapter {
  isActive(): boolean
  scheduleExpiry(params: {
    orderId: string
    delayMs?: number
    correlationId?: string
  }): Promise<ScheduleExpiryResult>
  forwardToDlq(record: OrderExpiryDlqRecord): Promise<string | null>
  getStats(): Promise<OrderExpiryQueueStats>
  listDlq(limit?: number): Promise<DlqJobItem[]>
  retryDlq(dlqJobId: string): Promise<RetryDlqResult>
}

const EMPTY_COUNTS: QueueCounts = {
  waiting: 0,
  active: 0,
  delayed: 0,
  completed: 0,
  failed: 0,
  paused: 0,
}

let mainQueue: Queue<OrderExpiryJobData, unknown, OrderExpiryJobName> | null = null
let dlqQueue: Queue<OrderExpiryDlqRecord, unknown, 'dead-letter-order-expiry'> | null = null
let testAdapterOverride: OrderExpiryQueueAdapter | null = null

export function setOrderExpiryQueueAdapterForTests(adapter: OrderExpiryQueueAdapter | null): void {
  testAdapterOverride = adapter
}

export function buildOrderExpiryJobId(orderId: string): string {
  return `expire-order-${extractBaseOrderId(orderId)}`
}

export function getBullMqConnectionOptions(): ConnectionOptions | null {
  if (config.BULLMQ_ENABLED !== 'true' || !config.REDIS_URL) {
    return null
  }

  return {
    url: config.REDIS_URL,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times: number) => Math.min(times * 250, 5_000),
  }
}

export function isBullMqActive(): boolean {
  if (testAdapterOverride) {
    return testAdapterOverride.isActive()
  }
  return config.BULLMQ_ENABLED === 'true' && Boolean(config.REDIS_URL)
}

export function getOrderExpiryQueue(): Queue<
  OrderExpiryJobData,
  unknown,
  OrderExpiryJobName
> | null {
  if (mainQueue) {
    return mainQueue
  }

  const connection = getBullMqConnectionOptions()
  if (!connection) {
    return null
  }

  mainQueue = new Queue<OrderExpiryJobData, unknown, OrderExpiryJobName>(ORDER_EXPIRY_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: DEFAULT_EXPIRY_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: DEFAULT_EXPIRY_BACKOFF_MS,
      },
      removeOnComplete: 500,
      removeOnFail: 1_000,
    },
  })

  return mainQueue
}

export function getOrderExpiryDlq(): Queue<
  OrderExpiryDlqRecord,
  unknown,
  'dead-letter-order-expiry'
> | null {
  if (dlqQueue) {
    return dlqQueue
  }

  const connection = getBullMqConnectionOptions()
  if (!connection) {
    return null
  }

  dlqQueue = new Queue<OrderExpiryDlqRecord, unknown, 'dead-letter-order-expiry'>(
    ORDER_EXPIRY_DLQ_NAME,
    {
      connection,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: 1_000,
        removeOnFail: 5_000,
      },
    },
  )

  return dlqQueue
}

export async function scheduleOrderExpiryJob(params: {
  orderId: string
  delayMs?: number
  correlationId?: string
}): Promise<ScheduleExpiryResult> {
  if (testAdapterOverride) {
    return testAdapterOverride.scheduleExpiry(params)
  }

  const baseOrderId = extractBaseOrderId(params.orderId)
  const delayMs = Math.max(0, params.delayMs ?? config.ORDER_EXPIRY_MINUTES * 60_000)
  const jobId = buildOrderExpiryJobId(baseOrderId)

  const queue = getOrderExpiryQueue()
  if (!queue) {
    return {
      scheduled: false,
      jobId,
      delayMs,
      mode: 'disabled_or_no_redis',
    }
  }

  await queue.add(
    'expire-order',
    {
      kind: 'single',
      orderId: baseOrderId,
      correlationId: params.correlationId,
      scheduledAt: new Date().toISOString(),
    },
    {
      jobId,
      delay: delayMs,
      attempts: DEFAULT_EXPIRY_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: DEFAULT_EXPIRY_BACKOFF_MS,
      },
    },
  )

  return {
    scheduled: true,
    jobId,
    delayMs,
    mode: 'bullmq',
  }
}

export async function registerExpirySweepScheduler(
  intervalMs = config.ORDER_SWEEP_INTERVAL_MS,
  expiryMinutes = config.ORDER_EXPIRY_MINUTES,
): Promise<boolean> {
  const queue = getOrderExpiryQueue()
  if (!queue) {
    return false
  }

  await queue.upsertJobScheduler(
    'sweep-expired-orders',
    { every: intervalMs },
    {
      name: 'sweep-expired-orders',
      data: {
        kind: 'sweep',
        expiryMinutes,
        correlationId: 'periodic-sweep-scheduler',
      },
      opts: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: DEFAULT_EXPIRY_BACKOFF_MS,
        },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    },
  )

  return true
}

export async function forwardFailedJobToDlq(record: OrderExpiryDlqRecord): Promise<string | null> {
  if (testAdapterOverride) {
    return testAdapterOverride.forwardToDlq(record)
  }

  const dlq = getOrderExpiryDlq()
  if (!dlq) {
    return null
  }

  const dlqJobId = `dlq-${record.originalJobId}-${Date.now()}`
  const added = await dlq.add('dead-letter-order-expiry', record, {
    jobId: dlqJobId,
  })

  return added.id ?? dlqJobId
}

function mapCounts(raw: Record<string, number>): QueueCounts {
  return {
    waiting: raw.waiting ?? 0,
    active: raw.active ?? 0,
    delayed: raw.delayed ?? 0,
    completed: raw.completed ?? 0,
    failed: raw.failed ?? 0,
    paused: raw.paused ?? 0,
  }
}

export async function getOrderExpiryQueueStats(): Promise<OrderExpiryQueueStats> {
  if (testAdapterOverride) {
    return testAdapterOverride.getStats()
  }

  const queue = getOrderExpiryQueue()
  const dlq = getOrderExpiryDlq()

  if (!queue || !dlq) {
    return {
      enabled: false,
      mainQueue: { ...EMPTY_COUNTS },
      dlq: { ...EMPTY_COUNTS },
    }
  }

  const [mainCounts, dlqCounts] = await Promise.all([queue.getJobCounts(), dlq.getJobCounts()])

  return {
    enabled: true,
    mainQueue: mapCounts(mainCounts),
    dlq: mapCounts(dlqCounts),
  }
}

export async function listDlqJobs(limit = 25): Promise<DlqJobItem[]> {
  if (testAdapterOverride) {
    return testAdapterOverride.listDlq(limit)
  }

  const dlq = getOrderExpiryDlq()
  if (!dlq) {
    return []
  }

  const boundedLimit = Math.max(1, Math.min(100, limit))
  const jobs = await dlq.getJobs(['waiting', 'delayed', 'failed', 'completed'], 0, boundedLimit - 1)

  return jobs.map((job) => ({
    id: String(job.id ?? ''),
    payload: job.data,
    timestamp: job.timestamp,
  }))
}

export async function retryDlqJob(dlqJobId: string): Promise<RetryDlqResult> {
  if (testAdapterOverride) {
    return testAdapterOverride.retryDlq(dlqJobId)
  }

  const queue = getOrderExpiryQueue()
  const dlq = getOrderExpiryDlq()

  if (!queue || !dlq) {
    return {
      retried: false,
      dlqJobId,
      newJobId: null,
      reason: 'BULLMQ_DISABLED_OR_NO_REDIS',
    }
  }

  const dlqJob = await dlq.getJob(dlqJobId)
  if (!dlqJob) {
    return {
      retried: false,
      dlqJobId,
      newJobId: null,
      reason: 'DLQ_JOB_NOT_FOUND',
    }
  }

  const replayJobId = `${dlqJob.data.originalJobId}-retry-${Date.now()}`
  await queue.add(dlqJob.data.jobName, dlqJob.data.data, {
    jobId: replayJobId,
    delay: 0,
    attempts: DEFAULT_EXPIRY_ATTEMPTS,
    backoff: {
      type: 'exponential',
      delay: DEFAULT_EXPIRY_BACKOFF_MS,
    },
  })

  await dlqJob.remove()

  return {
    retried: true,
    dlqJobId,
    newJobId: replayJobId,
  }
}

export async function closeOrderExpiryQueues(): Promise<void> {
  if (mainQueue) {
    await mainQueue.close()
    mainQueue = null
  }
  if (dlqQueue) {
    await dlqQueue.close()
    dlqQueue = null
  }
}
