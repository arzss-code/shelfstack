import { describe, it, expect } from 'vitest'
import {
  claimVoucherSchema,
  userVoucherItemSchema,
  voucherWalletResponseSchema,
  type UserVoucherItem,
} from '../../shared/schemas/user-voucher'

describe('User Voucher Schema Validation [SHF-VOUCHER-WALLET]', () => {
  describe('claimVoucherSchema', () => {
    it('menerima coupon_id valid berformat UUID', () => {
      const res = claimVoucherSchema.safeParse({
        coupon_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      })
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.coupon_id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
      }
    })

    it('menerima dan meng-uppercase kode kupon promo', () => {
      const res = claimVoucherSchema.safeParse({
        code: '  hemat50k  ',
      })
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.code).toBe('HEMAT50K')
      }
    })

    it('menolak input jika coupon_id dan code sama-sama kosong', () => {
      const res = claimVoucherSchema.safeParse({})
      expect(res.success).toBe(false)
    })

    it('menolak format UUID coupon_id yang tidak valid', () => {
      const res = claimVoucherSchema.safeParse({
        coupon_id: 'bukan-uuid',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('userVoucherItemSchema', () => {
    it('memvalidasi item voucher dompet pelanggan dengan benar', () => {
      const mockItem: UserVoucherItem = {
        id: 'uv-1',
        coupon_id: 'c-1',
        code: 'SHELF10',
        name: 'Diskon Belanja 10%',
        description: 'Potongan 10% untuk semua kategori kurasi',
        discount_type: 'percentage',
        discount_value: 10,
        formatted_discount: 'Diskon 10%',
        min_purchase_cents: 10000000,
        formatted_min_purchase: 'Rp 100.000',
        max_discount_cents: 5000000,
        formatted_max_discount: 'Rp 50.000',
        starts_at: null,
        expires_at: '2026-12-31T23:59:59Z',
        status: 'claimed',
        claimed_at: '2026-11-02T10:00:00Z',
        used_at: null,
        is_expired: false,
        order_id: null,
      }

      const res = userVoucherItemSchema.safeParse(mockItem)
      expect(res.success).toBe(true)
    })

    it('menolak status voucher yang tidak diizinkan', () => {
      const mockInvalid = {
        id: 'uv-1',
        coupon_id: 'c-1',
        code: 'SHELF10',
        name: 'Diskon 10%',
        discount_type: 'percentage',
        discount_value: 10,
        formatted_discount: 'Diskon 10%',
        min_purchase_cents: 0,
        formatted_min_purchase: 'Tanpa Minimum',
        status: 'invalid_status',
        claimed_at: '2026-11-02T10:00:00Z',
        is_expired: false,
      }

      const res = userVoucherItemSchema.safeParse(mockInvalid)
      expect(res.success).toBe(false)
    })
  })

  describe('voucherWalletResponseSchema', () => {
    it('memvalidasi response ringkasan dompet voucher lengkap', () => {
      const mockWallet = {
        claimed: [],
        discoverable: [],
        history: [],
        active_count: 0,
      }

      const res = voucherWalletResponseSchema.safeParse(mockWallet)
      expect(res.success).toBe(true)
    })

    it('memvalidasi dompet dengan daftar voucher aktif dan kadaluarsa secara terstruktur', () => {
      const mockWallet = {
        claimed: [
          {
            id: 'uv-active',
            coupon_id: 'c-1',
            code: 'DISKON50',
            name: 'Diskon 50%',
            discount_type: 'percentage' as const,
            discount_value: 50,
            formatted_discount: 'Diskon 50%',
            min_purchase_cents: 5000000,
            formatted_min_purchase: 'Rp 50.000',
            max_discount_cents: 2500000,
            formatted_max_discount: 'Rp 25.000',
            status: 'claimed' as const,
            claimed_at: '2026-11-01T08:00:00Z',
            is_expired: false,
          },
        ],
        discoverable: [
          {
            id: 'c-disc-1',
            coupon_id: 'c-disc-1',
            code: 'ONGKIRGRATIS',
            name: 'Gratis Ongkir Se-Indonesia',
            discount_type: 'fixed' as const,
            discount_value: 2000000,
            formatted_discount: 'Rp 20.000',
            min_purchase_cents: 0,
            formatted_min_purchase: 'Tanpa Minimum',
            max_discount_cents: null,
            formatted_max_discount: null,
            status: 'available' as const,
            claimed_at: null,
            is_expired: false,
          },
        ],
        history: [
          {
            id: 'uv-used',
            coupon_id: 'c-used',
            code: 'WELCOME10',
            name: 'Voucher Pelanggan Baru',
            discount_type: 'fixed' as const,
            discount_value: 1000000,
            formatted_discount: 'Rp 10.000',
            min_purchase_cents: 0,
            formatted_min_purchase: 'Tanpa Minimum',
            status: 'used' as const,
            claimed_at: '2026-10-01T00:00:00Z',
            used_at: '2026-10-02T12:00:00Z',
            is_expired: false,
            order_id: 'ord-123',
          },
          {
            id: 'uv-expired',
            coupon_id: 'c-exp',
            code: 'EXPIRED100',
            name: 'Voucher Telah Berakhir',
            discount_type: 'percentage' as const,
            discount_value: 10,
            formatted_discount: 'Diskon 10%',
            min_purchase_cents: 10000000,
            formatted_min_purchase: 'Rp 100.000',
            status: 'expired' as const,
            claimed_at: '2026-09-01T00:00:00Z',
            is_expired: true,
          },
        ],
        active_count: 1,
      }

      const res = voucherWalletResponseSchema.safeParse(mockWallet)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.active_count).toBe(1)
        expect(res.data.claimed).toHaveLength(1)
        expect(res.data.discoverable).toHaveLength(1)
        expect(res.data.history).toHaveLength(2)
        expect(res.data.claimed[0]?.code).toBe('DISKON50')
      }
    })
  })
})
