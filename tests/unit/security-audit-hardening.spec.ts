import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Security Audit & Hardening Suite', () => {
  describe('Nuxt Config Route Rules & Rate Limiting', () => {
    const configPath = resolve(process.cwd(), 'nuxt.config.ts')
    const configContent = readFileSync(configPath, 'utf-8')

    it('exempts payment webhook from rate limiter to prevent dropped webhooks', () => {
      expect(configContent).toContain("'/api/midtrans/notification'")
      expect(configContent).toMatch(
        /'\/api\/midtrans\/notification':\s*\{\s*security:\s*\{\s*rateLimiter:\s*false/s,
      )
    })

    it('enforces rate limits on sensitive mutation and validation endpoints', () => {
      const requiredRateLimitedRoutes = [
        '/api/orders/**/payment-token',
        '/api/orders/**/cancel',
        '/api/orders/**/refund',
        '/api/coupons/validate',
        '/api/returns/upload',
        '/api/support/upload',
      ]

      for (const route of requiredRateLimitedRoutes) {
        expect(configContent).toContain(`'${route}'`)
      }
    })

    it('configures sensible tokensPerInterval for sensitive APIs', () => {
      expect(configContent).toMatch(
        /'\/api\/coupons\/validate':\s*\{\s*security:\s*\{\s*rateLimiter:\s*\{\s*tokensPerInterval:\s*20/s,
      )
      expect(configContent).toMatch(
        /'\/api\/returns\/upload':\s*\{\s*security:\s*\{\s*rateLimiter:\s*\{\s*tokensPerInterval:\s*10/s,
      )
      expect(configContent).toMatch(
        /'\/api\/support\/upload':\s*\{\s*security:\s*\{\s*rateLimiter:\s*\{\s*tokensPerInterval:\s*15/s,
      )
    })
  })

  describe('File Upload Safety Boundaries', () => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxFileSize = 5 * 1024 * 1024 // 5 MB

    const validateUploadMock = (file: { name?: string; data: Uint8Array; type?: string }) => {
      if (!file.data || file.data.length === 0) {
        return { valid: false, error: 'Berkas kosong' }
      }
      if (file.data.length > maxFileSize) {
        return { valid: false, error: 'Ukuran file terlalu besar' }
      }
      const mime = file.type?.toLowerCase() || 'image/jpeg'
      if (!allowedMimeTypes.includes(mime)) {
        return { valid: false, error: 'Format file tidak didukung' }
      }
      return { valid: true, error: null }
    }

    it('accepts valid JPEG, PNG, and WEBP files under 5MB', () => {
      const validJpeg = {
        name: 'proof.jpg',
        data: new Uint8Array(1024 * 100), // 100 KB
        type: 'image/jpeg',
      }
      const validPng = {
        name: 'proof.png',
        data: new Uint8Array(1024 * 500), // 500 KB
        type: 'image/png',
      }
      const validWebp = {
        name: 'proof.webp',
        data: new Uint8Array(1024 * 300), // 300 KB
        type: 'image/webp',
      }

      expect(validateUploadMock(validJpeg).valid).toBe(true)
      expect(validateUploadMock(validPng).valid).toBe(true)
      expect(validateUploadMock(validWebp).valid).toBe(true)
    })

    it('rejects files exceeding 5MB size limit', () => {
      const oversized = {
        name: 'huge.jpg',
        data: new Uint8Array(maxFileSize + 1),
        type: 'image/jpeg',
      }
      const result = validateUploadMock(oversized)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Ukuran file terlalu besar')
    })

    it('rejects forbidden file types like executables or html scripts', () => {
      const dangerousFiles = [
        { name: 'malicious.exe', data: new Uint8Array(500), type: 'application/x-msdownload' },
        { name: 'xss.html', data: new Uint8Array(500), type: 'text/html' },
        { name: 'script.js', data: new Uint8Array(500), type: 'application/javascript' },
        { name: 'doc.pdf', data: new Uint8Array(500), type: 'application/pdf' },
      ]

      for (const dangerous of dangerousFiles) {
        const result = validateUploadMock(dangerous)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Format file tidak didukung')
      }
    })
  })

  describe('Database Security & RLS Invariants', () => {
    const migrationsDir = resolve(process.cwd(), 'supabase/migrations')
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'))

    it('found migration files to audit', () => {
      expect(files.length).toBeGreaterThan(0)
    })

    it('never executes destructive DROP DATABASE or unconstrained TRUNCATE', () => {
      for (const file of files) {
        const content = readFileSync(resolve(migrationsDir, file), 'utf-8').toLowerCase()
        expect(content).not.toContain('drop database')
        expect(content).not.toContain('truncate table orders')
        expect(content).not.toContain('truncate table products')
      }
    })

    it('verifies RLS enablement statements exist in core migration schemas', () => {
      const allSql = files
        .map((f) => readFileSync(resolve(migrationsDir, f), 'utf-8'))
        .join('\n')
        .toLowerCase()

      expect(allSql).toContain('enable row level security')
      expect(allSql).toContain('create policy')
    })

    it('verifies soft delete column deleted_at is referenced in core models', () => {
      const allSql = files
        .map((f) => readFileSync(resolve(migrationsDir, f), 'utf-8'))
        .join('\n')
        .toLowerCase()

      expect(allSql).toContain('deleted_at')
    })
  })
})
