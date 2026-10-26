import { describe, expect, it } from 'vitest'
import { sortProducts } from '~/features/products/utils/product-sort'
import type { Product } from '~/types/product'

function makeProduct(overrides: Partial<Product> = {}, id = 1): Product {
  return { id, name: `Produk ${id}`, price: 0, stock: 0, image_url: null, ...overrides }
}

describe('Sort produk admin (client-side)', () => {
  it('nama A-Z', () => {
    const list = [
      makeProduct({ name: 'Kopi Robusta' }, 1),
      makeProduct({ name: 'Teh Melati' }, 2),
      makeProduct({ name: 'Kopi Arabika' }, 3),
    ]
    expect(sortProducts(list, 'name', 'asc').map((p) => p.name)).toEqual([
      'Kopi Arabika',
      'Kopi Robusta',
      'Teh Melati',
    ])
  })

  it('nama Z-A', () => {
    const list = [
      makeProduct({ name: 'Kopi Robusta' }, 1),
      makeProduct({ name: 'Teh Melati' }, 2),
      makeProduct({ name: 'Kopi Arabika' }, 3),
    ]
    expect(sortProducts(list, 'name', 'desc').map((p) => p.name)).toEqual([
      'Teh Melati',
      'Kopi Robusta',
      'Kopi Arabika',
    ])
  })

  it('harga termurah ke termahal', () => {
    const list = [
      makeProduct({ price: 30000 }, 1),
      makeProduct({ price: 10000 }, 2),
      makeProduct({ price: 20000 }, 3),
    ]
    expect(sortProducts(list, 'price', 'asc').map((p) => p.id)).toEqual([2, 3, 1])
  })

  it('harga termahal ke termurah', () => {
    const list = [
      makeProduct({ price: 30000 }, 1),
      makeProduct({ price: 10000 }, 2),
      makeProduct({ price: 20000 }, 3),
    ]
    expect(sortProducts(list, 'price', 'desc').map((p) => p.id)).toEqual([1, 3, 2])
  })

  it('price_cents diutamakan atas price', () => {
    const list = [
      makeProduct({ price: 99999, price_cents: 5000 }, 1),
      makeProduct({ price: 10000 }, 2),
    ]
    expect(sortProducts(list, 'price', 'asc').map((p) => p.id)).toEqual([1, 2])
  })

  it('stok tersedikit ke terbanyak', () => {
    const list = [
      makeProduct({ stock: 20 }, 1),
      makeProduct({ stock: 3 }, 2),
      makeProduct({ stock: 12 }, 3),
    ]
    expect(sortProducts(list, 'stock', 'asc').map((p) => p.id)).toEqual([2, 3, 1])
  })

  it('stok terbanyak ke tersedikit', () => {
    const list = [
      makeProduct({ stock: 20 }, 1),
      makeProduct({ stock: 3 }, 2),
      makeProduct({ stock: 12 }, 3),
    ]
    expect(sortProducts(list, 'stock', 'desc').map((p) => p.id)).toEqual([1, 3, 2])
  })

  it('tidak memutasi input', () => {
    const list = [
      makeProduct({ name: 'C' }, 3),
      makeProduct({ name: 'A' }, 1),
      makeProduct({ name: 'B' }, 2),
    ]
    const before = list.map((p) => p.id)
    const result = sortProducts(list, 'name', 'asc')
    expect(result).not.toBe(list)
    expect(list.map((p) => p.id)).toEqual(before)
    expect(result.map((p) => p.id)).toEqual([1, 2, 3])
  })

  it('stok dan harga null dianggap 0', () => {
    const list = [
      makeProduct({ price: 15000, stock: 10 }, 1),
      makeProduct({ price: null as unknown as number, stock: null as unknown as number }, 2),
    ]
    expect(sortProducts(list, 'price', 'asc').map((p) => p.id)).toEqual([2, 1])
    expect(sortProducts(list, 'stock', 'asc').map((p) => p.id)).toEqual([2, 1])
  })

  it('daftar kosong tetap kosong', () => {
    expect(sortProducts([], 'name', 'asc')).toEqual([])
    expect(sortProducts([], 'stock', 'desc')).toEqual([])
  })

  it('daftar null atau undefined mengembalikan array kosong', () => {
    expect(sortProducts(null, 'name', 'asc')).toEqual([])
    expect(sortProducts(undefined, 'price', 'desc')).toEqual([])
  })
})
