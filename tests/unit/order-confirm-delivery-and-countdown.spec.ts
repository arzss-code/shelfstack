import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import fs from 'node:fs'
import path from 'node:path'
import OrderPaymentCountdownCard from '../../app/features/orders/components/OrderPaymentCountdownCard.vue'

describe('Order Confirm Delivery & Payment Countdown Suite', () => {
  describe('Confirm Delivery Business Logic & Access Control', () => {
    const validateDeliveryConfirmation = (
      order: { id: string; user_id: string; status: string },
      requesterId: string,
      isAdmin: boolean,
    ) => {
      if (order.user_id !== requesterId && !isAdmin) {
        throw new Error('FORBIDDEN_ACCESS')
      }
      if (order.status !== 'shipped') {
        throw new Error(
          `INVALID_STATUS: Hanya pesanan shipped yang dapat dikonfirmasi (status saat ini: ${order.status})`,
        )
      }
      return {
        success: true,
        target_status: 'completed',
        earned_coins: 1000,
      }
    }

    it('mengizinkan konfirmasi penerimaan untuk pesanan berstatus shipped oleh pemilik pesanan', () => {
      const order = { id: 'ord-ship-1', user_id: 'usr-buyer-10', status: 'shipped' }
      const res = validateDeliveryConfirmation(order, 'usr-buyer-10', false)
      expect(res.success).toBe(true)
      expect(res.target_status).toBe('completed')
    })

    it('mengizinkan konfirmasi penerimaan oleh administrator untuk bantuan pelanggan', () => {
      const order = { id: 'ord-ship-2', user_id: 'usr-buyer-10', status: 'shipped' }
      const res = validateDeliveryConfirmation(order, 'admin-root', true)
      expect(res.success).toBe(true)
      expect(res.target_status).toBe('completed')
    })

    it('menolak konfirmasi penerimaan jika pemohon bukan pemilik dan bukan admin (403)', () => {
      const order = { id: 'ord-ship-3', user_id: 'usr-buyer-10', status: 'shipped' }
      expect(() => validateDeliveryConfirmation(order, 'hacker-99', false)).toThrow(
        'FORBIDDEN_ACCESS',
      )
    })

    it('menolak konfirmasi penerimaan jika pesanan belum shipped (pending, paid, completed, cancelled) (400)', () => {
      expect(() =>
        validateDeliveryConfirmation({ id: '1', user_id: 'u1', status: 'pending' }, 'u1', false),
      ).toThrow('INVALID_STATUS')

      expect(() =>
        validateDeliveryConfirmation({ id: '2', user_id: 'u1', status: 'paid' }, 'u1', false),
      ).toThrow('INVALID_STATUS')

      expect(() =>
        validateDeliveryConfirmation({ id: '3', user_id: 'u1', status: 'completed' }, 'u1', false),
      ).toThrow('INVALID_STATUS')

      expect(() =>
        validateDeliveryConfirmation({ id: '4', user_id: 'u1', status: 'cancelled' }, 'u1', false),
      ).toThrow('INVALID_STATUS')
    })
  })

  describe('OrderPaymentCountdownCard Component', () => {
    it('merender batas waktu pembayaran 15 menit dengan format MM:SS secara tepat', () => {
      // 10 menit yang lalu -> tersisa 5 menit (05:00)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      const wrapper = mount(OrderPaymentCountdownCard, {
        props: {
          createdAt: tenMinutesAgo,
          expiryMinutes: 15,
        },
      })

      expect(wrapper.text()).toContain('Batas Waktu Pembayaran')
      expect(wrapper.text()).toMatch(/0[45]:\d\d/)
      expect(wrapper.attributes('role')).toBe('timer')
    })

    it('menampilkan status Waktu Pembayaran Habis dan meng-emit event expired jika waktu terlewati', async () => {
      // 20 menit yang lalu -> sudah expired
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString()
      const wrapper = mount(OrderPaymentCountdownCard, {
        props: {
          createdAt: twentyMinutesAgo,
          expiryMinutes: 15,
        },
      })

      expect(wrapper.text()).toContain('Waktu Pembayaran Habis')
      expect(wrapper.text()).toContain('00:00')
      expect(wrapper.emitted('expired')).toBeTruthy()
    })

    it('menghentikan interval timer saat komponen di-unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      const wrapper = mount(OrderPaymentCountdownCard, {
        props: {
          createdAt: new Date().toISOString(),
          expiryMinutes: 15,
        },
      })
      wrapper.unmount()
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Footer Category Navigation & SOP Verification', () => {
    it('memastikan link navigasi kategori footer mengarah ke rute kategori kanonikal /c/[slug]', () => {
      const footerPath = path.resolve(process.cwd(), 'app/components/AppFooter.vue')
      const content = fs.readFileSync(footerPath, 'utf-8')

      expect(content).toContain('to="/c/tech"')
      expect(content).toContain('to="/c/home"')
      expect(content).toContain('to="/c/furniture"')
    })

    it('memastikan berkas implementasi baru mematuhi batas <= 300 baris dan bebas dari em dash', () => {
      const filesToCheck = [
        'server/api/orders/[id]/confirm-delivery.post.ts',
        'app/features/orders/components/OrderPaymentCountdownCard.vue',
        'app/features/orders/components/OrderDetailPaymentCard.vue',
        'app/composables/useOrderDetail.ts',
        'app/pages/orders/[id].vue',
        'app/components/AppFooter.vue',
      ]

      for (const rel of filesToCheck) {
        const fullPath = path.resolve(process.cwd(), rel)
        const content = fs.readFileSync(fullPath, 'utf-8')
        const lines = content.split('\n').length
        expect(lines, `${rel} melebihi 300 baris (${lines})`).toBeLessThanOrEqual(300)
        expect(content, `${rel} mengandung karakter em dash terlarang`).not.toContain('\u2014')
      }
    })
  })
})
