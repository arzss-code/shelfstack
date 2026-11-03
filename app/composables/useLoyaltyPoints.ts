import { tryUseNuxtApp, useState } from '#imports'
import { computed, ref } from 'vue'
import type {
  CoinExchangeCatalogItem,
  CoinTransaction,
  UserCoinsSummary,
} from '~~/shared/schemas/loyalty-coin'
import { useUiToast } from './useUiToast'

export const useLoyaltyPoints = () => {
  let summary = ref<UserCoinsSummary | null>(null)
  let catalog = ref<CoinExchangeCatalogItem[]>([])

  const nuxtApp = tryUseNuxtApp()
  if (nuxtApp) {
    try {
      summary = useState<UserCoinsSummary | null>('user_coins_summary', () => null)
      catalog = useState<CoinExchangeCatalogItem[]>('user_coins_exchange_catalog', () => [])
    } catch {
      // Abaikan jika useState belum siap
    }
  }

  const isLoading = ref(false)
  const isClaimingWelcome = ref(false)
  const isExchanging = ref(false)
  const error = ref<string | null>(null)

  const toast = useUiToast()

  const balanceCoins = computed(() => summary.value?.balance_coins || 0)
  const formattedBalance = computed(() => summary.value?.formatted_balance || '0 Koin')
  const rupiahValue = computed(() => summary.value?.rupiah_value || 0)
  const formattedRupiah = computed(() => summary.value?.formatted_rupiah || 'Rp 0')
  const hasClaimedWelcome = computed(() => Boolean(summary.value?.has_claimed_welcome))
  const transactions = computed<CoinTransaction[]>(() => summary.value?.recent_transactions || [])
  const exchangeCatalog = computed<CoinExchangeCatalogItem[]>(() => catalog.value || [])

  const fetchPointsSummary = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ status: string; data: UserCoinsSummary }>(
        '/api/account/points',
      )
      if (response && response.data) {
        summary.value = response.data
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? (err as { data?: { message?: string } }).data?.message || 'Gagal memuat data koin.'
          : 'Gagal memuat data koin.'
      error.value = msg
    } finally {
      isLoading.value = false
    }
  }

  const fetchExchangeCatalog = async () => {
    try {
      const response = await $fetch<{ status: string; data: CoinExchangeCatalogItem[] }>(
        '/api/account/points/catalog',
      )
      if (response && response.data) {
        catalog.value = response.data
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? (err as { data?: { message?: string } }).data?.message ||
            'Gagal memuat katalog penukaran koin.'
          : 'Gagal memuat katalog penukaran koin.'
      error.value = msg
    }
  }

  const claimWelcomeBonus = async (): Promise<boolean> => {
    isClaimingWelcome.value = true
    error.value = null

    try {
      const res = await $fetch<{
        status: string
        message: string
        data: { balance_coins: number }
      }>('/api/account/points/welcome', {
        method: 'POST',
      })

      toast.show({
        title: 'Berhasil',
        message: res.message || 'Bonus sambutan 10.000 Koin berhasil diklaim!',
        tone: 'success',
      })
      await fetchPointsSummary()
      await fetchExchangeCatalog()
      return true
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? (err as { data?: { message?: string } }).data?.message ||
            'Gagal mengklaim bonus sambutan.'
          : 'Gagal mengklaim bonus sambutan.'
      error.value = msg
      toast.show({
        title: 'Pemberitahuan',
        message: msg,
        tone: 'error',
      })
      return false
    } finally {
      isClaimingWelcome.value = false
    }
  }

  const exchangeForVoucher = async (couponId: string): Promise<boolean> => {
    isExchanging.value = true
    error.value = null

    try {
      const res = await $fetch<{
        status: string
        message: string
        data: { coupon_code: string; balance_coins: number }
      }>('/api/account/points/exchange', {
        method: 'POST',
        body: { coupon_id: couponId },
      })

      toast.show({
        title: 'Penukaran Berhasil',
        message: res.message || 'Voucher berhasil ditukarkan dan siap digunakan!',
        tone: 'success',
      })
      await fetchPointsSummary()
      await fetchExchangeCatalog()
      return true
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? (err as { data?: { message?: string } }).data?.message || 'Gagal menukarkan koin.'
          : 'Gagal menukarkan koin.'
      error.value = msg
      toast.show({
        title: 'Gagal Menukar Koin',
        message: msg,
        tone: 'error',
      })
      return false
    } finally {
      isExchanging.value = false
    }
  }

  return {
    summary,
    catalog,
    isLoading,
    isClaimingWelcome,
    isExchanging,
    error,
    balanceCoins,
    formattedBalance,
    rupiahValue,
    formattedRupiah,
    hasClaimedWelcome,
    transactions,
    exchangeCatalog,
    fetchPointsSummary,
    fetchExchangeCatalog,
    claimWelcomeBonus,
    exchangeForVoucher,
  }
}
