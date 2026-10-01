import { describe, expect, it } from 'vitest'
import {
  checkoutAddressSchema,
  checkoutItemSchema,
  checkoutSchema,
} from '../../shared/schemas/order'

const validAddress = {
  name: 'Budi Santoso',
  phone: '081234567890',
  street: 'Jl. Jenderal Sudirman No. 45, Jakarta Pusat',
  city: 'Jakarta Pusat',
  postal: '10220',
  note: 'Tolong titipkan di pos satpam.',
}

const validItem = {
  product_id: 1,
  qty: 2,
}

describe('checkoutItemSchema', () => {
  it('menerima item produk yang valid', () => {
    const result = checkoutItemSchema.safeParse(validItem)
    expect(result.success).toBe(true)
  })

  it('menolak kuantitas 0 atau negatif', () => {
    expect(checkoutItemSchema.safeParse({ product_id: 1, qty: 0 }).success).toBe(false)
    expect(checkoutItemSchema.safeParse({ product_id: 1, qty: -2 }).success).toBe(false)
  })

  it('menolak kuantitas melebihi batas 99', () => {
    expect(checkoutItemSchema.safeParse({ product_id: 1, qty: 100 }).success).toBe(false)
  })

  it('menolak product_id non-positif atau desimal', () => {
    expect(checkoutItemSchema.safeParse({ product_id: 0, qty: 1 }).success).toBe(false)
    expect(checkoutItemSchema.safeParse({ product_id: 1.5, qty: 1 }).success).toBe(false)
  })
})

describe('checkoutAddressSchema', () => {
  it('menerima alamat pengiriman yang lengkap dan valid', () => {
    const result = checkoutAddressSchema.safeParse(validAddress)
    expect(result.success).toBe(true)
  })

  it('menerima alamat tanpa catatan opsional', () => {
    const { note: _, ...withoutNote } = validAddress
    const result = checkoutAddressSchema.safeParse(withoutNote)
    expect(result.success).toBe(true)
  })

  it('menolak nama penerima terlalu pendek', () => {
    const result = checkoutAddressSchema.safeParse({ ...validAddress, name: 'Al' })
    expect(result.success).toBe(false)
  })

  it('menolak nomor telepon terlalu pendek atau karakter ilegal', () => {
    expect(checkoutAddressSchema.safeParse({ ...validAddress, phone: '123' }).success).toBe(false)
    expect(checkoutAddressSchema.safeParse({ ...validAddress, phone: '0812abc88' }).success).toBe(
      false,
    )
  })

  it('menolak jalan/alamat terlalu pendek', () => {
    const result = checkoutAddressSchema.safeParse({ ...validAddress, street: 'Jl. ABC' })
    expect(result.success).toBe(false)
  })

  it('menolak kode pos bukan angka atau kurang dari 5 digit', () => {
    expect(checkoutAddressSchema.safeParse({ ...validAddress, postal: '1234' }).success).toBe(false)
    expect(checkoutAddressSchema.safeParse({ ...validAddress, postal: 'ABCDE' }).success).toBe(
      false,
    )
  })
})

describe('checkoutSchema', () => {
  it('menerima payload checkout lengkap', () => {
    const payload = {
      items: [validItem],
      address: validAddress,
    }
    const result = checkoutSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('menolak checkout dengan keranjang kosong', () => {
    const payload = {
      items: [],
      address: validAddress,
    }
    const result = checkoutSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })
})
