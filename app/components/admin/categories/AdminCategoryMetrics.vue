<script setup lang="ts">
defineProps<{
  categoryCount: number
  totalProducts: number
  averagePerCategory: string
}>()
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          Total Kategori
        </span>
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-accent-edge bg-brand-accent-tint text-brand-accent-text"
        >
          <i class="pi pi-tags text-xs" aria-hidden="true" />
        </span>
      </div>
      <div
        class="font-display mt-2 text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-brand-ink"
      >
        {{ categoryCount }}
      </div>
      <p class="mt-1 m-0 text-[11px] text-brand-muted">Kategori aktif di etalase</p>
    </div>

    <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          Produk Terkatalog
        </span>
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-success-edge bg-brand-success-tint text-brand-success-text"
        >
          <i class="pi pi-box text-xs" aria-hidden="true" />
        </span>
      </div>
      <div
        class="font-display mt-2 text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-brand-ink"
      >
        {{ totalProducts }}
      </div>
      <p class="mt-1 m-0 text-[11px] text-brand-muted">Produk yang terhubung ke kategori</p>
    </div>

    <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          Rata-rata per Kategori
        </span>
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-accent-edge bg-brand-accent-tint text-brand-accent-text"
        >
          <i class="pi pi-chart-pie text-xs" aria-hidden="true" />
        </span>
      </div>
      <div
        class="font-display mt-2 text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-brand-ink"
      >
        {{ averagePerCategory }}
      </div>
      <p class="mt-1 m-0 text-[11px] text-brand-muted">Sebaran produk per kategori</p>
    </div>
  </div>
</template>
