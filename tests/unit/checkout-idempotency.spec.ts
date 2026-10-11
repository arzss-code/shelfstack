import { describe, expect, it } from 'vitest'
import { calculateCheckoutHash, validateIdempotencyKey } from '../../server/utils/idempotency'
import type { CheckoutInput } from '../../shared/schemas/order'

/**
 * Unit Test Suite: Checkout Idempotency Pattern (Task 02)
 *
 * Menguji:
 * 1. Validasi header Idempotency-Key
 * 2. Deterministic request hashing (array order agnostic, whitespace trimming)
 * 3. Idempotency state simulator:
 *    - First request creates order
 *    - Same key + same payload returns existing order (idempotent replay)
 *    - Same key + different payload returns 409 Conflict
 *    - User isolation (User A & User B with same key do not collide)
 *    - Failure rollback (failed attempt allows retry with same key)
 */

describe('Idempotency Key Validation (validateIdempotencyKey)', () => {
  it('mengizinkan undefined atau null untuk backward compatibility', () => {
    expect(validateIdempotencyKey(undefined)).toEqual({ isValid: true, key: null })
    expect(validateIdempotencyKey(null)).toEqual({ isValid: true, key: null })
  })

  it('memvalidasi UUID dan string alfanumerik yang valid', () => {
    const uuidKey = 'b129f62c-152e-44cf-9fa6-f12a548168d1'
    expect(validateIdempotencyKey(uuidKey)).toEqual({ isValid: true, key: uuidKey })

    const customKey = 'checkout_user123:req-999.v1'
    expect(validateIdempotencyKey(customKey)).toEqual({ isValid: true, key: customKey })
  })

  it('menolak string kosong atau whitespace saja', () => {
    const resEmpty = validateIdempotencyKey('')
    expect(resEmpty.isValid).toBe(false)
    expect(resEmpty.error).toContain('tidak boleh berupa string kosong')

    const resWhitespace = validateIdempotencyKey('   ')
    expect(resWhitespace.isValid).toBe(false)
  })

  it('menolak key yang melebihi batas maksimal 255 karakter', () => {
    const longKey = 'a'.repeat(256)
    const res = validateIdempotencyKey(longKey)
    expect(res.isValid).toBe(false)
    expect(res.error).toContain('255 karakter')
  })

  it('menolak karakter berbahaya atau control characters', () => {
    expect(validateIdempotencyKey('key with spaces').isValid).toBe(false)
    expect(validateIdempotencyKey('key\nnewline').isValid).toBe(false)
    expect(validateIdempotencyKey('key<script>').isValid).toBe(false)
  })
})

describe('Deterministic Request Hashing (calculateCheckoutHash)', () => {
  const samplePayload1: CheckoutInput = {
    items: [
      { product_id: 102, qty: 2 },
      { product_id: 101, qty: 1 },
    ],
    address: {
      name: 'Budi Santoso',
      phone: '081234567890',
      street: 'Jl. Sudirman No. 10',
      city: 'Jakarta',
      postal: '10220',
      note: 'Dekat pos satpam',
    },
  }

  const samplePayload1DifferentItemOrder: CheckoutInput = {
    items: [
      { product_id: 101, qty: 1 },
      { product_id: 102, qty: 2 },
    ],
    address: {
      name: '  Budi Santoso  ',
      phone: '081234567890',
      street: 'Jl. Sudirman No. 10',
      city: 'Jakarta',
      postal: '10220',
      note: 'Dekat pos satpam  ',
    },
  }

  it('menghasilkan hash identik meskipun urutan array items berbeda dan terdapat spasi pinggir di alamat', () => {
    const hashA = calculateCheckoutHash(samplePayload1)
    const hashB = calculateCheckoutHash(samplePayload1DifferentItemOrder)

    expect(hashA).toBe(hashB)
    expect(hashA).toHaveLength(64) // SHA-256 hex string
  })

  it('menghasilkan hash berbeda jika kuantitas item diubah', () => {
    const modifiedPayload: CheckoutInput = {
      ...samplePayload1,
      items: [
        { product_id: 101, qty: 2 }, // Berubah dari 1 menjadi 2
        { product_id: 102, qty: 2 },
      ],
    }

    const hashOrig = calculateCheckoutHash(samplePayload1)
    const hashMod = calculateCheckoutHash(modifiedPayload)

    expect(hashOrig).not.toBe(hashMod)
  })

  it('menghasilkan hash berbeda jika alamat pengiriman diubah', () => {
    const modifiedPayload: CheckoutInput = {
      ...samplePayload1,
      address: {
        ...samplePayload1.address,
        city: 'Bandung',
      },
    }

    const hashOrig = calculateCheckoutHash(samplePayload1)
    const hashMod = calculateCheckoutHash(modifiedPayload)

    expect(hashOrig).not.toBe(hashMod)
  })
})

