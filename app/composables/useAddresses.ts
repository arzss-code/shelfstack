import { ref, computed } from 'vue'
import type { UserAddress, CreateAddressInput, UpdateAddressInput } from '~~/shared/schemas/address'

export function useAddresses() {
  const addresses = ref<UserAddress[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedAddressId = ref<string | null>(null)

  const defaultAddress = computed(() => {
    return addresses.value.find((addr) => addr.is_default) || addresses.value[0] || null
  })

  const selectedAddress = computed(() => {
    if (!addresses.value.length) return null
    if (selectedAddressId.value) {
      const found = addresses.value.find((addr) => addr.id === selectedAddressId.value)
      if (found) return found
    }
    return defaultAddress.value
  })

  const fetchAddresses = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ status: string; data: UserAddress[] }>('/api/addresses')
      addresses.value = response.data || []

      // Otomatis pilih default jika belum ada pilihan aktif
      if (!selectedAddressId.value && defaultAddress.value) {
        selectedAddressId.value = defaultAddress.value.id
      }
      return addresses.value
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Gagal memuat daftar alamat.'
      error.value = message
      return []
    } finally {
      loading.value = false
    }
  }

  const saveAddress = async (input: CreateAddressInput) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ status: string; data: UserAddress }>('/api/addresses', {
        method: 'POST',
        body: input,
      })
      const saved = response.data

      // Jika alamat baru adalah default, update flag is_default alamat lainnya di state lokal
      if (saved.is_default) {
        addresses.value = addresses.value.map((a) => ({ ...a, is_default: false }))
      }

      addresses.value.unshift(saved)
      selectedAddressId.value = saved.id
      return saved
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Gagal menyimpan alamat.'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateAddress = async (id: string, input: UpdateAddressInput) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ status: string; data: UserAddress }>(`/api/addresses/${id}`, {
        method: 'PUT',
        body: input,
      })
      const updated = response.data

      if (updated.is_default) {
        addresses.value = addresses.value.map((a) => ({
          ...a,
          is_default: a.id === id,
        }))
      }

      const idx = addresses.value.findIndex((a) => a.id === id)
      if (idx !== -1) {
        addresses.value[idx] = updated
      }
      return updated
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Gagal memperbarui alamat.'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteAddress = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
      })
      addresses.value = addresses.value.filter((a) => a.id !== id)

      // Jika yang dihapus sedang dipilih, pindahkan pilihan ke alamat default yang tersisa
      if (selectedAddressId.value === id) {
        selectedAddressId.value = defaultAddress.value ? defaultAddress.value.id : null
      }
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Gagal menghapus alamat.'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const selectDefault = async (id: string) => {
    try {
      await updateAddress(id, { is_default: true })
      selectedAddressId.value = id
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Gagal menjadikan alamat utama.'
      error.value = message
      throw err
    }
  }

  const selectAddress = (id: string) => {
    selectedAddressId.value = id
  }

  return {
    addresses,
    loading,
    error,
    selectedAddressId,
    selectedAddress,
    defaultAddress,
    fetchAddresses,
    saveAddress,
    updateAddress,
    deleteAddress,
    selectDefault,
    selectAddress,
  }
}
