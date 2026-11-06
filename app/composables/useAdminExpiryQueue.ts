export interface AdminExpiryQueueCounts {
  waiting: number
  active: number
  delayed: number
  completed: number
  failed: number
  paused: number
}

export interface AdminExpiryDlqJob {
  id: string
  payload: {
    originalJobId: string
    jobName: string
    data: Record<string, unknown>
    failedReason: string
    attemptsMade: number
    maxAttempts: number
    failedAt: string
  }
  timestamp: number
}

export interface AdminExpiryQueueTelemetry {
  reachable: boolean
  enabled: boolean
  mainQueue: AdminExpiryQueueCounts
  dlq: AdminExpiryQueueCounts
  dlqJobs: AdminExpiryDlqJob[]
}

export function useAdminExpiryQueue() {
  const toast = useUiToast()
  const telemetry = ref<AdminExpiryQueueTelemetry | null>(null)
  const loading = ref(true)
  const refreshing = ref(false)
  const retryingJobId = ref<string | null>(null)
  const errorMessage = ref('')

  const dlqCount = computed(() => {
    if (!telemetry.value) return 0
    const { waiting, delayed, active, failed } = telemetry.value.dlq
    return Math.max(waiting + delayed + active + failed, telemetry.value.dlqJobs.length)
  })

  const fetchQueueTelemetry = async (isManual = false) => {
    if (isManual) {
      refreshing.value = true
    } else if (!telemetry.value) {
      loading.value = true
    }
    errorMessage.value = ''

    try {
      const response = await $fetch<{ status: string; data: AdminExpiryQueueTelemetry }>(
        '/api/admin/orders/expiry-queue',
      )
      telemetry.value = response.data
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      errorMessage.value =
        fetchErr.data?.message || 'Gagal memuat telemetri antrean kedaluwarsa pesanan.'
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  const retryDlqJob = async (jobId: string) => {
    if (!jobId || retryingJobId.value) return
    retryingJobId.value = jobId

    try {
      const response = await $fetch<{ status: string; message: string }>(
        '/api/admin/orders/expiry-dlq-retry',
        {
          method: 'POST',
          body: { job_id: jobId },
        },
      )
      toast.add({
        severity: 'success',
        summary: 'Job Dijadwalkan Ulang',
        detail: response.message || 'Job DLQ berhasil dikembalikan ke antrean utama.',
        life: 3500,
      })
      await fetchQueueTelemetry(true)
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      toast.add({
        severity: 'error',
        summary: 'Gagal Memproses Ulang',
        detail: fetchErr.data?.message || 'Job DLQ gagal dijadwalkan ulang.',
        life: 4500,
      })
    } finally {
      retryingJobId.value = null
    }
  }

  onMounted(() => {
    fetchQueueTelemetry()
  })

  return {
    telemetry,
    loading,
    refreshing,
    retryingJobId,
    errorMessage,
    dlqCount,
    fetchQueueTelemetry,
    retryDlqJob,
  }
}
