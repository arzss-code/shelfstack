import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  type FlashDealItem,
  type FlashSaleCampaign,
  calculateClaimPercentage,
} from '~~/shared/schemas/flash-deals'
import { calculateCountdownUntil, type CountdownTime } from '~/utils/countdown'

export function useFlashSale() {
  const campaign = ref<FlashSaleCampaign | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const countdownData = ref<CountdownTime | null>(null)
  let timerInterval: ReturnType<typeof setInterval> | null = null

  const updateTimer = () => {
    if (campaign.value?.ends_at) {
      countdownData.value = calculateCountdownUntil(campaign.value.ends_at)
    } else {
      countdownData.value = null
    }
  }

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval)
    updateTimer()
    timerInterval = setInterval(updateTimer, 1000)
  }

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  const fetchFlashDeals = async () => {
    isLoading.value = true
    errorMessage.value = null
    try {
      const res = await $fetch<{ data: FlashSaleCampaign }>('/api/promotions/flash-deals')
      if (res && res.data) {
        campaign.value = res.data
        startTimer()
      }
    } catch (err: unknown) {
      errorMessage.value = err instanceof Error ? err.message : 'Gagal memuat kampanye flash sale'
    } finally {
      isLoading.value = false
    }
  }

  const getDealForProduct = (productId: number | string): FlashDealItem | null => {
    if (!campaign.value || !campaign.value.items) return null
    const targetId = Number(productId)
    return campaign.value.items.find((item) => item.product_id === targetId) || null
  }

  const isUrgent = (deal: FlashDealItem): boolean => {
    const percentage = calculateClaimPercentage(deal.claimed, deal.quota)
    return percentage >= 70
  }

  const isSoldOut = (deal: FlashDealItem): boolean => {
    return deal.claimed >= deal.quota
  }

  onMounted(() => {
    if (!campaign.value) {
      void fetchFlashDeals()
    } else if (campaign.value.ends_at) {
      startTimer()
    }
  })

  onUnmounted(() => {
    stopTimer()
  })

  const formattedTimer = computed(() => {
    return countdownData.value?.formatted || '00:00:00'
  })

  const isCampaignActive = computed(() => {
    if (!campaign.value || !campaign.value.is_active) return false
    return Boolean(countdownData.value && countdownData.value.totalSeconds > 0)
  })

  return {
    campaign,
    isLoading,
    errorMessage,
    countdownData,
    formattedTimer,
    isCampaignActive,
    fetchFlashDeals,
    getDealForProduct,
    isUrgent,
    isSoldOut,
    calculateClaimPercentage,
  }
}
