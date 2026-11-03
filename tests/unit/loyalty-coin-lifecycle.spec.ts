import { describe, it, expect } from 'vitest'

interface MockUserCoins {
  balance_coins: number
  lifetime_earned_coins: number
  lifetime_spent_coins: number
  has_claimed_welcome: boolean
}

interface MockCoinTx {
  type: string
  amount: number
  balance_after: number
  order_id?: string
  coupon_id?: string
  description: string
}

describe('Loyalty Coins Lifecycle & State Machine [SHF-COINS-LIFECYCLE]', () => {
  it('memberikan bonus sambutan 10.000 koin pada klaim pertama', () => {
    const userWallet: MockUserCoins = {
      balance_coins: 0,
      lifetime_earned_coins: 0,
      lifetime_spent_coins: 0,
      has_claimed_welcome: false,
    }
    const transactions: MockCoinTx[] = []

    const claimWelcome = (wallet: MockUserCoins) => {
      if (wallet.has_claimed_welcome) {
        throw new Error('Bonus sambutan sudah pernah diklaim sebelumnya')
      }
      wallet.balance_coins += 10000
      wallet.lifetime_earned_coins += 10000
      wallet.has_claimed_welcome = true
      transactions.push({
        type: 'welcome_bonus',
        amount: 10000,
        balance_after: wallet.balance_coins,
        description: 'Bonus 10.000 Koin Sambutan Pengguna Baru',
      })
      return wallet
    }

    claimWelcome(userWallet)

    expect(userWallet.balance_coins).toBe(10000)
    expect(userWallet.has_claimed_welcome).toBe(true)
    expect(transactions).toHaveLength(1)
    expect(transactions[0]?.type).toBe('welcome_bonus')

    // Klaim kedua harus ditolak
    expect(() => claimWelcome(userWallet)).toThrow('Bonus sambutan sudah pernah diklaim')
  })

  it('mengalkulasi cashback 1% koin saat pesanan berstatus completed', () => {
    // Formula: floor(net_spent_cents * 0.01 / 100)
    // 1 Koin = 100 sen (Rp 1)
    const calculateCashbackCoins = (
      subtotalCents: number,
      couponDiscountCents: number,
      coinsDiscountCents: number,
    ) => {
      const netSpentCents = Math.max(0, subtotalCents - couponDiscountCents - coinsDiscountCents)
      return Math.floor((netSpentCents * 0.01) / 100)
    }

    // Kasus 1: Belanja Rp 250.000 tanpa diskon
    // Cashback = 1% dari Rp 250.000 = Rp 2.500 = 2.500 Koin
    const cb1 = calculateCashbackCoins(25000000, 0, 0)
    expect(cb1).toBe(2500)

    // Kasus 2: Belanja Rp 200.000 dengan kupon Rp 50.000 dan koin Rp 20.000
    // Net belanja = 200.000 - 50.000 - 20.000 = Rp 130.000
    // Cashback = 1% dari Rp 130.000 = 1.300 Koin
    const cb2 = calculateCashbackCoins(20000000, 5000000, 2000000)
    expect(cb2).toBe(1300)
  })

  it('memotong saldo koin saat checkout dan mengembalikan saldo saat order dibatalkan', () => {
    const userWallet: MockUserCoins = {
      balance_coins: 15000,
      lifetime_earned_coins: 20000,
      lifetime_spent_coins: 5000,
      has_claimed_welcome: true,
    }
    const transactions: MockCoinTx[] = []

    // 1. Checkout dengan 5.000 koin
    const coinsToUse = 5000
    userWallet.balance_coins -= coinsToUse
    userWallet.lifetime_spent_coins += coinsToUse
    transactions.push({
      type: 'spent',
      amount: coinsToUse,
      balance_after: userWallet.balance_coins,
      order_id: 'ord-123',
      description: 'Pemakaian 5.000 Koin pada Pesanan ord-123',
    })

    expect(userWallet.balance_coins).toBe(10000)
    expect(userWallet.lifetime_spent_coins).toBe(10000)

    // 2. Order dibatalkan -> refund koin
    userWallet.balance_coins += coinsToUse
    userWallet.lifetime_spent_coins -= coinsToUse
    transactions.push({
      type: 'cancelled_order',
      amount: coinsToUse,
      balance_after: userWallet.balance_coins,
      order_id: 'ord-123',
      description: 'Pengembalian 5.000 Koin dari pembatalan pesanan ord-123',
    })

    expect(userWallet.balance_coins).toBe(15000)
    expect(userWallet.lifetime_spent_coins).toBe(5000)
    expect(transactions).toHaveLength(2)
    expect(transactions[1]?.type).toBe('cancelled_order')
  })

  it('mengurangi koin dan menambahkan voucher dompet saat penukaran voucher berhasil', () => {
    const userWallet: MockUserCoins = {
      balance_coins: 10000,
      lifetime_earned_coins: 10000,
      lifetime_spent_coins: 0,
      has_claimed_welcome: true,
    }
    const userVoucherWallet = new Set<string>()

    const exchangeVoucher = (couponId: string, coinCost: number) => {
      if (userVoucherWallet.has(couponId)) {
        throw new Error('Anda sudah memiliki voucher ini di dompet Anda')
      }
      if (userWallet.balance_coins < coinCost) {
        throw new Error('Saldo koin tidak mencukupi')
      }

      userWallet.balance_coins -= coinCost
      userWallet.lifetime_spent_coins += coinCost
      userVoucherWallet.add(couponId)
      return true
    }

    // Tukar voucher 2.500 koin
    exchangeVoucher('coup-ongkir', 2500)
    expect(userWallet.balance_coins).toBe(7500)
    expect(userVoucherWallet.has('coup-ongkir')).toBe(true)

    // Coba tukar lagi voucher yang sama -> harus ditolak
    expect(() => exchangeVoucher('coup-ongkir', 2500)).toThrow('Anda sudah memiliki voucher ini')

    // Coba tukar voucher mahal melebihi sisa koin
    expect(() => exchangeVoucher('coup-super', 10000)).toThrow('Saldo koin tidak mencukupi')
  })
})
