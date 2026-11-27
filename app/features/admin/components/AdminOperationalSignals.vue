<script setup lang="ts">
import { useAdminOperationalSignals } from '~/features/admin/composables/useAdminOperationalSignals'

const {
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
} = useAdminOperationalSignals()

const systemToneBadge = computed(() => {
  switch (systemTone.value) {
    case 'success':
      return { variant: 'success' as const, label: 'Normal' }
    case 'danger':
      return { variant: 'danger' as const, label: 'Gangguan' }
    case 'warning':
    default:
      return { variant: 'warning' as const, label: 'Perlu Diperiksa' }
  }
})
</script>

<template>
  <section
    aria-labelledby="operational-signals-heading"
    class="rounded-card border border-brand-hair bg-brand-canvas p-5 shadow-whisper space-y-4"
  >
    <!-- Section Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="space-y-1">
        <div class="flex flex-wrap items-center gap-2.5">
          <h2
            id="operational-signals-heading"
            class="font-display text-base font-bold text-brand-ink m-0"
          >
            Status Sistem
          </h2>
          <UiBadge :label="systemToneBadge.label" :variant="systemToneBadge.variant" />
        </div>
        <p class="font-body text-xs text-brand-muted m-0">
          Koneksi database, worker antrean pesanan, dan performa endpoint layanan.
        </p>
      </div>

      <div class="flex items-center gap-2.5 self-start sm:self-auto">
        <span v-if="lastRefreshedAt" class="text-[11px] text-brand-muted tabular-nums">
          Terakhir dicek: {{ lastRefreshedAt }}
        </span>
        <UiButton
          variant="outline"
          size="sm"
          icon="pi-refresh"
          :loading="refreshing"
          @click="fetchSignals(true)"
        >
          Muat Ulang
        </UiButton>
      </div>
    </div>

    <!-- Error Alert -->
    <UiAlert v-if="errorMessage" tone="danger">
      <div class="flex items-center justify-between gap-3 w-full">
        <span>{{ errorMessage }}</span>
        <UiButton variant="outline" size="sm" @click="fetchSignals(true)"> Coba Lagi </UiButton>
      </div>
    </UiAlert>

    <!-- Dependencies Health Strip -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <!-- PostgreSQL Dependency -->
      <div
        class="flex items-center justify-between p-3.5 rounded-field border bg-brand-canvas transition-colors"
        :class="isDatabaseUp ? 'border-brand-hair' : 'border-brand-danger bg-brand-danger-tint/30'"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="w-2.5 h-2.5 rounded-full"
            :class="isDatabaseUp ? 'bg-brand-success' : 'bg-brand-danger'"
          />
          <div>
            <span class="text-xs font-semibold text-brand-ink block">PostgreSQL Supabase</span>
            <span class="text-[10px] text-brand-muted block">Penyimpanan Transaksional</span>
          </div>
        </div>
        <UiBadge
          :label="isDatabaseUp ? 'Online' : 'Gangguan'"
          :variant="isDatabaseUp ? 'success' : 'danger'"
        />
      </div>

      <!-- Order Service Fastify / BullMQ -->
      <div
        class="flex items-center justify-between p-3.5 rounded-field border bg-brand-canvas transition-colors"
        :class="isOrderServiceUp ? 'border-brand-hair' : 'border-brand-hairsoft'"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="w-2.5 h-2.5 rounded-full"
            :class="isOrderServiceUp ? 'bg-brand-success' : 'bg-brand-muted'"
          />
          <div>
            <span class="text-xs font-semibold text-brand-ink block">Order Service Worker</span>
            <span class="text-[10px] text-brand-muted block">Fastify BullMQ &amp; DLQ</span>
          </div>
        </div>
        <UiBadge
          :label="isOrderServiceUp ? 'Terhubung' : 'Offline'"
          :variant="isOrderServiceUp ? 'success' : 'default'"
        />
      </div>

      <!-- Runtime Node & Version -->
      <div
        class="flex items-center justify-between p-3.5 rounded-field border border-brand-hair bg-brand-canvas transition-colors sm:col-span-2 lg:col-span-1"
      >
        <div class="flex items-center gap-2.5">
          <i class="pi pi-server text-sm text-brand-muted" aria-hidden="true" />
          <div>
            <span class="text-xs font-semibold text-brand-ink block">Nuxt Nitro Engine</span>
            <span class="text-[10px] text-brand-muted block">
              Versi {{ readiness?.version || 'Aktif' }}
            </span>
          </div>
        </div>
        <UiBadge label="Siap Layanan" variant="info" />
      </div>
    </div>

    <!-- Loading Skeleton View -->
    <div
      v-if="loading && !metrics"
      class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse"
    >
      <div v-for="i in 4" :key="i" class="h-24 rounded-card bg-brand-field" />
    </div>

    <!-- Metrics Telemetry Grid -->
    <div v-else-if="metrics" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <!-- 1. HTTP Request Success Rate -->
      <div
        class="p-4 rounded-field border border-brand-hair bg-brand-canvas space-y-1.5 shadow-whisper"
      >
        <span class="text-[11px] font-medium uppercase tracking-wider text-brand-muted block">
          Sukses HTTP API
        </span>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight tabular text-brand-ink font-display">
            {{ requestSuccessRate }}%
          </span>
          <span class="text-[11px] text-brand-muted">
            ({{ metrics.requestsSuccess }}/{{ metrics.requestsTotal }})
          </span>
        </div>
        <div
          class="flex items-center justify-between text-[11px] text-brand-muted pt-1 border-t border-brand-hairsoft"
        >
          <span>4xx: {{ metrics.requestsClientError }}</span>
          <span
            :class="metrics.requestsServerError > 0 ? 'text-brand-danger-text font-semibold' : ''"
          >
            5xx: {{ metrics.requestsServerError }}
          </span>
        </div>
      </div>

      <!-- 2. Payment Webhook Resilience -->
      <div
        class="p-4 rounded-field border border-brand-hair bg-brand-canvas space-y-1.5 shadow-whisper"
      >
        <span class="text-[11px] font-medium uppercase tracking-wider text-brand-muted block">
          Webhook Midtrans
        </span>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight tabular text-brand-ink font-display">
            {{ webhookSuccessRate }}%
          </span>
          <span class="text-[11px] text-brand-muted">
            ({{ metrics.webhookSuccess }}/{{ metrics.webhookTotal }})
          </span>
        </div>
        <div
          class="flex items-center justify-between text-[11px] text-brand-muted pt-1 border-t border-brand-hairsoft"
        >
          <span>Gagal: {{ metrics.webhookFailure }}</span>
          <span class="text-brand-success-text font-medium">SHA-512 Valid</span>
        </div>
      </div>

      <!-- 3. Refund Transaksional -->
      <div
        class="p-4 rounded-field border border-brand-hair bg-brand-canvas space-y-1.5 shadow-whisper"
      >
        <span class="text-[11px] font-medium uppercase tracking-wider text-brand-muted block">
          Penyelesaian Refund
        </span>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight tabular text-brand-ink font-display">
            {{ metrics.refundSuccess }}
          </span>
          <span class="text-[11px] text-brand-muted">
            dari {{ metrics.refundTotal }} permintaan
          </span>
        </div>
        <div
          class="flex items-center justify-between text-[11px] text-brand-muted pt-1 border-t border-brand-hairsoft"
        >
          <span>Gagal: {{ metrics.refundFailure }}</span>
          <span class="text-brand-muted">2-Tahap Async</span>
        </div>
      </div>

      <!-- 4. Rekonsiliasi Status -->
      <div
        class="p-4 rounded-field border border-brand-hair bg-brand-canvas space-y-1.5 shadow-whisper"
      >
        <span class="text-[11px] font-medium uppercase tracking-wider text-brand-muted block">
          Rekonsiliasi Status
        </span>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight tabular text-brand-ink font-display">
            {{ metrics.reconciliationSuccess }}
          </span>
          <span class="text-[11px] text-brand-muted"> sinkronisasi </span>
        </div>
        <div
          class="flex items-center justify-between text-[11px] text-brand-muted pt-1 border-t border-brand-hairsoft"
        >
          <span>Gagal: {{ metrics.reconciliationFailure }}</span>
          <span class="text-brand-accent-text font-medium">Idempoten</span>
        </div>
      </div>
    </div>
  </section>
</template>
