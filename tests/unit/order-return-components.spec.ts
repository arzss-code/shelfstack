import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import OrderReturnStatusCard from '../../app/components/orders/OrderReturnStatusCard.vue'
import type { ReturnRequestItem } from '../../shared/schemas/return-request'

vi.mock('~/composables/useUiToast', () => ({
  useUiToast: () => ({
    show: vi.fn(),
    remove: vi.fn(),
    toasts: { value: [] },
  }),
}))

describe('OrderReturnStatusCard Component', () => {
  const baseTicket: ReturnRequestItem = {
    id: 'b1234567-89ab-cdef-0123-456789abcdef',
    order_id: 'ord-12345',
    user_id: 'user-001',
    reason_type: 'defective',
    solution_type: 'refund',
    status: 'requested',
    customer_notes: 'Layar perangkat berkedip dan mati total setelah 2 jam pemakaian.',
    proof_image_urls: ['https://example.com/proof1.jpg'],
    unboxing_video_url: null,
    return_courier: null,
    return_tracking_number: null,
    replacement_courier: null,
    replacement_tracking_number: null,
    admin_notes: null,
    refund_amount_cents: 500000,
    restocked_at: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  it('merender status requested dengan label Menunggu Peninjauan dan 4-tahap stepper', () => {
    const wrapper = mount(OrderReturnStatusCard, {
      props: {
        ticket: baseTicket,
        orderId: 'ord-12345',
      },
    })

    expect(wrapper.text()).toContain('Status Klaim Garansi & Retur')
    expect(wrapper.text()).toContain('Menunggu Peninjauan')
    expect(wrapper.text()).toContain('Cacat Pabrik / Kendala Fungsi')
    expect(wrapper.text()).toContain('Diajukan')
    expect(wrapper.text()).toContain('Inspeksi Gudang')
  })

  it('menampilkan alamat gudang dan form resi saat status approved dan resi belum diinput', () => {
    const approvedTicket: ReturnRequestItem = {
      ...baseTicket,
      status: 'approved',
    }

    const wrapper = mount(OrderReturnStatusCard, {
      props: {
        ticket: approvedTicket,
        orderId: 'ord-12345',
      },
    })

    expect(wrapper.text()).toContain('Disetujui (Menunggu Kiriman Balik)')
    expect(wrapper.text()).toContain('Alamat Pengiriman Balik ke Gudang')
    expect(wrapper.text()).toContain('Kota Semarang')
    expect(wrapper.text()).toContain('Konfirmasi Nomor Resi Pengiriman')
  })

  it('menampilkan informasi resi pengiriman balik saat sudah diinput oleh pelanggan', () => {
    const shippedTicket: ReturnRequestItem = {
      ...baseTicket,
      status: 'approved',
      return_courier: 'jne',
      return_tracking_number: 'JNE9876543210',
    }

    const wrapper = mount(OrderReturnStatusCard, {
      props: {
        ticket: shippedTicket,
        orderId: 'ord-12345',
      },
    })

    expect(wrapper.text()).toContain('JNE - JNE9876543210')
    expect(wrapper.text()).toContain('Paket sedang dalam perjalanan')
  })

  it('menampilkan pesan unit tiba di gudang saat status item_received', () => {
    const receivedTicket: ReturnRequestItem = {
      ...baseTicket,
      status: 'item_received',
    }

    const wrapper = mount(OrderReturnStatusCard, {
      props: {
        ticket: receivedTicket,
        orderId: 'ord-12345',
      },
    })

    expect(wrapper.text()).toContain('Barang Diterima di Gudang')
    expect(wrapper.text()).toContain('Unit Tiba di Gudang')
  })

  it('menampilkan alert penolakan dan catatan admin saat status rejected', () => {
    const rejectedTicket: ReturnRequestItem = {
      ...baseTicket,
      status: 'rejected',
      admin_notes: 'Kerusakan diakibatkan kelalaian pengguna (tercebur ke dalam air).',
    }

    const wrapper = mount(OrderReturnStatusCard, {
      props: {
        ticket: rejectedTicket,
        orderId: 'ord-12345',
      },
    })

    expect(wrapper.text()).toContain('Pengajuan Ditolak')
    expect(wrapper.text()).toContain('Klaim Tidak Dapat Disetujui')
    expect(wrapper.text()).toContain('Kerusakan diakibatkan kelalaian pengguna')
  })

  it('menampilkan konfirmasi resolusi tuntas saat status completed', () => {
    const completedTicket: ReturnRequestItem = {
      ...baseTicket,
      status: 'completed',
      solution_type: 'replacement',
      replacement_courier: 'sicepat',
      replacement_tracking_number: '001122334455',
    }

    const wrapper = mount(OrderReturnStatusCard, {
      props: {
        ticket: completedTicket,
        orderId: 'ord-12345',
      },
    })

    expect(wrapper.text()).toContain('Klaim Selesai')
    expect(wrapper.text()).toContain('Resolusi Tuntas')
    expect(wrapper.text()).toContain('SICEPAT')
    expect(wrapper.text()).toContain('001122334455')
  })
})
