<script setup lang="ts">
export interface ReturnMetricsSummary {
  requested: number
  approved: number
  item_received: number
  completed: number
}

defineProps<{
  metrics: ReturnMetricsSummary
}>()
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper space-y-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          Menunggu Review
        </span>
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-warning-edge bg-brand-warning-tint text-brand-warning-text"
        >
          <i class="pi pi-clock text-xs" aria-hidden="true" />
        </span>
      </div>
      <div class="font-display text-xl sm:text-2xl font-bold tabular text-brand-warning-text">
        {{ metrics.requested }}
      </div>
      <p class="m-0 text-[11px] text-brand-muted">Tiket menunggu otorisasi</p>
    </div>

    <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper space-y-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          Menunggu Kiriman
        </span>
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-accent-edge bg-brand-accent-tint text-brand-accent-text"
        >
          <i class="pi pi-truck text-xs" aria-hidden="true" />
        </span>
      </div>
      <div class="font-display text-xl sm:text-2xl font-bold tabular text-brand-accent-text">
        {{ metrics.approved }}
      </div>
      <p class="m-0 text-[11px] text-brand-muted">Disetujui, paket dalam perjalanan</p>
    </div>

    <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper space-y-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          Tiba di Gudang
        </span>
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-hair bg-brand-canvas-soft text-brand-ink"
        >
          <i class="pi pi-box text-xs" aria-hidden="true" />
        </span>
      </div>
      <div class="font-display text-xl sm:text-2xl font-bold tabular text-brand-ink">
        {{ metrics.item_received }}
      </div>
      <p class="m-0 text-[11px] text-brand-muted">Menunggu inspeksi kondisi unit</p>
    </div>

    <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper space-y-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          Selesai
        </span>
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-success-edge bg-brand-success-tint text-brand-success-text"
        >
          <i class="pi pi-check-circle text-xs" aria-hidden="true" />
        </span>
      </div>
      <div class="font-display text-xl sm:text-2xl font-bold tabular text-brand-success-text">
        {{ metrics.completed }}
      </div>
      <p class="m-0 text-[11px] text-brand-muted">Klaim telah dituntaskan</p>
    </div>
  </div>
</template>
