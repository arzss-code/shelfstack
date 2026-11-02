import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useAddresses } from '../../app/composables/useAddresses'
import type { AccountStats } from '../../shared/schemas/profile'

const { mockFetch } = vi.hoisted(() => {
  const mockFn: any = vi.fn()
  mockFn.create = () => mockFn
  mockFn.raw = vi.fn()
  return { mockFetch: mockFn }
})

vi.mock('ofetch', () => ({
  $fetch: mockFetch,
  ofetch: mockFetch,
  createFetch: () => mockFetch,
}))

// Ensure global $fetch points to mockFetch
globalThis.$fetch = mockFetch as any

// Mock global Nuxt useState
vi.stubGlobal('useState', (_key: string, init: () => any) => ref(init()))

describe('Account Profile & Address Book Management [SHF-ACC-02]', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('useAddresses composable state logic', () => {
    it('menginisialisasi state dengan benar', () => {
      const { addresses, loading, error, selectedAddressId, defaultAddress } = useAddresses()
      expect(addresses.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(selectedAddressId.value).toBeNull()
      expect(defaultAddress.value).toBeNull()
    })

    it('memuat daftar alamat melalui fetchAddresses()', async () => {
      const mockAddresses = [
        {
          id: 'addr-1',
          user_id: 'user-1',
          name: 'Budi Santoso',
          phone: '081234567890',
          street: 'Jl. Sudirman No. 10',
          city: 'Kota Bandung, Jawa Barat',
          postal: '40132',
          note: null,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: mockAddresses,
      })

      const { addresses, defaultAddress, selectedAddressId, fetchAddresses } = useAddresses()
      await fetchAddresses()

      expect(addresses.value).toHaveLength(1)
      expect(defaultAddress.value?.id).toBe('addr-1')
      expect(selectedAddressId.value).toBe('addr-1')
    })

    it('menangani error saat fetchAddresses() gagal', async () => {
      mockFetch.mockRejectedValueOnce({
        data: { message: 'Koneksi database bermasalah' },
      })

      const { addresses, error, fetchAddresses } = useAddresses()
      await fetchAddresses()

      expect(addresses.value).toEqual([])
      expect(error.value).toBe('Koneksi database bermasalah')
    })

    it('menambahkan alamat baru dengan saveAddress()', async () => {
      const newAddress = {
        id: 'addr-new',
        user_id: 'user-1',
        name: 'Siti Aminah',
        phone: '081987654321',
        street: 'Jl. Merdeka No. 45',
        city: 'Kota Surabaya, Jawa Timur',
        postal: '60111',
        note: 'Pagar hijau',
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: newAddress,
      })

      const { addresses, saveAddress } = useAddresses()
      const saved = await saveAddress({
        name: newAddress.name,
        phone: newAddress.phone,
        street: newAddress.street,
        city: newAddress.city,
        postal: newAddress.postal,
        note: newAddress.note,
        is_default: newAddress.is_default,
      })

      expect(saved.id).toBe('addr-new')
      expect(addresses.value).toHaveLength(1)
      expect(addresses.value[0]?.name).toBe('Siti Aminah')
    })

    it('menghapus alamat dari state lokal saat deleteAddress() berhasil', async () => {
      mockFetch.mockResolvedValueOnce({ status: 'success' })

      const { addresses, deleteAddress } = useAddresses()
      addresses.value = [
        {
          id: 'addr-1',
          user_id: 'user-1',
          name: 'Budi Santoso',
          phone: '081234567890',
          street: 'Jl. Sudirman No. 10',
          city: 'Kota Bandung, Jawa Barat',
          postal: '40132',
          note: null,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      await deleteAddress('addr-1')
      expect(addresses.value).toHaveLength(0)
    })
  })

  describe('Account stats contract integrity', () => {
    it('memvalidasi format statistik akun sesuai schema', () => {
      const stats: AccountStats = {
        totalOrders: 12,
        activeOrders: 2,
        completedOrders: 10,
        totalAddresses: 3,
        memberSince: '2026-08-18T10:48:00Z',
      }

      expect(stats.totalOrders).toBeGreaterThanOrEqual(0)
      expect(stats.activeOrders).toBeGreaterThanOrEqual(0)
      expect(stats.completedOrders).toBeGreaterThanOrEqual(0)
      expect(stats.totalAddresses).toBeGreaterThanOrEqual(0)
      expect(typeof stats.memberSince).toBe('string')
    })
  })
})
