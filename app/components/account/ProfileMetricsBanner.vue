<script setup lang="ts">
import type { AccountStats } from '~~/shared/schemas/profile'
import UiSkeleton from '~/components/ui/UiSkeleton.vue'

defineProps<{
  stats: AccountStats | null
  loading: boolean
}>()
</script>

<template>
  <div
    class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-brand-canvas border border-brand-hair rounded-card p-4 sm:p-5 shadow-whisper"
  >
    <div class="p-3 rounded-field bg-brand-canvas-soft">
      <span class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block">
        Status Akun
      </span>
      <span class="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
        <i class="pi pi-shield text-[10px]" />
        <span>Terverifikasi</span>
      </span>
    </div>

    <NuxtLink
      to="/orders"
      class="p-3 rounded-field bg-brand-canvas-soft no-underline block hover:bg-brand-hairsoft transition-colors active:scale-95"
    >
      <span class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block">
        Total Pesanan
      </span>
      <div v-if="loading" class="mt-1">
        <UiSkeleton width="w-10" height="h-4" />
      </div>
      <span v-else class="text-base font-bold text-brand-ink tabular-nums">
        {{ stats?.totalOrders ?? 0 }}
      </span>
    </NuxtLink>

    <NuxtLink
      to="/orders"
      class="p-3 rounded-field bg-brand-canvas-soft no-underline block hover:bg-brand-hairsoft transition-colors active:scale-95"
    >
      <span class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block">
        Pesanan Aktif
      </span>
      <div v-if="loading" class="mt-1">
        <UiSkeleton width="w-10" height="h-4" />
      </div>
      <span v-else class="text-base font-bold text-brand-accent tabular-nums">
        {{ stats?.activeOrders ?? 0 }}
      </span>
    </NuxtLink>

    <NuxtLink
      to="/account/addresses"
      class="p-3 rounded-field bg-brand-canvas-soft no-underline block hover:bg-brand-hairsoft transition-colors active:scale-95"
    >
      <span class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block">
        Buku Alamat
      </span>
      <div v-if="loading" class="mt-1">
        <UiSkeleton width="w-10" height="h-4" />
      </div>
      <span v-else class="text-base font-bold text-brand-ink tabular-nums">
        {{ stats?.totalAddresses ?? 0 }} Alamat
      </span>
    </NuxtLink>
  </div>
</template>
