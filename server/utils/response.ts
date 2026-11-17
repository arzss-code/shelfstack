import type { H3Event } from 'h3'
import { logger, resolveRequestId } from './logger'

export function successResponse<T = unknown>(
  message: string,
  data: T = null as T,
  meta?: Record<string, unknown>,
) {
  return {
    status: 'success',
    message,
    data,
    errors: null,
    ...(meta || {}),
  }
}

function sanitizeErrorPayload(errors: unknown, statusCode: number): unknown {
  if (!errors) return null

  // If status is internal server error (5xx), avoid leaking internal database/SQL stack
  if (statusCode >= 500) {
    if (process.env.NODE_ENV === 'production') {
      return null
    }
    // In dev/test, sanitize internal database error details
    if (
      typeof errors === 'object' &&
      errors !== null &&
      ('hint' in errors || 'details' in errors || 'internalPosition' in errors)
    ) {
      const errObj = errors as { message?: string }
      return {
        message: errObj.message || 'Database error occurred',
      }
    }
  }

  // Remove potential stack trace leaks if an Error instance was passed
  if (errors instanceof Error) {
    return {
      message: errors.message,
    }
  }

  return errors
}

export function errorResponse(
  event: unknown,
  message: string,
  errors: unknown = null,
  statusCode: number = 400,
): never {
  const safeErrors = sanitizeErrorPayload(errors, statusCode)

  let requestId: string | undefined = undefined
  const eventObj = event as {
    context?: { requestId?: string }
    path?: string
    method?: string
    node?: { req?: { url?: string; method?: string } }
  } | null

  if (eventObj) {
    if (eventObj.context?.requestId) {
      requestId = eventObj.context.requestId
    } else if (typeof getHeader === 'function') {
      try {
        const headerVal = getHeader(event as H3Event, 'x-request-id')
        if (headerVal) {
          requestId = resolveRequestId(headerVal)
        }
      } catch {
        // Ignored in unit testing environments
      }
    }
  }

  // Structured logging for API errors (fail-safe)
  try {
    const route = eventObj?.path || eventObj?.node?.req?.url || undefined
    const method = eventObj?.method || eventObj?.node?.req?.method || undefined
    const context = {
      requestId,
      route,
      method,
      statusCode,
    }

    if (statusCode >= 500) {
      logger.error(`API Error: ${message}`, context, errors)
    } else {
      logger.warn(`API Client Error: ${message}`, context)
    }
  } catch {
    // Keep response generation completely safe
  }

  throw createError({
    statusCode,
    statusMessage: message,
    message,
    data: {
      status: 'error',
      message,
      data: null,
      errors: safeErrors,
      ...(requestId ? { requestId } : {}),
    },
  })
}
