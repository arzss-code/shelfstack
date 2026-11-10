import { computed, getCurrentInstance, onMounted, onUnmounted, ref } from 'vue'

export interface OperationalMetricsSnapshot {
  requestsTotal: number
  requestsSuccess: number
  requestsClientError: number
  requestsServerError: number
  webhookTotal: number
  webhookSuccess: number
  webhookFailure: number
  refundTotal: number
  refundSuccess: number
  refundFailure: number
  reconciliationTotal: number
  reconciliationSuccess: number
  reconciliationFailure: number
  startedAt: string
}

export interface SystemReadinessSnapshot {
  service: string
  version: string
  timestamp: string
  dependencies: {
    database: 'up' | 'down'
    order_service: 'up' | 'down'
  }
}

export function useAdminOperationalSignals() {
  const metrics = ref<OperationalMetricsSnapshot | null>(null)
  const readiness = ref<SystemReadinessSnapshot | null>(null)
  const loading = ref(true)
  const refreshing = ref(false)
  const errorMessage = ref('')
  const lastRefreshedAt = ref('')

  let pollInterval: ReturnType<typeof setInterval> | null = null

  const isDatabaseUp = computed(() => readiness.value?.dependencies.database === 'up')
  const isOrderServiceUp = computed(() => readiness.value?.dependencies.order_service === 'up')

  const requestSuccessRate = computed(() => {
    if (!metrics.value || metrics.value.requestsTotal === 0) return 100
    const rate = (metrics.value.requestsSuccess / metrics.value.requestsTotal) * 100
    return Math.round(rate * 10) / 10
  })

  const webhookSuccessRate = computed(() => {
    if (!metrics.value || metrics.value.webhookTotal === 0) return 100
    const rate = (metrics.value.webhookSuccess / metrics.value.webhookTotal) * 100
    return Math.round(rate * 10) / 10
  })

  const systemTone = computed<'success' | 'warning' | 'danger'>(() => {
    if (!readiness.value) return 'warning'
    if (!isDatabaseUp.value) return 'danger'
    if (!isOrderServiceUp.value) return 'warning'
    if (metrics.value && metrics.value.requestsServerError > 0) return 'warning'
    return 'success'
  })

  const fetchSignals = async (isManual = false): Promise<void> => {
    if (isManual) {
      refreshing.value = true
    } else if (!metrics.value && !readiness.value) {
      loading.value = true
    }
    errorMessage.value = ''

    try {
      const [metricsRes, readinessRes] = await Promise.all([
        $fetch<{
          status: string
          data: { metrics: OperationalMetricsSnapshot; timestamp: string }
        }>('/api/admin/metrics'),
        $fetch<{ status: string; data: SystemReadinessSnapshot }>('/api/ready'),
      ])

      metrics.value = metricsRes.data.metrics
      readiness.value = readinessRes.data
      lastRefreshedAt.value = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      errorMessage.value =
        fetchErr.data?.message ||
        (err instanceof Error ? err.message : 'Gagal memuat telemetri operasional sistem.')
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      fetchSignals()
      pollInterval = setInterval(() => {
        fetchSignals()
      }, 30000)
    })

    onUnmounted(() => {
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    })
  }

  return {
    metrics,
    readiness,
    loading,
    refreshing,
    errorMessage,
    lastRefreshedAt,
    isDatabaseUp,
    isOrderServiceUp,
    requestSuccessRate,
    webhookSuccessRate,
    systemTone,
    fetchSignals,
  }
}
