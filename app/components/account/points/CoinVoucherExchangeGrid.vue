<script setup lang="ts">
import { ref } from 'vue'
import type { CoinExchangeCatalogItem } from '~~/shared/schemas/loyalty-coin'

interface Props {
  catalog: CoinExchangeCatalogItem[]
  userBalance: number
  isExchanging: boolean
  isLoading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'exchange', couponId: string): void
}>()

const exchangingCouponId = ref<string | null>(null)

const handleExchange = async (couponId: string) => {
  exchangingCouponId.value = couponId
  emit('exchange', couponId)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Loading skeleton -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="i in 3"
        :key="i"
        class="animate-pulse rounded-card border border-brand-hair bg-brand-canvas p-5"
      >
        <div class="h-6 w-24 rounded bg-brand-field" />
        <div class="mt-4 h-5 w-40 rounded bg-brand-field" />
        <div class="mt-2 h-4 w-48 rounded bg-brand-canvas-soft" />
        <div class="mt-6 flex items-center justify-between">
          <div class="h-4 w-20 rounded bg-brand-field" />
          <div class="h-9 w-28 rounded-xl bg-brand-field" />
        </div>
      </div>
    </div>

    <!-- Empty catalog state -->
    <div
      v-else-if="catalog.length === 0"
      class="flex flex-col items-center justify-center rounded-card border border-dashed border-brand-hair bg-brand-canvas-soft px-6 py-12 text-center"
    >
      <div
        class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-warning-tint text-brand-warning-text"
      >
        <i class="pi pi-ticket text-2xl" />
      </div>
      <h3 class="text-base font-bold text-brand-ink">Belum Ada Voucher Penukaran</h3>
      <p class="mt-1 max-w-sm text-xs text-brand-muted">
        Saat ini belum ada voucher penukaran koin yang tersedia. Nantikan penawaran eksklusif
        berikutnya!
      </p>
    </div>

    <!-- Catalog grid -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="item in catalog"
        :key="item.id"
        class="group relative flex flex-col justify-between rounded-card border border-brand-warning-edge bg-brand-canvas p-5 shadow-whisper transition-all hover:border-brand-warning hover:shadow-floating"
      >
        <div>
          <!-- Header: Discount pill & Coin cost badge -->
          <div class="flex items-start justify-between gap-2">
            <span
              class="inline-flex items-center gap-1.5 rounded-lg bg-brand-warning-tint px-2.5 py-1 text-xs font-bold text-brand-warning-text"
            >
              <i class="pi pi-tag text-xs" />
              {{ item.formatted_discount }}
            </span>

            <span
              class="inline-flex items-center gap-1 rounded-full bg-brand-warning-tint px-3 py-1 text-xs font-extrabold text-brand-warning-text border border-brand-warning-edge"
            >
              <i class="pi pi-dollar text-xs text-brand-warning" />
              {{ item.formatted_coin_cost }}
            </span>
          </div>

          <!-- Voucher Name & Description -->
          <h4
            class="mt-3 text-base font-bold text-brand-ink transition-colors group-hover:text-brand-warning-text"
          >
            {{ item.name }}
          </h4>
          <p v-if="item.description" class="mt-1 text-xs text-brand-muted">
            {{ item.description }}
          </p>

          <!-- Min purchase & terms -->
          <div
            class="mt-4 space-y-1 rounded-xl bg-brand-canvas-soft p-2.5 text-[11px] text-brand-muted"
          >
            <div class="flex justify-between">
              <span>Min. Belanja:</span>
              <span class="font-semibold text-brand-ink">{{ item.formatted_min_purchase }}</span>
            </div>
            <div v-if="item.formatted_max_discount" class="flex justify-between">
              <span>Maks. Potongan:</span>
              <span class="font-semibold text-brand-ink">{{ item.formatted_max_discount }}</span>
            </div>
          </div>
        </div>

        <!-- Exchange Action Button -->
        <div class="mt-5 border-t border-brand-hairsoft pt-3">
          <button
            v-if="item.is_claimed"
            type="button"
            disabled
            class="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-brand-success-tint px-4 py-2 text-xs font-bold text-brand-success-text"
          >
            <i class="pi pi-check text-xs" />
            <span>Sudah Ditukarkan</span>
          </button>

          <button
            v-else-if="userBalance < item.coin_cost"
            type="button"
            disabled
            class="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-brand-field px-4 py-2 text-xs font-semibold text-brand-muted"
          >
            <i class="pi pi-lock text-xs" />
            <span>Koin Tidak Cukup</span>
          </button>

          <button
            v-else
            type="button"
            :disabled="isExchanging"
            class="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-brand-warning-text px-4 py-2 text-xs font-bold text-white dark:bg-brand-warning dark:text-brand-onink shadow-sm transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-warning focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer border-0"
            @click="handleExchange(item.id)"
          >
            <i
              v-if="isExchanging && exchangingCouponId === item.id"
              class="pi pi-spin pi-spinner text-xs"
            />
            <i v-else class="pi pi-sync text-xs" />
            <span>{{
              isExchanging && exchangingCouponId === item.id
                ? 'Memproses...'
                : 'Tukar Koin Sekarang'
            }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
