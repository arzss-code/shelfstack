import { describe, it, expect, beforeEach } from 'vitest'
import {
  TokenBucketLimiter,
  RATE_LIMIT_RULES,
  resolveEndpointCategory,
  type RateLimitConfig,
} from '~/../server/utils/rate-limit'

describe('Token Bucket Rate Limiting & Security (E-08)', () => {
  let limiter: TokenBucketLimiter

  beforeEach(() => {
    limiter = new TokenBucketLimiter()
  })

  describe('Algoritma Token Bucket', () => {
    it('mengizinkan permintaan pertama dengan kuota token penuh', () => {
      const config: RateLimitConfig = { maxTokens: 5, intervalMs: 60000 }
      const now = 1000000

      const result = limiter.checkLimit('test-client-1', config, now)

      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
      expect(result.retryAfter).toBe(0)
      expect(result.reset).toBe(Math.ceil((now + 60000) / 1000))
    })

    it('menolak permintaan dan mengembalikan HTTP 429 Retry-After saat kuota habis', () => {
      const config: RateLimitConfig = { maxTokens: 3, intervalMs: 60000 }
      const now = 1000000

      // Konsumsi 3 token berturut-turut
      limiter.checkLimit('test-client-2', config, now)
      limiter.checkLimit('test-client-2', config, now)
      const third = limiter.checkLimit('test-client-2', config, now)
      expect(third.allowed).toBe(true)
      expect(third.remaining).toBe(0)

      // Permintaan ke-4 harus ditolak
      const blocked = limiter.checkLimit('test-client-2', config, now)
      expect(blocked.allowed).toBe(false)
      expect(blocked.remaining).toBe(0)
      expect(blocked.retryAfter).toBeGreaterThanOrEqual(1)
    })

    it('mengisi ulang (refill) token secara proporsional seiring berjalannya waktu', () => {
      const config: RateLimitConfig = { maxTokens: 2, intervalMs: 20000 } // 1 token per 10 detik
      let now = 1000000

      // Habiskan 2 token
      limiter.checkLimit('test-client-3', config, now)
      limiter.checkLimit('test-client-3', config, now)
      expect(limiter.checkLimit('test-client-3', config, now).allowed).toBe(false)

      // Majukan waktu 10 detik (1 token terisi ulang)
      now += 10000
      const afterTenSec = limiter.checkLimit('test-client-3', config, now)
      expect(afterTenSec.allowed).toBe(true)
      expect(afterTenSec.remaining).toBe(0)

      // Permintaan instan setelahnya ditolak
      expect(limiter.checkLimit('test-client-3', config, now).allowed).toBe(false)

      // Majukan waktu 20 detik (2 token penuh kembali)
      now += 20000
      const fullyRefilled = limiter.checkLimit('test-client-3', config, now)
      expect(fullyRefilled.allowed).toBe(true)
      expect(fullyRefilled.remaining).toBe(1)
    })

    it('mengisolasi kuota token antar alamat IP klien secara independen', () => {
      const config: RateLimitConfig = { maxTokens: 1, intervalMs: 60000 }
      const now = 1000000

      // Klien A habiskan kuota
      const clientA1 = limiter.checkLimit('ip:192.168.1.1', config, now)
      expect(clientA1.allowed).toBe(true)
      const clientA2 = limiter.checkLimit('ip:192.168.1.1', config, now)
      expect(clientA2.allowed).toBe(false)

      // Klien B tetap memiliki kuota mandiri
      const clientB1 = limiter.checkLimit('ip:192.168.1.2', config, now)
      expect(clientB1.allowed).toBe(true)
      expect(clientB1.remaining).toBe(0)
    })

    it('mendukung penghapusan memori bucket lewat reset()', () => {
      const config: RateLimitConfig = { maxTokens: 1, intervalMs: 60000 }
      const now = 1000000

      limiter.checkLimit('ip:to-reset', config, now)
      expect(limiter.checkLimit('ip:to-reset', config, now).allowed).toBe(false)

      limiter.reset('ip:to-reset')
      expect(limiter.checkLimit('ip:to-reset', config, now).allowed).toBe(true)
    })
  })

  describe('Resolusi Kategori Endpoint & Konfigurasi Kuota (SOP E-08)', () => {
    it('memetakan endpoint autentikasi ke kategori auth dengan limit 5 req/menit', () => {
      expect(resolveEndpointCategory('/api/auth/login', 'POST')).toBe('auth')
      expect(resolveEndpointCategory('/api/auth/register', 'POST')).toBe('auth')
      expect(resolveEndpointCategory('/api/auth/session', 'GET')).toBe('auth')

      expect(RATE_LIMIT_RULES.auth).toEqual({
        maxTokens: 5,
        intervalMs: 60000,
        cost: 1,
      })
    })

    it('memetakan pembuatan pesanan ke kategori checkout dengan limit 10 req/menit', () => {
      expect(resolveEndpointCategory('/api/orders', 'POST')).toBe('checkout')
      // GET orders (daftar pesanan pembeli) tidak dibatasi limit checkout
      expect(resolveEndpointCategory('/api/orders', 'GET')).toBeNull()

      expect(RATE_LIMIT_RULES.checkout).toEqual({
        maxTokens: 10,
        intervalMs: 60000,
        cost: 1,
      })
    })

    it('memetakan pencarian instan ke kategori search dengan limit 30 req/menit', () => {
      expect(resolveEndpointCategory('/api/products/search-instant', 'GET')).toBe('search')

      expect(RATE_LIMIT_RULES.search).toEqual({
        maxTokens: 30,
        intervalMs: 60000,
        cost: 1,
      })
    })

    it('mengabaikan endpoint statis dan endpoint publik lainnya', () => {
      expect(resolveEndpointCategory('/api/products', 'GET')).toBeNull()
      expect(resolveEndpointCategory('/api/health', 'GET')).toBeNull()
      expect(resolveEndpointCategory('/sitemap.xml', 'GET')).toBeNull()
    })
  })
})
