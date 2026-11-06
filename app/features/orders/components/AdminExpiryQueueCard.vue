<script setup lang="ts">
const {
  telemetry,
  loading,
  refreshing,
  retryingJobId,
  errorMessage,
  dlqCount,
  fetchQueueTelemetry,
  retryDlqJob,
} = useAdminExpiryQueue()

const showDlqList = ref(false)

function extractOrderId(data: Record<string, unknown>): string {
  const candidate = data.orderId
  return typeof candidate === 'string' && candidate.length > 0 ? `#${candidate.slice(0, 8)}` : '-'
}

function formatFailedTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
</script>

<template>
  <section
    aria-label="Telemetri Worker Kedaluwarsa Pesanan"
    class="rounded-card border border-brand-hair bg-brand-canvas-soft p-4 sm:p-5 shadow-whisper space-y-4"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="font-display text-sm sm:text-base font-bold text-brand-ink m-0">
            Antrean Kedaluwarsa Pesanan (BullMQ &amp; DLQ)
          </h2>

          <UiBadge v-if="loading" label="Memeriksa Worker..." variant="default" />
          <UiBadge
            v-else-if="!telemetry?.reachable"
            label="Order Service Offline"
            variant="default"
          />
          <UiBadge v-else-if="dlqCount > 0" :label="`${dlqCount} Job di DLQ`" variant="danger" />
          <UiBadge v-else-if="telemetry.enabled" label="Worker Aktif" variant="success" />
          <UiBadge v-else label="BullMQ Nonaktif" variant="warning" />
        </div>

        <p class="font-body text-xs text-brand-muted m-0">
          Menangani pembatalan otomatis pesanan pending setelah batas waktu bayar habis beserta
          pemulihan stok, kuota voucher, dan koin pelanggan.
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <UiButton
          v-if="dlqCount > 0"
          variant="outline"
          size="sm"
          icon="pi-exclamation-circle"
          @click="showDlqList = !showDlqList"
        >
          {{ showDlqList ? 'Tutup DLQ' : `Tinjau DLQ (${dlqCount})` }}
        </UiButton>

        <UiButton
          variant="secondary"
          size="sm"
          icon="pi-refresh"
          :loading="refreshing"
          @click="fetchQueueTelemetry(true)"
        >
          Segarkan Worker
        </UiButton>
      </div>
    </div>

    <UiAlert v-if="errorMessage" tone="danger">
      {{ errorMessage }}
    </UiAlert>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="idx in 4" :key="idx" class="h-16 rounded-field bg-brand-hairsoft animate-pulse" />
    </div>

    <!-- Offline / Unreachable State -->
    <div
      v-else-if="!telemetry?.reachable"
      class="rounded-field border border-brand-hair bg-brand-canvas px-4 py-3 text-xs text-brand-muted flex items-center gap-2.5"
    >
      <i class="pi pi-info-circle text-sm text-brand-muted shrink-0" aria-hidden="true" />
      <span>
        Layanan internal <code>@shelfstack/order-service</code> belum terhubung pada lingkungan ini.
        Checkout tetap berjalan normal (fail-open) dan rekonsiliasi akan aktif otomatis saat worker
        berjalan.
      </span>
    </div>

    <!-- Queue Metrics Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="rounded-field border border-brand-hair bg-brand-canvas px-3.5 py-2.5">
        <p class="text-[11px] font-medium text-brand-muted m-0">Terjadwal (Delayed)</p>
        <p class="font-display text-lg font-bold text-brand-ink tabular m-0 mt-0.5">
          {{ telemetry.mainQueue.delayed }}
        </p>
      </div>

      <div class="rounded-field border border-brand-hair bg-brand-canvas px-3.5 py-2.5">
        <p class="text-[11px] font-medium text-brand-muted m-0">Menunggu / Aktif</p>
        <p class="font-display text-lg font-bold text-brand-ink tabular m-0 mt-0.5">
          {{ telemetry.mainQueue.waiting + telemetry.mainQueue.active }}
        </p>
      </div>

      <div class="rounded-field border border-brand-hair bg-brand-canvas px-3.5 py-2.5">
        <p class="text-[11px] font-medium text-brand-muted m-0">Selesai Diproses</p>
        <p class="font-display text-lg font-bold text-brand-success-text tabular m-0 mt-0.5">
          {{ telemetry.mainQueue.completed }}
        </p>
      </div>

      <div class="rounded-field border border-brand-hair bg-brand-canvas px-3.5 py-2.5">
        <p class="text-[11px] font-medium text-brand-muted m-0">Dead Letter Queue</p>
        <p
          class="font-display text-lg font-bold tabular m-0 mt-0.5"
          :class="dlqCount > 0 ? 'text-brand-danger-text' : 'text-brand-ink'"
        >
          {{ dlqCount }}
        </p>
      </div>
    </div>

    <!-- Dead Letter Queue Inspection Table -->
    <div
      v-if="telemetry?.reachable && showDlqList && telemetry.dlqJobs.length > 0"
      class="rounded-field border border-brand-danger-edge bg-brand-canvas overflow-x-auto"
    >
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="border-b border-brand-hair bg-brand-danger-tint/50 text-brand-ink">
            <th class="py-2.5 px-3 font-semibold">Pesanan</th>
            <th class="py-2.5 px-3 font-semibold">Alasan Gagal</th>
            <th class="py-2.5 px-3 font-semibold">Percobaan</th>
            <th class="py-2.5 px-3 font-semibold">Waktu</th>
            <th class="py-2.5 px-3 font-semibold text-right">Tindakan</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-brand-hairsoft">
          <tr v-for="job in telemetry.dlqJobs" :key="job.id">
            <td class="py-2.5 px-3 font-semibold text-brand-ink tabular whitespace-nowrap">
              {{ extractOrderId(job.payload.data) }}
            </td>
            <td
              class="py-2.5 px-3 text-brand-muted max-w-xs truncate"
              :title="job.payload.failedReason"
            >
              {{ job.payload.failedReason }}
            </td>
            <td class="py-2.5 px-3 text-brand-muted tabular whitespace-nowrap">
              {{ job.payload.attemptsMade }} / {{ job.payload.maxAttempts }}
            </td>
            <td class="py-2.5 px-3 text-brand-muted whitespace-nowrap">
              {{ formatFailedTime(job.payload.failedAt) }}
            </td>
            <td class="py-2.5 px-3 text-right whitespace-nowrap">
              <UiButton
                variant="secondary"
                size="sm"
                icon="pi-replay"
                :loading="retryingJobId === job.id"
                @click="retryDlqJob(job.id)"
              >
                Ulangi
              </UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
