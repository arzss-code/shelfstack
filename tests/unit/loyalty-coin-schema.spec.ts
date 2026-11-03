import { describe, it, expect } from 'vitest'
import {
  coinTransactionTypeSchema,
  coinTransactionSchema,
  userCoinsSummarySchema,
  exchangeVoucherInputSchema,
  coinExchangeCatalogItemSchema,
  type CoinTransaction,
  type UserCoinsSummary,
  type CoinExchangeCatalogItem,
} from '../../shared/schemas/loyalty-coin'

describe('Loyalty Coins Schema & Calculation Rules [SHF-LOYALTY-COINS]', () => {
  describe('coinTransactionTypeSchema', () => {
    it('menerima seluruh tipe mutasi koin yang valid', () => {
      const validTypes = [
        'earned',
        'spent',
        'redeemed_voucher',
        'welcome_bonus',
        'refunded_order',
        'cancelled_order',
      ]

      for (const type of validTypes) {
        const res = coinTransactionTypeSchema.safeParse(type)
        expect(res.success).toBe(true)
      }
    })

    it('menolak tipe mutasi yang tidak dikenali', () => {
      const res = coinTransactionTypeSchema.safeParse('unknown_type')
      expect(res.success).toBe(false)
    })
  })

  describe('coinTransactionSchema', () => {
    it('memvalidasi transaksi koin yang valid', () => {
      const mockTx: CoinTransaction = {
        id: 'tx-123',
        user_id: 'user-456',
        type: 'welcome_bonus',
        amount_coins: 10000,
        balance_after: 10000,
        description: 'Bonus 10.000 Koin Sambutan Pengguna Baru',
        created_at: '2026-11-03T10:00:00Z',
        formatted_amount: '+10.000 Koin',
        formatted_date: '3 Nov 2026, 10:00',
      }

      const res = coinTransactionSchema.safeParse(mockTx)
      expect(res.success).toBe(true)
    })

    it('menolak transaksi dengan amount_coins nol atau negatif', () => {
      const resZero = coinTransactionSchema.safeParse({
        id: 'tx-1',
        user_id: 'user-1',
        type: 'earned',
        amount_coins: 0,
        balance_after: 0,
        description: 'Test',
        created_at: '2026-11-03T10:00:00Z',
      })
      expect(resZero.success).toBe(false)

      const resNeg = coinTransactionSchema.safeParse({
        id: 'tx-2',
        user_id: 'user-1',
        type: 'spent',
        amount_coins: -500,
        balance_after: 0,
        description: 'Test',
        created_at: '2026-11-03T10:00:00Z',
      })
      expect(resNeg.success).toBe(false)
    })

    it('menolak balance_after negatif', () => {
      const res = coinTransactionSchema.safeParse({
        id: 'tx-1',
        user_id: 'user-1',
        type: 'spent',
        amount_coins: 500,
        balance_after: -100,
        description: 'Overdraft test',
        created_at: '2026-11-03T10:00:00Z',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('userCoinsSummarySchema', () => {
    it('memvalidasi ringkasan koin pengguna dengan benar', () => {
      const mockSummary: UserCoinsSummary = {
        balance_coins: 15000,
        lifetime_earned_coins: 20000,
        lifetime_spent_coins: 5000,
        has_claimed_welcome: true,
        formatted_balance: '15.000 Koin',
        rupiah_value: 15000,
        formatted_rupiah: 'Rp 15.000',
        recent_transactions: [],
      }

      const res = userCoinsSummarySchema.safeParse(mockSummary)
      expect(res.success).toBe(true)
    })
  })

  describe('exchangeVoucherInputSchema', () => {
    it('menerima coupon_id berformat UUID valid', () => {
      const res = exchangeVoucherInputSchema.safeParse({
        coupon_id: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(res.success).toBe(true)
    })

    it('menolak coupon_id string sembarang bukan UUID', () => {
      const res = exchangeVoucherInputSchema.safeParse({
        coupon_id: 'bukan-uuid-kupon',
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0]?.message).toContain('UUID')
      }
    })
  })

  describe('coinExchangeCatalogItemSchema', () => {
    it('memvalidasi item katalog voucher koin dengan lengkap', () => {
      const item: CoinExchangeCatalogItem = {
        id: 'cp-1',
        code: 'KOINONGKIR',
        name: 'Gratis Ongkir Koin Rp 20.000',
        description: 'Potongan ongkir khusus penukaran 2.500 Koin',
        discount_type: 'fixed',
        discount_value: 2000000,
        formatted_discount: 'Rp 20.000',
        min_purchase_cents: 5000000,
        formatted_min_purchase: 'Rp 50.000',
        max_discount_cents: null,
        formatted_max_discount: null,
        coin_cost: 2500,
        formatted_coin_cost: '2.500 Koin',
        is_claimed: false,
        expires_at: '2026-12-31T23:59:59Z',
      }

      const res = coinExchangeCatalogItemSchema.safeParse(item)
      expect(res.success).toBe(true)
    })
  })

  describe('Aturan Bisnis Kalkulasi Koin di Checkout', () => {
    const calculateMaxCoins = (subtotalAfterCouponCents: number, userBalanceCoins: number) => {
      if (userBalanceCoins <= 0) return 0
      // 1 Koin = 100 sen (Rp 1). Maks 50% dari subtotal setelah kupon diskon.
      const maxAllowed = Math.floor((subtotalAfterCouponCents * 0.5) / 100)
      return Math.max(0, Math.min(userBalanceCoins, maxAllowed))
    }

    it('membatasi koin maksimal 50% dari subtotal jika saldo berlebih', () => {
      // Subtotal Rp 100.000 (10.000.000 sen). 50% = Rp 50.000 (50.000 koin).
      // Saldo user: 80.000 koin.
      const usable = calculateMaxCoins(10000000, 80000)
      expect(usable).toBe(50000)
    })

    it('memakai seluruh koin jika saldo di bawah 50% subtotal', () => {
      // Subtotal Rp 100.000. 50% = 50.000 koin.
      // Saldo user: 10.000 koin.
      const usable = calculateMaxCoins(10000000, 10000)
      expect(usable).toBe(10000)
    })

    it('menghasilkan 0 koin jika saldo user adalah 0', () => {
      const usable = calculateMaxCoins(10000000, 0)
      expect(usable).toBe(0)
    })

    it('menghasilkan 0 koin jika subtotal adalah 0', () => {
      const usable = calculateMaxCoins(0, 10000)
      expect(usable).toBe(0)
    })
  })
})
