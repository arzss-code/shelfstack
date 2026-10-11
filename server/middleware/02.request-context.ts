import { REQUEST_ID_REGEX, resolveRequestId, logger } from '../utils/logger'
import { metrics } from '../utils/metrics'

export default defineEventHandler((event) => {
  // 1. Resolve and validate incoming request ID or generate a new UUID
  let rawRequestId: string | undefined
  try {
    rawRequestId = getHeader(event, 'x-request-id')
  } catch {
    rawRequestId = event.node?.req?.headers?.['x-request-id'] as string | undefined
  }
  const requestId = resolveRequestId(rawRequestId)

  // 2. Resolve correlation ID (or inherit request ID)
  let rawCorrelationId: string | undefined
  try {
    rawCorrelationId = getHeader(event, 'x-correlation-id')
  } catch {
    rawCorrelationId = event.node?.req?.headers?.['x-correlation-id'] as string | undefined
  }
  const correlationId =
    rawCorrelationId && REQUEST_ID_REGEX.test(rawCorrelationId.trim())
      ? rawCorrelationId.trim()
      : requestId

  // 3. Attach to event context for downstream handlers and error responses
  event.context.requestId = requestId
  event.context.correlationId = correlationId
  event.context.startTime = Date.now()

  // 4. Set standard tracing headers on the HTTP response
  try {
    setHeader(event, 'x-request-id', requestId)
    setHeader(event, 'x-correlation-id', correlationId)
  } catch {
    if (event.node?.res && !event.node.res.headersSent) {
      event.node.res.setHeader('x-request-id', requestId)
      event.node.res.setHeader('x-correlation-id', correlationId)
    }
  }

  // 5. Audit log on request completion (non-blocking)
  if (event.node?.res?.on) {
    event.node.res.on('finish', () => {
      const durationMs = Date.now() - (event.context.startTime || Date.now())
      const statusCode = event.node?.res?.statusCode || 200
      const path = event.path || event.node?.req?.url || ''
      const method = event.method || event.node?.req?.method || 'GET'

      // Skip logging static assets to prevent log noise
      if (
        path.startsWith('/_nuxt') ||
        path.startsWith('/__nuxt') ||
        path.includes('/favicon.ico') ||
        path.startsWith('/primeicons')
      ) {
        return
      }

      // Record in-memory operational metrics
      metrics.recordRequest(statusCode)

      const logContext = {
        requestId,
        correlationId,
        route: path,
        method,
        statusCode,
        durationMs,
      }

      const message = `HTTP ${method} ${path} -> ${statusCode} (${durationMs}ms)`

      if (statusCode >= 500) {
        logger.error(message, logContext)
      } else if (statusCode >= 400) {
        logger.warn(message, logContext)
      } else {
        logger.info(message, logContext)
      }
    })
  }
})