describe('Idempotency State & Concurrency Simulation', () => {
  interface StoredIdempotencyKey {
    userId: string
    key: string
    requestHash: string
    orderId: string
  }

  interface MockProduct {
    id: number
    stock: number
  }

  class CheckoutIdempotencySimulator {
    public idempotencyKeys: Map<string, StoredIdempotencyKey> = new Map()
    public products: Map<number, MockProduct> = new Map()
    public orders: Array<{ id: string; userId: string; items: any[] }> = []

    constructor(initialProducts: MockProduct[]) {
      initialProducts.forEach((p) => this.products.set(p.id, { ...p }))
    }

    private makeScopedKey(userId: string, key: string): string {
      return `${userId}:::${key}`
    }

    public createOrder(
      userId: string,
      payload: CheckoutInput,
      idempotencyKey?: string,
    ): { status: 'created' | 'replayed' | 'conflict'; orderId?: string; error?: string } {
      const requestHash = idempotencyKey ? calculateCheckoutHash(payload) : null

      if (idempotencyKey) {
        const scopedKey = this.makeScopedKey(userId, idempotencyKey)
        const existing = this.idempotencyKeys.get(scopedKey)

        if (existing) {
          if (existing.requestHash !== requestHash) {
            return {
              status: 'conflict',
              error: `IDEMPOTENCY_CONFLICT: Key "${idempotencyKey}" used with different payload`,
            }
          }
          return { status: 'replayed', orderId: existing.orderId }
        }
      }

      // Check stock
      for (const item of payload.items) {
        const prod = this.products.get(item.product_id)
        if (!prod || prod.stock < item.qty) {
          throw new Error(`Insufficient stock for product ${item.product_id}`)
        }
      }

      // Deduct stock
      for (const item of payload.items) {
        const prod = this.products.get(item.product_id)!
        prod.stock -= item.qty
      }

      // Create order
      const newOrderId = `ord-${this.orders.length + 1}`
      this.orders.push({
        id: newOrderId,
        userId,
        items: [...payload.items],
      })

      // Store idempotency record
      if (idempotencyKey && requestHash) {
        this.idempotencyKeys.set(this.makeScopedKey(userId, idempotencyKey), {
          userId,
          key: idempotencyKey,
          requestHash,
          orderId: newOrderId,
        })
      }

      return { status: 'created', orderId: newOrderId }
    }
  }

  const samplePayload: CheckoutInput = {
    items: [{ product_id: 1, qty: 2 }],
    address: {
      name: 'Alice',
      phone: '08123456789',
      street: 'Jl. Merdeka 1',
      city: 'Jakarta',
      postal: '10110',
    },
  }

  it('request pertama dengan Idempotency-Key sukses membuat order dan memotong stok', () => {
    const sim = new CheckoutIdempotencySimulator([{ id: 1, stock: 10 }])
    const res = sim.createOrder('user-1', samplePayload, 'key-abc')

    expect(res.status).toBe('created')
    expect(res.orderId).toBe('ord-1')
    expect(sim.products.get(1)!.stock).toBe(8)
    expect(sim.orders).toHaveLength(1)
  })

  it('retry dengan key dan payload sama mengembalikan order yang sama tanpa membuat order baru atau memotong stok kedua kali', () => {
    const sim = new CheckoutIdempotencySimulator([{ id: 1, stock: 10 }])

    // Request pertama
    const res1 = sim.createOrder('user-1', samplePayload, 'key-abc')
    expect(res1.status).toBe('created')

    // Request kedua (retry jaringan / double-click)
    const res2 = sim.createOrder('user-1', samplePayload, 'key-abc')
    expect(res2.status).toBe('replayed')
    expect(res2.orderId).toBe(res1.orderId)

    // Invarian: stok tetap 8 (hanya dipotong 1x) dan total order tetap 1
    expect(sim.products.get(1)!.stock).toBe(8)
    expect(sim.orders).toHaveLength(1)
  })

  it('same key dengan payload berbeda menghasilkan conflict (409) dan tidak mengubah order pertama', () => {
    const sim = new CheckoutIdempotencySimulator([{ id: 1, stock: 10 }])

    // Request pertama
    const res1 = sim.createOrder('user-1', samplePayload, 'key-abc')
    expect(res1.status).toBe('created')

    // Request kedua dengan payload berbeda
    const differentPayload: CheckoutInput = {
      ...samplePayload,
      items: [{ product_id: 1, qty: 5 }],
    }
    const res2 = sim.createOrder('user-1', differentPayload, 'key-abc')

    expect(res2.status).toBe('conflict')
    expect(res2.error).toContain('IDEMPOTENCY_CONFLICT')

    // Invarian: stok tetap 8 (order kedua ditolak) dan total order tetap 1
    expect(sim.products.get(1)!.stock).toBe(8)
    expect(sim.orders).toHaveLength(1)
  })

  it('user isolation: User A dan User B dengan key yang sama tidak saling bertabrakan', () => {
    const sim = new CheckoutIdempotencySimulator([{ id: 1, stock: 20 }])

    const resA = sim.createOrder('user-a', samplePayload, 'common-key')
    const resB = sim.createOrder('user-b', samplePayload, 'common-key')

    expect(resA.status).toBe('created')
    expect(resB.status).toBe('created')
    expect(resA.orderId).not.toBe(resB.orderId)

    // Kedua user berhasil membuat order masing-masing
    expect(sim.orders).toHaveLength(2)
    expect(sim.products.get(1)!.stock).toBe(16) // 20 - 2 - 2
  })

  it('failure safety: jika order pertama gagal karena stok kurang, retry dengan key yang sama dapat diproses saat stok tersedia', () => {
    const sim = new CheckoutIdempotencySimulator([{ id: 1, stock: 1 }]) // Stok hanya 1, butuh 2

    // Request pertama gagal
    expect(() => sim.createOrder('user-1', samplePayload, 'key-fail-test')).toThrow(
      'Insufficient stock',
    )
    expect(sim.orders).toHaveLength(0)

    // Merchant menambah stok produk
    sim.products.get(1)!.stock = 10

    // Retry dengan key yang sama sekarang berhasil
    const retryRes = sim.createOrder('user-1', samplePayload, 'key-fail-test')
    expect(retryRes.status).toBe('created')
    expect(retryRes.orderId).toBe('ord-1')
    expect(sim.products.get(1)!.stock).toBe(8)
  })
})
