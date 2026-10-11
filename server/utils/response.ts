import { logger, resolveRequestId } from './logger'

export function successResponse(message: string, data: any = null, meta?: Record<string, any>) {
  return {
    status: 'success',
    message,
    data,
    errors: null,
    ...(meta || {}),
  }
}

function sanitizeErrorPayload(errors: any, statusCode: number): any {
  if (!errors) return null

  // If status is internal server error (5xx), avoid leaking internal database/SQL stack
  if (statusCode >= 500) {
    if (process.env.NODE_ENV === 'production') {
      return null
    }
    // In dev/test, sanitize internal database error details
    if (
      typeof errors === 'object' &&
      ('hint' in errors || 'details' in errors || 'internalPosition' in errors)
    ) {
      return {
        message: errors.message || 'Database error occurred',
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
  event: any,
  message: string,
  errors: any = null,
  statusCode: number = 400,
): never {
  const safeErrors = sanitizeErrorPayload(errors, statusCode)

  let requestId: string | undefined = undefined
  if (event) {
    if (event.context?.requestId) {
      requestId = event.context.requestId
    } else if (typeof getHeader === 'function') {
      try {
        const headerVal = getHeader(event, 'x-request-id')
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
    const route = event?.path || event?.node?.req?.url || undefined
    const method = event?.method || event?.node?.req?.method || undefined
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
