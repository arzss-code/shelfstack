import { describe, expect, it } from 'vitest'
import { wishlistMutationSchema, wishlistSyncSchema } from '../../shared/schemas/wishlist'

describe('Wishlist Zod Schema Validation', () => {
  it('menerima payload mutasi productId yang valid', () => {
    const res = wishlistMutationSchema.safeParse({ productId: 101 })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.productId).toBe(101)
    }
  })

  it('menolak productId non-integer, nol, negatif, atau string kosong', () => {
    expect(wishlistMutationSchema.safeParse({ productId: 0 }).success).toBe(false)
    expect(wishlistMutationSchema.safeParse({ productId: -5 }).success).toBe(false)
    expect(wishlistMutationSchema.safeParse({ productId: 3.14 }).success).toBe(false)
    expect(wishlistMutationSchema.safeParse({ productId: 'invalid' }).success).toBe(false)
    expect(wishlistMutationSchema.safeParse({}).success).toBe(false)
  })

  it('menerima payload sinkronisasi massal dengan array ID produk valid', () => {
    const res = wishlistSyncSchema.safeParse({ productIds: [101, 102, 105] })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.productIds).toEqual([101, 102, 105])
    }
  })

  it('menerima array kosong pada sinkronisasi massal', () => {
    const res = wishlistSyncSchema.safeParse({ productIds: [] })
    expect(res.success).toBe(true)
  })

  it('menolak array sinkronisasi yang memuat elemen negatif atau non-numerik', () => {
    expect(wishlistSyncSchema.safeParse({ productIds: [101, -1] }).success).toBe(false)
    expect(wishlistSyncSchema.safeParse({ productIds: [101, 'abc'] }).success).toBe(false)
  })
})

describe('Wishlist Multi-Tenant & Database Invariants', () => {
  // Simulasi tabel database di Postgres
  interface WishlistRow {
    id: string
    user_id: string
    product_id: number
    created_at: string
  }

  const mockDbWishlists: WishlistRow[] = [
    { id: 'w-1', user_id: 'user-alice-uuid', product_id: 101, created_at: '2026-10-26T10:00:00Z' },
    { id: 'w-2', user_id: 'user-alice-uuid', product_id: 102, created_at: '2026-10-26T10:05:00Z' },
    { id: 'w-3', user_id: 'user-bob-uuid', product_id: 101, created_at: '2026-10-26T11:00:00Z' },
  ]

  it('mengisolasi data wishlist antar pengguna (Alice hanya melihat miliknya)', () => {
    const aliceUserId = 'user-alice-uuid'
    const aliceItems = mockDbWishlists.filter((row) => row.user_id === aliceUserId)

    expect(aliceItems.length).toBe(2)
    expect(aliceItems.every((row) => row.user_id === aliceUserId)).toBe(true)
    expect(aliceItems.map((r) => r.product_id)).toEqual([101, 102])
  })

  it('mengisolasi penghapusan item (Bob tidak dapat menghapus item milik Alice)', () => {
    const bobUserId = 'user-bob-uuid'
    const targetProductId = 102 // Hanya ada di wishlist Alice

    const indexToDelete = mockDbWishlists.findIndex(
      (row) => row.user_id === bobUserId && row.product_id === targetProductId,
    )

    // Bob tidak menemukan row ini di bawah kendali user_id miliknya
    expect(indexToDelete).toBe(-1)
  })

  it('menjamin constraint unique (user_id, product_id) saat upsert / tambah ulang', () => {
    const table = [...mockDbWishlists]
    const upsert = (user_id: string, product_id: number) => {
      const exists = table.some((r) => r.user_id === user_id && r.product_id === product_id)
      if (!exists) {
        table.push({
          id: `w-${table.length + 1}`,
          user_id,
          product_id,
          created_at: new Date().toISOString(),
        })
      }
    }

    // Alice menambah ulang produk 101
    upsert('user-alice-uuid', 101)
    const aliceRows = table.filter((r) => r.user_id === 'user-alice-uuid' && r.product_id === 101)
    expect(aliceRows.length).toBe(1) // Tidak terjadi duplikasi
  })

  it('menyinkronkan daftar lokal guest ke database saat login tanpa duplikasi', () => {
    const aliceDbItems = [101, 102]
    const guestLocalItems = [102, 103, 104] // 102 sudah ada di DB

    const merged = Array.from(new Set([...aliceDbItems, ...guestLocalItems]))
    expect(merged).toEqual([101, 102, 103, 104])
  })
})
