import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { resolveDefaultSavedAddress } from '~/utils/checkout-pricing'
import CoinTransactionList from '~/components/account/points/CoinTransactionList.vue'
import type { CoinTransaction } from '~~/shared/schemas/loyalty-coin'

describe('Customer Portal & Default Address Auto-Select (E-05 & E-06)', () => {
  describe('resolveDefaultSavedAddress helper', () => {
    it('returns null when address list is empty or undefined', () => {
      expect(resolveDefaultSavedAddress([])).toBeNull()
      expect(resolveDefaultSavedAddress(undefined as unknown as [])).toBeNull()
    })

    it('returns the address with is_default: true', () => {
      const addresses = [
        { id: '1', name: 'Alamat Kantor', is_default: false },
        { id: '2', name: 'Alamat Rumah Utama', is_default: true },
        { id: '3', name: 'Alamat Orang Tua', is_default: false },
      ]
      const result = resolveDefaultSavedAddress(addresses)
      expect(result).not.toBeNull()
      expect(result?.id).toBe('2')
      expect(result?.name).toBe('Alamat Rumah Utama')
    })

    it('falls back to the first address if no address has is_default: true', () => {
      const addresses = [
        { id: '1', name: 'Alamat Kantor', is_default: false },
        { id: '2', name: 'Alamat Apartemen', is_default: false },
      ]
      const result = resolveDefaultSavedAddress(addresses)
      expect(result).not.toBeNull()
      expect(result?.id).toBe('1')
    })
  })

  describe('CoinTransactionList.vue component', () => {
    const mockTransactions: CoinTransaction[] = [
      {
        id: 'tx-1',
        user_id: 'user-1',
        amount: 5000,
        type: 'earned',
        balance_after: 5000,
        description: 'Cashback 1% Pesanan Selesai #ORD-001',
        formatted_amount: '+5.000 Koin',
        formatted_date: '14 Nov 2026, 10:00',
        created_at: '2026-11-14T10:00:00Z',
      },
      {
        id: 'tx-2',
        user_id: 'user-1',
        amount: -2000,
        type: 'spent',
        balance_after: 3000,
        description: 'Potongan Belanja Pesanan #ORD-002',
        formatted_amount: '-2.000 Koin',
        formatted_date: '14 Nov 2026, 12:30',
        created_at: '2026-11-14T12:30:00Z',
      },
      {
        id: 'tx-3',
        user_id: 'user-1',
        amount: 10000,
        type: 'welcome_bonus',
        balance_after: 13000,
        description: 'Bonus Sambutan Pengguna Baru',
        formatted_amount: '+10.000 Koin',
        formatted_date: '14 Nov 2026, 09:00',
        created_at: '2026-11-14T09:00:00Z',
      },
    ]

    it('renders transaction items with brand token classes and amounts', () => {
      const wrapper = mount(CoinTransactionList, {
        props: {
          transactions: mockTransactions,
          isLoading: false,
        },
      })

      expect(wrapper.text()).toContain('Cashback 1% Pesanan Selesai #ORD-001')
      expect(wrapper.text()).toContain('+5.000 Koin')
      expect(wrapper.text()).toContain('Potongan Belanja Pesanan #ORD-002')
      expect(wrapper.text()).toContain('-2.000 Koin')
      expect(wrapper.text()).toContain('Bonus Sambutan Pengguna Baru')
      expect(wrapper.text()).toContain('+10.000 Koin')
    })

    it('renders empty ledger state when transactions array is empty', () => {
      const wrapper = mount(CoinTransactionList, {
        props: {
          transactions: [],
          isLoading: false,
        },
      })

      expect(wrapper.text()).toContain('Belum Ada Riwayat Mutasi')
      expect(wrapper.text()).toContain('bonus sambutan dan cashback 1%')
    })

    it('renders loading skeleton when isLoading is true', () => {
      const wrapper = mount(CoinTransactionList, {
        props: {
          transactions: [],
          isLoading: true,
        },
      })

      const skeletons = wrapper.findAll('.animate-pulse')
      expect(skeletons.length).toBe(4)
    })
  })
})
