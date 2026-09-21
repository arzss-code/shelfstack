import { describe, expect, it } from 'vitest'
import { productListQuerySchema, productSchema } from '../../shared/schemas/product'

const validProduct = {
  name: 'Kopi Susu 250ml',
  price: 18000,
  description: 'Kopi susu gula aren',
  link: null,
  image_url: null,
}

describe('productSchema', () => {
  it('menerima produk valid', () => {
    expect(productSchema.safeParse(validProduct).success).toBe(true)
  })

  it('menolak nama kosong / terlalu pendek (kasus PRD-1-02)', () => {
    const result = productSchema.safeParse({ ...validProduct, name: '' })
    expect(result.success).toBe(false)
  })

  it('menolak harga negatif (kasus PRD-1-02)', () => {
    const result = productSchema.safeParse({ ...validProduct, price: -10 })
    expect(result.success).toBe(false)
  })

  it('menolak harga nol', () => {
    const result = productSchema.safeParse({ ...validProduct, price: 0 })
    expect(result.success).toBe(false)
  })

  it('menolak link bukan URL', () => {
    const result = productSchema.safeParse({ ...validProduct, link: 'bukan-url' })
    expect(result.success).toBe(false)
  })

  it('menerima field opsional yang dihilangkan', () => {
    const { description, link, image_url, ...minimal } = validProduct
    expect(productSchema.safeParse(minimal).success).toBe(true)
  })
})

describe('productListQuerySchema', () => {
  it('memakai default from=0 to=11 saat query kosong', () => {
    expect(productListQuerySchema.parse({})).toEqual({ from: 0, to: 11 })
  })

  it('meng-coerce string query menjadi angka', () => {
    expect(productListQuerySchema.parse({ from: '12', to: '23' })).toEqual({ from: 12, to: 23 })
  })

  it('menolak from negatif', () => {
    expect(productListQuerySchema.safeParse({ from: -1 }).success).toBe(false)
  })
})
