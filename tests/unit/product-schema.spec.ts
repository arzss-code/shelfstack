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

  it('menerima stok fisik integer valid dan default 0', () => {
    const resWithStock = productSchema.safeParse({ ...validProduct, stock: 15 })
    expect(resWithStock.success).toBe(true)
    if (resWithStock.success) {
      expect(resWithStock.data.stock).toBe(15)
    }

    const resDefault = productSchema.safeParse(validProduct)
    expect(resDefault.success).toBe(true)
    if (resDefault.success) {
      expect(resDefault.data.stock).toBe(0)
    }
  })

  it('menolak stok negatif atau bukan bilangan bulat', () => {
    expect(productSchema.safeParse({ ...validProduct, stock: -1 }).success).toBe(false)
    expect(productSchema.safeParse({ ...validProduct, stock: 2.5 }).success).toBe(false)
  })

  it('menerima category_id valid UUID dan menolak non-UUID', () => {
    expect(
      productSchema.safeParse({
        ...validProduct,
        category_id: '28082f15-1fd6-425e-9f6e-ed197c591c39',
      }).success,
    ).toBe(true)

    expect(
      productSchema.safeParse({
        ...validProduct,
        category_id: 'bukan-uuid',
      }).success,
    ).toBe(false)
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

  it('menerima query filter pencarian, kategori, harga, dan sort', () => {
    const parsed = productListQuerySchema.parse({
      q: '  meja kayu  ',
      category: 'meja-kerja',
      min_price: '500000',
      max_price: '2000000',
      min_rating: '4.5',
      stock_status: 'in_stock',
      sort: 'popular',
      page: '2',
      limit: '12',
    })
    expect(parsed).toEqual({
      from: 0,
      to: 11,
      q: 'meja kayu',
      category: 'meja-kerja',
      min_price: 500000,
      max_price: 2000000,
      min_rating: 4.5,
      stock_status: 'in_stock',
      sort: 'popular',
      page: 2,
      limit: 12,
    })
  })

  it('memvalidasi jangkauan min_rating (0-5)', () => {
    expect(productListQuerySchema.parse({ min_rating: '0' }).min_rating).toBe(0)
    expect(productListQuerySchema.parse({ min_rating: '5' }).min_rating).toBe(5)
    expect(productListQuerySchema.safeParse({ min_rating: '-1' }).success).toBe(false)
    expect(productListQuerySchema.safeParse({ min_rating: '5.1' }).success).toBe(false)
  })

  it('menolak sort dan stock_status yang tidak terdaftar', () => {
    expect(productListQuerySchema.safeParse({ sort: 'invalid-sort' }).success).toBe(false)
    expect(productListQuerySchema.safeParse({ stock_status: 'unknown' }).success).toBe(false)
  })
})
