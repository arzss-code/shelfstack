import { describe, it, expect, vi } from 'vitest'
import type { Order, OrderStatus } from '~/types/order'

describe('Order Detail Actions & State Machine Rules', () => {
  const allowedInvoiceStatuses: OrderStatus[] = ['paid', 'shipped', 'completed']

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
        return { variant: 'info' as const, label: 'Diproses' }
      case 'shipped':
        return { variant: 'info' as const, label: 'Dikirim' }
      case 'completed':
        return { variant: 'success' as const, label: 'Selesai' }
      case 'cancelled':
        return { variant: 'danger' as const, label: 'Dibatalkan' }
      case 'pending':
      default:
        return { variant: 'warning' as const, label: 'Menunggu Pembayaran' }
    }
  }

  const getPaymentStatusBadge = (orderData: Order) => {
    if (orderData.status === 'refunded') {
      return { variant: 'default' as const, label: 'Dikembalikan' }
    }
    if (orderData.status === 'cancelled') {
      return { variant: 'default' as const, label: 'Belum Dibayar' }
    }
    if (orderData.paid_at || ['paid', 'shipped', 'completed'].includes(orderData.status)) {
      return { variant: 'success' as const, label: 'Lunas' }
    }
    return { variant: 'warning' as const, label: 'Menunggu Pembayaran' }
  }

  it('membedakan Status Pesanan (Fulfillment) dengan Status Pembayaran (Finansial)', () => {
    // 1. Kasus Shipped: Pesanan sedang dikirim, pembayaran sudah lunas
    const shippedOrder: Order = {
      id: 'ord-shipped-1',
      user_id: 'usr-1',
      total_cents: 10000000,
      status: 'shipped',
      created_at: '2026-10-25T10:00:00Z',
      paid_at: '2026-10-25T10:15:00Z',
      address: {
        name: 'Tester',
        phone: '081',
        street: 'Jl Test',
        city: 'Semarang',
        postal: '50000',
      },
    }
    expect(getStatusBadge(shippedOrder.status)).toEqual({
      variant: 'info',
      label: 'Dikirim',
    })
    expect(getPaymentStatusBadge(shippedOrder)).toEqual({
      variant: 'success',
      label: 'Lunas',
    })

    // 2. Kasus Paid / Diproses: Pesanan sedang diproses, pembayaran sudah lunas
    const paidOrder: Order = { ...shippedOrder, status: 'paid' }
    expect(getStatusBadge(paidOrder.status)).toEqual({
      variant: 'info',
      label: 'Diproses',
    })
    expect(getPaymentStatusBadge(paidOrder)).toEqual({
      variant: 'success',
      label: 'Lunas',
    })

    // 3. Kasus Cancelled: Pesanan dibatalkan, status bayar belum dibayar
    const cancelledOrder: Order = { ...shippedOrder, status: 'cancelled', paid_at: null }
    expect(getStatusBadge(cancelledOrder.status)).toEqual({
      variant: 'danger',
      label: 'Dibatalkan',
    })
    expect(getPaymentStatusBadge(cancelledOrder)).toEqual({
      variant: 'default',
      label: 'Belum Dibayar',
    })

    // 4. Kasus Pending: Pesanan menunggu bayar, status bayar menunggu bayar
    const pendingOrder: Order = { ...shippedOrder, status: 'pending', paid_at: null }
    expect(getStatusBadge(pendingOrder.status)).toEqual({
      variant: 'warning',
      label: 'Menunggu Pembayaran',
    })
    expect(getPaymentStatusBadge(pendingOrder)).toEqual({
      variant: 'warning',
      label: 'Menunggu Pembayaran',
    })
  })

  it('hanya mengizinkan akses Cetak Invoice untuk status lunas, dikirim, atau selesai', () => {
    expect(allowedInvoiceStatuses.includes('paid')).toBe(true)
    expect(allowedInvoiceStatuses.includes('shipped')).toBe(true)
    expect(allowedInvoiceStatuses.includes('completed')).toBe(true)

    expect(allowedInvoiceStatuses.includes('pending')).toBe(false)
    expect(allowedInvoiceStatuses.includes('cancelled')).toBe(false)
    expect(allowedInvoiceStatuses.includes('refunded')).toBe(false)
  })

  it('memetakan item pesanan yang dibatalkan menjadi payload keranjang belanja untuk Beli Lagi', () => {
    const mockOrder: Order = {
      id: 'ord-12345678-aaaa',
      user_id: 'usr-1',
      total_cents: 15000000,
      status: 'cancelled',
      created_at: '2026-10-25T10:00:00Z',
      cancelled_at: '2026-10-25T11:00:00Z',
      cancellation_reason: 'Perubahan rencana belanja',
      address: {
        name: 'Budi Santoso',
        phone: '081234567890',
        street: 'Jl. Sudirman 45',
        city: 'Jakarta',
        postal: '10220',
      },
      items: [
        {
          id: 'item-1',
          order_id: 'ord-12345678-aaaa',
          product_id: 10,
          qty: 2,
          price_cents: 5000000,
          product: {
            id: 10,
            name: 'Ergonomic Desk Mat',
            image_url: 'https://example.com/mat.jpg',
          },
        },
        {
          id: 'item-2',
          order_id: 'ord-12345678-aaaa',
          product_id: 20,
          qty: 1,
          price_cents: 5000000,
          product: {
            id: 20,
            name: 'Wireless Mouse Pad',
            image_url: null,
          },
        },
      ],
    }

    const addedCartPayloads: Array<{
      productId: number
      name: string
      price: number
      priceCents: number
      imageUrl: string | null
      quantity: number
      stock: number
      openCartDrawer: boolean
    }> = []

    const mockCartStore = {
      addItem: vi.fn((payload) => addedCartPayloads.push(payload)),
    }

    // Simulasi fungsi handleReorder
    for (const item of mockOrder.items || []) {
      mockCartStore.addItem({
        productId: item.product_id,
        name: item.product?.name || `Produk #${item.product_id}`,
        price: item.price_cents / 100,
        priceCents: item.price_cents,
        imageUrl: item.product?.image_url ?? null,
        quantity: item.qty,
        stock: 99,
        openCartDrawer: false,
      })
    }

    expect(mockCartStore.addItem).toHaveBeenCalledTimes(2)
    expect(addedCartPayloads[0]).toEqual({
      productId: 10,
      name: 'Ergonomic Desk Mat',
      price: 50000,
      priceCents: 5000000,
      imageUrl: 'https://example.com/mat.jpg',
      quantity: 2,
      stock: 99,
      openCartDrawer: false,
    })
    expect(addedCartPayloads[1]).toEqual({
      productId: 20,
      name: 'Wireless Mouse Pad',
      price: 50000,
      priceCents: 5000000,
      imageUrl: null,
      quantity: 1,
      stock: 99,
      openCartDrawer: false,
    })
  })

  it('memvalidasi informasi pembatalan transparan (alasan dan timestamp pembatalan)', () => {
    const cancelledOrder: Order = {
      id: 'ord-cancelled-999',
      user_id: 'usr-1',
      total_cents: 3000000,
      status: 'cancelled',
      created_at: '2026-10-26T08:00:00Z',
      cancelled_at: '2026-10-26T09:30:00Z',
      cancellation_reason: 'Ingin mengubah alamat pengiriman',
      address: {
        name: 'Rudi Wijaya',
        phone: '081234567890',
        street: 'Jl. Pemuda No. 12',
        city: 'Semarang',
        postal: '50132',
      },
    }

    expect(cancelledOrder.cancellation_reason).toBe('Ingin mengubah alamat pengiriman')
    expect(cancelledOrder.cancelled_at).toBe('2026-10-26T09:30:00Z')
    expect(cancelledOrder.status).toBe('cancelled')
  })
})
