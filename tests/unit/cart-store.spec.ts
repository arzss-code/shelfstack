import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '../../app/features/cart/stores/cart'

describe('useCartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('menginisialisasi keranjang dalam kondisi kosong', () => {
    const cart = useCartStore()
    expect(cart.items).toEqual([])
    expect(cart.totalItems).toBe(0)
    expect(cart.totalPrice).toBe(0)
    expect(cart.isEmpty).toBe(true)
  })

  it('menambahkan item baru dan menghitung total harga dengan benar', () => {
    const cart = useCartStore()
    cart.addItem({
      productId: 1,
      name: 'Mechanical Keyboard',
      price: 1500000,
      stock: 10,
      quantity: 2,
      openCartDrawer: false,
    })

    expect(cart.items.length).toBe(1)
    expect(cart.totalItems).toBe(2)
    expect(cart.totalPrice).toBe(3000000)
    expect(cart.totalPriceCents).toBe(300000000)
    expect(cart.isEmpty).toBe(false)
  })

  it('mengakumulasi kuantitas jika item yang sama ditambahkan kembali', () => {
    const cart = useCartStore()
    cart.addItem({
      productId: 1,
      name: 'Mechanical Keyboard',
      price: 1500000,
      stock: 5,
      quantity: 2,
      openCartDrawer: false,
    })

    cart.addItem({
      productId: 1,
      name: 'Mechanical Keyboard',
      price: 1500000,
      stock: 5,
      quantity: 2,
      openCartDrawer: false,
    })

    expect(cart.items.length).toBe(1)
    expect(cart.totalItems).toBe(4)
  })

  it('tidak melebihi batas stok yang tersedia', () => {
    const cart = useCartStore()
    cart.addItem({
      productId: 1,
      name: 'Mechanical Keyboard',
      price: 1500000,
      stock: 3,
      quantity: 5,
      openCartDrawer: false,
    })

    expect(cart.items[0].quantity).toBe(3)
  })

  it('memperbarui kuantitas dan menghapus jika kuantitas <= 0', () => {
    const cart = useCartStore()
    cart.addItem({
      productId: 1,
      name: 'Mechanical Keyboard',
      price: 1500000,
      stock: 10,
      quantity: 2,
      openCartDrawer: false,
    })

    cart.updateQuantity(1, 4)
    expect(cart.totalItems).toBe(4)

    cart.updateQuantity(1, 0)
    expect(cart.items.length).toBe(0)
    expect(cart.isEmpty).toBe(true)
  })

  it('menghapus item secara spesifik dan membersihkan seluruh isi keranjang', () => {
    const cart = useCartStore()
    cart.addItem({
      productId: 1,
      name: 'Item A',
      price: 10000,
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })
    cart.addItem({
      productId: 2,
      name: 'Item B',
      price: 20000,
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })

    expect(cart.items.length).toBe(2)

    cart.removeItem(1)
    expect(cart.items.length).toBe(1)
    expect(cart.items[0].productId).toBe(2)

    cart.clearCart()
    expect(cart.items.length).toBe(0)
  })
})
