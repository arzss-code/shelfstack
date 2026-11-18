import crypto from 'node:crypto'

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  service: string
  environment: string
  message: string
  requestId?: string
  correlationId?: string
  route?: string
  method?: string
  statusCode?: number
  durationMs?: number
  context?: Record<string, unknown>
  error?: {
    name?: string
    message: string
    code?: string | number
    stack?: string
  }
}

/**
 * Regex for validating client/proxy supplied Request IDs.
 * Alphanumeric, hyphen, and underscore up to 64 characters.
 */
export const REQUEST_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/

/**
 * Validates request ID from incoming headers or generates a secure UUID.
 */
export function resolveRequestId(rawHeader?: string | null): string {
  if (rawHeader && typeof rawHeader === 'string') {
    const trimmed = rawHeader.trim()
    if (REQUEST_ID_REGEX.test(trimmed)) {
      return trimmed
    }
  }
  return crypto.randomUUID()
}

/**
 * Sensitive field names that must be redacted in logs.
 */
const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'token',
  'access_token',
  'refresh_token',
  'service_role_key',
  'service_role',
  'supabase_service_role_key',
  'midtrans_server_key',
  'server_key',
  'signature_key',
  'signature',
  'password',
  'secret',
  'snap_token',
  'card_number',
  'cvv',
  'phone',
  'address',
  'full_address',
])

/**
 * Regex patterns for masking sensitive strings embedded in arbitrary values.
 */
const JWT_REGEX = /Bearer\s+[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_.-]+/gi
const BASIC_AUTH_REGEX = /Basic\s+[A-Za-z0-9+/=]+/gi
const SHA512_HEX_REGEX = /\b[a-fA-F0-9]{128}\b/g
const SHA256_HEX_REGEX = /\b[a-fA-F0-9]{64}\b/g
const SUPABASE_KEY_REGEX = /sbp_[a-zA-Z0-9_-]+/g

function getErrorCode(err: unknown): string | number | undefined {
  if (!err || typeof err !== 'object' || !('code' in err)) return undefined
  const code = (err as { code?: unknown }).code
  return typeof code === 'string' || typeof code === 'number' ? code : undefined
}

/**
 * Recursively redacts sensitive keys and values from logging objects.
 */
export function sanitizeLogData(data: unknown, depth = 0): unknown {
  if (depth > 6) return '[MAX_DEPTH_EXCEEDED]'
  if (data === null || data === undefined) return data

  if (typeof data === 'string') {
    return data
      .replace(JWT_REGEX, 'Bearer [REDACTED_JWT]')
      .replace(BASIC_AUTH_REGEX, 'Basic [REDACTED_AUTH]')
      .replace(SHA512_HEX_REGEX, '[REDACTED_SHA512]')
      .replace(SHA256_HEX_REGEX, '[REDACTED_SHA256]')
      .replace(SUPABASE_KEY_REGEX, '[REDACTED_KEY]')
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data
  }

  if (data instanceof Error) {
    const isProd = process.env.NODE_ENV === 'production'
    return {
      name: data.name,
      message: sanitizeLogData(data.message, depth + 1),
      code: getErrorCode(data),
      stack: isProd ? undefined : data.stack,
    }
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1))
  }

  if (typeof data === 'object') {
    const sanitizedObj: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()
      if (SENSITIVE_KEYS.has(lowerKey)) {
        sanitizedObj[key] = '[REDACTED]'
      } else {
        sanitizedObj[key] = sanitizeLogData(value, depth + 1)
      }
    }
    return sanitizedObj
  }

  return String(data)
}

/**
 * Format and write structured log entry.
 */
function writeLog(entry: LogEntry): void {
  const isTest = process.env.NODE_ENV === 'test'
  const serialized = JSON.stringify(entry)

  if (isTest) {
    // Keep test runners clean while still allowing test assertions on entry
    return
  }

  if (entry.level === 'error') {
    console.error(serialized)
  } else if (entry.level === 'warn') {
    console.warn(serialized)
  } else {
    console.info(serialized)
  }
}

export interface LogContext {
  requestId?: string
  correlationId?: string
  route?: string
  method?: string
  statusCode?: number
  durationMs?: number
  [key: string]: unknown
}

export const logger = {
  createEntry(
    level: LogEntry['level'],
    message: string,
    context?: LogContext,
    err?: unknown,
  ): LogEntry {
    const { requestId, correlationId, route, method, statusCode, durationMs, ...restContext } =
      context || {}

    const sanitizedContext =
      Object.keys(restContext).length > 0
        ? (sanitizeLogData(restContext) as Record<string, unknown>)
        : undefined

    let errorObj: LogEntry['error'] = undefined
    if (err) {
      if (err instanceof Error) {
        errorObj = {
          name: err.name,
          message: err.message,
          code: getErrorCode(err),
          stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        }
      } else if (err && typeof err === 'object') {
        const errObj = err as Record<string, unknown>
        errorObj = {
          name: typeof errObj.name === 'string' ? errObj.name : 'DatabaseError',
          message:
            typeof errObj.message === 'string'
              ? errObj.message
              : typeof errObj.error_description === 'string'
                ? errObj.error_description
                : JSON.stringify(err),
          code:
            typeof errObj.code === 'string' || typeof errObj.code === 'number'
              ? String(errObj.code)
              : undefined,
        }
      } else {
        errorObj = {
          message: String(err),
        }
      }
    }

    return {
      timestamp: new Date().toISOString(),
      level,
      service: 'shelfstack-frontend',
      environment: process.env.NODE_ENV || 'development',
      message: sanitizeLogData(message) as string,
      requestId,
      correlationId: correlationId || requestId,
      route,
      method,
      statusCode,
      durationMs,
      context: sanitizedContext,
      error: errorObj,
    }
  },

  info(message: string, context?: LogContext): LogEntry {
    const entry = this.createEntry('info', message, context)
    writeLog(entry)
    return entry
  },

  warn(message: string, context?: LogContext, err?: unknown): LogEntry {
    const entry = this.createEntry('warn', message, context, err)
    writeLog(entry)
    return entry
  },

  error(message: string, context?: LogContext, err?: unknown): LogEntry {
    const entry = this.createEntry('error', message, context, err)
    writeLog(entry)
    return entry
  },

  debug(message: string, context?: LogContext): LogEntry {
    const entry = this.createEntry('debug', message, context)
    writeLog(entry)
    return entry
  },
}
