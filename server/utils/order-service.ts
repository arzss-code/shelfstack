import { logger } from './logger'

export interface OrderExpiryQueueCounts {
  waiting: number
  active: number
  delayed: number
  completed: number
  failed: number
  paused: number
}

export interface OrderExpiryQueueTelemetry {
  reachable: boolean
  enabled: boolean
  mainQueue: OrderExpiryQueueCounts
  dlq: OrderExpiryQueueCounts
  dlqJobs: Array<{
    id: string
    payload: {
      originalJobId: string
      jobName: string
      data: Record<string, unknown>
      failedReason: string
      attemptsMade: number
      maxAttempts: number
      failedAt: string
    }
    timestamp: number
  }>
}

const ZERO_COUNTS: OrderExpiryQueueCounts = {
  waiting: 0,
  active: 0,
  delayed: 0,
  completed: 0,
  failed: 0,
  paused: 0,
}

function resolveOrderServiceConfig() {
  let baseUrl = process.env.ORDER_SERVICE_URL || ''
  let secret = process.env.INTERNAL_SERVICE_KEY || ''

  try {
    const cfg = useRuntimeConfig()
    if (!baseUrl && typeof cfg.orderServiceUrl === 'string') {
      baseUrl = cfg.orderServiceUrl
    }
    if (!secret && typeof cfg.internalServiceKey === 'string') {
      secret = cfg.internalServiceKey
    }
  } catch {
    // Allow running in pure unit test contexts outside Nitro runtime
  }

  return {
    baseUrl: (baseUrl || 'http://127.0.0.1:4000').replace(/\/+$/, ''),
    secret,
  }
}

function buildInternalHeaders(requestId?: string, secret?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  if (secret) {
    headers['x-internal-secret'] = secret
  }
  if (requestId) {
    headers['x-request-id'] = requestId
    headers['x-correlation-id'] = requestId
  }
  return headers
}

/**
 * Schedules a delayed BullMQ expiry job in @shelfstack/order-service on a fail-open basis.
 * Checkout never fails if order-service is unreachable because the repeatable sweep
 * scheduler reconciles expired pending orders automatically.
 */
export async function enqueueOrderExpiryNotification(
  orderId: string,
  requestId?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const { baseUrl, secret } = resolveOrderServiceConfig()

  try {
    const response = await fetchImpl(`${baseUrl}/api/v1/orders/schedule-expiry`, {
      method: 'POST',
      headers: buildInternalHeaders(requestId, secret),
      body: JSON.stringify({ order_id: orderId }),
      signal: AbortSignal.timeout(1_500),
    })

    if (!response.ok) {
      logger.warn('[OrderServiceBridge] Non-2xx response while scheduling order expiry', {
        orderId,
        requestId,
        statusCode: response.status,
      })
      return false
    }

    return true
  } catch (err: unknown) {
    logger.warn(
      '[OrderServiceBridge] Order service unreachable during checkout; periodic sweep will reconcile',
      {
        orderId,
        requestId,
      },
      err,
    )
    return false
  }
}

/**
 * Fetches BullMQ queue counts and DLQ entries from @shelfstack/order-service for admin telemetry.
 */
export async function fetchOrderExpiryQueueTelemetry(
  requestId?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<OrderExpiryQueueTelemetry> {
  const { baseUrl, secret } = resolveOrderServiceConfig()
  const headers = buildInternalHeaders(requestId, secret)

  try {
    const [statsRes, dlqRes] = await Promise.all([
      fetchImpl(`${baseUrl}/api/v1/orders/queue-stats`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(2_500),
      }),
      fetchImpl(`${baseUrl}/api/v1/orders/dlq?limit=20`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(2_500),
      }),
    ])

    if (!statsRes.ok) {
      return {
        reachable: false,
        enabled: false,
        mainQueue: { ...ZERO_COUNTS },
        dlq: { ...ZERO_COUNTS },
        dlqJobs: [],
      }
    }

    const statsJson = (await statsRes.json()) as {
      data?: {
        enabled?: boolean
        mainQueue?: OrderExpiryQueueCounts
        dlq?: OrderExpiryQueueCounts
      }
    }

    const dlqJson = dlqRes.ok
      ? ((await dlqRes.json()) as {
          data?: { jobs?: OrderExpiryQueueTelemetry['dlqJobs'] }
        })
      : { data: { jobs: [] } }

    return {
      reachable: true,
      enabled: Boolean(statsJson.data?.enabled),
      mainQueue: statsJson.data?.mainQueue ?? { ...ZERO_COUNTS },
      dlq: statsJson.data?.dlq ?? { ...ZERO_COUNTS },
      dlqJobs: dlqJson.data?.jobs ?? [],
    }
  } catch {
    return {
      reachable: false,
      enabled: false,
      mainQueue: { ...ZERO_COUNTS },
      dlq: { ...ZERO_COUNTS },
      dlqJobs: [],
    }
  }
}

export async function retryOrderExpiryDlqJob(
  jobId: string,
  requestId?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; statusCode: number; message: string }> {
  const { baseUrl, secret } = resolveOrderServiceConfig()

  try {
    const res = await fetchImpl(`${baseUrl}/api/v1/orders/dlq/${encodeURIComponent(jobId)}/retry`, {
      method: 'POST',
      headers: buildInternalHeaders(requestId, secret),
      signal: AbortSignal.timeout(3_000),
    })

    const body = (await res.json().catch(() => null)) as { message?: string } | null
    return {
      ok: res.ok,
      statusCode: res.status,
      message:
        body?.message ||
        (res.ok ? 'Job DLQ berhasil dijadwalkan ulang' : 'Gagal memproses ulang job DLQ'),
    }
  } catch {
    return {
      ok: false,
      statusCode: 503,
      message: 'Order service belum dapat dihubungi saat ini',
    }
  }
}

/**
 * Pings @shelfstack/order-service /health endpoint for readiness probes.
 */
export async function pingOrderService(
  _requestId?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const { baseUrl } = resolveOrderServiceConfig()
  try {
    const res = await fetchImpl(`${baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2_000),
    })
    return res.ok
  } catch {
    return false
  }
}
