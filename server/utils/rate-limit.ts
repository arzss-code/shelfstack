export interface RateLimitConfig {
  maxTokens: number
  intervalMs: number
  cost?: number
}

export interface TokenBucketState {
  tokens: number
  lastRefill: number
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter: number
}

export const RATE_LIMIT_RULES: Record<string, RateLimitConfig> = {
  auth: { maxTokens: 5, intervalMs: 60000, cost: 1 },
  checkout: { maxTokens: 10, intervalMs: 60000, cost: 1 },
  search: { maxTokens: 30, intervalMs: 60000, cost: 1 },
}

export class TokenBucketLimiter {
  private buckets = new Map<string, TokenBucketState>()

  /**
   * Evaluasi ketersediaan token bucket untuk kunci spesifik.
   * Mendukung mock stempel waktu untuk pengujian deterministik.
   */
  public checkLimit(
    key: string,
    config: RateLimitConfig,
    now: number = Date.now(),
  ): RateLimitResult {
    const cost = config.cost ?? 1
    let state = this.buckets.get(key)

    if (!state) {
      state = {
        tokens: config.maxTokens,
        lastRefill: now,
      }
      this.buckets.set(key, state)
    }

    // Hitung penambahan token proporsional terhadap durasi yang lewat
    const elapsed = Math.max(0, now - state.lastRefill)
    const refillRatePerMs = config.maxTokens / config.intervalMs
    const refilledTokens = elapsed * refillRatePerMs

    state.tokens = Math.min(config.maxTokens, state.tokens + refilledTokens)
    state.lastRefill = now

    // Waktu reset token penuh (dalam detik epoch)
    const reset = Math.ceil((now + config.intervalMs) / 1000)

    if (state.tokens >= cost) {
      state.tokens -= cost
      return {
        allowed: true,
        limit: config.maxTokens,
        remaining: Math.floor(state.tokens),
        reset,
        retryAfter: 0,
      }
    }

    // Token habis: hitung waktu tunggu hingga 1 token kembali tersedia
    const deficit = cost - state.tokens
    const retryAfterMs = deficit / refillRatePerMs
    const retryAfter = Math.max(1, Math.ceil(retryAfterMs / 1000))

    return {
      allowed: false,
      limit: config.maxTokens,
      remaining: 0,
      reset,
      retryAfter,
    }
  }

  public reset(key?: string): void {
    if (key) {
      this.buckets.delete(key)
    } else {
      this.buckets.clear()
    }
  }
}

export const globalRateLimiter = new TokenBucketLimiter()

/**
 * Petakan URL path dan metode HTTP ke kategori rate limit yang sesuai.
 */
export function resolveEndpointCategory(
  pathname: string,
  method: string = 'GET',
): 'auth' | 'checkout' | 'search' | null {
  const normalizedPath = pathname.split('?')[0] || ''
  const upperMethod = method.toUpperCase()

  if (normalizedPath.startsWith('/api/auth')) {
    return 'auth'
  }
  if (normalizedPath === '/api/orders' && upperMethod === 'POST') {
    return 'checkout'
  }
  if (normalizedPath === '/api/products/search-instant') {
    return 'search'
  }
  return null
}
