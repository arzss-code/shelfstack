<script setup lang="ts">
import type { AdminCrmMetrics } from '~~/shared/types/admin-crm'
import UiCard from '~/components/ui/UiCard.vue'

defineProps<{
  metrics: AdminCrmMetrics
}>()
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <!-- Total Pelanggan -->
    <UiCard class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-brand-muted">Total Pelanggan</span>
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-canvas-soft text-brand-ink border border-brand-hair"
        >
          <i class="pi pi-users text-xs" />
        </div>
      </div>
      <div class="font-display text-2xl font-bold tracking-tight text-brand-ink">
        {{ new Intl.NumberFormat('id-ID').format(metrics.totalCustomers) }}
      </div>
      <p class="text-[11px] text-brand-muted m-0">Terdaftar dalam database resmi</p>
    </UiCard>

    <!-- Akumulasi Omzet LTV -->
    <UiCard class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-brand-muted">Total Transaksi Selesai</span>
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-success-tint text-brand-success border border-brand-success-edge"
        >
          <i class="pi pi-dollar text-xs" />
        </div>
      </div>
      <div
        class="font-display text-xl sm:text-2xl font-bold tracking-tight text-brand-ink truncate"
      >
        {{ metrics.formattedTotalRevenue }}
      </div>
      <p class="text-[11px] text-brand-muted m-0">Dari seluruh pesanan lunas</p>
    </UiCard>

    <!-- Rata-rata Customer Lifetime Value (LTV) -->
    <UiCard class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-brand-muted">Rata-rata Nilai Belanja (LTV)</span>
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-canvas-soft text-brand-accent border border-brand-hair"
        >
          <i class="pi pi-chart-line text-xs" />
        </div>
      </div>
      <div
        class="font-display text-xl sm:text-2xl font-bold tracking-tight text-brand-ink truncate"
      >
        {{ metrics.formattedAverageLtv }}
      </div>
      <p class="text-[11px] text-brand-muted m-0">Rerata omzet per akun pengguna</p>
    </UiCard>

    <!-- Pelanggan Aktif Belanja -->
    <UiCard class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-brand-muted">Pelanggan Aktif Belanja</span>
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200"
        >
          <i class="pi pi-shopping-bag text-xs" />
        </div>
      </div>
      <div class="font-display text-2xl font-bold tracking-tight text-brand-ink">
        {{ new Intl.NumberFormat('id-ID').format(metrics.activeOrderingCustomers) }}
      </div>
      <p class="text-[11px] text-brand-muted m-0">Memiliki minimal 1 riwayat pesanan</p>
    </UiCard>
  </div>
</template>
