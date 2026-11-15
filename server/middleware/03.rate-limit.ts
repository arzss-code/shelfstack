import { globalRateLimiter, RATE_LIMIT_RULES, resolveEndpointCategory } from '../utils/rate-limit'

export default defineEventHandler((event) => {
  const path = event.path?.split('?')[0] || ''
  const method = event.method || 'GET'

  const category = resolveEndpointCategory(path, method)
  if (!category) return

  const rule = RATE_LIMIT_RULES[category]
  if (!rule) return

  // Ekstrak alamat IP klien secara aman dari proxy headers
  let clientIp: string
  try {
    const xForwardedFor = getHeader(event, 'x-forwarded-for')
    if (xForwardedFor) {
      clientIp = xForwardedFor.split(',')[0]?.trim() || '127.0.0.1'
    } else {
      clientIp =
        getHeader(event, 'cf-connecting-ip') ||
        getHeader(event, 'x-real-ip') ||
        event.node?.req?.socket?.remoteAddress ||
        '127.0.0.1'
    }
  } catch {
    clientIp = '127.0.0.1'
  }

  const key = `${category}:${clientIp}`
  const result = globalRateLimiter.checkLimit(key, rule)

  // Pasang header telemetri rate limiting standar
  try {
    setHeader(event, 'X-RateLimit-Limit', result.limit.toString())
    setHeader(event, 'X-RateLimit-Remaining', result.remaining.toString())
    setHeader(event, 'X-RateLimit-Reset', result.reset.toString())
  } catch {
    if (event.node?.res && !event.node.res.headersSent) {
      event.node.res.setHeader('X-RateLimit-Limit', result.limit.toString())
      event.node.res.setHeader('X-RateLimit-Remaining', result.remaining.toString())
      event.node.res.setHeader('X-RateLimit-Reset', result.reset.toString())
    }
  }

  if (!result.allowed) {
    try {
      setHeader(event, 'Retry-After', result.retryAfter)
    } catch {
      if (event.node?.res && !event.node.res.headersSent) {
        event.node.res.setHeader('Retry-After', result.retryAfter.toString())
      }
    }

    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: {
        success: false,
        message: 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa saat.',
        retryAfter: result.retryAfter,
      },
    })
  }
})
