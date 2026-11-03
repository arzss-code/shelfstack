import { tryUseNuxtApp, useState } from '#imports'
import { computed, ref } from 'vue'
import type { UserVoucherItem, VoucherWalletResponse } from '~~/shared/schemas/user-voucher'
import { useUiToast } from './useUiToast'

export const useUserVouchers = () => {
  let claimedVouchers = ref<UserVoucherItem[]>([])
  let discoverableVouchers = ref<UserVoucherItem[]>([])
  let historyVouchers = ref<UserVoucherItem[]>([])

  const nuxtApp = tryUseNuxtApp()
  if (nuxtApp) {
    try {
      claimedVouchers = useState<UserVoucherItem[]>('user_vouchers_claimed', () => [])
      discoverableVouchers = useState<UserVoucherItem[]>('user_vouchers_discoverable', () => [])
      historyVouchers = useState<UserVoucherItem[]>('user_vouchers_history', () => [])
    } catch {
      // Abaikan jika useState belum siap
    }
  }

  const isLoading = ref(false)
  const isClaiming = ref(false)
  const error = ref<string | null>(null)

  const toast = useUiToast()

  const activeCount = computed(() => claimedVouchers.value.length)

  const fetchVouchers = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ status: string; data: VoucherWalletResponse }>(
        '/api/account/vouchers',
      )
      if (response && response.data) {
        claimedVouchers.value = response.data.claimed || []
        discoverableVouchers.value = response.data.discoverable || []
        historyVouchers.value = response.data.history || []
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? (err as { data?: { message?: string } }).data?.message || 'Gagal memuat daftar voucher.'
          : 'Gagal memuat daftar voucher.'
      error.value = msg
    } finally {
      isLoading.value = false
    }
  }

  const claimVoucher = async (couponId: string): Promise<boolean> => {
    isClaiming.value = true
    error.value = null

    try {
      const res = await $fetch<{ status: string; message: string; data: unknown }>(
        '/api/account/vouchers/claim',
        {
          method: 'POST',
          body: { coupon_id: couponId },
        },
      )

      toast.show({
        title: 'Voucher Berhasil Diklaim',
        message: res.message || 'Voucher telah tersimpan di dompet akun Anda.',
        tone: 'success',
      })

      await fetchVouchers()
      return true
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? (err as { data?: { message?: string } }).data?.message || 'Gagal mengklaim voucher.'
          : 'Gagal mengklaim voucher.'
      error.value = msg
      toast.show({
        title: 'Klaim Voucher Gagal',
        message: msg,
        tone: 'error',
      })
      return false
    } finally {
      isClaiming.value = false
    }
  }

  const claimVoucherByCode = async (code: string): Promise<boolean> => {
    isClaiming.value = true
    error.value = null

    try {
      const res = await $fetch<{ status: string; message: string; data: unknown }>(
        '/api/account/vouchers/claim',
        {
          method: 'POST',
          body: { code: code.trim().toUpperCase() },
        },
      )

      toast.show({
        title: 'Kode Promo Berhasil Digunakan',
        message: res.message || 'Voucher telah ditambahkan ke dompet akun Anda.',
        tone: 'success',
      })

      await fetchVouchers()
      return true
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? (err as { data?: { message?: string } }).data?.message || 'Gagal mengklaim kode kupon.'
          : 'Gagal mengklaim kode kupon.'
      error.value = msg
      toast.show({
        title: 'Klaim Voucher Gagal',
        message: msg,
        tone: 'error',
      })
      return false
    } finally {
      isClaiming.value = false
    }
  }

  return {
    claimedVouchers,
    discoverableVouchers,
    historyVouchers,
    isLoading,
    isClaiming,
    error,
    activeCount,
    fetchVouchers,
    claimVoucher,
    claimVoucherByCode,
  }
}
